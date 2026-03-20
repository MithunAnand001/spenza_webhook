import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      requestID: string;
      user?: {
        sub: number;
        uuid: string;
        email: string;
      };
    }
  }
}
