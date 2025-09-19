import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { CartItemsController } from './cartItems.controller';
import { CartItemsService } from './cartItems.service';
@Module({
  imports: [
    JwtModule.register({}),
  ],
  controllers: [CartItemsController],
  providers: [CartItemsService],
})
export class CartItemsModule {}
