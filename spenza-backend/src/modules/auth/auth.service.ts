import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUserRepository, IAuthService } from '../../types/interfaces';
import { RegisterDto, LoginDto } from './auth.dto';
import { LoginResult } from '../../types/auth.types';
import { logger } from '../../utils/logger';
import { config } from '../../config';

const SALT_ROUNDS = 12;

export class AuthService implements IAuthService {
  constructor(private userRepo: IUserRepository) {}

  async register(dto: RegisterDto): Promise<LoginResult> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      logger.warn(`Registration attempt with existing email: ${dto.email}`);
      throw new Error('Email already registered');
    }

    const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.userRepo.save({
      name: dto.name,
      emailId: dto.email,
      phoneNumber: dto.phoneNumber ?? null,
      password: hashed,
    });

    logger.info(`User registered: ${user.emailId} (ID: ${user.id})`);
    return this.generateTokens(user);
  }

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      logger.warn(`Login failed: User not found (${dto.email})`);
      throw new Error('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      logger.warn(`Login failed: Invalid password (${dto.email})`);
      throw new Error('Invalid credentials');
    }

    logger.info(`User logged in: ${user.emailId} (ID: ${user.id})`);
    return this.generateTokens(user);
  }

  private generateTokens(user: any): LoginResult {
    const payload = { sub: user.id, uuid: user.uuid, email: user.emailId };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as any,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        uuid: user.uuid,
        name: user.name,
        email: user.emailId,
      },
    };
  }
}
