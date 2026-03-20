import axios from 'axios';
import { WebhookLogRepository } from '../repositories/WebhookLogRepository';
import { UserConfigurationRepository } from '../repositories/UserConfigurationRepository';
import { UserEventMappingRepository } from '../repositories/UserEventMappingRepository';
import { EventLogStatus } from '../modules/events/webhook-event-log.entity';
import { getChannel } from '../rabbitmq/rabbitmq.service';
import { broadcastToUser } from '../modules/events/socket.service';
import { logger } from '../utils/logger';
import { config } from '../config';
import { getCurrentDate, addMs } from '../utils/date';
import { CryptoUtil } from '../utils/crypto';

const MAX_RETRIES = config.rabbitmq.maxRetries;
const BASE_DELAY_MS = config.rabbitmq.retryDelay;

interface QueueMessage {
  eventLogId: number;
  userUuid: string;
  correlationId?: string;
  publishedAt: string;
}

export const startDeliveryWorker = async (): Promise<void> => {
  const channel = getChannel();
  const QUEUE = config.rabbitmq.queue;

  await channel.prefetch(1);
  logger.info('[Worker] Delivery worker started');

  channel.consume(QUEUE, async (msg: any) => {
    if (!msg) return;

    let message: QueueMessage;
    try {
      message = JSON.parse(msg.content.toString()) as QueueMessage;
    } catch {
      logger.error('[Worker] Failed to parse message');
      channel.nack(msg, false, false);
      return;
    }

    // Get retry count from RabbitMQ headers (x-death)
    const deathHeader = msg.properties.headers['x-death'];
    const retryCount = deathHeader ? deathHeader[0].count : 0;
    const currentAttempt = retryCount + 1;

    const { eventLogId, userUuid, correlationId } = message;
    const requestID = correlationId || `wrk-${eventLogId}`;
    const logCtx = { requestID, methodName: 'deliveryWorker', attempt: currentAttempt };

    const logRepo = new WebhookLogRepository();
    const configRepo = new UserConfigurationRepository();
    const mappingRepo = new UserEventMappingRepository();

    try {
      const log = await logRepo.findById(eventLogId);
      if (!log) {
        logger.warn(`EventLog ${eventLogId} not found`, logCtx);
        channel.ack(msg);
        return;
      }

      log.status = EventLogStatus.PROCESSING;
      log.attemptNumber = currentAttempt;
      await logRepo.save(log);

      const mapping = await mappingRepo.findById(log.mappingId!);
      if (!mapping || !mapping.isActive) {
        log.status = EventLogStatus.FAILED;
        log.responseBody = 'Subscription inactive or not found';
        await logRepo.save(log);
        logger.warn(`Subscription ${log.mappingId} inactive`, logCtx);
        channel.ack(msg);
        return;
      }

      const configData = await configRepo.findByUserId(log.userId);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Delivery': log.uuid,
        'X-Correlation-Id': requestID,
      };

      if (configData) {
        if (configData.authenticationType === 'bearer' && configData.callbackBearerToken) {
          const decryptedToken = CryptoUtil.decrypt(configData.callbackBearerToken);
          headers['Authorization'] = `Bearer ${decryptedToken}`;
        } else if (configData.authenticationType === 'basic' && configData.callbackUsername && configData.callbackPassword) {
          const decryptedPassword = CryptoUtil.decrypt(configData.callbackPassword);
          const encoded = Buffer.from(`${configData.callbackUsername}:${decryptedPassword}`).toString('base64');
          headers['Authorization'] = `Basic ${encoded}`;
        }
      }

      logger.info(`Delivering payload to ${mapping.callbackUrl}`, logCtx);
      const response = await axios.post(mapping.callbackUrl, log.payload, {
        headers,
        timeout: 10000,
        validateStatus: (status) => status >= 200 && status < 300,
      });

      log.status = EventLogStatus.DELIVERED;
      log.responseCode = response.status;
      log.responseBody = JSON.stringify(response.data).substring(0, 1000);
      log.deliveredAt = getCurrentDate();

      // Emit via WebSocket using userUuid
      broadcastToUser(userUuid, 'webhook_event', {
        logUuid: log.uuid,
        status: log.status,
        eventType: mapping.eventType?.name,
        deliveredAt: log.deliveredAt,
        responseCode: log.responseCode,
      });

      await logRepo.save(log);
      logger.info(`Delivered eventLogId=${eventLogId} → ${response.status}`, logCtx);
      channel.ack(msg);

    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Delivery error: ${errMsg}`, { ...logCtx, stack: err instanceof Error ? err.stack : undefined });

      const log = await logRepo.findById(eventLogId);
      
      if (log) {
        if (currentAttempt >= MAX_RETRIES) {
          log.status = EventLogStatus.FAILED;
          log.responseBody = `Max retries (${MAX_RETRIES}) exceeded. Last error: ${errMsg}`;
          await logRepo.save(log);
          
          const mapping = await mappingRepo.findById(log.mappingId!);
          broadcastToUser(userUuid, 'webhook_event', {
            logUuid: log.uuid,
            status: log.status,
            eventType: mapping?.eventType?.name,
            deliveredAt: null,
            responseCode: (err as any).response?.status || 0,
          });

          logger.error(`[Worker] Max retries reached for eventLogId=${eventLogId}. Closing.`, logCtx);
          channel.ack(msg);
        } else {
          const delay = BASE_DELAY_MS * Math.pow(2, currentAttempt);
          log.status = EventLogStatus.RETRYING;
          log.nextRetryAt = addMs(getCurrentDate(), delay);
          log.responseBody = `Attempt ${currentAttempt} failed: ${errMsg}`;
          await logRepo.save(log);
          
          const mapping = await mappingRepo.findById(log.mappingId!);
          broadcastToUser(userUuid, 'webhook_event', {
            logUuid: log.uuid,
            status: log.status,
            eventType: mapping?.eventType?.name,
            deliveredAt: null,
            responseCode: (err as any).response?.status || 0,
          });

          logger.warn(`[Worker] Attempt ${currentAttempt}/${MAX_RETRIES} failed. Scheduling retry.`, logCtx);
          channel.nack(msg, false, false);
        }
      } else {
        channel.ack(msg);
      }
    }
  });
};
