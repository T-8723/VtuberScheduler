import { Module, HttpModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoQuary, Config, Utility, Converter } from '../../shared';

import { FeedsService } from './feed.service';
import { FeedsController } from './feed.controller';
import { FeedsSchema } from './feed.schema';

import { ChannelsModule } from '../channel/channel.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 50000,
      maxRedirects: 5,
    }),
    MongooseModule.forFeature([
      { name: 'Feeds', schema: FeedsSchema, collection: 'Feeds' },
    ]),
    ChannelsModule,
  ],
  controllers: [FeedsController],
  providers: [FeedsService, MongoQuary, Config, Utility, Converter],
  exports: [FeedsService],
})
export class FeedsModule {}
