import {
  Body,
  Req,
  Res,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Request, Response } from 'express';
import { Public, GetCurrentUserId, GetCurrentUser, SetPermissions } from '../common/decorators';
import { RtGuard, AtGuard } from '../common/guards';
import { AuthService } from './auth.service';
import { SignInDto, SignUpDto, ChangePasswordDto } from './dto';
import { Tokens } from './types';

@ApiTags('Authentication')
@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registration User' })
  signUp(
    @Body() dto: SignUpDto, 
    @Req() req: Request, 
    @Res() res: Response): Promise<Tokens> {
    return this.authService.signUp(dto, req, res);
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login User' })
  async signIn(
    @Body() dto: SignInDto, 
    @Req() req: Request, 
    @Res({ passthrough: true }) res: Response): Promise<void> {
    const resp = await this.authService.signIn(dto, req, res);
    res.cookie('access_token', resp.access, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      expires: new Date(new Date().getTime()+1000*60*60*24*365),
    });
    res.cookie('refreshToken', resp.refresh, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      expires: new Date(new Date().getTime()+1000*60*60*24*365),
    }).send({ 
      status: 'ok',
      exp: resp['exp'],
    });
  }

  @ApiBearerAuth()
  @Post('me')
  @SetPermissions('user:me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Info Userlogs' })
  async me(
    @GetCurrentUserId() userId: string, 
    @Req() req: Request, 
    @Res() res: Response): Promise<void> {
    const user = await this.authService.me(userId, req, res)
    res.status(HttpStatus.OK).send({
      'statusCode': HttpStatus.OK,
      'data': user
    });
  }

  @ApiBearerAuth()
  @Post('changepassword')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change Password User' })
  changePassword(
    @GetCurrentUserId() userId: string, 
    @Body() dto: ChangePasswordDto, 
    @Req() req: Request, 
    @Res() res: Response): Promise<void> {
    return this.authService.changePassword(userId, dto, req, res);
  }

  @ApiBearerAuth()
  @UseGuards(RtGuard)
  @Post('logout')
  @SetPermissions('user:logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout User' })
  async logout(
    @GetCurrentUserId() userId: string, 
    @GetCurrentUser('refreshToken') refreshToken: string,
    @Req() req: Request,
    @Res() res: Response): Promise<void> {
    await this.authService.logout(userId, refreshToken, req, res);
    res.clearCookie('access_token', {path:'/'});
    res.clearCookie('refreshToken', {path:'/'});
    res.status(HttpStatus.OK).send({
      'statusCode': HttpStatus.OK,
      'message': 'Successfully logged out.'
    });
  }

  @ApiBearerAuth()
  @Public()
  @UseGuards(RtGuard)
  @Post('refresh')
  @SetPermissions('user:refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh Token Users' })
  async refreshTokens(
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const resp = await this.authService.refreshTokens(userId, refreshToken, req, res)
    res.clearCookie('access_token', {path:'/'});
    res.clearCookie('refreshToken', {path:'/'});
    res.cookie('access_token', resp.access, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      expires: new Date(new Date().getTime()+1000*60*60*24*365),
    });
    res.cookie('refreshToken', resp.refresh, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      expires: new Date(new Date().getTime()+1000*60*60*24*365),
    }).send({ 
      status: 'ok',
      exp: resp['exp'],
    });
  }
}
