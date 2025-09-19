import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
@Module({
    imports: [
        JwtModule.register({}),
    ],
    controllers: [ApplicationsController],
    providers: [ApplicationsService],
})
export class ApplicationsModule {}
