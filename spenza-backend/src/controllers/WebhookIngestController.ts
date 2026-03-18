import { Request, Response } from 'express';
import { IWebhookIngestService } from '../types/interfaces';
import { SpenzaErrorCode } from '../constants/ErrorCodes';
import { logger } from '../utils/logger';

export class WebhookIngestController {
  constructor(private service: IWebhookIngestService) {}

  ingest = async (req: Request, res: Response) => {
    const subscriptionId = parseInt(req.params.subscriptionId as string);
    const requestID = req.requestID;

    if (isNaN(subscriptionId)) {
      return res.sendError('Invalid subscription ID', 'Bad Request', 400, SpenzaErrorCode.BAD_REQUEST);
    }

    const signature = req.headers['x-webhook-signature'] as string | undefined;
    const correlationId = (req.headers['x-correlation-id'] as string) || requestID;

    try {
      req.log('ingest', `Ingesting webhook for sub ${subscriptionId}`);
      const result = await this.service.ingest(subscriptionId, req.body, signature, correlationId);
      return res.sendResponse(result, 'Webhook Received', 202);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      req.log('ingest', `Ingestion failed: ${message}`, 'error');
      
      if (message.includes('signature')) {
        return res.sendError(message, 'Unauthorized', 401, SpenzaErrorCode.UNAUTHORIZED);
      }
      if (message.includes('not found')) {
        return res.sendError(message, 'Not Found', 404, SpenzaErrorCode.NOT_FOUND);
      }
      return res.sendError('Internal server error', 'Error', 500, SpenzaErrorCode.INTERNAL_ERROR);
    }
  };
}
