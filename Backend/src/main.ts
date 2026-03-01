import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Backend listening on http://localhost:${port}`);
}
bootstrap();
