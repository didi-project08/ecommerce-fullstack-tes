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

export class CreateCartItemsDto {
    @ApiProperty({
        required: true,
    })
    @Type(() => String)
    @IsNotEmpty()
    @IsString()
    cartId: string;

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
}

export class UpdateCartItemsDto {
    @ApiProperty({
        required: false,
    })
    @Type(() => String)
    @IsOptional()
    @IsString()
    cartId: string;

    @ApiProperty({
        required: false,
    })
    @Type(() => String)
    @IsOptional()
    @IsString()
    productId: string;

    @ApiProperty({
        required: true,
    })
    @Type(() => Number)
    @IsNumber()
    quantity: number;

    @ApiProperty({
        required: false,
    })
    restore: boolean;
}

export class delPermanentCartItemsDto {
    @ApiProperty({
        required: false,
    })
    permanent: boolean;
}