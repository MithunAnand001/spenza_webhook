import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { SpenzaErrorCode } from '../constants/ErrorCodes';
import { UserRepository } from '../repositories/UserRepository';
import { ResponseHandler } from '../utils/response-handler';

const userRepo = new UserRepository();

interface JwtPayload {
  sub: string; // This is now user.uuid
  email: string;
}

export const authMiddleware = async (
  req: Request,
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
    return ResponseHandler.error(res, 'Unauthorized: No token provided', 'Unauthorized', 401, SpenzaErrorCode.UNAUTHORIZED);
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as unknown as JwtPayload;
    
    // Verify user existence in DB using UUID
    const user = await userRepo.findByUuid(decoded.sub);
    if (!user || !user.isActive) {
      return ResponseHandler.error(res, 'User not found or inactive', 'Unauthorized', 401, SpenzaErrorCode.UNAUTHORIZED);
    }

    req.user = {
      id: user.id,
      uuid: user.uuid,
      email: user.emailId,
    };
    
    next();
  } catch (err: unknown) {
    return ResponseHandler.error(res, 'Unauthorized: Invalid or expired token', 'Unauthorized', 401, SpenzaErrorCode.UNAUTHORIZED);
  }
};
