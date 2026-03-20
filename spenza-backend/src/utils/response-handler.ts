import { Response } from 'express';
import { formatDate, getCurrentDate } from './date';
import { ApiResponse, ApiError } from '../types/api.types';

export class ResponseHandler {
  static success<T>(res: Response, data: T, message: string = 'Success', code: number = 200, requestID?: string) {
    const response: ApiResponse<T> = {
      code,
      message,
      data,
      timestamp: formatDate(getCurrentDate()),
      requestID: requestID || (res.req as any).requestID || 'N/A',
      errors: [],
    };
    return res.status(code).json(response);
  }

  static error(res: Response, errors: ApiError[] | string, message: string = 'Error', code: number = 500, spenzaCode?: string, requestID?: string) {
    const errorArray: ApiError[] = typeof errors === 'string' 
      ? [{ message: errors, code: spenzaCode as any || 'SPZ_006' }] 
      : errors;
    
    const response: ApiResponse<null> = {
      code,
      message,
      data: null,
      timestamp: formatDate(getCurrentDate()),
      requestID: requestID || (res.req as any).requestID || 'N/A',
      errors: errorArray,
    };
    return res.status(code).json(response);
  }
}
