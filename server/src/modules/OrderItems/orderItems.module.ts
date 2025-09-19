import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { OrderItemsController } from './orderItems.controller';
import { OrderItemsService } from './orderItems.service';
@Module({
  imports: [
    JwtModule.register({}),
  ],
  controllers: [OrderItemsController],
  providers: [OrderItemsService],
})
export class OrderItemsModule {}
