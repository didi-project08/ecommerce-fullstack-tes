import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, JwtPayloadWithRt } from '../types';

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  // ORIGINAL
  // constructor(config: ConfigService) {
  //   super({
  //     jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  //     secretOrKey: config.get<string>('RT_SECRET'),
  //     passReqToCallback: true,
  //   });
  // }

  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        RtStrategy.extractJWTFromCookie,
      ]),
      secretOrKey: config.get<string>('RT_SECRET'),
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  private static extractJWTFromCookie(req: Request): string | null {
    if (req.cookies && req.cookies.refreshToken) {
      return req.cookies.refreshToken;
    }
    return null;
  }

  validate(req: Request, payload: JwtPayload): JwtPayloadWithRt {
    // ORIGINAL
    // const refreshToken = req
    //   ?.get('authorization')
    //   ?.replace('Bearer', '')
    //   .trim();
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new ForbiddenException('Refresh token malformed');
    return {
      ...payload,
      refreshToken,
    };
  }
}
