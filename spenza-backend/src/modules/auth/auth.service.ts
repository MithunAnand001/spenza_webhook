import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from './user.entity';
import { RegisterDto, LoginDto } from './auth.dto';
import { config } from '../../config';
import { IUserRepository, IAuthService } from '../../types/interfaces';

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
    // Use UUID as the 'sub' claim instead of internal ID
    const payload = { sub: user.uuid, email: user.emailId };

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
        uuid: user.uuid,
        name: user.name,
        email: user.emailId,
      },
    };
  }
}
