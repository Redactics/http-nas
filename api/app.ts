import express from 'express';

// Create a new express application instance
const app: express.Application = express();

const routes = require('./routes');

app.use('/', routes);

module.exports = app;