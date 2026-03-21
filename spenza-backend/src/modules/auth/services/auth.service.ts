import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../entities/user.entity';
import { RegisterDto, LoginDto } from '../entities/auth.dto';
import { config } from '../../../config';
import { IUserRepository, IAuthService } from '../../../types/interfaces';

const SALT_ROUNDS = 12;

export class AuthService implements IAuthService {
  constructor(private userRepo: IUserRepository) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) throw new Error('Email already registered');

    const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.userRepo.save({
      name: dto.name,
      emailId: dto.email,
      phoneNumber: dto.phoneNumber ?? null,
      password: hashed,
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new Error('Invalid credentials');

    return this.generateTokens(user);
  }

  private generateTokens(user: User) {
    const accessPayload = {
      sub: user.uuid,
      type: 'access',
    };

    const refreshPayload = {
      sub: user.uuid,
      type: 'refresh',
      jti: uuidv4(),
    };

    const accessToken = jwt.sign(accessPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
      issuer: 'spenza-auth-service',
      audience: 'spenza-app',
    });

    const refreshToken = jwt.sign(refreshPayload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as any,
      issuer: 'spenza-auth-service',
      audience: 'spenza-app',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        uuid: user.uuid,
        name: user.name,
        email: user.emailId,
      },
    };
  }
}
