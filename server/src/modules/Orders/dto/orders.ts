import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsInt } from 'class-validator';

export class UidDto {
    @ApiProperty({
        required: true,
    })
    @Type(() => String)
    @IsNotEmpty()
    @IsString()
    id: string;
}

enum OrderStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED',
}

export class CreateOrdersDto {
    @ApiProperty({
        required: false,
    })
    @Type(() => String)
    @IsOptional()
    @IsString()
    userId: string;

    @ApiProperty({
        required: true,
    })
    @Type(() => String)
    @IsDateString()
    orderDate: string;

    @ApiProperty({
        required: true,
    })
    @Type(() => Number)
    @IsNumber()
    totalAmount: number;

    @ApiProperty({
        required: false,
    })
    @IsEnum(OrderStatus, { message: 'Invalid order status provided.' })
    status: OrderStatus;

    @ApiProperty({
        required: false,
    })
    @Type(() => String)
    @IsString()
    email: string;

    @ApiProperty({
        required: false,
    })
    @Type(() => String)
    @IsString()
    phone: string;

    @ApiProperty({
        required: false,
    })
    @Type(() => String)
    @IsString()
    address: string;
}

export class UpdateOrdersDto {
    @ApiProperty({
        required: false,
    })
    @Type(() => String)
    @IsOptional()
    @IsString()
    userId: string;

    @ApiProperty({
        required: true,
    })
    @Type(() => String)
    @IsDateString()
    orderDate: string;

    @ApiProperty({
        required: true,
    })
    @Type(() => Number)
    @IsNumber()
    totalAmount: number;

    @ApiProperty({
        required: false,
    })
    @IsEnum(OrderStatus, { message: 'Invalid order status provided.' })
    status: OrderStatus;

    @ApiProperty({
        required: false,
    })
    @Type(() => String)
    @IsString()
    email: number;

    @ApiProperty({
        required: false,
    })
    @Type(() => String)
    @IsString()
    phone: string;

    @ApiProperty({
        required: false,
    })
    @Type(() => String)
    @IsString()
    address: string;

    @ApiProperty({
        required: false,
    })
    restore: boolean;
}

export class delPermanentOrdersDto {
    @ApiProperty({
        required: false,
    })
    permanent: boolean;
}