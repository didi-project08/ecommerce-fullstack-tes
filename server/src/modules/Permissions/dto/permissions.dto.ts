import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsNumber, IsInt } from 'class-validator';

export class UidDto {
    @ApiProperty({
        required: true,
    })
    @Type(() => String)
    @IsNotEmpty()
    @IsString()
    id: string;
}

export class CreatePermissionsDto {
    @ApiProperty({
        required: false,
    })
    // @Type(() => String)
    // @IsNotEmpty()
    // @IsString()
    pGroupId: string;

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
        required: false,
    })
    @Type(() => String)
    @IsString()
    icon: string;

    @ApiProperty({
        required: false,
    })
    @Type(() => String)
    @IsString()
    path: string;

    @ApiProperty({
        required: false,
    })
    @Type(() => String)
    @IsString()
    type: string;

    @ApiProperty({
        required: false,
    })
    // @Type(() => String)
    // @IsNotEmpty()
    // @IsString()
    sort: number;
}

export class UpdatePermissionsDto {
    @ApiProperty({
        required: false,
    })
    // @Type(() => String)
    // @IsNotEmpty()
    // @IsString()
    pGroupId: string;

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
    // @Type(() => String)
    // @IsNotEmpty()
    // @IsString()
    description: string;

    @ApiProperty({
        required: false,
    })
    // @Type(() => String)
    // @IsNotEmpty()
    // @IsString()
    icon: string;

    @ApiProperty({
        required: false,
    })
    // @Type(() => String)
    // @IsNotEmpty()
    // @IsString()
    path: string;

    @ApiProperty({
        required: false,
    })
    // @Type(() => String)
    // @IsNotEmpty()
    // @IsString()
    sort: number;

    @ApiProperty({
        required: false,
    })
    restore: boolean;
}

export class delPermanentPermissionsDto {
    @ApiProperty({
        required: false,
    })
    permanent: boolean;
}