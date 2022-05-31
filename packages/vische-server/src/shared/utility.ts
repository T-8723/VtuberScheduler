import { Injectable } from '@nestjs/common';
import { Channel } from 'src/modules/channel/channel.model';
import { Feed, initFeed } from 'src/modules/feed/feed.schema';
import {
  ResEntry,
  YoutubeChannelRwsponse,
  YoutubeVideoRwsponse,
} from '../interfaces/types';

@Injectable({})
export class MongoQuary {
  /** AND検索（オブジェクト） */
  public toAND(params: unknown) {
    return params;
  }

  /** OR検索用のvalue */
  public toOR(value: any[]) {
    if (value.length > 0) {
      if (value.length > 1) {
        return { $in: value };
      } else {
        return value[0];
      }
    } else {
      return null;
    }
  }

  /** 等しくない値検索用のvalue */
  public toNOT(value: any) {
    return { $ne: value };
  }

  /** ～より大きい値検索用のvalue */
  public toGT(num: any) {
    return { $gt: num };
  }

  /** ～より小さい値検索用のvalue */
  public toLT(num: any) {
    return { $lt: num };
  }

  /** ～以上検索用のvalue */
  public toGTE(num: any) {
    return { $gte: num };
  }

  /** ～以下検索用のvalue */
  public toLTE(num: any) {
    return { $lte: num };
  }

  /** 範囲検索 */
  public toBETWEEN(
    key: string,
    lt_num: any,
    gt_num: any,
    lt_inclued = true,
    gt_inclued = true,
  ) {
    return {
      $and: [
        { [key]: lt_inclued ? this.toLTE(lt_num) : this.toLT(lt_num) },
        { [key]: gt_inclued ? this.toGTE(gt_num) : this.toGT(gt_num) },
      ],
    };
  }

  /** ～MongoDBの時間検索用 */
  public toISODate(value: string) {
    return `ISODate("${value}")`;
  }
}

@Injectable({})
export class Utility {
  public getNowDateTIme() {
    const d = new Date();
    return `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${(
      '0' + d.getDate()
    ).slice(-2)}_${('0' + d.getHours()).slice(-2)}:${(
      '0' + d.getMinutes()
    ).slice(-2)}:${('0' + d.getSeconds()).slice(-2)}`;
  }

  /** DateオブジェクトをStringへ変換
   * @param d Dateオブジェクト - デフォルトで今日
   * @param elementOrdinal Dateオブジェクトの要素の配置設定
   */
  public formatDate(
    d: Date = new Date(),
    elementOrdinal: Array<
      'year' | 'month' | 'date' | 'hours' | 'minutes' | ' ' | '/' | ':'
    > = ['year', '/', 'month', '/', 'date'],
    alignHour = 0,
  ) {
    const formatValue = [];
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const date = ('0' + d.getDate()).slice(-2);
    const hours = ('0' + (d.getHours() - alignHour)).slice(-2);
    const minutes = ('0' + d.getMinutes()).slice(-2);

    elementOrdinal.forEach((dKey) => {
      switch (dKey) {
        case 'year':
          formatValue.push(year);
          break;
        case 'month':
          formatValue.push(month);
          break;
        case 'date':
          formatValue.push(date);
          break;
        case 'hours':
          formatValue.push(hours);
          break;
        case 'minutes':
          formatValue.push(minutes);
          break;
        case ' ':
          formatValue.push(' ');
          break;
        case '/':
          formatValue.push('/');
          break;
        case ':':
          formatValue.push(':');
          break;
      }
    });
    return formatValue.join('');
  }

  public calcMinutes(interval: 15 | 30 | 60, next = false) {
    const d = new Date();
    const m = d.getMinutes();
    let baseMinutes = 0;
    if (interval === 15) {
      if (m >= 0 && m < 15) {
        baseMinutes = 0;
      } else if (m >= 15 && m < 30) {
        baseMinutes = 15;
      } else if (m >= 30 && m < 45) {
        baseMinutes = 30;
      } else {
        baseMinutes = 45;
      }
    } else if (interval === 30) {
      if (m >= 0 && m < 30) {
        baseMinutes = 0;
      } else {
        baseMinutes = 30;
      }
    }
    return next ? baseMinutes + interval : baseMinutes;
  }

