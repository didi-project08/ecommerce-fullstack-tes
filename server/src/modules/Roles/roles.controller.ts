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
import { RolesService } from './roles.service';
import { UidDto, CreateRolesDto, UpdateRolesDto, delPermanentRolesDto, PaginationDto, TypeModuleDto  } from './dto';
import { RateLimitInterceptor } from '../../common/interceptors/rate-limit.interceptors';

@ApiTags('Roles')
@Controller()
export class RolesController {
    constructor(private rolesService: RolesService) {}

    @ApiBearerAuth()
    @UseInterceptors(RateLimitInterceptor)
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get Record Roles' })
    async getRoles(@Query() dto: PaginationDto, @Res() res: Response): Promise<void> {
        const { data, total } = await this.rolesService.getRoles(dto, res);
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
    @ApiOperation({ summary: 'Create Record Roles' })
    async createRoles(@Query() types: TypeModuleDto, @Body() dto: CreateRolesDto, @Res() res: Response): Promise<void> {
        const roles = await this.rolesService.createRoles(types, dto, res);
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
    @ApiOperation({ summary: 'Update Record Roles by ID' })
    async UpdateRolesById(
        @GetCurrentUser() currUser: string,
        @Param() param: UidDto, 
        @Body() body: UpdateRolesDto,
        @Res() res: Response): Promise<void> {
        const users = await this.rolesService.UpdateRolesById(currUser, param, body, res);
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
    @ApiOperation({ summary: 'Get Record Roles by ID' })
    async getRolesById(@Param() dto: UidDto, @Res() res: Response): Promise<void> {
        const { data, total } = await this.rolesService.getRolesById(dto, res);
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
    @ApiOperation({ summary: 'Delete Record Roles by ID' })
    async deleteRolesById(
        @GetCurrentUser() currUser: string, 
        @Param() param: UidDto, 
        @Body() body: delPermanentRolesDto,
        @Res() res: Response): Promise<void> {
        const roles = await this.rolesService.deleteRolesById(currUser, param, body, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Deleted successfully',
            'data': roles,
        });
    }
}