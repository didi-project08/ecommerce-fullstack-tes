import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { PermissionGroupsController } from './permissionGroups.controller';
import { PermissionGroupsService } from './permissionGroups.service';
@Module({
  imports: [
    JwtModule.register({}),
  ],
  controllers: [PermissionGroupsController],
  providers: [PermissionGroupsService],
})
export class PermissionGroupsModule {}
