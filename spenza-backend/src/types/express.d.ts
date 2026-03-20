import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      requestID: string;
      user?: {
        id: number;
        uuid: string;
        email: string;
      };
    }
  }
}
