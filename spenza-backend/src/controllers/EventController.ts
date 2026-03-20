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

  private log(req: Request, methodName: string, message: string, level: string = 'info', meta: any = {}) {
    (this.logger as any)[level](message, { methodName, requestID: req.requestID, ...meta });
  }

  listEventTypes = async (req: Request, res: Response) => {
    try {
      this.log(req, 'listEventTypes', 'Fetching active event types');
      const types = await this.eventTypeRepo.findAllActive();
      const formattedTypes = types.map(t => {
        const { id, createdBy, modifiedBy, ...rest } = t as any;
        return {
          ...rest,
          createdOn: formatDate(t.createdOn, DateFormat.DISPLAY),
          modifiedOn: formatDate(t.modifiedOn, DateFormat.DISPLAY),
        };
      });
      return ResponseHandler.success(res, formattedTypes);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.log(req, 'listEventTypes', `Error: ${message}`, 'error');
      return ResponseHandler.error(res, message, 'Error', 500, SpenzaErrorCode.INTERNAL_ERROR);
    }
  };

  getEventType = async (req: Request, res: Response) => {
    try {
      const uuid = req.params.uuid as string;
      this.log(req, 'getEventType', `Fetching event type ${uuid}`);
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
      this.log(req, 'getEventType', `Error: ${message}`, 'error');
      return ResponseHandler.error(res, message, 'Error', 500, SpenzaErrorCode.INTERNAL_ERROR);
    }
  };

  listEvents = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const eventTypeUuid = req.query.eventTypeUuid as string;
      const search = req.query.search as string;
      const sortField = (req.query.sortField as string) || 'createdOn';
      const sortOrder = (req.query.sortOrder as string) || 'DESC';

      const validSortFields = ['createdOn', 'status', 'responseCode', 'uuid'];
      const field = validSortFields.includes(sortField) ? sortField : 'createdOn';
      const order = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

      this.log(req, 'listEvents', `Fetching events for user ${req.user!.id}, page ${page}, search: ${search}`);

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
        order: { [field]: order },
        skip: (page - 1) * limit,
        take: limit,
      });

      const formattedLogs = logs.map(log => {
        const { id, userId, eventId, mappingId, createdBy, modifiedBy, ...rest } = log as any;
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
      this.log(req, 'listEvents', `Error: ${message}`, 'error');
      return ResponseHandler.error(res, message, 'Error', 500, SpenzaErrorCode.INTERNAL_ERROR);
    }
  };

  getEventLog = async (req: Request, res: Response) => {
    try {
      const uuid = req.params.uuid as string;
      this.log(req, 'getEventLog', `Fetching log ${uuid} for user ${req.user!.id}`);
      const log = await this.logRepo.findByUuidAndUser(uuid, req.user!.id);
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
      this.log(req, 'getEventLog', `Error: ${message}`, 'error');
      return ResponseHandler.error(res, message, 'Error', 500, SpenzaErrorCode.INTERNAL_ERROR);
    }
  };
}
