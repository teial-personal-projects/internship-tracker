import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jobsRouter from './routes/jobs';
import profileRouter from './routes/profile';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.NODE_ENV === 'production' ? false : true }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/api/jobs', jobsRouter);
  app.use('/api/profile', profileRouter);

  app.use(errorHandler);

  return app;
}
