import { Response } from 'express';
import axios from 'axios';
import { ISubscriptionsService } from '../types/interfaces';
import { CreateSubscriptionSchema } from '../modules/subscriptions/subscriptions.dto';
import { AuthRequest } from '../middleware/auth.middleware';
import { SpenzaErrorCode } from '../constants/ErrorCodes';
import { formatDate, DateFormat } from '../utils/date';

export class SubscriptionController {
  constructor(private service: ISubscriptionsService) {}

  testUrl = async (req: AuthRequest, res: Response) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.sendError('Invalid URL', 'Bad Request', 400, SpenzaErrorCode.BAD_REQUEST);
    }

    try {
      req.log('testUrl', `Testing URL: ${url}`);
      await axios.get(url, { timeout: 3000 });
      return res.sendResponse({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      req.log('testUrl', `URL test failed: ${message}`, 'warn');
      return res.sendResponse({ success: false, message });
    }
  };

  create = async (req: AuthRequest, res: Response) => {
    const parsed = CreateSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map(i => ({ 
        message: i.message, 
        field: i.path.join('.'),
        code: SpenzaErrorCode.VALIDATION_ERROR 
      }));
      return res.sendError(errors, 'Validation Failed', 400);
    }
    try {
      req.log('create', `Creating subscription for user ${req.user!.sub}`);
      const result = await this.service.createSubscription(req.user!.sub, parsed.data);
      const formattedResult = {
        ...result,
        subscription: {
          ...result.subscription,
          createdOn: formatDate(result.subscription.createdOn, DateFormat.DISPLAY),
        }
      };
      return res.sendResponse(formattedResult, 'Subscription Created', 201);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      req.log('create', `Subscription creation failed: ${message}`, 'error');
      return res.sendError(message, 'Conflict', 409, SpenzaErrorCode.CONFLICT);
    }
  };

  list = async (req: AuthRequest, res: Response) => {
    try {
      req.log('list', `Listing subscriptions for user ${req.user!.sub}`);
      const subs = await this.service.listSubscriptions(req.user!.sub);
      const formattedSubs = subs.map(sub => ({
        ...sub,
        createdOn: formatDate(sub.createdOn, DateFormat.DISPLAY),
      }));
      return res.sendResponse(formattedSubs);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      req.log('list', `Failed to list subscriptions: ${message}`, 'error');
      return res.sendError(message, 'Error', 500, SpenzaErrorCode.INTERNAL_ERROR);
    }
  };

  get = async (req: AuthRequest, res: Response) => {
    try {
      const subId = parseInt(req.params.id as string);
      req.log('get', `Getting subscription ${subId} for user ${req.user!.sub}`);
      const sub = await this.service.getSubscription(req.user!.sub, subId);
      return res.sendResponse({
        ...sub,
        createdOn: formatDate(sub.createdOn, DateFormat.DISPLAY),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      req.log('get', `Failed to get subscription: ${message}`, 'error');
      return res.sendError(message, 'Not Found', 404, SpenzaErrorCode.NOT_FOUND);
    }
  };

  cancel = async (req: AuthRequest, res: Response) => {
    try {
      const subId = parseInt(req.params.id as string);
      req.log('cancel', `Cancelling subscription ${subId} for user ${req.user!.sub}`);
      const sub = await this.service.cancelSubscription(req.user!.sub, subId);
      return res.sendResponse({
        ...sub,
        createdOn: formatDate(sub.createdOn, DateFormat.DISPLAY),
      }, 'Subscription Cancelled');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      req.log('cancel', `Failed to cancel subscription: ${message}`, 'error');
      return res.sendError(message, 'Not Found', 404, SpenzaErrorCode.NOT_FOUND);
    }
  };
}
