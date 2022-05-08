import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { JwtPayload } from './dto/auth.dto';

const REFRESH_EXPIRES_IN = '365d';
const ACCESS_EXPIRES_IN = '3600s';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  createRefreshToken(userId: string): string {
    const payload: JwtPayload = {
      name: userId,
      sub: userId,
    };
    return this.jwtService.sign(payload, { expiresIn: REFRESH_EXPIRES_IN });
  }

  createAccessToken(userId: string): string {
    const payload: JwtPayload = {
      name: userId,
      sub: userId,
    };
    return this.jwtService.sign(payload, { expiresIn: ACCESS_EXPIRES_IN });
  }
}
