import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsNumber, IsInt, IsArray } from 'class-validator';

export class UidDto {
    @ApiProperty({
        required: true,
    })
    @Type(() => String)
    @IsNotEmpty()
    @IsString()
    id: string;
}

export class CreateRoleUsersDto {
    @ApiProperty({
        required: true,
    })
    @Type(() => Array)
    @IsNotEmpty()
    @IsArray()
    userId: [];

    @ApiProperty({
        required: true,
    })
    @Type(() => String)
    @IsNotEmpty()
    @IsString()
    roleId: string;
}

export class UpdateRoleUsersDto {
    @ApiProperty({
        required: true,
    })
    @Type(() => String)
    @IsNotEmpty()
    @IsString()
    userId: string;

    @ApiProperty({
        required: true,
    })
    @Type(() => String)
    @IsNotEmpty()
    @IsString()
    roleId: string;
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