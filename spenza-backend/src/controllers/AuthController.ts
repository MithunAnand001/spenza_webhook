import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { IAuthService } from '../types/interfaces';
import { RegisterSchema, LoginSchema } from '../modules/auth/auth.dto';
import { SpenzaErrorCode } from '../constants/ErrorCodes';
import { config } from '../config';
import { UserRepository } from '../repositories/UserRepository';

export class AuthController {
  constructor(private authService: IAuthService) {}

  register = async (req: Request, res: Response) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map(i => ({ 
        message: i.message, 
        field: i.path.join('.'),
        code: SpenzaErrorCode.VALIDATION_ERROR
      }));
      return res.sendError(errors, 'Validation Failed', 400);
    }

    try {
      const result = await this.authService.register(parsed.data);
      req.log('register', `User registered successfully: ${parsed.data.email}`);
      return res.sendResponse(result, 'Registration Successful', 201);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      req.log('register', `Registration failed: ${message}`, 'error');
      return res.sendError(message, 'Conflict', 409, SpenzaErrorCode.CONFLICT);
    }
  };

  login = async (req: Request, res: Response) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map(i => ({ 
        message: i.message, 
        field: i.path.join('.'),
        code: SpenzaErrorCode.VALIDATION_ERROR
      }));
      return res.sendError(errors, 'Validation Failed', 400);
    }

    try {
      const result = await this.authService.login(parsed.data);
      req.log('login', `User logged in: ${parsed.data.email}`);
      return res.sendResponse(result, 'Login Successful', 200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      req.log('login', `Login failed for ${parsed.data.email}: ${message}`, 'warn');
      return res.sendError(message, 'Unauthorized', 401, SpenzaErrorCode.UNAUTHORIZED);
    }
  };

  refresh = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.sendError('Refresh token required', 'Bad Request', 400, SpenzaErrorCode.BAD_REQUEST);
    }

    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;
      const userRepo = new UserRepository();
      const user = await userRepo.findById(decoded.sub);

      if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
      }

      const payload = { sub: user.id, uuid: user.uuid, email: user.emailId };
      const accessToken = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn as any,
      });

      return res.sendResponse({ accessToken }, 'Token Refreshed');
    } catch (err: unknown) {
      return res.sendError('Invalid refresh token', 'Unauthorized', 401, SpenzaErrorCode.UNAUTHORIZED);
    }
  };
}
