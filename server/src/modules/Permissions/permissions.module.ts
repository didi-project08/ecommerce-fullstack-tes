import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
@Module({
  imports: [
    JwtModule.register({}),
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService],
})
export class PermissionsModule {}
