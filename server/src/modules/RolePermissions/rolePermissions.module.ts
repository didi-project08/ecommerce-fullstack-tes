import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { RolePermissionsController } from './rolePermissions.controller';
import { RolePermissionsService } from './rolePermissions.service';
@Module({
  imports: [
    JwtModule.register({}),
  ],
  controllers: [RolePermissionsController],
  providers: [RolePermissionsService],
})
export class RolePermissionsModule {}
