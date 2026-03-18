import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { logger } from '../utils/logger';
import { config } from '../config';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: false,
  logging: config.nodeEnv === 'development',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  subscribers: [],
  // Performance: Connection Pooling
  extra: {
    max: 20, // Maximum number of connections in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    logger.info('[Database] PostgreSQL connected successfully with connection pooling');
    return AppDataSource;
  } catch (err) {
    logger.error('[Database] Connection failed:', err);
    throw err;
  }
};
