import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { logger } from './config/logger';
import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

import authRoutes from './routes/auth.routes';
import jobRoutes from './routes/job.routes';
import candidateRoutes from './routes/candidate.routes';
import screeningRoutes from './routes/screening.routes';
import uploadRoutes from './routes/upload.routes';

export const createApp = () => {
  const app = express();

  app.set('etag', false);

  app.use(helmet());
  app.use(cors({
    origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    message: { error: 'Too many requests. Please try again later.' },
  });
  app.use('/api/', limiter);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

  app.use('/uploads', authenticate, express.static(path.join(__dirname, '../uploads')));

  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: '1.0.0',
    });
  });

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1', authenticate);
  app.use('/api/v1/jobs', jobRoutes);
  app.use('/api/v1/candidates', candidateRoutes);
  app.use('/api/v1/screenings', screeningRoutes);
  app.use('/api/v1/upload', uploadRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

const app = createApp();

export default app;
