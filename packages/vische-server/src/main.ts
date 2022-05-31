import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import { dump } from 'js-yaml';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const PORT = process.env.PORT || 80;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // CROSS ORIGINの許可
  /*   app.enableCors({
    origin: '*',
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept',
  }); */

  if (process.env.NODE_ENV !== 'production') {
    const options = new DocumentBuilder().setTitle('VischeAPI').build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('openapi', app, document);

    // JSON
    fs.writeFileSync(
      './swagger-spec/swagger-spec.json',
      JSON.stringify(document, undefined, 2),
    );

    // YAML
    fs.writeFileSync('./swagger-spec/swagger-spec.yaml', dump(document, {}));

    SwaggerModule.setup('api', app, document);
  }
  await app.listen(PORT);
}
bootstrap();
