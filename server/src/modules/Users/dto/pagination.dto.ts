import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class PaginationDto {
    @ApiProperty({
        required: false,
    })
    // @Type(() => String)
    // @IsString()
    search: string;

    @ApiProperty({
        required: false,
    })
    // @Type(() => String)
    // @IsString()
    filter: string;

    @ApiProperty({
        required: false,
    })
    // @Type(() => Number)
    // @IsNumber()
    page: number;

    @ApiProperty({
        required: false,
    })
    // @Type(() => Number)
    // @IsNumber()
    rows: number;
}