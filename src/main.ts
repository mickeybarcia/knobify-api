import { NestFactory } from '@nestjs/core';
import cookies from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ credentials: true, origin: process.env.KNOBIFY_URL });
  app.use(cookies());
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
