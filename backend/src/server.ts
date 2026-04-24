import dotenv from 'dotenv';
import app from './app';
import { connectDatabase } from './config/database';
import { logger } from './config/logger';
import { ensureAdminUser } from './services/bootstrap-admin.service';

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

export const startServer = async () => {
  try {
    await connectDatabase();
    await ensureAdminUser();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      logger.info(`API available at http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

void startServer();
