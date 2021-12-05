import express from 'express';
import routes from './routes';

// Create a new express application instance
const app: express.Application = express();

app.use('/', routes);

export default app;
