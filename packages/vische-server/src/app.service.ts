import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { Utility } from './shared/utility';

import { FeedsService } from './modules/feed/feed.service';

@Injectable()
export class AppService {
  devMode: boolean = process.env.npm_lifecycle_event === 'start:dev';
  constructor(private utility: Utility, private feedsService: FeedsService) {
    console.log(`[${this.utility.getNowDateTIme()}][INFO]: 起動`);

    if (this.devMode) {
      console.log(
        `[${this.utility.getNowDateTIme()}][INFO]: ローカル開発モードで起動します`,
      );
    } else {
      console.log(
        `[${this.utility.getNowDateTIme()}][INFO]: 本番稼働モードで起動します`,
      );
    }
  }

  getHello(): string {
    return 'Hello World!';
  }

  /*
  ------------------------------------------ CronTasks ------------------------------------------
  */
  /* 10分 */
  @Cron('0 */10 * * * *', {
    unrefTimeout: true,
  })
  croncheckLiveStatus() {
    if (!this.devMode) {
      this.feedsService.checkLiveStatus();
    }
  }

  /* 5分毎、各30秒に実行するタスク */
  @Cron('30 */5 * * * *', {
    unrefTimeout: true,
  })
  cronrequestFeeds() {
    if (!this.devMode) {
      this.feedsService.requestFeeds();
    }
  }
}
