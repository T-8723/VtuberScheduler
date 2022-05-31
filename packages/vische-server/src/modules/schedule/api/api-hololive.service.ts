import { Injectable } from '@nestjs/common';
import client = require('cheerio-httpcli');

import { ChannelsService } from '../../channel/channel.service';
import { FeedsService } from '../../feed/feed.service';
import {
  ApiResponseHololive,
  EventHololive,
} from '../../../interfaces/api-response-hololive';

import { Utility } from '../../../shared';
import { LiveData } from '../schedule.dto';

@Injectable()
export class ApiHololiveService {
  url = 'https://schedule.hololive.tv/lives';
  data_hololive!: unknown;

  main: Cheerio;

  constructor(
    private channelsService: ChannelsService,
    private feedsService: FeedsService,
    private utility: Utility,
  ) {}

  async getData() {
    const scheduleData = await this.getScheduleDataAsync();
    return this.addYoutubeAPIInfo(this.analyzeAndGetLiveData(scheduleData));
  }

  /**
   * タイプガード関数
   * - 余裕ができたらちゃんと書け
   *
   * @param response APIレスポンス
   * @returns タイプガード
   */
  private _checkType(response: unknown): response is ApiResponseHololive {
    return true;
  }

  async getScheduleDataAsync() {
    try {
      console.log(
        `[${this.utility.getNowDateTIme()}][INFO]: OfficalAPIへの要求を実行します`,
      );
      return new Promise((resolve: (num: Cheerio) => void) => {
        client
          .fetch(this.url)
          .then((result) => {
            console.log(
              `[${this.utility.getNowDateTIme()}][INFO]: OfficalAPIへの要求に成功しました`,
            );
            this.main = result
              .$('div.holodule')
              .children('div.container')
              .children('.row')
              .children('div')
              .children('div.tab-content')
              .children('div#all')
              .children('div.container')
              .children('.row');

            resolve(
              this.main
                .children('div')
                .children('div.row')
                .children('div')
                .children('a.thumbnail'),
            );
          })
          .catch((error) => {
            console.log('error' + error);
          });
      });
    } catch (error) {
      console.error(
        `[${this.utility.getNowDateTIme()}][ERROR]: OfficalAPIのAPI要求に失敗しました mgs: ${error}`,
      );
    }
  }

  analyzeAndGetLiveData(domData: Cheerio) {
    // console.log(domData.length);

    const datas: EventHololive[] = [];
    let date: string = null;

    domData.each((i, e) => {
      const commonElm = e.childNodes[1].childNodes[1].childNodes;
      const dataElm = commonElm[1].childNodes[1].childNodes;
      const styleElm = commonElm[5].childNodes[1].childNodes[1].childNodes[1];

      const channelName = dataElm[3].childNodes[0].data.trim();
      const datetime = dataElm[1].childNodes[2].data.trim();
      const style = styleElm.attribs['style'];
      const icon = styleElm.attribs['src'];
      const thumbnail = commonElm[3].childNodes[1].attribs['src'];

      if (e.parentNode.parentNode.parentNode.parentNode.childNodes[0]) {
        const temp =
          e.parentNode.parentNode.parentNode.parentNode.childNodes[0].next
            .children[1].children[1];

        if (temp.data !== 'br' && temp.children[0] !== undefined) {
          date = temp.children[0].data
            .match(/[0-9]{2}\/[0-9]{2}/)[0]
            .replace('/', '-');
        }
      }

      datas.push({
        member: {
          name: channelName,
          icon: icon,
          color: style.match(/#[0-9a-zA-Z]{6}/)?.toString(),
        },
        streaming: {
          datetime: this.setDate(date, datetime),
          url: e.attribs['href'],
          thumbnail: thumbnail,
          now: e.attribs['style'].indexOf('red') !== -1,
        },
      });
    });
    return datas;
  }

  private async addYoutubeAPIInfo(datas: EventHololive[]) {
    const nowStreamingResponses = datas
      .filter((item) => item.streaming.now)
      .map((item) => item.streaming);

    try {
      console.log(
        `[${this.utility.getNowDateTIme()}][INFO]: GoogleAPIへの要求を実行します`,
      );
      const responseYoutubeAPI =
        await this.feedsService.reqestYoutubeAPIBynowStreamingResponses(
          nowStreamingResponses,
        );
      console.log(
        `[${this.utility.getNowDateTIme()}][INFO]: GoogleAPIへの要求が成功しました`,
      );
      const res: LiveData[] = datas.map((item) => {
        const videoId = item.streaming.url.replace(
          'https://www.youtube.com/watch?v=',
          '',
        );
        const videoInfo =
          responseYoutubeAPI !== null
            ? responseYoutubeAPI?.items?.find((item) => item.id === videoId)
            : null;
        return {
          member: {
            name: item.member.name,
            icon: item.member.icon,
            color: item.member.color,
            channel_id: videoInfo?.snippet?.channelId,
          },
          streaming: {
            datetime: item.streaming.datetime,
            description: videoInfo?.snippet?.description,
            url: item.streaming.url,
            thumbnail: item.streaming.thumbnail,
            title: videoInfo?.snippet?.title,
            now: item.streaming.now,
          },
          update_date: new Date(),
        };
      });
      return res;
    } catch (error) {
      console.error(
        `[${this.utility.getNowDateTIme()}][ERROR]: GoogleAPIへの要求に失敗しました mgs: ${error}`,
      );
    }
  }

  private setDate(date: string, datetime: string) {
    const now = new Date();
    let prev_year = now.getFullYear().toString();
    let next_year = now.getFullYear().toString();

    if (now.getMonth() === 0 && now.getDate() === 1) {
      prev_year = (now.getFullYear() - 1).toString();
    }
    if (now.getMonth() === 11 && now.getDate() === 31) {
      next_year = (now.getFullYear() + 1).toString();
    }

    let fixDate: Date;
    if (date === '1/1') {
      fixDate = new Date(`${prev_year}-${date}T${datetime}:00+09:00`);
    } else if (date === '12/31') {
      fixDate = new Date(`${next_year}-${date}T${datetime}:00+09:00`);
    } else {
      fixDate = new Date(`${now.getFullYear()}-${date}T${datetime}:00+09:00`);
    }
    return fixDate;
  }
}
