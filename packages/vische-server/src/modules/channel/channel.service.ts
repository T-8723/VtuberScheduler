import { Injectable, HttpService } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { map } from 'rxjs/operators';

import { Response } from 'src/interfaces/types';
import { MongoQuary, Config, Converter, Utility } from '../../shared';

import { Channel } from './channel.model';
import { Channels } from './channel.schema';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectModel('Channels')
    private channelsModel: Model<Channels>,
    private mongoQuary: MongoQuary,
    private http: HttpService,
    private config: Config,
    private converter: Converter,
    private utility: Utility,
  ) {}

  private initChannel() {
    return {
      channel_id: null,
      channel_title: null,
      enable: true,
      name: null,
      published_date: null,
      icon_url: null,
      country: null,
      group_id: null,
      sub_group_id: null,
      twitterId: null,
      stream_hash_tag: [],
      color: null,
    } as Channel;
  }

  public async getPersonalChannels(excluded_group_id: string[] = []) {
    try {
      const dataArr: Channel[] = [];
      const findResult = await this.channelsModel
        .find({
          enable: true,
          $nor: excluded_group_id.map((item) => {
            return {
              group_id: item,
            };
          }),
        })
        .exec();
      if (findResult.length > 0) {
        findResult.forEach((data) => {
          const init = this.initChannel();
          Object.keys(init).forEach((key) => (init[key] = data[key]));
          dataArr.push(init);
        });
      }
      return dataArr.sort((a, b) => {
        if (a.published_date && b.published_date) {
          return new Date(a.published_date) < new Date(b.published_date)
            ? -1
            : 1;
        } else {
          return 1;
        }
      });
    } catch (error) {
      console.error(
        `[${this.utility.getNowDateTIme()}][ERROR]: チャンネル情報の検索に失敗しました mgs: ${error}`,
      );
      return [];
    }
  }

  /** チャンネル情報取得処理
   ** チャンネルIDまたはグループIDの排他検索　及び　全件出力に対応
   * @param channel_id チャンネルIDを配列で指定
   * @param group_id 所属グループIDを配列で指定
   *  */
  public async getChannels(
    channel_id: string[] = [],
    group_id: string[] = [],
    sub_group_id: string[] = [],
    active_only = true,
    name: string[] = [],
  ): Promise<Channel[]> {
    try {
      let findObj = {};
      if (channel_id.length > 0) {
        findObj = { channel_id: this.mongoQuary.toOR(channel_id) };
      } else {
        if (group_id.length > 0) {
          findObj = { group_id: this.mongoQuary.toOR(group_id) };
        }
        if (sub_group_id.length > 0) {
          findObj = { sub_group_id: this.mongoQuary.toOR(sub_group_id) };
        }
        if (name.length > 0) {
          const reg = name.map((nameKey) => {
            return new RegExp(nameKey);
          });
          findObj = { name: this.mongoQuary.toOR(reg) };
        }
      }
      if (active_only) {
        findObj['enable'] = true;
      }

      const dataArr: Channel[] = [];
      const findResult = await this.channelsModel.find(findObj).exec();
      if (findResult.length > 0) {
        findResult.forEach((data) => {
          const init = this.initChannel();
          Object.keys(init).forEach((key) => (init[key] = data[key]));
          dataArr.push(init);
        });
      }
      return dataArr.sort((a, b) => {
        if (a.published_date && b.published_date) {
          return new Date(a.published_date) < new Date(b.published_date)
            ? -1
            : 1;
        } else {
          return 1;
        }
      });
    } catch (error) {
      console.error(
        `[${this.utility.getNowDateTIme()}][ERROR]: チャンネル情報の検索に失敗しました mgs: ${error}`,
      );
      return [];
    }
  }

  /** チャンネル情報登録処理
   ** 最低限YoutubeChannelIDを指定したチャンネル情報をDBに登録
   * @param channel_data チャンネル情報（IDは必須）
   * @param request_to_google GoogleAPIへチャンネル情報を要求する
   **/
  public async registChannel(
    channel_data: Channel,
    request_to_google = false,
  ): Promise<Response<void>> {
    const registedChannelData = await this.getChannels([
      channel_data.channel_id,
    ]);
    const exist = registedChannelData.length > 0 ? true : false;

    if (request_to_google) {
      try {
        console.log(
          `[${this.utility.getNowDateTIme()}][NFO]: GoogleAPIへの要求を実行します`,
        );
        return this.http
          .get(`https://www.googleapis.com/youtube/v3/channels`, {
            params: {
              key: this.config.apiKey,
              part: 'snippet',
              id: channel_data.channel_id,
              fields:
                'items(snippet(title,publishedAt,country,thumbnails(medium(url))))',
            },
          })
          .pipe(
            map((response) => {
              const initData = !exist ? this.initChannel() : channel_data;
              if (!exist) {
                Object.keys(initData).forEach((key) => {
                  initData[key] = channel_data[key];
                });
              }
              console.log(
                `[${this.utility.getNowDateTIme()}][NFO]: GoogleAPIへの要求が完了しました`,
              );
              return this.subRegistChannel(
                exist,
                this.converter.responseToChannel(response.data, initData),
              );
            }),
          )
          .toPromise();
      } catch (error) {
        console.error(
          `[${this.utility.getNowDateTIme()}][ERROR]: チャンネル情報のAPI要求に失敗しました mgs: ${error}`,
        );
        return {
          status: 'error',
          message: 'チャンネル情報のAPI要求に失敗しました',
        };
      }
    } else {
      return this.subRegistChannel(exist, channel_data);
    }
  }

  private async subRegistChannel(
    exist: boolean,
    channel_data: Channel,
  ): Promise<Response<void>> {
    try {
      if (exist) {
        this.channelsModel
          .updateOne(
            {
              channel_id: channel_data.channel_id,
            },
            {
              $set: channel_data,
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
        const createData = new this.channelsModel({ ...channel_data });
        await createData.save();
        return {
          status: 'success',
          message: '登録が完了しました',
        };
      }
    } catch (error) {
      console.error(
        `[${this.utility.getNowDateTIme()}][ERROR]: チャンネル登録に失敗しました mgs: ${error}`,
      );
      return {
        status: 'error',
        message: 'チャンネル登録に失敗しました',
      };
    }
  }

  /** チャンネル情報削除処理
   ** チャンネルIDに一致したレコードを削除
   * @param channel_id チャンネルID
   **/
  public async deleteChannels(channel_id: string[]): Promise<Response<void>> {
    try {
      await this.channelsModel.remove(
        {
          channel_id: this.mongoQuary.toOR(channel_id),
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
        `[${this.utility.getNowDateTIme()}][ERROR]: チャンネル削除に失敗しました mgs: ${error}`,
      );
      return {
        status: 'error',
        message: 'チャンネル削除に失敗しました',
      };
    }
  }
}
