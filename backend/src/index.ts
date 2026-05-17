import app from './app.js';
import './worker/imageProcessor.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info('Worker initialized and listening for jobs');
});
