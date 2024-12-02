var bodyParser = require('body-parser')
var express = require("express");
let app = express();
const cors = require("cors");
app.use(express.json());
const path = require('path');
let PropertiesReader = require("properties-reader");
let propertiesPath = path.resolve(__dirname, "dbconnections.properties");
let properties = PropertiesReader(propertiesPath);

app.use(cors())
const dbPrefix = properties.get('db.prefix');
const dbHost = properties.get('db.host');
const dbName = properties.get('db.name');
const dbUser = properties.get('db.user');
const dbPassword = properties.get('db.password');
const dbParams = properties.get('db.params');

const { MongoClient, ServerApiVersion, ObjectId, Collection } = require("mongodb");

const uri = `${dbPrefix}${dbUser}:${dbPassword}${dbHost}${dbParams}`;

const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

let db1;//declare variable

app.use(express.static('public'))

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

async function connectDB() {
    try {
        client.connect();
        console.log('Connected to MongoDB');
        db1 = client.db(dbName);
        // console.log(db1)
    } catch (err) {
        console.error('MongoDB connection error:', err);
        console.error(err.message)
    }
}

connectDB(); 

app.get('/search', async function (req, res) {
    const collection = db1.collection('lessons')
    const results = await collection.find({
        subject: { $regex: `^${req.query.search_term}`, $options: 'i' }
    }).toArray();
    const payload = results.map(item => ({ ...item, id: item._id }))
    return res.status(200).json(payload)

});



app.post('/order/', async function (req, res) {
    try {
        console.log(req.body);

        // Extract collections
        const collection = db1.collection('order');
        const collectionL = db1.collection('lessons');

        // Validate input
        if (!req.body.items || !Array.isArray(req.body.items)) {
            return res.status(400).json({ Detail: "Invalid order format" });
        }

        // Fetch all lesson details in a single query
        const itemIds = req.body.items.map(item => new ObjectId(item.id));
        const lessonsData = await collectionL.find({ _id: { $in: itemIds } }).toArray();

        // Map lesson data by ID for easy lookup
        const lessonsMap = lessonsData.reduce((map, lesson) => {
            map[lesson._id.toString()] = lesson;
            return map;
        }, {});

        // Validate and prepare lessons for checkout
        const updatedLessons = [];
        for (const item of req.body.items) {
            const lesson = lessonsMap[item.id];

            if (!lesson) {
                return res.status(400).json({ Detail: `Lesson with ID ${item.id} not found` });
            }

            if (lesson.spaces < item.quantity) {
                return res.status(400).json({
                    Detail: `Not enough spaces for lesson with ID ${item.id}`,
                    AvailableSpaces: lesson.spaces,
                });
            }

            // Reduce spaces
            updatedLessons.push({
                id: item.id,
                newSpaces: lesson.spaces - item.quantity,
            });
        }

        const orderData = {
            ...req.body,
            createdAt: new Date(),
        };
        const orderResult = await collection.insertOne(orderData);

        const bulkUpdates = updatedLessons.map(item => ({
            updateOne: {
                filter: { _id: new ObjectId(item.id) },
                update: { $set: { spaces: item.newSpaces } },
            },
        }));
        await collectionL.bulkWrite(bulkUpdates);

        // Respond with success
        return res.status(200).json({ orderId: orderResult.insertedId, message: "Order placed successfully" });
    } catch (error) {
        console.error("Error processing order:", error);
        return res.status(500).json({ Detail: "Internal server error" });
    }
});

app.get('/collections/:collectionName', async function (req, res, next) {
    console.log('collection2', req.query)
    try {

        const collection = db1.collection(req.params.collectionName)
        const results = await collection.find({}).toArray();

        const payload = results.map(item => ({ ...item, id: item._id }))
        return res.status(200).json(payload)


    }
    catch (err) {
        console.error('Error fetching docs', err.message);
        next(err);
    }

});


app.post('/collections/:collectionName', async function (req, res, next) {
    try {
        connectDB()
        const collection = db1.collection(req.params.collectionName)
        const results = await collection.insertOne(req.body);


        console.log('Recieved request: ', req.body);
        console.log(client.db("coursework"))



        res.json(results);


    }
    catch (err) {
        console.error('Error fetching docs', err.message);
        next(err);
    }

});


app.delete('/collections/:collectionName/:id', async function (req, res, next) {

    try {
        connectDB()

        const collection = db1.collection(req.params.collectionName)
        const results = await collection.deleteOne({ _id: new ObjectId(req.params.id) });
     
        console.log('Deleted data: ', results);


        res.json(results.deletedCount === 1) ? { msg: "success" } : { msg: "error" };


    }
    catch (err) {
        console.error('Error fetching docs', err.message);
        next(err);
    }

});

app.put('/collections/:collectionName/:id', async function (req, res, next) {
    try {
        connectDB()
        const collection = db1.collection(req.params.collectionName)
        const results = await collection.updateOne({ _id: new ObjectId(req.params.id) },
            { $set: req.body });
       

        console.log('Updated: ', results);


        res.json(results.matchedCount === 1) ? { msg: "success" } : { msg: "error" };
       

    }
    catch (err) {
        console.error('Error fetching docs', err.message);
        next(err);
    }

});

app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ error: 'An error occurred' });
});


