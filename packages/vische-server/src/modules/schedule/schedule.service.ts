import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { MongoQuary, Config, Converter, Utility } from '../../shared';

import { ApiHololiveService, ApiNijusanjiService } from './api';
import { Schedules, Schedule } from './schedule.schema';
import { FeedsService } from '../feed/feed.service';
import { ChannelsService } from '../channel/channel.service';
import { LiveData } from './schedule.dto';
import { ResYoutubeApi } from 'src/interfaces/types';

@Injectable()
export class ScheduleService {
  devMode: boolean = process.env.npm_lifecycle_event === 'start:dev';
  group_id_hololive = 'UCJFZiqLMntJufDCHc6bQixg';
  group_id_nijisanju = 'UCX7YkU9nEeaoZbkVLVajcMg';

  constructor(
    @InjectModel('Schedules')
    private schedulesModel: Model<Schedules>,
    private apiHololiveService: ApiHololiveService,
    private apiNijusanjiService: ApiNijusanjiService,
    private mongoQuary: MongoQuary,
    private feedsService: FeedsService,
    private channelsService: ChannelsService,
    private config: Config,
    private converter: Converter,
    private utility: Utility,
  ) {}

  private initSchedule() {
    return {
      group_id: null,
      last_sync: null,
      response_data_str: null,
    } as Schedule;
  }

  async getHololivelist(): Promise<LiveData[]> {
    try {
      console.log(
        `[${this.utility.getNowDateTIme()}][INFO]: スケジュール情報を取得します。`,
      );
      const registedData = await this.getCachedScheduleAPIResponse([
        this.group_id_hololive,
      ]);
      if (this.checkCache(registedData)) {
        const res = await this.apiHololiveService.getData();
        await this.setAddData(res, registedData);
        this.registCachedScheduleAPIResponse({
          group_id: this.group_id_hololive,
          last_sync: new Date(),
          response_data_str: JSON.stringify(res),
        });
        return res;
      } else {
        return JSON.parse(registedData[0].response_data_str);
      }
    } catch (error) {
      console.error(
        `[${this.utility.getNowDateTIme()}][ERROR]: スケジュール情報のAPI要求に失敗しました mgs: ${error}`,
      );
    }
  }

  async getNijisanjilist(): Promise<LiveData[]> {
    try {
      console.log(
        `[${this.utility.getNowDateTIme()}][INFO]: スケジュール情報を取得します。`,
      );
      const registedData = await this.getCachedScheduleAPIResponse([
        this.group_id_nijisanju,
      ]);
      if (this.checkCache(registedData)) {
        const res = await this.apiNijusanjiService.getData();
        await this.setAddData(res, registedData);
        this.registCachedScheduleAPIResponse({
          group_id: this.group_id_nijisanju,
          last_sync: new Date(),
          response_data_str: JSON.stringify(res),
        });
        return res;
      } else {
        return JSON.parse(registedData[0].response_data_str) as LiveData[];
      }
    } catch (error) {
      console.error(
        `[${this.utility.getNowDateTIme()}][ERROR]: スケジュール情報のAPI要求に失敗しました mgs: ${error}`,
      );
    }
  }

  async getPersonalList(): Promise<LiveData[]> {
    const channels = await this.channelsService.getPersonalChannels([
      this.group_id_hololive,
      this.group_id_nijisanju,
    ]);
    const channelList = channels.map((item) => item.channel_id);
    const videos = await this.feedsService.getPersonalFeeds(channelList);

    return videos.map((item) => {
      const channel = channels.find(
        (temp) => temp.channel_id === item.channel_id,
      );
      return {
        member: {
          name: channel.name,
          icon: channel.icon_url,
          color: channel.color,
          channel_id: channel.channel_id,
        },
        streaming: {
          datetime: item.start_time
            ? new Date(item.start_time)
            : new Date(item.scheduled_time),
          description: item.description,
          thumbnail: item.thumbnail_url,
          title: item.video_title,
          url: `https://www.youtube.com/watch?v=${item.video_id}`,
          now: item.steaming_status === 1,
        },
        update_date: new Date(),
      };
    });
  }

  private checkCache(registedData: Schedule[], cacheCycle = 15) {
    const exist = registedData.length > 0 ? true : false;
    const targetDate = new Date(
      new Date().setMinutes(new Date().getMinutes() - cacheCycle),
    );
    let sync = true;
    if (this.devMode) {
      return true;
    }

    if (exist) {
      if (registedData[0].last_sync < targetDate === false) {
        sync = false;
      }
    }

    if (sync) {
      console.log(`キャッシュを更新します`);
    } else {
      const lastSync = String(
        new Date().getMinutes() - registedData[0].last_sync.getMinutes(),
      );
      console.log(`最終更新: ${lastSync}分前 キャッシュデータを使用します`);
    }
    return sync;
  }

