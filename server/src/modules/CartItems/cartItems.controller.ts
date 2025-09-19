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
import { CartItemsService } from './cartItems.service';
import { UidDto, CreateCartItemsDto, UpdateCartItemsDto, delPermanentCartItemsDto, PaginationDto  } from './dto';
import { RateLimitInterceptor } from '../../common/interceptors/rate-limit.interceptors';

@ApiTags('Cart Items')
@Controller()
export class CartItemsController {
    constructor(private cartItemsService: CartItemsService) {}
    
    @ApiBearerAuth()
    @Get()
    @SetPermissions('cartItems:read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get Record CartItems' })
    async getCartItems(@Query() dto: PaginationDto, @Res() res: Response): Promise<void> {
        const { data, total } = await this.cartItemsService.getCartItems(dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            total,
            data,
        });
    }

    @ApiBearerAuth()
    @Post()
    @SetPermissions('cartItems:create')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Create Record CartItems' })
    async createCartItems(@Body() dto: CreateCartItemsDto, @Res() res: Response): Promise<void> {
        const data = await this.cartItemsService.createCartItems(dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Created successfully',
            'data': data,
        });
    }

    @ApiBearerAuth()
    @Put(':id')
    @SetPermissions('cartItems:update')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update Record CartItems by ID' })
    async UpdateCartItemsById(
        @GetCurrentUser() currUser: string,
        @Param() param: UidDto, 
        @Body() dto: UpdateCartItemsDto,
        @Res() res: Response): Promise<void> {
        const data = await this.cartItemsService.UpdateCartItemsById(currUser, param, dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Updated successfully',
            'data': data,
        });
    }

    @ApiBearerAuth()
    @Get(':id')
    @SetPermissions('cartItems:readById')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get Record CartItems by ID' })
    async getCartItemsById(@Param() dto: UidDto, @Res() res: Response): Promise<void> {
        const { data, message } = await this.cartItemsService.getCartItemsById(dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            message,
            data,
        });
    }

    @ApiBearerAuth()
    @Delete(':id')
    @SetPermissions('cartItems:delete')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete Record CartItems by ID' })
    async deleteCartItemsById(
        @GetCurrentUser() currUser: string, 
        @Param() param: UidDto, 
        @Body() body: delPermanentCartItemsDto,
        @Res() res: Response): Promise<void> {
        const data = await this.cartItemsService.deleteCartItemsById(currUser, param, body, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Deleted successfully',
            'data': data,
        });
    }
}