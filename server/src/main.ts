import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { corsOptions } from './cors/corsOptions';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser())
  app.enableCors(corsOptions)

  let swOptions = {}

  const config = new DocumentBuilder()
    .addBearerAuth()
    .addServer('http://localhost:3004')
    .addServer('https://bemcu.konselingkesehatanjiwa.my.id')
    .setTitle('MY API')
    .setDescription('MYAPI only for testing')
    .setVersion('1.0')
    .build()

  if (process.env.MODE === 'PRODUCTION') {
    swOptions = {
      swaggerOptions: {
        config: { 
          uiConfig: {
            docExpansion: 'none',
          }
        }
      },
    }
  } else if (process.env.MODE === 'DEVELOPMENT') {
    swOptions = {
      swaggerOptions: {
        config: { 
          uiConfig: {
            docExpansion: 'full',
          }
        }
      },
    }
  }

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document, swOptions)

  await app.listen(process.env.PORT || '0.0.0.0')
}
bootstrap();
