import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SignInDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class SignUpDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  fullname: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  passwordOld: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  passwordNew: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  passwordConfirm: string;
}
