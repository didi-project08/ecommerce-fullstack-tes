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
import { Public, GetCurrentUserId, GetCurrentUser } from '../../common/decorators';
import { RtGuard, AtGuard } from '../../common/guards';
import { RoleUsersService } from './roleUsers.service';
import { UidDto, CreateRoleUsersDto, PaginationDto, TypeModuleDto  } from './dto';
import { RateLimitInterceptor } from '../../common/interceptors/rate-limit.interceptors';

@ApiTags('Role Users')
@Controller()
export class RoleUsersController {
    constructor(private roleUsersService: RoleUsersService) {}

    @ApiBearerAuth()
    @UseInterceptors(RateLimitInterceptor)
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get Record Role Users' })
    async getRoleUsers(@Query() dto: PaginationDto, @Res() res: Response): Promise<void> {
        const { data, total } = await this.roleUsersService.getRoleUsers(dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            total,
            data,
        });
    }

    @ApiBearerAuth()
    @UseInterceptors(RateLimitInterceptor)
    @Post()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Upsert Record Role Users' })
    async createRoleUsers(@Body() dto: CreateRoleUsersDto, @Res() res: Response): Promise<void> {
        const roleUsers = await this.roleUsersService.createRoleUsers(dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Role users has been change.',
            'data': roleUsers,
        });
    }

    @ApiBearerAuth()
    @UseInterceptors(RateLimitInterceptor)
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get Record Role Users by ID' })
    async getRoleUsersById(@Param() dto: UidDto, @Res() res: Response): Promise<void> {
        const { data, total } = await this.roleUsersService.getRoleUsersById(dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            total,
            data,
        });
    }

    @ApiBearerAuth()
    @UseInterceptors(RateLimitInterceptor)
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete Record Role Users by ID' })
    async deleteRoleUsersById(@GetCurrentUser() currUser: string, @Param() dto: UidDto, @Res() res: Response): Promise<void> {
        const roleUsers = await this.roleUsersService.deleteRoleUsersById(currUser, dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Deleted successfully',
            'data': roleUsers,
        });
    }
}