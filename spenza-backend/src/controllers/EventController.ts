import { Response } from 'express';
import { 
  IEventTypeRepository, 
  IWebhookLogRepository 
} from '../types/interfaces';
import { AuthRequest } from '../middleware/auth.middleware';
import { SpenzaErrorCode } from '../constants/ErrorCodes';
import { sseClients } from '../modules/events/sse.service';
import { formatDate, DateFormat } from '../utils/date';

export class EventController {
  constructor(
    private eventTypeRepo: IEventTypeRepository,
    private logRepo: IWebhookLogRepository
  ) {}

  stream = (req: AuthRequest, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    const userId = req.user!.sub;
    const clientId = `${userId}-${Date.now()}`;

    sseClients.set(clientId, { userId, res });
    req.log('stream', `SSE client connected: ${clientId}`);

    const heartbeat = setInterval(() => {
      res.write('event: heartbeat\ndata: {}\n\n');
    }, 30000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(clientId);
      req.log('stream', `SSE client disconnected: ${clientId}`);
    });

    res.write(`event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`);
  };

  listEventTypes = async (req: AuthRequest, res: Response) => {
    try {
      req.log('listEventTypes', 'Fetching active event types');
      const types = await this.eventTypeRepo.findAllActive();
      const formattedTypes = types.map(t => ({
        ...t,
        createdOn: formatDate(t.createdOn, DateFormat.DISPLAY),
        modifiedOn: formatDate(t.modifiedOn, DateFormat.DISPLAY),
      }));
      return res.sendResponse(formattedTypes);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      req.log('listEventTypes', `Error: ${message}`, 'error');
      return res.sendError(message, 'Error', 500, SpenzaErrorCode.INTERNAL_ERROR);
    }
  };

  getEventType = async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      req.log('getEventType', `Fetching event type ${id}`);
      const type = await this.eventTypeRepo.findById(id);
      if (!type) {
        return res.sendError('Event type not found', 'Not Found', 404, SpenzaErrorCode.NOT_FOUND);
      }
      return res.sendResponse({
        ...type,
        createdOn: formatDate(type.createdOn, DateFormat.DISPLAY),
        modifiedOn: formatDate(type.modifiedOn, DateFormat.DISPLAY),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      req.log('getEventType', `Error: ${message}`, 'error');
      return res.sendError(message, 'Error', 500, SpenzaErrorCode.INTERNAL_ERROR);
    }
  };

  listEvents = async (req: AuthRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as any;

      req.log('listEvents', `Fetching events for user ${req.user!.sub}, page ${page}`);
      const [logs, total] = await this.logRepo.findAndCount({
        where: {
          userId: req.user!.sub,
          ...(status ? { status } : {}),
        },
        relations: ['event', 'event.eventType'],
        order: { createdOn: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      const formattedLogs = logs.map(log => ({
        ...log,
        createdOn: formatDate(log.createdOn, DateFormat.DISPLAY),
        deliveredAt: log.deliveredAt ? formatDate(log.deliveredAt, DateFormat.DISPLAY) : null,
        nextRetryAt: log.nextRetryAt ? formatDate(log.nextRetryAt, DateFormat.DISPLAY) : null,
      }));

      return res.sendResponse({ 
        data: formattedLogs, 
        total, 
        page, 
        limit, 
        totalPages: Math.ceil(total / limit) 
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      req.log('listEvents', `Error: ${message}`, 'error');
      return res.sendError(message, 'Error', 500, SpenzaErrorCode.INTERNAL_ERROR);
    }
  };

  getEventLog = async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      req.log('getEventLog', `Fetching log ${id} for user ${req.user!.sub}`);
      const log = await this.logRepo.findOne({
        where: { id, userId: req.user!.sub },
        relations: ['event', 'event.eventType', 'mapping'],
      });
      if (!log) {
        return res.sendError('Event log not found', 'Not Found', 404, SpenzaErrorCode.NOT_FOUND);
      }
      return res.sendResponse({
        ...log,
        createdOn: formatDate(log.createdOn, DateFormat.DISPLAY),
        deliveredAt: log.deliveredAt ? formatDate(log.deliveredAt, DateFormat.DISPLAY) : null,
        nextRetryAt: log.nextRetryAt ? formatDate(log.nextRetryAt, DateFormat.DISPLAY) : null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      req.log('getEventLog', `Error: ${message}`, 'error');
      return res.sendError(message, 'Error', 500, SpenzaErrorCode.INTERNAL_ERROR);
    }
  };
}
