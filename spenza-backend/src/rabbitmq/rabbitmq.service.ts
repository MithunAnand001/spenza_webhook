import * as amqplib from 'amqplib';
import { logger } from '../utils/logger';
import { config } from '../config';
import { getCurrentDate, formatDate } from '../utils/date';

let connection: amqplib.ChannelModel | undefined;
let channel: amqplib.Channel | undefined;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

const { exchange, queue, retryQueue, retryDelay, url } = config.rabbitmq;

const scheduleReconnect = (attempt: number): void => {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => connectRabbitMQ(attempt), 5000);
};

export const connectRabbitMQ = async (attempt = 1): Promise<void> => {
  try {
    const conn = await amqplib.connect(url);
    const ch = await conn.createChannel();

    connection = conn;
    channel = ch;

    conn.once('close', () => {
      logger.error('[RabbitMQ] Connection closed, attempting to reconnect...');
      connection = undefined;
      channel = undefined;
      scheduleReconnect(1);
    });

    await ch.assertExchange(exchange, 'direct', { durable: true });

    await ch.assertQueue(queue, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': exchange,
        'x-dead-letter-routing-key': retryQueue,
      },
    });

    await ch.assertQueue(retryQueue, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': exchange,
        'x-dead-letter-routing-key': queue,
        'x-message-ttl': retryDelay,
      },
    });

    await ch.bindQueue(queue, exchange, queue);
    await ch.bindQueue(retryQueue, exchange, retryQueue);

    logger.info('[RabbitMQ] Connected and queues declared');
  } catch (err) {
    connection = undefined;
    channel = undefined;
    logger.error(`[RabbitMQ] Connection attempt ${attempt} failed:`, err);
    scheduleReconnect(attempt + 1);
  }
};

export const getChannel = (): amqplib.Channel => {
  if (!channel) throw new Error('RabbitMQ channel not initialized');
  return channel;
};

export const publishWebhookEvent = (
  eventLogId: number,
  userUuid: string,
  attemptNumber = 0,
  correlationId?: string,
): boolean => {
  try {
    const ch = getChannel();
    const message = JSON.stringify({
      eventLogId,
      userUuid,
      attemptNumber,
      correlationId,
      publishedAt: formatDate(getCurrentDate()),
    });
    const published = ch.publish(exchange, queue, Buffer.from(message), {
      persistent: true,
      contentType: 'application/json',
    });
    if (!published) {
      logger.warn(`[RabbitMQ] Publish buffer full for eventLogId=${eventLogId}`, { correlationId });
    } else {
      logger.info(`[RabbitMQ] Published eventLogId=${eventLogId} for user ${userUuid}`, { correlationId });     
    }
    return published;
  } catch (err) {
    logger.error(`[RabbitMQ] Failed to publish eventLogId=${eventLogId}:`, err);
    return false;
  }
};
