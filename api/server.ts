import logger from './winston';
import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => logger.info(`Listening on port: ${PORT}`));
