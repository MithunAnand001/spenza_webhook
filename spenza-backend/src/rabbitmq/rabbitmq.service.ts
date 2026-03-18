import amqp from 'amqplib';
import { logger } from '../utils/logger';
import { config } from '../config';
import { getCurrentDate, formatDate } from '../utils/date';

let connection: any;
let channel: any;

const { exchange, queue, retryQueue, retryDelay, url } = config.rabbitmq;

export const connectRabbitMQ = async (attempt = 1): Promise<void> => {
  try {
    connection = await amqp.connect(url);
    channel = await connection.createChannel();

    // Listen for connection close
    connection.on('close', () => {
      logger.error('[RabbitMQ] Connection closed, attempting to reconnect...');
      setTimeout(() => connectRabbitMQ(), 5000);
    });

    await channel.assertExchange(exchange, 'direct', { durable: true });

    await channel.assertQueue(queue, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': exchange,
        'x-dead-letter-routing-key': retryQueue,
      },
    });

    await channel.assertQueue(retryQueue, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': exchange,
        'x-dead-letter-routing-key': queue,
        'x-message-ttl': retryDelay,
      },
    });

    await channel.bindQueue(queue, exchange, queue);
    await channel.bindQueue(retryQueue, exchange, retryQueue);

    logger.info('[RabbitMQ] Connected and queues declared');
  } catch (err) {
    logger.error(`[RabbitMQ] Connection attempt ${attempt} failed:`, err);
    // Retry indefinitely every 5 seconds
    setTimeout(() => connectRabbitMQ(attempt + 1), 5000);
  }
};

export const getChannel = (): any => {
  if (!channel) throw new Error('RabbitMQ channel not initialized');
  return channel;
};

export const publishWebhookEvent = (eventLogId: number, attemptNumber = 0, correlationId?: string): void => {
  try {
    const ch = getChannel();
    const message = JSON.stringify({ 
      eventLogId, 
      attemptNumber, 
      correlationId,
      publishedAt: formatDate(getCurrentDate()) 
    });
    ch.publish(exchange, queue, Buffer.from(message), {
      persistent: true,
      contentType: 'application/json',
    });
    logger.info(`[RabbitMQ] Published eventLogId=${eventLogId}`, { correlationId });
  } catch (err) {
    logger.error(`[RabbitMQ] Failed to publish eventLogId=${eventLogId}:`, err);
  }
};