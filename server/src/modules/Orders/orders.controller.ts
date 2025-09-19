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
import { OrdersService } from './orders.service';
import { UidDto, CreateOrdersDto, UpdateOrdersDto, delPermanentOrdersDto, PaginationDto  } from './dto';
import { RateLimitInterceptor } from '../../common/interceptors/rate-limit.interceptors';

@ApiTags('Orders')
@Controller()
export class OrdersController {
    constructor(private ordersService: OrdersService) {}
    
    @ApiBearerAuth()
    @Get()
    @SetPermissions('orders:read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get Record Orders' })
    async getOrders(@GetCurrentUserId() userId: string, @Query() dto: PaginationDto, @Res() res: Response): Promise<void> {
        const { data, total } = await this.ordersService.getOrders(userId, dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            total,
            data,
        });
    }

    @ApiBearerAuth()
    @Post()
    @SetPermissions('orders:create')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Create Record Orders' })
    async createOrders(@Body() dto: CreateOrdersDto, @Res() res: Response): Promise<void> {
        const data = await this.ordersService.createOrders(dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Created successfully',
            'data': data,
        });
    }

    @ApiBearerAuth()
    @Put(':id')
    @SetPermissions('orders:update')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update Record Orders by ID' })
    async UpdateOrdersById(
        @GetCurrentUser() currUser: string,
        @Param() param: UidDto, 
        @Body() dto: UpdateOrdersDto,
        @Res() res: Response): Promise<void> {
        const data = await this.ordersService.UpdateOrdersById(currUser, param, dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Updated successfully',
            'data': data,
        });
    }

    @ApiBearerAuth()
    @Get(':id')
    @SetPermissions('orders:readById')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get Record Orders by ID' })
    async getOrdersById(@Param() dto: UidDto, @Res() res: Response): Promise<void> {
        const { data, message } = await this.ordersService.getOrdersById(dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            message,
            data,
        });
    }

    @ApiBearerAuth()
    @Delete(':id')
    @SetPermissions('orders:delete')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete Record Orders by ID' })
    async deleteOrdersById(
        @GetCurrentUser() currUser: string, 
        @Param() param: UidDto, 
        @Body() body: delPermanentOrdersDto,
        @Res() res: Response): Promise<void> {
        const data = await this.ordersService.deleteOrdersById(currUser, param, body, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Deleted successfully',
            'data': data,
        });
    }
}