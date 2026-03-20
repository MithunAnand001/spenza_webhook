import 'reflect-metadata';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeDatabase } from './database/data-source';
import { connectRabbitMQ } from './rabbitmq/rabbitmq.service';
import { startDeliveryWorker } from './workers/delivery.worker';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { logger } from './utils/logger';
import { ResponseHandler } from './utils/response-handler';
import { initSocket } from './modules/events/socket.service';

// Routers
import authRouter from './modules/auth/auth.router';
import eventTypesRouter from './modules/events/event-types.router';
import subscriptionsRouter from './modules/subscriptions/subscriptions.router';
import webhookIngestRouter from './modules/webhooks/webhook-ingest.router';
import eventsRouter from './modules/events/events.router';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize WebSockets
initSocket(httpServer);

// Request ID middleware
app.use(requestIdMiddleware);

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
    return ResponseHandler.error(res, 'Potential XSS detected in request', 'Bad Request', 400);
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
  ResponseHandler.success(res, { status: 'OK' }, 'System is healthy');
});

// 404 handler
app.use((_req, res) => {
  ResponseHandler.error(res, 'Route not found', 'Not Found', 404);
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('[Global Error Handler]', { error: err, requestID: _req.requestID });
  const code = err.status || 500;
  ResponseHandler.error(res, err.message || 'Internal server error', 'Error', code);
});

// Initialization
const startServer = async () => {
  try {
    // 1. Connect to Database
    await initializeDatabase();

    // 2. Connect to RabbitMQ
    await connectRabbitMQ();

    // 3. Start Delivery Worker
    await startDeliveryWorker();

    // 4. Start HTTP & WebSocket Server
    httpServer.listen(PORT, () => {
      logger.info(`[Server] Running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error('[Error] Initialization failed:', err);
    process.exit(1);
  }
};

startServer();
