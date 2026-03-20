import { Request, Response } from 'express';
import { IWebhookIngestService, ILogger } from '../types/interfaces';
import { SpenzaErrorCode } from '../constants/ErrorCodes';
import { ResponseHandler } from '../utils/response-handler';
import { http } from 'winston';
import { HttpStatusCode } from 'axios';

export class WebhookIngestController {
  constructor(
    private service: IWebhookIngestService,
    private logger: ILogger
  ) { }

  ingest = async (req: Request, res: Response) => {
    const subscriptionId = parseInt(req.params.subscriptionId as string);
    const requestID = req.requestID;

    if (isNaN(subscriptionId)) {
      return ResponseHandler.error(res, 'Invalid subscription ID', 'Bad Request', 400, SpenzaErrorCode.BAD_REQUEST);
    }

    const signature = req.headers['x-webhook-signature'] as string | undefined;
    const correlationId = (req.headers['x-correlation-id'] as string) || requestID;

    try {
      this.logger.info(`Ingesting webhook for sub ${subscriptionId}`, { methodName: 'ingest', requestID });
      const result = await this.service.ingest(subscriptionId, req.body, signature, correlationId);
      return ResponseHandler.success(res, result, 'Webhook Received', HttpStatusCode.Accepted);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Ingestion failed: ${message}`, { methodName: 'ingest', requestID });

      if (message.includes('signature')) {
        return ResponseHandler.error(res, message, 'Unauthorized', 401, SpenzaErrorCode.UNAUTHORIZED);
      }
      if (message.includes('not found')) {
        return ResponseHandler.error(res, message, 'Not Found', 404, SpenzaErrorCode.NOT_FOUND);
      }
      return ResponseHandler.error(res, 'Internal server error', 'Error', 500, SpenzaErrorCode.INTERNAL_ERROR);
    }
  };
}
