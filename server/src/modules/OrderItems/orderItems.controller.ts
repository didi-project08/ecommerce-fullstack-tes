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
import { OrderItemsService } from './orderItems.service';
import { UidDto, CreateOrderItemsDto, UpdateOrderItemsDto, delPermanentOrderItemsDto, PaginationDto  } from './dto';
import { RateLimitInterceptor } from '../../common/interceptors/rate-limit.interceptors';

@ApiTags('Order Items')
@Controller()
export class OrderItemsController {
    constructor(private orderItemsService: OrderItemsService) {}
    
    @Public()
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get Record OrderItems' })
    async getOrderItems(@Query() dto: PaginationDto, @Res() res: Response): Promise<void> {
        const { data, total } = await this.orderItemsService.getOrderItems(dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            total,
            data,
        });
    }

    // @ApiBearerAuth()
    @Public()
    @Post()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Create Record OrderItems' })
    async createOrderItems(@Body() dto: CreateOrderItemsDto, @Res() res: Response): Promise<void> {
        const data = await this.orderItemsService.createOrderItems(dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Created successfully',
            'data': data,
        });
    }

    // @ApiBearerAuth()
    @Public()
    @Put(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update Record OrderItems by ID' })
    async UpdateOrderItemsById(
        @GetCurrentUser() currUser: string,
        @Param() param: UidDto, 
        @Body() dto: UpdateOrderItemsDto,
        @Res() res: Response): Promise<void> {
        const data = await this.orderItemsService.UpdateOrderItemsById(currUser, param, dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Updated successfully',
            'data': data,
        });
    }

    // @ApiBearerAuth()
    @Public()
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get Record OrderItems by ID' })
    async getOrderItemsById(@Param() dto: UidDto, @Res() res: Response): Promise<void> {
        const { data, message } = await this.orderItemsService.getOrderItemsById(dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            message,
            data,
        });
    }

    // @ApiBearerAuth()
    @Public()
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete Record OrderItems by ID' })
    async deleteOrderItemsById(
        @GetCurrentUser() currUser: string, 
        @Param() param: UidDto, 
        @Body() body: delPermanentOrderItemsDto,
        @Res() res: Response): Promise<void> {
        const data = await this.orderItemsService.deleteOrderItemsById(currUser, param, body, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Deleted successfully',
            'data': data,
        });
    }
}