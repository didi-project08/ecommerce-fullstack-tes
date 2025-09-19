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
import { ProductsService } from './products.service';
import { UidDto, CreateProductsDto, UpdateProductsDto, delPermanentProductsDto, PaginationDto  } from './dto';
import { RateLimitInterceptor } from '../../common/interceptors/rate-limit.interceptors';

@ApiTags('Products')
@Controller()
export class ProductsController {
    constructor(private productsService: ProductsService) {}
    
    @Public()
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get Record Products' })
    async getProducts(@Query() dto: PaginationDto, @Res() res: Response): Promise<void> {
        const { data, total } = await this.productsService.getProducts(dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            total,
            data,
        });
    }

    @ApiBearerAuth()
    @Post()
    @SetPermissions('products:create')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Create Record Products' })
    async createProducts(@Body() dto: CreateProductsDto, @Res() res: Response): Promise<void> {
        const roles = await this.productsService.createProducts(dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Created successfully',
            'data': roles,
        });
    }

    @ApiBearerAuth()
    @Put(':id')
    @SetPermissions('products:update')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update Record Products by ID' })
    async UpdateProductsById(
        @GetCurrentUser() currUser: string,
        @Param() param: UidDto, 
        @Body() dto: UpdateProductsDto,
        @Res() res: Response): Promise<void> {
        const users = await this.productsService.UpdateProductsById(currUser, param, dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Updated successfully',
            'data': users,
        });
    }

    @ApiBearerAuth()
    @Get(':id')
    @SetPermissions('products:readById')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get Record Products by ID' })
    async getProductsById(@Param() dto: UidDto, @Res() res: Response): Promise<void> {
        const { data, message } = await this.productsService.getProductsById(dto, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            message,
            data,
        });
    }

    @ApiBearerAuth()
    @Delete(':id')
    @SetPermissions('products:delete')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete Record Products by ID' })
    async deleteProductsById(
        @GetCurrentUser() currUser: string, 
        @Param() param: UidDto, 
        @Body() body: delPermanentProductsDto,
        @Res() res: Response): Promise<void> {
        const roles = await this.productsService.deleteProductsById(currUser, param, body, res);
        res.status(HttpStatus.OK).send({
            'statusCode': HttpStatus.OK,
            'message': 'Deleted successfully',
            'data': roles,
        });
    }
}