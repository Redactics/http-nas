const express = require('express');
//const bodyParser = require('body-parser');

// Create a new express application instance
const app: express.Application = express();
//app.use(bodyParser.json());

const routes = require('./routes');

app.use('/', routes);

module.exports = app;