import {
    Body,
    Param,
    Query,
    Req,
    Res,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Get,
    Delete,
    Put,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiQuery, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public, GetCurrentUserId, GetCurrentUser, SetPermissions } from '../../common/decorators';
import { RtGuard, AtGuard } from '../../common/guards';
import { ApplicationsService } from './applications.service';
import { RateLimitInterceptor } from '../../common/interceptors/rate-limit.interceptors';

@ApiTags('Applications')
@Controller()
export class ApplicationsController {
    constructor(private applications: ApplicationsService) {}

    @ApiBearerAuth()
    @UseInterceptors(RateLimitInterceptor)
    @Get('modules')
    @SetPermissions('modules:read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get Record App Modules' })
    async getModules( @GetCurrentUserId() userId: string, @Res() res: Response): Promise<void> {
        const { data, total } = await this.applications.getModules(userId, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            total,
            data,
        });
    }
}