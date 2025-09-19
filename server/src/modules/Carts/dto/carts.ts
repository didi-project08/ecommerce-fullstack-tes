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

export class CreateCartsDto {
    @ApiProperty({
        required: true,
    })
    @Type(() => String)
    @IsString()
    sessionId: string;
}

export class UpdateCartsDto {
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
    @IsString()
    sessionId: string;

    @ApiProperty({
        required: false,
    })
    restore: boolean;
}

export class delPermanentCartsDto {
    @ApiProperty({
        required: false,
    })
    permanent: boolean;
}