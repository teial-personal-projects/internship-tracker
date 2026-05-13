import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jobsRouter from './routes/jobs';
import applicationsRouter from './routes/applications';
import contactsRouter from './routes/contacts';
import profileRouter from './routes/profile';
import jobBoardsRouter from './routes/jobBoards';
import { errorHandler } from './middleware/errorHandler';

export function createApp(version: string) {
  const app = express();

  app.use(helmet());
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [];
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
  }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true, version }));

  app.use('/api/jobs', jobsRouter);
  app.use('/api/applications', applicationsRouter);
  app.use('/api/contacts', contactsRouter);
  app.use('/api/profile', profileRouter);
  app.use('/api/job-boards', jobBoardsRouter);

  app.use(errorHandler);

  return app;
}
