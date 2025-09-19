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
import { PermissionsService } from './permissions.service';
import { UidDto, CreatePermissionsDto, UpdatePermissionsDto, delPermanentPermissionsDto, PaginationDto  } from './dto';
import { RateLimitInterceptor } from '../../common/interceptors/rate-limit.interceptors';

@ApiTags('Permissions')
@Controller()
export class PermissionsController {
    constructor(private permissionsService: PermissionsService) {}
    
    @ApiBearerAuth()
    @UseInterceptors(RateLimitInterceptor)
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get Record Permissions' })
    async getPermissions(@Query() dto: PaginationDto, @Res() res: Response): Promise<void> {
        const { data, total } = await this.permissionsService.getPermissions(dto, res);
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
    @ApiOperation({ summary: 'Create Record Permissions' })
    async createPermissions(@Body() dto: CreatePermissionsDto, @Res() res: Response): Promise<void> {
        const roles = await this.permissionsService.createPermissions(dto, res);
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
    @ApiOperation({ summary: 'Update Record Permissions by ID' })
    async UpdatePermissionsById(
        @GetCurrentUser() currUser: string,
        @Param() param: UidDto, 
        @Body() dto: UpdatePermissionsDto,
        @Res() res: Response): Promise<void> {
        const users = await this.permissionsService.UpdatePermissionsById(currUser, param, dto, res);
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
    @ApiOperation({ summary: 'Get Record Permissions by ID' })
    async getPermissionsById(@Param() dto: UidDto, @Res() res: Response): Promise<void> {
        const { data, total } = await this.permissionsService.getPermissionsById(dto, res);
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
    @ApiOperation({ summary: 'Delete Record Permissions by ID' })
    async deletePermissionsById(
        @GetCurrentUser() currUser: string, 
        @Param() param: UidDto, 
        @Body() body: delPermanentPermissionsDto,
        @Res() res: Response): Promise<void> {
        const roles = await this.permissionsService.deletePermissionsById(currUser, param, body, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Deleted successfully',
            'data': roles,
        });
    }
}