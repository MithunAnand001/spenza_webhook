import { Request, Response } from 'express';
import axios from 'axios';
import { ISubscriptionsService, ILogger } from '../types/interfaces';
import { CreateSubscriptionSchema } from '../modules/subscriptions/subscriptions.dto';
import { SpenzaErrorCode } from '../constants/ErrorCodes';
import { formatDate, DateFormat } from '../utils/date';
import { ResponseHandler } from '../utils/response-handler';

export class SubscriptionController {
  constructor(
    private service: ISubscriptionsService,
    private logger: ILogger
  ) {}

  testUrl = async (req: Request, res: Response) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return ResponseHandler.error(res, 'Invalid URL', 'Bad Request', 400, SpenzaErrorCode.BAD_REQUEST);
    }

    try {
      this.logger.info(`Testing URL: ${url}`, { methodName: 'testUrl', requestID: req.requestID });
      await axios.get(url, { timeout: 3000 });
      return ResponseHandler.success(res, { success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.warn(`URL test failed: ${message}`, { methodName: 'testUrl', requestID: req.requestID });
      return ResponseHandler.success(res, { success: false, message });
    }
  };

  create = async (req: Request, res: Response) => {
    const parsed = CreateSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map(i => ({ 
        message: i.message, 
        field: i.path.join('.'),
        code: SpenzaErrorCode.VALIDATION_ERROR 
      }));
      return ResponseHandler.error(res, errors, 'Validation Failed', 400);
    }
    try {
      this.logger.info(`Creating subscription for user ${req.user!.sub}`, { methodName: 'create', requestID: req.requestID });
      const result = await this.service.createSubscription(req.user!.sub, parsed.data);
      const formattedResult = {
        ...result,
        subscription: {
          ...result.subscription,
          createdOn: formatDate(result.subscription.createdOn, DateFormat.DISPLAY),
        }
      };
      return ResponseHandler.success(res, formattedResult, 'Subscription Created', 201);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Subscription creation failed: ${message}`, { methodName: 'create', requestID: req.requestID });
      return ResponseHandler.error(res, message, 'Conflict', 409, SpenzaErrorCode.CONFLICT);
    }
  };

  list = async (req: Request, res: Response) => {
    try {
      this.logger.info(`Listing subscriptions for user ${req.user!.sub}`, { methodName: 'list', requestID: req.requestID });
      const subs = await this.service.listSubscriptions(req.user!.sub);
      const formattedSubs = subs.map(sub => ({
        ...sub,
        createdOn: formatDate(sub.createdOn, DateFormat.DISPLAY),
      }));
      return ResponseHandler.success(res, formattedSubs);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Failed to list subscriptions: ${message}`, { methodName: 'list', requestID: req.requestID });
      return ResponseHandler.error(res, message, 'Error', 500, SpenzaErrorCode.INTERNAL_ERROR);
    }
  };

  get = async (req: Request, res: Response) => {
    try {
      const subId = parseInt(req.params.id as string);
      this.logger.info(`Getting subscription ${subId} for user ${req.user!.sub}`, { methodName: 'get', requestID: req.requestID });
      const sub = await this.service.getSubscription(req.user!.sub, subId);
      return ResponseHandler.success(res, {
        ...sub,
        createdOn: formatDate(sub.createdOn, DateFormat.DISPLAY),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Failed to get subscription: ${message}`, { methodName: 'get', requestID: req.requestID });
      return ResponseHandler.error(res, message, 'Not Found', 404, SpenzaErrorCode.NOT_FOUND);
    }
  };

  cancel = async (req: Request, res: Response) => {
    try {
      const subId = parseInt(req.params.id as string);
      this.logger.info(`Cancelling subscription ${subId} for user ${req.user!.sub}`, { methodName: 'cancel', requestID: req.requestID });
      const sub = await this.service.cancelSubscription(req.user!.sub, subId);
      return ResponseHandler.success(res, {
        ...sub,
        createdOn: formatDate(sub.createdOn, DateFormat.DISPLAY),
      }, 'Subscription Cancelled');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Failed to cancel subscription: ${message}`, { methodName: 'cancel', requestID: req.requestID });
      return ResponseHandler.error(res, message, 'Not Found', 404, SpenzaErrorCode.NOT_FOUND);
    }
  };
}
