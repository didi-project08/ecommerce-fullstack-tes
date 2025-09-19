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
import { RolePermissionsService } from './rolePermissions.service';
import { UidDto, CreateRolePermissionsDto, PaginationDto, TypeModuleDto  } from './dto';
import { RateLimitInterceptor } from '../../common/interceptors/rate-limit.interceptors';

@ApiTags('Role Permissions')
@Controller()
export class RolePermissionsController {
    constructor(private rolePermissionsService: RolePermissionsService) {}

    @ApiBearerAuth()
    @UseInterceptors(RateLimitInterceptor)
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get Record Role Permissions' })
    async getRolePermissions(@Query() dto: PaginationDto, @Res() res: Response): Promise<void> {
        const { data, total } = await this.rolePermissionsService.getRolePermissions(dto, res);
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
    @ApiOperation({ summary: 'Upsert Record Role Permissions' })
    async createRolePermissions(@Body() dto: CreateRolePermissionsDto, @Res() res: Response): Promise<void> {
        const rolePermissions = await this.rolePermissionsService.createRolePermissions(dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Role permissions has been change.',
            'data': rolePermissions,
        });
    }

    @ApiBearerAuth()
    @UseInterceptors(RateLimitInterceptor)
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get Record Role Permissions by ID' })
    async getRolePermissionsById(@Param() dto: UidDto, @Res() res: Response): Promise<void> {
        const { data, total } = await this.rolePermissionsService.getRolePermissionsById(dto, res);
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
    @ApiOperation({ summary: 'Delete Record Role Permissions by ID' })
    async deleteRolePermissionsById(@GetCurrentUser() currUser: string, @Param() dto: UidDto, @Res() res: Response): Promise<void> {
        const rolePermissions = await this.rolePermissionsService.deleteRolePermissionsById(currUser, dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Deleted successfully',
            'data': rolePermissions,
        });
    }
}