  public maxArryCount(interval: 15 | 30 | 60) {
    let count = 24;
    switch (interval) {
      case 30:
        count = 24;
        break;
      case 60:
        count = 24;
        break;
      default:
        break;
    }
    return count;
  }
}

@Injectable({})
export class Converter {
  list = [
    'yt:videoId',
    'yt:channelId',
    'title',
    'published',
    'published',
    'updated',
    'media:content',
    'media:thumbnail',
    'media:description',
    'media:statistics',
  ];

  constructor(private utility: Utility) {}

  // タイトルからタグ情報とタグなしのタイトルを抽出する
  public titleToShortTitleAndTags(title: string) {
    let tagArray: string[] = [];
    let tempTitle = title;

    const divFunc = (
      str1: string | RegExp,
      str2: string | RegExp,
      reg: RegExp,
    ) => {
      if (title.match(str1) && title.match(str2)) {
        const temp = tempTitle.match(reg);
        temp.forEach((key) => {
          const tempKey = key.split(/\/|\|/g);
          if (tempKey.length > 1) {
            tempKey.forEach((temp) => {
              tagArray.push(temp.replace(str1, '').replace(str2, ''));
            });
          } else {
            tagArray.push(key.replace(str1, '').replace(str2, ''));
          }

          tempTitle = tempTitle.replace(key, '');
        });
      }
    };

    divFunc('【', '】', /(?=【).*?(?<=】)/g);
    divFunc(/\[/, /\]/, /(?=\[).*?(?<=\])/g);

    tempTitle = tempTitle.replace(/^(\s*|\S*)|(\s*|\S*)$/, '');
    tagArray = tagArray.filter((item) => item !== '');

    return {
      tags: tagArray,
      title: tempTitle,
    };
  }

