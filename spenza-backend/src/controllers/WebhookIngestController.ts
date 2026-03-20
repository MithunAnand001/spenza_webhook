import { Request, Response } from 'express';
import { IWebhookIngestService, ILogger } from '../types/interfaces';
import { SpenzaErrorCode } from '../constants/ErrorCodes';
import { ResponseHandler } from '../utils/response-handler';
import { z } from 'zod';

const IngestSchema = z.object({
  payload: z.unknown(),
  subscriptionUuid: z.string().uuid(),
});

export class WebhookIngestController {
  constructor(
    private service: IWebhookIngestService,
    private logger: ILogger
  ) {}

  private log(req: Request, methodName: string, message: string, level: string = 'info', meta: any = {}) {
    (this.logger as any)[level](message, { methodName, requestID: req.requestID, ...meta });
  }

  ingest = async (req: Request, res: Response) => {
    const { subscriptionUuid } = req.params;
    const validation = IngestSchema.safeParse({ payload: req.body, subscriptionUuid });

    if (!validation.success) {
      return ResponseHandler.error(res, 'Invalid request data', 'Bad Request', 400, SpenzaErrorCode.BAD_REQUEST);
    }

    const requestID = req.requestID;
    const signature = req.headers['x-webhook-signature'] as string | undefined;
    const correlationId = (req.headers['x-correlation-id'] as string) || requestID;

    try {
      this.logger.info(`Ingesting webhook for sub ${subscriptionUuid}`, { methodName: 'ingest', requestID });
      const result = await this.service.ingest(subscriptionUuid as string, req.body, signature, correlationId);
      return ResponseHandler.success(res, result, 'Webhook Received', 202);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Ingestion failed: ${message}`, { methodName: 'ingest', requestID });
      
      // Map domain errors to proper HTTP statuses
      if (message.includes('signature') || message.includes('Missing X-Webhook-Signature')) {
        return ResponseHandler.error(res, message, 'Unauthorized', 401, SpenzaErrorCode.UNAUTHORIZED);
      }
      if (message.includes('not found') || message.includes('inactive')) {
        return ResponseHandler.error(res, message, 'Not Found', 404, SpenzaErrorCode.NOT_FOUND);
      }
      
      return ResponseHandler.error(res, 'Internal server error', 'Error', 500, SpenzaErrorCode.INTERNAL_ERROR);
    }
  };
}
