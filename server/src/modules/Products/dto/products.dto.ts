import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsInt } from 'class-validator';

export class UidDto {
    @ApiProperty({
        required: true,
    })
    @Type(() => String)
    @IsNotEmpty()
    @IsString()
    id: string;
}

export class CreateProductsDto {
    @ApiProperty({
        required: true,
    })
    @Type(() => String)
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({
        required: false,
    })
    @Type(() => String)
    @IsString()
    description: string;

    @ApiProperty({
        required: true,
    })
    // @Type(() => String)
    // @IsString()
    price: number;

    @ApiProperty({
        required: false,
    })
    @Type(() => String)
    @IsString()
    category: string;

    @ApiProperty({
        required: true,
    })
    // @Type(() => String)
    // @IsString()
    stock: number;

    @ApiProperty({
        required: false,
    })
    @Type(() => String)
    @IsString()
    imageUrl: string;
}

export class UpdateProductsDto {
    @ApiProperty({
        required: false,
    })
    @Type(() => String)
    @IsOptional()
    @IsString()
    name: string;

    @ApiProperty({
        required: false,
    })
    @Type(() => String)
    @IsOptional()
    @IsString()
    description: string;

    @ApiProperty({
        required: false,
    })
    // @Type(() => String)
    // @IsString()
    price: number;

    @ApiProperty({
        required: false,
    })
    @Type(() => String)
    @IsOptional()
    @IsString()
    category: string;

    @ApiProperty({
        required: false,
    })
    // @Type(() => String)
    // @IsString()
    stock: number;

    @ApiProperty({
        required: false,
    })
    @Type(() => String)
    @IsOptional()
    @IsString()
    imageUrl: string;

    @ApiProperty({
        required: false,
    })
    restore: boolean;
}

export class delPermanentProductsDto {
    @ApiProperty({
        required: false,
    })
    permanent: boolean;
}