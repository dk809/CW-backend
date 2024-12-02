var bodyParser = require('body-parser')
var express = require("express");
let app = express();
const cors = require("cors");
// app.use(cors());
app.use(express.json());
// app.use(bodyParser.json())
// app.set('json spaces', 3);
const path = require('path');
let PropertiesReader = require("properties-reader");
// Load properties from the file
let propertiesPath = path.resolve(__dirname, "dbconnections.properties");
let properties = PropertiesReader(propertiesPath);

// Extract values from the properties file
const dbPrefix = properties.get('db.prefix');
const dbHost = properties.get('db.host');
const dbName = properties.get('db.name');
const dbUser = properties.get('db.user');
const dbPassword = properties.get('db.password');
const dbParams = properties.get('db.params');

const { MongoClient, ServerApiVersion, ObjectId, Collection } = require("mongodb");
// MongoDB connection URL
const uri = `${dbPrefix}${dbUser}:${dbPassword}${dbHost}${dbParams}`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

let db1;//declare variable

app.use(express.static('public'))

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

