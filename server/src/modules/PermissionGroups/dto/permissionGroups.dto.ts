import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsEmpty, IsNumber, IsInt } from 'class-validator';

export class UidDto {
    @ApiProperty({
        required: true,
    })
    @Type(() => String)
    @IsNotEmpty()
    @IsString()
    id: string;
}

export class CreatePermissionGroupsDto {
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
    icon: string;

    @ApiProperty({
        required: false,
    })
    // @Type(() => String)
    // @IsNotEmpty()
    // @IsString()
    sort: number;
}

export class UpdatePermissionGroupsDto {
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
    icon: string;

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

export class delPermanentPermissionGroupsDto {
    @ApiProperty({
        required: false,
    })
    permanent: boolean;
}

export class TypeModuleDto {
    @ApiProperty({
        required: true,
        enum: ['master', 'corporate', 'employee']
    })
    @Type(() => String)
    @IsString()
    type: string;
}