import { Injectable, HttpService } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { map } from 'rxjs/operators';
import { clearInterval } from 'timers';

import { MongoQuary, Config, Converter, Utility } from '../../shared';

import { Feed, Feeds, initFeed } from './feed.schema';

import { ChannelsService } from '../channel/channel.service';
import { ResYoutubeApi } from 'src/interfaces/types';

@Injectable()
export class FeedsService {
  constructor(
    @InjectModel('Feeds')
    private feedsModel: Model<Feeds>,
    private config: Config,
    private mongoQuary: MongoQuary,
    private converter: Converter,
    private http: HttpService,
    private channelsService: ChannelsService,
    private utility: Utility,
  ) {}

  public async requestFeeds(): Promise<void> {
    console.log(
      `[${this.utility.getNowDateTIme()}][INFO]: フィード情報チェック`,
    );

    try {
      // にじさんじ・ホロライブはフィルター
      const channelList = await (
        await this.channelsService.getChannels()
      ).filter((item) => {
        return !(
          item.group_id === 'UCJFZiqLMntJufDCHc6bQixg' ||
          item.channel_id === 'UCJFZiqLMntJufDCHc6bQixg'
        );
      });

      let counter = 0;
      const request = setInterval(async () => {
        const data = channelList[counter];
        if (channelList.length - 1 >= counter) {
          this.requestFeed(data.channel_id).finally(() => {
            console.log(
              `[${this.utility.getNowDateTIme()}][INFO]: ${
                data.channel_id
              } のフィードAPI要求が完了しました `,
            );
          });
        } else {
          clearInterval(request);
        }
        counter++;
      }, 500);
    } catch (error) {
      console.log(
        `[${this.utility.getNowDateTIme()}][ERROR]: フィード取得にエラー msg: ${error}`,
      );
    }
  }

  public async checkLiveStatus(): Promise<void> {
    console.log(`[${this.utility.getNowDateTIme()}][INFO]: 配信の状態チェック`);

    const scheduleddList = await this.getFeeds([], [], 0);
    if (scheduleddList.length > 0) {
      let counter = 0;
      const request = setInterval(async () => {
        if (scheduleddList.length - 1 >= counter) {
          const data = scheduleddList[counter];
          if (
            this.converter.minutesCalculator(new Date(data.scheduled_time)) >
              -30 &&
            this.converter.minutesCalculator(new Date(data.scheduled_time)) < 2
          ) {
            this.registFeed(data).finally(() => {
              console.log(
                `[${this.utility.getNowDateTIme()}][INFO]: GoogleAPIへの要求が完了しました`,
              );
            });
          }
        } else {
          clearInterval(request);
        }
        counter++;
      }, 500);
    }
    const activeList = await this.getFeeds([], [], 1);
    if (activeList.length > 0) {
      let counter = 0;
      const request = setInterval(async () => {
        if (activeList.length - 1 >= counter) {
          const data = activeList[counter];
          this.registFeed(data).finally(() => {
            console.log(
              `[${this.utility.getNowDateTIme()}][INFO]: GoogleAPIへの要求が完了しました`,
            );
          });
        } else {
          clearInterval(request);
        }
        counter++;
      }, 500);
    }
  }

