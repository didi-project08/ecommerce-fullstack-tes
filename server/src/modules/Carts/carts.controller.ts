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
import { CartsService } from './carts.service';
import { UidDto, CreateCartsDto, UpdateCartsDto, delPermanentCartsDto, PaginationDto  } from './dto';
import { RateLimitInterceptor } from '../../common/interceptors/rate-limit.interceptors';

@ApiTags('Carts')
@Controller()
export class CartsController {
    constructor(private cartsService: CartsService) {}
    
    @ApiBearerAuth()
    @Get()
    @SetPermissions('carts:read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get Record Carts' })
    async getCarts(@GetCurrentUserId() userId: string, @Query() dto: PaginationDto, @Res() res: Response): Promise<void> {
        const { data, total } = await this.cartsService.getCarts(userId, dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            total,
            data,
        });
    }

    @ApiBearerAuth()
    @Post()
    @SetPermissions('carts:create')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Create Record Carts' })
    async createCarts(@GetCurrentUserId() userId: string, @Body() dto: CreateCartsDto, @Res() res: Response): Promise<void> {
        const data = await this.cartsService.createCarts(userId, dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Created successfully',
            'data': data,
        });
    }

    @ApiBearerAuth()
    @Put(':id')
    @SetPermissions('carts:update')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update Record Carts by ID' })
    async UpdateCartsById(
        @GetCurrentUser() currUser: string,
        @Param() param: UidDto, 
        @Body() dto: UpdateCartsDto,
        @Res() res: Response): Promise<void> {
        const data = await this.cartsService.UpdateCartsById(currUser, param, dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Updated successfully',
            'data': data,
        });
    }

    @ApiBearerAuth()
    @Get(':id')
    @SetPermissions('carts:readById')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get Record Carts by ID' })
    async getCartsById(@Param() dto: UidDto, @Res() res: Response): Promise<void> {
        const { data, message } = await this.cartsService.getCartsById(dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            message,
            data,
        });
    }

    @ApiBearerAuth()
    @Delete(':id')
    @SetPermissions('carts:delete')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete Record Carts by ID' })
    async deleteCartsById(
        @GetCurrentUser() currUser: string, 
        @Param() param: UidDto, 
        @Body() body: delPermanentCartsDto,
        @Res() res: Response): Promise<void> {
        const data = await this.cartsService.deleteCartsById(currUser, param, body, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Deleted successfully',
            'data': data,
        });
    }
}