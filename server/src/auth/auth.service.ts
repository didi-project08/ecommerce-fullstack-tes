import { ForbiddenException, BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client'
import * as argon from 'argon2';
import { PrismaService } from '../prisma/prisma.service';

import { Request, Response } from 'express';
import { SignInDto, SignUpDto, ChangePasswordDto } from './dto';
import { JwtPayload, Tokens } from './types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService
  ) {}
  
  async signUp(dto: SignUpDto, req: Request, res: Response): Promise<any> {
    const password = await argon.hash(dto.password);

    try {
      const user = await this.prisma.users.create({
        data: {
          fullname: dto.fullname,
          username: dto.username,
          email: dto.email,
          password,
        }
      })
      const tokens = await this.getTokens(user.id, user.fullname, user.username, user.email, user.limitHit || 100, user.ttl || 60000, user.timeRt, user.timeAt);
      await this.createUserLogs(user.id, req, res)
      await this.updateRtHash(user.id, tokens.refresh);
      res.status(200).json({
        statusCode: 200,
        message: 'Signup successfully.',
        data: {
          id: user.id,
          fullname: user.fullname,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token: tokens,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
            let message = ""
            for (const [key, value] of Object.entries(error.meta || {})) {
                message += `${key}: ${value},`
            }
            throw new BadRequestException(`Credentials incorrect: ${message}`);
        }
    }
    throw error;
    }
  }

  async signIn(dto: SignInDto, req: Request, res: Response): Promise<Tokens> {
    const user = await this.prisma.users.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) throw new ForbiddenException('User not founds!!');
    // SET MULTI LOGIN
    if (multiLogin) {
      if (user.hashedRt) throw new ForbiddenException('Sorry, your session is currently in use on another device. Please logout of either device and try logging in again.');
    }

    const passwordMatches = await argon.verify(user.password, dto.password);
    if (!passwordMatches) throw new BadRequestException("Wrong password!!");
    const tokens = await this.getTokens(user.id, user.fullname, user.username, user.email, user.limitHit || 100, user.ttl || 60000, user.timeRt, user.timeAt);
    const base64Payload = tokens.access.split('.')[1];
    const payloadBuffer = Buffer.from(base64Payload, 'base64');
    const updatedJwtPayload: JwtPayload = JSON.parse(payloadBuffer.toString()) as JwtPayload;
    const expires = {
      exp: updatedJwtPayload['exp']
    }

    await this.createUserLogs(user.id, req, res)
    await this.updateRtHash(user.id, tokens.refresh)

    // return res.status(200).json({
    //   statusCode: 200,
    //   data: {
    //     fullname: user.fullname,
    //     username: user.username,
    //     email: user.email,
    //     createdAt: user.createdAt,
    //     updatedAt: user.updatedAt,
    //   },
    //   message: 'SignIn successfully.',
    //   token: tokens,
    // });
    
    return {...tokens,...expires};
  }

  async me(userId: string, req: Request, res: Response): Promise<any> {
    try {
        const users = await this.prisma.users.findFirst({
          where: {
              id: userId,
              deletedAt: null,
              deletedBy: null,
          },
          select: {
            fullname: true,
            username: true,
            email: true,
            hashedRt: true,
            role_users: {
              select: {
                id: true,
                roles: {
                  select: {
                    id: true,
                    name: true,
                    role_permissions: {
                      select: {
                        id: true,
                        permissions: {
                          select: {
                            id: true,
                            name: true,
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            carts: true,
            addresses: true
          }
        });
        
        return users;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                let message = ""
                for (const [key, value] of Object.entries(error.meta || {})) {
                    message += `${key}: ${value},`
                }
                throw new BadRequestException(`Credentials incorrect: ${message}`);
            }
        }
        throw error;
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto, req: Request, res: Response): Promise<any> {
    const checkUser = await this.prisma.users.findUnique({
      where: {
        id: userId,
      }
    });
    if (!checkUser || !checkUser.password) throw new BadRequestException('Oops users not founds');
    const passwordMatches = await argon.verify(checkUser.password, dto.passwordOld);
    if (passwordMatches) {
      if (dto.passwordNew == dto.passwordConfirm) {
        const password = await argon.hash(dto.passwordNew)
        const updatePassword = await this.prisma.users.update({
          where: {
            id: userId,
          },
          data: {
            password,
          }
        })
        await this.createUserLogs(userId, req, res)
        res.status(200).json({
          statusCode: 200,
          message: 'Change password successfully.',
          data: {
            id: updatePassword.id,
            fullname: updatePassword.fullname,
            username: updatePassword.username,
            email: updatePassword.email,
            updatedAt: updatePassword.updatedAt,
            updatedBy: updatePassword.updatedBy,
          },
        });
      } else {
        res.status(400).json({
          statusCode: 400,
          message: "Oopps, password new and password confirm does'nt matches",
        });
      }
    } else {
      res.status(400).json({
        statusCode: 400,
        message: "Oopps, password old does'nt matches",
      });
    }
  }

  async logout(userId: string, rt: string, req: Request, res: Response): Promise<void> {
    // SET MULTI LOGIN TRUE
    if (multiLogin) {
      await this.checkUserHasSignin(userId, rt)
    }
    await this.prisma.users.updateMany({
      where: {
        id: userId,
        hashedRt: {
          not: null,
        },
      },
      data: {
        hashedRt: null,
      },
    });
    await this.createUserLogs(userId, req, res)
  }

  async autoLogout(userId: string, rt: string, req: Request, res: Response): Promise<void> {
    // SET MULTI LOGIN TRUE
    if (multiLogin) {
      await this.checkUserHasSignin(userId, rt)
    }
    await this.prisma.users.updateMany({
      where: {
        id: userId,
        hashedRt: {
          not: null,
        },
      },
      data: {
        hashedRt: null,
      },
    });
    await this.createUserLogs(userId, req, res)
    res.clearCookie('logged', {path:'/'});
    res.clearCookie('exp_limit', {path:'/'});
    res.clearCookie('access_token', {path:'/'});
    res.clearCookie('refreshToken', {path:'/'});
    res.status(200).send({
      'statusCode': 200,
      'message': 'Successfully logged out.'
    });
  }

  async refreshTokens(userId: string, rt: string, req: Request, res: Response): Promise<Tokens> {
    // SET MULTI LOGIN TRUE
    let user: object = {}
    if (multiLogin) {
      user = await this.checkUserHasSignin(userId, rt)
    } else {
      const data = await this.prisma.users.findUnique({
        where: {
          id: userId,
        },
      });
      user = data || {}
      if (!user || !user['hashedRt']) throw new ForbiddenException('Access Denied! user not found');
    }

    //Condition if the user does not perform an action on the all endpoint
    let timeNow = new Date().getTime();
    let timeAt = parseInt(req.cookies?.exp_limit);
    let timeRequest = timeNow - timeAt;
    console.log(`\x1b[32m before hit: ${req.user?.['limitHit']} | after hit: ${user['limitHit']}\x1b[0m`)
    if (req.user?.['limitHit'] == user['limitHit']) {
      if (timeRequest >= user['timeRt']) {
        this.autoLogout(user['id'], rt, req, res);
      }
      console.log(`\x1b[33m [timeRequest => ${timeRequest}] more than [timeRt => ${user['timeRt']}] will log out automatically.\x1b[0m`)
    } else {
      res.cookie('exp_limit', new Date().getTime(),  {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        expires: new Date(new Date().getTime()+1000*60*60*24*365),
      })
      if (!isNaN(timeRequest)) {
        console.log(`\x1b[33m [timeRequest => ${timeRequest}] more than [timeRt => ${user['timeRt']}] will log out automatically.\x1b[0m`)
      }
      console.log('\x1b[90m Your expiry time has reloaded.\x1b[0m');
    }

    const tokens = await this.getTokens(user['id'], user['fullname'], user['username'], user['email'], user['limitHit'], user['ttl'], user['timeRt'], user['timeAt']);
    await this.updateRtHash(user['id'], tokens.refresh);
    const base64Payload = tokens.access.split('.')[1];
    const payloadBuffer = Buffer.from(base64Payload, 'base64');
    const updatedJwtPayload: JwtPayload = JSON.parse(payloadBuffer.toString()) as JwtPayload;
    const expires = {
      exp: updatedJwtPayload['exp']
    }

    return {...tokens,...expires};
  }

  async updateRtHash(userId: string, rt: string): Promise<void> {
    const hash = await argon.hash(rt);
    await this.prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        hashedRt: hash,
      },
    });
  }

  async getTokens(
    userId: string, 
    fullname: string, 
    username: string, 
    email: string,
    limitHit: number,
    ttl: number,
    timeRt: number,
    timeAt: number): Promise<Tokens> {
    const jwtPayload: JwtPayload = {
      id: userId,
      fullname: fullname,
      username: username,
      email: email,
      limitHit: limitHit,
      ttl: ttl,
    };

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.config.get<string>('AT_SECRET'),
        expiresIn: `${timeAt}s`,
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.config.get<string>('RT_SECRET'),
        expiresIn: `${timeRt}s`,
      }),
    ]);

    return {
      access: at,
      refresh: rt,
    };
  }

  async createUserLogs(userId: string, req: Request, res: Response): Promise<any> {
    const { ip, method, originalUrl } = req;
    const userAgent = req.get('user-agent') || '';

    try {
      await this.prisma.user_logs.create({
        data: {
          userId,
          ip: ip||'',
          method,
          accessUrl: originalUrl,
          userAgent,
        }
      })
      console.log('userId:'+userId+', ip:'+ip+', method:'+method+', originalUrl:'+originalUrl+', userAgent:'+userAgent)
    } catch (error) {
      throw new BadRequestException('Userlogs says: something wrong error!')
    }
  }

  async checkUserHasSignin(userId: string, rt: string): Promise<any> {
    const user = await this.prisma.users.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user || !user.hashedRt) throw new ForbiddenException('Access Denied! user not found');

    const rtMatches = await argon.verify(user.hashedRt, rt);
    if (!rtMatches) throw new ForbiddenException('Sorry, your session is currently in use on another device. Please logout of either device and try logging in again.');
    return user;
  }
}

export const multiLogin: number = parseInt(process.env.MULTI_LOGIN || '0')
