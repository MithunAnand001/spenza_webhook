import { Request, Response } from 'express';
import { 
  IEventTypeRepository, 
  IWebhookLogRepository,
  ILogger
} from '../../../types/interfaces';
import { SpenzaErrorCode } from '../../../constants/ErrorCodes';
import { formatDate, DateFormat } from '../../../utils/date';
import { ILike } from 'typeorm';
import { ResponseHandler } from '../../../utils/response-handler';
import { z } from 'zod';

const ListEventsSchema = z.object({
  page: z.string().optional().transform(v => parseInt(v || '1')),
  limit: z.string().optional().transform(v => parseInt(v || '20')),
  status: z.string().optional(),
  eventTypeUuid: z.string().uuid().optional(),
  search: z.string().optional(),
  sortField: z.string().optional().default('createdOn'),
  sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC'),
});

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
      const formattedTypes = types.map((t: any) => {
        const { id, createdBy, modifiedBy, ...rest } = t;
        return {
          ...rest,
          createdOn: formatDate(t.createdOn, DateFormat.DISPLAY),
          modifiedOn: formatDate(t.modifiedOn, DateFormat.DISPLAY),
        };
      });
      return ResponseHandler.success(res, formattedTypes);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Error listing event types: ${message}`, { methodName: 'listEventTypes', requestID: req.requestID });
      return ResponseHandler.error(res, message, 'Error', 500, SpenzaErrorCode.INTERNAL_ERROR);
    }
  };

  getEventType = async (req: Request, res: Response) => {
    try {
      const uuid = req.params.uuid as string;
      if (!z.string().uuid().safeParse(uuid).success) {
        return ResponseHandler.error(res, 'Invalid UUID format', 'Bad Request', 400, SpenzaErrorCode.BAD_REQUEST);
      }
      this.logger.info(`Fetching event type ${uuid}`, { methodName: 'getEventType', requestID: req.requestID });
      const type = await this.eventTypeRepo.findByUuid(uuid);
      if (!type) {
        return ResponseHandler.error(res, 'Event type not found', 'Not Found', 404, SpenzaErrorCode.NOT_FOUND);
      }
      const { id, createdBy, modifiedBy, ...rest } = type as any;
      return ResponseHandler.success(res, {
        ...rest,
        createdOn: formatDate(type.createdOn, DateFormat.DISPLAY),
        modifiedOn: formatDate(type.modifiedOn, DateFormat.DISPLAY),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Error getting event type: ${message}`, { methodName: 'getEventType', requestID: req.requestID });
      return ResponseHandler.error(res, message, 'Error', 500, SpenzaErrorCode.INTERNAL_ERROR);
    }
  };

  listEvents = async (req: Request, res: Response) => {
    const validation = ListEventsSchema.safeParse(req.query);
    if (!validation.success) {
      return ResponseHandler.error(res, 'Invalid query parameters', 'Bad Request', 400, SpenzaErrorCode.BAD_REQUEST);
    }

    const { page, limit, status, eventTypeUuid, search, sortField, sortOrder } = validation.data;

    try {
      const validSortFields = ['createdOn', 'status', 'responseCode', 'uuid'];
      const field = validSortFields.includes(sortField) ? sortField : 'createdOn';

      this.logger.info(`Fetching events for user ${req.user!.id}, page ${page}, search: ${search}`, { 
        methodName: 'listEvents', 
        requestID: req.requestID 
      });

      const where: any = {
        userId: req.user!.id,
      };

      if (status) where.status = status;
      if (eventTypeUuid) {
        where.event = { uuid: eventTypeUuid };
      }
      if (search) {
        where.correlationId = ILike(`%${search}%`);
      }

      const [logs, total] = await this.logRepo.findAndCount({
        where,
        relations: ['event', 'event.eventType'],
        order: { [field]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      });

      const formattedLogs = logs.map((log: any) => {
        const { id, userId, eventId, mappingId, createdBy, modifiedBy, ...rest } = log;
        // Clean event and eventType as well
        if (rest.event) {
          const { id: eid, eventTypeId, createdBy: ecb, modifiedBy: emb, ...eRest } = rest.event;
          rest.event = eRest;
          if (rest.event.eventType) {
            const { id: etid, createdBy: etcb, modifiedBy: etmb, ...etRest } = rest.event.eventType;
            rest.event.eventType = etRest;
          }
        }
        return {
          ...rest,
          createdOn: formatDate(log.createdOn, DateFormat.DISPLAY),
          deliveredAt: log.deliveredAt ? formatDate(log.deliveredAt, DateFormat.DISPLAY) : null,
          nextRetryAt: log.nextRetryAt ? formatDate(log.nextRetryAt, DateFormat.DISPLAY) : null,
        };
      });

      return ResponseHandler.success(res, { 
        data: formattedLogs, 
        total, 
        page, 
        limit, 
        totalPages: Math.ceil(total / limit) 
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Error listing events: ${message}`, { methodName: 'listEvents', requestID: req.requestID });
      return ResponseHandler.error(res, message, 'Error', 500, SpenzaErrorCode.INTERNAL_ERROR);
    }
  };

  getEventLog = async (req: Request, res: Response) => {
    try {
      const uuid = req.params.uuid as string;
      if (!z.string().uuid().safeParse(uuid).success) {
        return ResponseHandler.error(res, 'Invalid UUID format', 'Bad Request', 400, SpenzaErrorCode.BAD_REQUEST);
      }
      this.logger.info(`Fetching log ${uuid} for user ${req.user!.id}`, { methodName: 'getEventLog', requestID: req.requestID });
      const log = await this.logRepo.findByUuidAndUser(uuid as string, req.user!.id);
      if (!log) {
        return ResponseHandler.error(res, 'Event log not found', 'Not Found', 404, SpenzaErrorCode.NOT_FOUND);
      }
      const { id, userId, eventId, mappingId, createdBy, modifiedBy, ...rest } = log as any;
      return ResponseHandler.success(res, {
        ...rest,
        createdOn: formatDate(log.createdOn, DateFormat.DISPLAY),
        deliveredAt: log.deliveredAt ? formatDate(log.deliveredAt, DateFormat.DISPLAY) : null,
        nextRetryAt: log.nextRetryAt ? formatDate(log.nextRetryAt, DateFormat.DISPLAY) : null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Error getting event log: ${message}`, { methodName: 'getEventLog', requestID: req.requestID });
      return ResponseHandler.error(res, message, 'Error', 500, SpenzaErrorCode.INTERNAL_ERROR);
    }
  };
}
