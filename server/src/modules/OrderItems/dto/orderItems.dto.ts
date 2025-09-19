import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, IsNumberString, IsInt } from 'class-validator';

export class UidDto {
    @ApiProperty({
        required: true,
    })
    @Type(() => String)
    @IsNotEmpty()
    @IsString()
    id: string;
}

export class CreateOrderItemsDto {
    @ApiProperty({
        required: true,
    })
    @Type(() => String)
    @IsNotEmpty()
    @IsString()
    orderId: string;

    @ApiProperty({
        required: true,
    })
    @Type(() => String)
    @IsNotEmpty()
    @IsString()
    productId: string;

    @ApiProperty({
        required: true,
    })
    @Type(() => Number)
    @IsNumber()
    quantity: number;

    @ApiProperty({
        required: true,
    })
    @Type(() => Number)
    @IsNumber()
    price: number;
}

export class UpdateOrderItemsDto {
    @ApiProperty({
        required: true,
    })
    @Type(() => String)
    @IsNotEmpty()
    @IsString()
    orderId: string;

    @ApiProperty({
        required: true,
    })
    @Type(() => String)
    @IsNotEmpty()
    @IsString()
    productId: string;

    @ApiProperty({
        required: true,
    })
    @Type(() => Number)
    @IsNumber()
    quantity: number;

    @ApiProperty({
        required: true,
    })
    @Type(() => Number)
    @IsNumber()
    price: number;

    @ApiProperty({
        required: false,
    })
    restore: boolean;
}

export class delPermanentOrderItemsDto {
    @ApiProperty({
        required: false,
    })
    permanent: boolean;
}