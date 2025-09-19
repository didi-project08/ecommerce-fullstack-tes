import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { RoleUsersController } from './roleUsers.controller';
import { RoleUsersService } from './roleUsers.service';
@Module({
  imports: [
    JwtModule.register({}),
  ],
  controllers: [RoleUsersController],
  providers: [RoleUsersService],
})
export class RoleUsersModule {}
