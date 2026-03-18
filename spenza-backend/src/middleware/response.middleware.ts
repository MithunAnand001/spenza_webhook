import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { formatDate, getCurrentDate } from '../utils/date';
import { ApiResponse, ApiError } from '../types/api.types';

declare global {
  namespace Express {
    interface Response {
      sendResponse<T>(data: T, message?: string, code?: number): void;
      sendError(errors: ApiError[] | string, message?: string, code?: number, spenzaCode?: string): void;
    }
    interface Request {
      requestID: string;
      log: (methodName: string, message: string, level?: string, meta?: any) => void;
    }
  }
}

export const responseMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestID = (req.headers['x-request-id'] as string) || `srv-${uuidv4()}`;
  req.requestID = requestID;

  req.log = (methodName: string, message: string, level: string = 'info', meta: any = {}) => {
    (logger as any)[level](`${message}`, { requestID, methodName, ...meta });
  };

  res.sendResponse = <T>(data: T, message: string = 'Success', code: number = 200) => {
    const response: ApiResponse<T> = {
      code,
      message,
      data,
      timestamp: formatDate(getCurrentDate()),
      requestID,
      errors: [],
    };
    res.status(code).json(response);
  };

  res.sendError = (errors: ApiError[] | string, message: string = 'Error', code: number = 500, spenzaCode?: string) => {
    const errorArray: ApiError[] = typeof errors === 'string' 
      ? [{ message: errors, code: spenzaCode as any || 'SPZ_006' }] 
      : errors;
    
    const response: ApiResponse<null> = {
      code,
      message,
      data: null,
      timestamp: formatDate(getCurrentDate()),
      requestID,
      errors: errorArray,
    };
    res.status(code).json(response);
  };

  next();
};
