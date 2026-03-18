import dotenv from 'dotenv';
dotenv.config();

export const getEnv = (key: string, fallback: string = ''): string => {
  return process.env[key] || fallback;
};

export const config = {
  port: parseInt(getEnv('PORT', '3001')),
  nodeEnv: getEnv('NODE_ENV', 'development'),
  database: {
    host: getEnv('DB_HOST', 'localhost'),
    port: parseInt(getEnv('DB_PORT', '5432')),
    username: getEnv('DB_USERNAME', 'postgres'),
    password: getEnv('DB_PASSWORD', 'admin123'),
    database: getEnv('DB_DATABASE', 'postgres'),
  },
  jwt: {
    secret: getEnv('JWT_SECRET', 'your_super_secret_jwt_key_32_chars'),
    expiresIn: getEnv('JWT_EXPIRES_IN', '7d'),
    refreshSecret: getEnv('JWT_REFRESH_SECRET', 'your_refresh_secret_key_32_chars'),
    refreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '30d'),
  },
  rabbitmq: {
    url: getEnv('RABBITMQ_URL', 'amqp://spenza_user:spenza_pass@localhost:5672'),
    exchange: getEnv('RABBITMQ_EXCHANGE', 'webhook.exchange'),
    queue: getEnv('RABBITMQ_QUEUE_WEBHOOK_EVENTS', 'webhook.events'),
    retryQueue: getEnv('RABBITMQ_QUEUE_RETRY', 'webhook.events.retry'),
    retryDelay: parseInt(getEnv('RETRY_BASE_DELAY_MS', '5000')),
    maxRetries: parseInt(getEnv('MAX_RETRY_ATTEMPTS', '3')),
  },
  security: {
    cryptoSecret: getEnv('CRYPTO_SECRET', 'your_aes_encryption_key_32_chars_exactly!!'),
    webhookSigningSecret: getEnv('WEBHOOK_SIGNING_SECRET', 'your_webhook_hmac_signing_secret'),
  },
  frontendUrl: getEnv('FRONTEND_URL', 'http://localhost:5173'),
};
