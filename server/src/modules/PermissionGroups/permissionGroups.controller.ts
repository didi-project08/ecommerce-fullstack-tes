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
import { PermissionGroupsService } from './permissionGroups.service';
import { UidDto, CreatePermissionGroupsDto, UpdatePermissionGroupsDto, delPermanentPermissionGroupsDto, PaginationDto, TypeModuleDto  } from './dto';
import { RateLimitInterceptor } from '../../common/interceptors/rate-limit.interceptors';

@ApiTags('Permission Groups')
@Controller()
export class PermissionGroupsController {
    constructor(private permissionGroupsService: PermissionGroupsService) {}
    
    @ApiBearerAuth()
    @UseInterceptors(RateLimitInterceptor)
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get Record Permission Groups' })
    async getPermissionGroups(@Query() dto: PaginationDto, @Res() res: Response): Promise<void> {
        const { data, total } = await this.permissionGroupsService.getPermissionGroups(dto, res);
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
    @ApiOperation({ summary: 'Create Record Permission Groups' })
    async createPermissionGroups(@Body() dto: CreatePermissionGroupsDto, @Res() res: Response): Promise<void> {
        const roles = await this.permissionGroupsService.createPermissionGroups(dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Created successfully',
            'data': roles,
        });
    }

    @ApiBearerAuth()
    @UseInterceptors(RateLimitInterceptor)
    @Put(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update Record Permission Groups by ID' })
    async UpdatePermissionGroupsById(
        @GetCurrentUser() currUser: string,
        @Param() param: UidDto,
        @Body() body: UpdatePermissionGroupsDto,
        @Res() res: Response): Promise<void> {
        const users = await this.permissionGroupsService.UpdatePermissionGroupsById(currUser, param, body, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Updated successfully',
            'data': users,
        });
    }

    @ApiBearerAuth()
    @UseInterceptors(RateLimitInterceptor)
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get Record Permission Groups by ID' })
    async getPermissionGroupsById(@Param() dto: UidDto, @Res() res: Response): Promise<void> {
        const { data, total } = await this.permissionGroupsService.getPermissionGroupsById(dto, res);
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
    @ApiOperation({ summary: 'Delete Record Permission Groups by ID' })
    async deletePermissionGroupsById(
        @GetCurrentUser() currUser: string, 
        @Param() param: UidDto,
        @Body() body: delPermanentPermissionGroupsDto,
        @Res() res: Response): Promise<void> {
        const roles = await this.permissionGroupsService.deletePermissionGroupsById(currUser, param, body, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Deleted successfully',
            'data': roles,
        });
    }
}