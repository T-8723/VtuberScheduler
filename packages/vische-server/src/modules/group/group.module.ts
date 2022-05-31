import { Module, HttpModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoQuary, Config, Utility } from '../../shared';

import { GroupsController } from './group.controller';
import { GroupsService } from './group.service';
import { GroupsSchema } from './group.schema';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    MongooseModule.forFeature([
      { name: 'Groups', schema: GroupsSchema, collection: 'Groups' },
    ]),
  ],
  controllers: [GroupsController],
  providers: [GroupsService, MongoQuary, Config, Utility],
  exports: [GroupsService],
})
export class GroupsModule {}
