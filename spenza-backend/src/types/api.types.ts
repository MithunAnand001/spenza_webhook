import { SpenzaErrorCode } from '../constants/ErrorCodes';

export interface ApiError {
  message: string;
  field?: string;
  code: SpenzaErrorCode;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  requestID: string;
  errors: ApiError[];
}
