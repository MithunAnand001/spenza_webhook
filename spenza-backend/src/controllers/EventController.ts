import { Request, Response } from 'express';
import { 
  IEventTypeRepository, 
  IWebhookLogRepository,
  ILogger
} from '../types/interfaces';
import { SpenzaErrorCode } from '../constants/ErrorCodes';
import { formatDate, DateFormat } from '../utils/date';
import { ILike } from 'typeorm';
import { ResponseHandler } from '../utils/response-handler';

export class EventController {
  constructor(
    private eventTypeRepo: IEventTypeRepository,
    private logRepo: IWebhookLogRepository,
    private logger: ILogger
  ) {}

  listEventTypes = async (req: Request, res: Response) => {
    try {
      this.logger.info('Fetching active event types', { methodName: 'listEventTypes', requestID: req.requestID });
      const types = await this.eventTypeRepo.findAllActive();
      const formattedTypes = types.map(t => ({
        ...t,
        createdOn: formatDate(t.createdOn, DateFormat.DISPLAY),
        modifiedOn: formatDate(t.modifiedOn, DateFormat.DISPLAY),
      }));
      return ResponseHandler.success(res, formattedTypes);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Error: ${message}`, { methodName: 'listEventTypes', requestID: req.requestID });
      return ResponseHandler.error(res, message, 'Error', 500, SpenzaErrorCode.INTERNAL_ERROR);
    }
  };

  getEventType = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      this.logger.info(`Fetching event type ${id}`, { methodName: 'getEventType', requestID: req.requestID });
      const type = await this.eventTypeRepo.findById(id);
      if (!type) {
        return ResponseHandler.error(res, 'Event type not found', 'Not Found', 404, SpenzaErrorCode.NOT_FOUND);
      }
      return ResponseHandler.success(res, {
        ...type,
        createdOn: formatDate(type.createdOn, DateFormat.DISPLAY),
        modifiedOn: formatDate(type.modifiedOn, DateFormat.DISPLAY),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Error: ${message}`, { methodName: 'getEventType', requestID: req.requestID });
      return ResponseHandler.error(res, message, 'Error', 500, SpenzaErrorCode.INTERNAL_ERROR);
    }
  };

  listEvents = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const eventTypeId = req.query.eventTypeId ? parseInt(req.query.eventTypeId as string) : undefined;
      const search = req.query.search as string;
      const sortField = (req.query.sortField as string) || 'createdOn';
      const sortOrder = (req.query.sortOrder as string) || 'DESC';

      const validSortFields = ['createdOn', 'status', 'responseCode', 'id'];
      const field = validSortFields.includes(sortField) ? sortField : 'createdOn';
      const order = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

      this.logger.info(`Fetching events for user ${req.user!.sub}, page ${page}, search: ${search}`, { 
        methodName: 'listEvents', 
        requestID: req.requestID 
      });

      const where: any = {
        userId: req.user!.sub,
      };

      if (status) where.status = status;
      if (eventTypeId) {
        where.event = { eventTypeId };
      }
      if (search) {
        where.correlationId = ILike(`%${search}%`);
      }

      const [logs, total] = await this.logRepo.findAndCount({
        where,
        relations: ['event', 'event.eventType'],
        order: { [field]: order },
        skip: (page - 1) * limit,
        take: limit,
      });

      const formattedLogs = logs.map(log => ({
        ...log,
        createdOn: formatDate(log.createdOn, DateFormat.DISPLAY),
        deliveredAt: log.deliveredAt ? formatDate(log.deliveredAt, DateFormat.DISPLAY) : null,
        nextRetryAt: log.nextRetryAt ? formatDate(log.nextRetryAt, DateFormat.DISPLAY) : null,
      }));

      return ResponseHandler.success(res, { 
        data: formattedLogs, 
        total, 
        page, 
        limit, 
        totalPages: Math.ceil(total / limit) 
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Error: ${message}`, { methodName: 'listEvents', requestID: req.requestID });
      return ResponseHandler.error(res, message, 'Error', 500, SpenzaErrorCode.INTERNAL_ERROR);
    }
  };

  getEventLog = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      this.logger.info(`Fetching log ${id} for user ${req.user!.sub}`, { methodName: 'getEventLog', requestID: req.requestID });
      const log = await this.logRepo.findOne({
        where: { id, userId: req.user!.sub },
        relations: ['event', 'event.eventType', 'mapping'],
      });
      if (!log) {
        return ResponseHandler.error(res, 'Event log not found', 'Not Found', 404, SpenzaErrorCode.NOT_FOUND);
      }
      return ResponseHandler.success(res, {
        ...log,
        createdOn: formatDate(log.createdOn, DateFormat.DISPLAY),
        deliveredAt: log.deliveredAt ? formatDate(log.deliveredAt, DateFormat.DISPLAY) : null,
        nextRetryAt: log.nextRetryAt ? formatDate(log.nextRetryAt, DateFormat.DISPLAY) : null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Error: ${message}`, { methodName: 'getEventLog', requestID: req.requestID });
      return ResponseHandler.error(res, message, 'Error', 500, SpenzaErrorCode.INTERNAL_ERROR);
    }
  };
}
