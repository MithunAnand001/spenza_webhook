import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const requestIdMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  req.requestID = (req.headers['x-request-id'] as string) || `srv-${uuidv4()}`;
  next();
};
