import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
@Module({
  imports: [
    JwtModule.register({}),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