  getFeedData(channel_id: string) {
    return this.http
      .get(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel_id}`)
      .pipe(
        map((response: any) => {
          const convertedData = this.converter.xmlToJson(response);
          // 最初の要素はチャンネル概要のため除外
          convertedData.shift();
          return convertedData;
        }),
      );
  }

  private async requestFeed(channel_id: string) {
    try {
      const registedList = await this.getFeeds([], [channel_id]);

      console.log(
        `[${this.utility.getNowDateTIme()}][INFO]: ${channel_id}のフィードAPIへ要求を送信します`,
      );
      return this.http
        .get(
          `https://www.youtube.com/feeds/videos.xml?channel_id=${channel_id}`,
        )
        .pipe(
          map((response: any) => {
            const convertedData = this.converter.xmlToJson(response);
            // 最初の要素はチャンネル概要のため除外
            convertedData.shift();

            const finishedList = registedList.filter(
              (item) => item.steaming_status === 2,
            );
            const filteredRequestedData = convertedData.filter(
              (item) =>
                !registedList
                  .map((item) => item.video_id)
                  .includes(item.videoId),
            );
            const newFeeds = filteredRequestedData.map((resData) =>
              this.converter.resEntryToFeed(resData),
            );
            newFeeds.forEach((data) =>
              this.registFeed(data).finally(() => {
                console.log(
                  `[${this.utility.getNowDateTIme()}][INFO]: GoogleAPIへの要求が完了しました`,
                );
              }),
            );

            const deleteTarget = finishedList.filter((item) => {
              const list = convertedData.map((data) => data.videoId);
              return !list.includes(item.video_id);
            });
            if (deleteTarget.length > 0) {
              this.deleteFeeds(deleteTarget.map((item) => item.video_id));
            }
            console.log(
              `[${this.utility.getNowDateTIme()}][INFO]: ${channel_id} 追加： ${
                newFeeds.length
              } 件 削除: ${deleteTarget.length} 件`,
            );
          }),
        )
        .toPromise();
    } catch (error) {
      console.error(
        `[${this.utility.getNowDateTIme()}][ERROR]: ${channel_id}のフィードAPI要求が失敗しました`,
      );
    }
  }

  public async getPersonalFeeds(channel_id: string[] = []) {
    try {
      const findObj = {};
      findObj['steaming_status'] = { $in: [0, 1] };
      if (channel_id.length > 0) {
        findObj['channel_id'] = this.mongoQuary.toOR(channel_id);
      }
      const dataArr: Feed[] = [];
      const findResult = await this.feedsModel.find(findObj).exec();
      if (findResult.length > 0) {
        findResult.forEach((data) => {
          const init = initFeed();
          Object.keys(init).forEach((key) => (init[key] = data[key]));
          dataArr.push(init);
        });
      }
      return dataArr;
    } catch (error) {
      console.error(
        `[${this.utility.getNowDateTIme()}][ERROR]: フィード情報の検索に失敗しました mgs: ${error}`,
      );
      return [];
    }
  }
  public async getFeeds(
    video_id: string[] = [],
    channel_id: string[] = [],
    steaming_status: 0 | 1 | 2 = null,
    scheduled_time: {
      lte: string;
      gte: string;
    } = null,
  ) {
    try {
      let findObj = {};
      if (scheduled_time !== null) {
        findObj = this.mongoQuary.toBETWEEN(
          'scheduled_time',
          scheduled_time.lte,
          scheduled_time.gte,
        );
      }
      if (video_id.length > 0) {
        findObj['video_id'] = this.mongoQuary.toOR(video_id);
      }
      if (channel_id.length > 0) {
        findObj['channel_id'] = this.mongoQuary.toOR(channel_id);
      }
      if (steaming_status !== null) {
        findObj['steaming_status'] = steaming_status;
      }

      const dataArr: Feed[] = [];
      const findResult = await this.feedsModel.find(findObj).exec();
      if (findResult.length > 0) {
        findResult.forEach((data) => {
          const init = initFeed();
          Object.keys(init).forEach((key) => (init[key] = data[key]));
          dataArr.push(init);
        });
      }
      return dataArr;
    } catch (error) {
      console.error(
        `[${this.utility.getNowDateTIme()}][ERROR]: フィード情報の検索に失敗しました mgs: ${error}`,
      );
      return [];
    }
  }

  async reqestYoutubeAPIBynowStreamingResponses(
    nowStreamingResponses: { url: string }[],
  ): Promise<ResYoutubeApi | null> {
    const nowStreamingVideoIds =
      nowStreamingResponses.length > 0
        ? nowStreamingResponses.map((item) =>
            item.url.replace('https://www.youtube.com/watch?v=', ''),
          )
        : [];
    return nowStreamingVideoIds === []
      ? await null
      : await this.requestYoutubeAPI(nowStreamingVideoIds);
  }

  async requestYoutubeAPI(
    video_ids: string[] = [],
  ): Promise<ResYoutubeApi | null> {
    if (video_ids !== null && video_ids.length === 0) {
      return await null;
    }
    const params = {
      key: this.config.apiKey,
      part: 'liveStreamingDetails,snippet',
      id: video_ids.length > 1 ? video_ids.join(',') : video_ids[0],
      fields:
        'items(id,snippet(title,channelId,description),liveStreamingDetails(actualStartTime,actualEndTime))',
    };

    return await this.http
      .get(`https://www.googleapis.com/youtube/v3/videos`, {
        params: params,
      })
      .pipe(
        map((response: AxiosResponse<ResYoutubeApi>) => {
          return response.data;
        }),
      )
      .toPromise();
  }

  public async registFeed(
    feed_data: Feed,
    request_to_google = true,
  ): Promise<{
    status: string;
    message: string;
  }> {
    const registedFeedData = await this.getFeeds([feed_data.video_id]);
    const exist = registedFeedData.length > 0 ? true : false;

    if (request_to_google) {
      try {
        console.log(
          `[${this.utility.getNowDateTIme()}][INFO]: GoogleAPIへの要求を実行します`,
        );
        return this.http
          .get(`https://www.googleapis.com/youtube/v3/videos`, {
            params: {
              key: this.config.apiKey,
              part: 'liveStreamingDetails,snippet',
              id: feed_data.video_id,
              fields:
                'items(snippet(title,description,tags,thumbnails(standard(url))),liveStreamingDetails(actualStartTime,scheduledStartTime,actualEndTime,concurrentViewers))',
            },
          })
          .pipe(
            map((response) => {
              return this.subRegistFeed(
                exist,
                this.converter.responseToFeed(response.data, feed_data),
              );
            }),
          )
          .toPromise();
      } catch (error) {
        console.error(
          `[${this.utility.getNowDateTIme()}][ERROR]: ビデオ情報のAPI要求に失敗しました mgs: ${error}`,
        );
      }
    } else {
      return this.subRegistFeed(exist, feed_data);
    }
  }

  private async subRegistFeed(
    exist: boolean,
    feed_data: Feed,
  ): Promise<{
    status: string;
    message: string;
  }> {
    try {
      if (exist) {
        this.feedsModel
          .updateOne(
            {
              video_id: feed_data.video_id,
            },
            {
              $set: feed_data,
            },
            {},
            (err) => {
              if (err) throw err;
            },
          )
          .exec();
        return {
          status: 'success',
          message: '更新が完了しました',
        };
      } else {
        const createData = new this.feedsModel({ ...feed_data });
        await createData.save();
        return {
          status: 'success',
          message: '登録が完了しました',
        };
      }
    } catch (error) {
      console.error(
        `[${this.utility.getNowDateTIme()}][ERROR]: フィード登録に失敗しました mgs: ${error}`,
      );
      return {
        status: 'error',
        message: 'フィード登録に失敗しました',
      };
    }
  }

  public async deleteFeeds(video_id: string[]) {
    try {
      await this.feedsModel.remove(
        {
          video_id: this.mongoQuary.toOR(video_id),
        },
        (err) => {
          if (err) throw err;
        },
      );
      return {
        status: 'success',
        message: '削除が完了しました',
      };
    } catch (error) {
      console.error(
        `[${this.utility.getNowDateTIme()}][ERROR]: フィード削除に失敗しました mgs: ${error}`,
      );
      return {
        status: 'error',
        message: 'フィード削除に失敗しました',
      };
    }
  }
}
