import { Module, HttpModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoQuary, Config, Converter, Utility } from '../../shared';

import { ChannelsService } from './channel.service';
import { ChannelsController } from './channel.controller';
import { ChannelsSchema } from './channel.schema';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    MongooseModule.forFeature([
      {
        name: 'Channels',
        schema: ChannelsSchema,
        collection: 'Channels',
      },
    ]),
  ],
  controllers: [ChannelsController],
  providers: [ChannelsService, MongoQuary, Config, Converter, Utility],
  exports: [ChannelsService],
})
export class ChannelsModule {}
