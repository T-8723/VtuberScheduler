import { Module } from '@nestjs/common';
import { join } from 'path';
import { ScheduleModule as NestSchedule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { Utility } from './shared/utility';

import { ChannelsModule } from './modules/channel/channel.module';
import { GroupsModule } from './modules/group/group.module';
import { FeedsModule } from './modules/feed/feed.module';
import { ScheduleModule } from './modules/schedule/schedule.module';

const URL =
  process.env.DB_URI ||
  'mongodb+srv://user-01:$Tomo1030@cluster0.njndn.mongodb.net/heroku_jq8ftw3t?retryWrites=true&w=majority';

@Module({
  imports: [
    MongooseModule.forRoot(URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(
        __dirname,
        '..',
        '..',
        '..',
        'packages',
        'vische-front-web',
        'dist',
        'vische',
      ),
      exclude: ['/api'],
    }),
    NestSchedule.forRoot(), // cron
    FeedsModule,
    ChannelsModule,
    GroupsModule,
    ScheduleModule,
  ],
  controllers: [AppController],
  providers: [Utility, AppService],
})
export class AppModule {}
