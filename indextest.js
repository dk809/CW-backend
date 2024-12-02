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