  private async setAddData(res: LiveData[], cacheDataList: Schedule[]) {
    let cacheScheduleDataList: LiveData[] = [];
    let responseYoutubeAPI: ResYoutubeApi = null;

    if (cacheDataList.length > 0) {
      const cacheData = cacheDataList[0];
      cacheScheduleDataList = JSON.parse(cacheData.response_data_str);
    }

    if (cacheScheduleDataList !== null && cacheScheduleDataList.length > 0) {
      res.forEach((item) => {
        const sameDataIndex = cacheScheduleDataList.findIndex(
          (temp) => temp.streaming.url === item.streaming.url,
        );
        if (sameDataIndex > -1) {
          const sameData = cacheScheduleDataList[sameDataIndex];
          item.member.channel_id = sameData?.member?.channel_id;
          item.streaming.title = sameData?.streaming?.title;
          item.streaming.description = sameData?.streaming?.description;
        }
      });
    }

    const tatgetVideoIdList = res
      .filter(
        (item) =>
          !item.member.channel_id &&
          Boolean(
            item.streaming.url.match(
              new RegExp(/https\:\/\/www\.youtube\.com\/watch\?v\=/),
            ),
          ),
      )
      .map((item) =>
        item.streaming.url.replace('https://www.youtube.com/watch?v=', ''),
      );

    console.log(`キャッシュからの更新対象は${tatgetVideoIdList.length}件です`);
    try {
      if (tatgetVideoIdList !== null && tatgetVideoIdList.length > 0) {
        console.log(
          `[${this.utility.getNowDateTIme()}][INFO]: GoogleAPIへの要求を実行します`,
        );
        responseYoutubeAPI = await this.feedsService.requestYoutubeAPI(
          tatgetVideoIdList,
        );
        console.log(
          `[${this.utility.getNowDateTIme()}][INFO]: GoogleAPIへの要求が成功しました`,
        );
      }
    } catch (error) {
      console.error(
        `[${this.utility.getNowDateTIme()}][ERROR]: GoogleAPIへの要求に失敗しました mgs: ${error}`,
      );
    }
    res.forEach((item) => {
      if (responseYoutubeAPI !== null) {
        const videoId = item.streaming.url.replace(
          'https://www.youtube.com/watch?v=',
          '',
        );
        const videoInfo =
          responseYoutubeAPI !== null
            ? responseYoutubeAPI?.items?.find((item) => item.id === videoId)
            : null;
        if (videoInfo) {
          item.member.channel_id = videoInfo?.snippet?.channelId;
          item.streaming.title = videoInfo?.snippet?.title;
          item.streaming.description = videoInfo?.snippet?.description;
          item.streaming.now =
            videoInfo?.liveStreamingDetails?.actualStartTime &&
            !videoInfo?.liveStreamingDetails?.actualEndTime;
        }
      }
    });
  }

  /** グループ情報取得処理
   ** グループIDの検索　及び　全件出力に対応
   * @param group_id 所属グループIDを配列で指定
   *  */
  public async getCachedScheduleAPIResponse(group_id: string[] = []) {
    try {
      let findObj = {};
      if (group_id.length > 0) {
        findObj = { group_id: this.mongoQuary.toOR(group_id) };
      }

      const dataArr: Schedule[] = [];
      const findResult = await this.schedulesModel.find(findObj).exec();
      if (findResult.length > 0) {
        findResult.forEach((data) => {
          const init = this.initSchedule();
          Object.keys(init).forEach((key) => (init[key] = data[key]));
          dataArr.push(init);
        });
      }
      return dataArr;
    } catch (error) {
      console.error(
        `[${this.utility.getNowDateTIme()}][ERROR]: グループ情報の検索に失敗しました mgs: ${error}`,
      );
      return [];
    }
  }

  /** レスポンスキャッシュの保存登録処理
   * @param schedule_data レスポンス情報
   **/
  public async registCachedScheduleAPIResponse(
    schedule_data: Schedule,
  ): Promise<void> {
    const registedChannelData = await this.getCachedScheduleAPIResponse([
      schedule_data.group_id,
    ]);
    const exist = registedChannelData.length > 0 ? true : false;
    try {
      if (exist) {
        this.schedulesModel
          .updateOne(
            {
              group_id: schedule_data.group_id,
            },
            {
              $set: schedule_data,
            },
            {},
            (err) => {
              if (err) throw err;
            },
          )
          .exec();
      } else {
        const createData = new this.schedulesModel({ ...schedule_data });
        await createData.save();
      }
    } catch (error) {
      console.error(
        `[${this.utility.getNowDateTIme()}][ERROR]: レスポンスキャッシュの保存に失敗しました mgs: ${error}`,
      );
    }
  }
}
