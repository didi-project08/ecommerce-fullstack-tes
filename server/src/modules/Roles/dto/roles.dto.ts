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

export class CreateRolesDto {
    @ApiProperty({
        required: true,
    })
    @Type(() => String)
    @IsNotEmpty()
    @IsString()
    name: string;
}

export class UpdateRolesDto {
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
    restore: boolean;
}

export class delPermanentRolesDto {
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