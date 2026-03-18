import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeDatabase } from './database/data-source';
import { connectRabbitMQ } from './rabbitmq/rabbitmq.service';
import { startDeliveryWorker } from './workers/delivery.worker';
import { responseMiddleware } from './middleware/response.middleware';
import { logger } from './utils/logger';

// Routers
import authRouter from './modules/auth/auth.router';
import eventTypesRouter from './modules/events/event-types.router';
import subscriptionsRouter from './modules/subscriptions/subscriptions.router';
import webhookIngestRouter from './modules/webhooks/webhook-ingest.router';
import eventsRouter from './modules/events/events.router';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Response format middleware
app.use(responseMiddleware);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Webhook-Signature', 'X-Correlation-Id', 'X-Request-ID'],
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Logging middleware
app.use(morgan('combined', { 
  stream: { write: (message) => logger.info(message.trim()) } 
}));

// XSS Protection Middleware
app.use((req, res, next) => {
  const xssPattern = /<script|<\/script|on\w+\s*=/i;
  const check = (obj: any): boolean => {
    if (typeof obj === 'string' && xssPattern.test(obj)) return true;
    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(v => check(v));
    }
    return false;
  };

  if (check(req.body) || check(req.query) || check(req.params)) {
    return res.sendError('Potential XSS detected in request', 'Bad Request', 400);
  }
  next();
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/event-types', eventTypesRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/webhooks', webhookIngestRouter);
app.use('/api/events', eventsRouter);

// Health Check
app.get('/health', (req, res) => {
  res.sendResponse({ status: 'OK' }, 'System is healthy');
});

// 404 handler
app.use((_req, res) => {
  res.sendError('Route not found', 'Not Found', 404);
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('[Global Error Handler]', err);
  const code = err.status || 500;
  res.sendError(err.message || 'Internal server error', 'Error', code);
});

// Initialization
const start = async () => {
  try {
    // 1. Connect to Database
    await initializeDatabase();

    // 2. Connect to RabbitMQ
    await connectRabbitMQ();

    // 3. Start Delivery Worker
    await startDeliveryWorker();

    // 4. Start Express Server
    app.listen(PORT, () => {
      logger.info(`[Server] Running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error('[Error] Initialization failed:', err);
    process.exit(1);
  }
};

start();
