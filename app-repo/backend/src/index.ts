import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { connectDatabase } from './config/database';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import { AppError } from './services/auth.service';

// Import queue to initialize connection on startup
import './config/queue';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({ error: 'Validation error', message: err.message });
    return;
  }

  // Invalid ObjectId format
  if (err.name === 'CastError') {
    res.status(400).json({ error: 'Invalid ID format' });
    return;
  }

  // MongoDB duplicate key
  if ((err as any).code === 11000) {
    res.status(409).json({ error: 'Duplicate entry. This resource already exists.' });
    return;
  }

  res.status(500).json({
    error: config.nodeEnv === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

// Start server
async function start() {
  await connectDatabase();

  app.listen(config.port, () => {
    console.log(`AI Task Platform API running on port ${config.port} (${config.nodeEnv})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
