import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { SpenzaErrorCode } from '../constants/ErrorCodes';
import { UserRepository } from '../repositories/UserRepository';

export interface UserPayload {
  sub: number;
  uuid: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

const userRepo = new UserRepository();

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    return res.sendError('Unauthorized: No token provided', 'Unauthorized', 401, SpenzaErrorCode.UNAUTHORIZED);
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    
    // Verify user existence in DB
    const user = await userRepo.findById(decoded.sub);
    if (!user || !user.isActive) {
      return res.sendError('User not found or inactive', 'Unauthorized', 401, SpenzaErrorCode.UNAUTHORIZED);
    }

    const userStruct: UserPayload = {
      sub: Number(decoded.sub),
      uuid: String(decoded.uuid),
      email: String(decoded.email),
    };
    req.user = userStruct;
    next();
  } catch (err: unknown) {
    return res.sendError('Unauthorized: Invalid or expired token', 'Unauthorized', 401, SpenzaErrorCode.UNAUTHORIZED);
  }
};
