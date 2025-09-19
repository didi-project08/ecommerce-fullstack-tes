import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';
@Module({
  imports: [
    JwtModule.register({}),
  ],
  controllers: [CartsController],
  providers: [CartsService],
})
export class CartsModule {}
