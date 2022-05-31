import { Module, HttpModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoQuary, Config, Utility, Converter } from '../../shared';

import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { ScheduleSchema } from './schedule.schema';
import { ApiHololiveService, ApiNijusanjiService } from './api';

import { ChannelsModule } from '../channel/channel.module';
import { FeedsModule } from '../feed/feed.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    MongooseModule.forFeature([
      {
        name: 'Schedules',
        schema: ScheduleSchema,
        collection: 'Schedules',
      },
    ]),
    ChannelsModule,
    FeedsModule,
  ],
  controllers: [ScheduleController],
  providers: [
    ScheduleService,
    MongoQuary,
    Config,
    Utility,
    Converter,
    ApiHololiveService,
    ApiNijusanjiService,
  ],
  exports: [ScheduleService],
})
export class ScheduleModule {}