  // XML→JSONに変換
  public xmlToJson(xmlString): ResEntry[] {
    const dividKeyValue = (field: string, item: string) => {
      let returnValue = null;

      if (item.match(`<${field}>`)) {
        const s_index = item.match(`<${field}>`).index + `<${field}>`.length;
        const e_index = item.match(`</${field}>`).index;
        const temp = item.substring(s_index, e_index);
        returnValue = temp;
      } else if (item.match(`<${field} `)) {
        const s_index = item.match(`<${field} `).index + `<${field} `.length;
        let count = 0,
          tempval = '';
        do {
          tempval += item[s_index + count];
          count++;
        } while (tempval.substring(tempval.length - 2) !== '/>');
        const temp = item
          .substr(s_index, count)
          .replace('/>', '')
          .replace(/"/g, '')
          .split(' ');
        const obj = {};
        temp.forEach((data) => {
          const splitData = data.split('=');
          obj[splitData[0]] = splitData[1];
        });
        returnValue = obj;
      }
      return returnValue;
    };

    const jsonArry: ResEntry[] = [];
    try {
      const xmlToString: string = xmlString.data.toString();
      const strArray: string[] = xmlToString.split('<entry>');
      strArray.forEach((item) => {
        const obj: ResEntry = {
          videoId: null,
          channelId: null,
          title: null,
          published: null,
          updated: null,
          content: null,
          thumbnail: null,
          description: null,
        };
        this.list.forEach((key) => {
          obj[key] = dividKeyValue(key, item);
        });
        Object.keys(obj).forEach((key) => {
          if (key.match(':')) {
            obj[key.split(':')[1]] = obj[key];
            delete obj[key];
          }
        });
        jsonArry.push(obj);
      });
      return jsonArry;
    } catch (error) {
      console.error(
        `[${new Date()}][ERROR]: XML→JSON変換エラー str: ${xmlString} msg: ${error}`,
      );
      return [];
    }
  }

  public convStreamingStatus(
    scheduledTime: string,
    startTime: string,
    endTime: string,
  ): 0 | 1 | 2 {
    let statusFlag: 0 | 1 | 2 = 0;

    // 開始１分前後のデータは配信中ステータスに更新してしまう
    const scheduledFlg =
      this.minutesCalculator(new Date(scheduledTime)) > -1 &&
      this.minutesCalculator(new Date(scheduledTime)) < 1;

    if (endTime !== null) {
      statusFlag = 2;
    } else if (scheduledFlg || startTime !== null) {
      statusFlag = 1;
    }
    return statusFlag;
  }

  /** 基準日から渡した日付を引いた差 m（分）を返す
   ** レスポンスが正 => 〇分後
   ** レスポンスが負 => 〇分前
   * @param targetDate 基準日を引く対象
   * @param baseDate 基準日
   */
  public minutesCalculator(
    targetDate: Date,
    baseDate: Date = new Date(),
  ): number {
    // milisecondに直して 比較対象の日付から今日（基準日）の値の差を求める
    const time1 = targetDate.getTime() - baseDate.getTime();
    // ミリ秒を時間に変換
    const m = Math.floor(time1 / (1000 * 60));
    // const day1 = Math.floor(time1 / (1000 * 60 * 60 * 24));
    return m;
  }

  public responseToChannel(
    apiResponse: YoutubeChannelRwsponse,
    channelData: Channel = {
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
    },
  ) {
    const responsedChannelData = apiResponse.items[0];
    channelData.channel_title = responsedChannelData.snippet.title;
    channelData.country = responsedChannelData.country;
    channelData.icon_url = responsedChannelData.snippet.thumbnails.medium.url;
    channelData.published_date = responsedChannelData.snippet.publishedAt;
    return channelData;
  }

  public resEntryToFeed(resData: ResEntry, data = initFeed()) {
    data.video_id = resData.videoId;
    data.video_title = resData.title;
    data.thumbnail_url = resData.thumbnail.url;
    data.channel_id = resData.channelId;
    data.update_date_time = resData.updated;
    data.create_date_time = resData.published;
    data.channel_id = resData.channelId;
    return data;
  }

  public responseToFeed(
    apiResponse: YoutubeVideoRwsponse,
    feedData: Feed = initFeed(),
  ) {
    if (apiResponse.items.length === 0) {
      feedData.steaming_status = 2;
    } else {
      const liveStreamingDetails = apiResponse.items[0].liveStreamingDetails;
      const snippet = apiResponse.items[0].snippet;

      if (snippet && liveStreamingDetails) {
        const tempTagList: string[] = [];

        if (snippet.title !== undefined) {
          feedData.video_title = snippet.title;
          const temp = this.titleToShortTitleAndTags(feedData.video_title);
          feedData.video_title_short = temp.title;
          tempTagList.push(...temp.tags);
        }
        if (snippet.tags !== undefined) {
          tempTagList.push(...snippet.tags);
          feedData.tags = tempTagList;
        }
        if (snippet.description !== undefined) {
          feedData.description = snippet.description;
        }
        if (snippet.thumbnails.standard.url !== undefined) {
          feedData.thumbnail_url = snippet.thumbnails.standard.url;
        }
        if (liveStreamingDetails.actualEndTime !== undefined) {
          feedData.end_time = liveStreamingDetails.actualEndTime;
        }
        if (liveStreamingDetails.actualStartTime !== undefined) {
          feedData.start_time = liveStreamingDetails.actualStartTime;
        }
        if (liveStreamingDetails.scheduledStartTime !== undefined) {
          feedData.scheduled_time = liveStreamingDetails.scheduledStartTime;
        }
        feedData.steaming_status = this.convStreamingStatus(
          feedData.scheduled_time,
          feedData.start_time,
          feedData.end_time,
        );
      } else {
        feedData.steaming_status = 2;
      }
    }
    return feedData;
  }
}
