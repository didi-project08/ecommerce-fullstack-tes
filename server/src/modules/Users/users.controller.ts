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
    UseInterceptors,
    UseGuards,
    HttpException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiQuery, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public, GetCurrentUserId, GetCurrentUser, SetPermissions } from '../../common/decorators';
import { UsersService } from './users.service';
import { UidDto, CreateUsersDto, UpdateUsersDto, PaginationDto } from './dto';
import { RateLimitInterceptor } from '../../common/interceptors/rate-limit.interceptors';

// export interface IUser {
//     id: number;
// }

@ApiTags('Users')
@Controller()
export class UsersController {
    constructor(private usersService: UsersService) {}

    @ApiBearerAuth()
    @UseInterceptors(RateLimitInterceptor)
    @Get()
    @SetPermissions('users:read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get Record Users' })
    async getUsers(@Query() dto: PaginationDto, @Res() res: Response): Promise<void> {
        const { data, total } = await this.usersService.getUsers(dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            total,
            data,
        });
    }

    @ApiBearerAuth()
    @Post()
    @SetPermissions('users:create')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Create Record Users' })
    async createUsers(@Body() dto: CreateUsersDto, @Res() res: Response): Promise<void> {
        const users = await this.usersService.createUsers(dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Created successfully',
            'data': users,
        });
    }

    @ApiBearerAuth()
    @UseInterceptors(RateLimitInterceptor)
    @Put(':id')
    @SetPermissions('users:update')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update Record Users by ID' })
    async UpdateUsersById(@Param() userId: UidDto, @Body() dto: UpdateUsersDto, @Res() res: Response): Promise<void> {
        const users = await this.usersService.UpdateUsersById(userId, dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Updated successfully',
            'data': users,
        });
    }

    @ApiBearerAuth()
    @UseInterceptors(RateLimitInterceptor)
    @Get(':id')
    @SetPermissions('users:read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get Record Users by ID' })
    async getUsersById(@Param() dto: UidDto, @Res() res: Response): Promise<void> {
        const { data, total } = await this.usersService.getUsersById(dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            total,
            data,
        });
    }

    @ApiBearerAuth()
    @Delete(':id')
    @SetPermissions('users:delete')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete Record Users by ID' })
    async deleteUsersById(@GetCurrentUser() currUser: string, @Param() dto: UidDto, @Res() res: Response): Promise<void> {
        const users = await this.usersService.deleteUsersById(currUser, dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Deleted successfully',
            'data': users,
        });
    }
}