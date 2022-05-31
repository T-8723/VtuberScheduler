import { Injectable, HttpService } from '@nestjs/common';
import { map } from 'rxjs/operators';

import { FeedsService } from '../../feed/feed.service';
import { ApiResponseNijusanji } from '../../../interfaces/api-response-nijusanji';

import { Utility } from '../../../shared';
import { LiveData } from '../schedule.dto';

@Injectable()
export class ApiNijusanjiService {
  url = 'https://api.itsukaralink.jp/v1.2/events.json';
  data_nijusanji!: unknown;

  constructor(
    private http: HttpService,
    private utility: Utility,
    private feedsService: FeedsService,
  ) {}

  async getData(): Promise<LiveData[]> {
    const resOfficialAPI = await this.getOfficalAPI();
    return this.addYoutubeAPIInfo(resOfficialAPI);
  }

  private async getOfficalAPI() {
    try {
      console.log(
        `[${this.utility.getNowDateTIme()}][INFO]: OfficalAPIへの要求を実行します`,
      );
      return await this.http
        .get(this.url)
        .pipe(
          map((result: any) => {
            const res = result.data;
            if (this._checkType(res)) {
              return res;
            }
          }),
        )
        .toPromise();
    } catch (error) {
      console.error(
        `[${this.utility.getNowDateTIme()}][ERROR]: OfficalAPIのAPI要求に失敗しました mgs: ${error}`,
      );
    }
  }

  private async addYoutubeAPIInfo(resOfficialAPI: ApiResponseNijusanji) {
    try {
      console.log(
        `[${this.utility.getNowDateTIme()}][INFO]: GoogleAPIへの要求を実行します`,
      );
      const nowStreamingResponses = resOfficialAPI.data.events.filter(
        (item) => {
          const s_date = new Date(item.start_date.toString());
          const e_date = new Date(item.end_date.toString());
          const now = s_date <= new Date() && new Date() < e_date;
          return now;
        },
      );
      const responseYoutubeAPI =
        await this.feedsService.reqestYoutubeAPIBynowStreamingResponses(
          nowStreamingResponses,
        );
      console.log(
        `[${this.utility.getNowDateTIme()}][INFO]: GoogleAPIへの要求が成功しました`,
      );
      return resOfficialAPI.data.events.map((item) => {
        const s_date = new Date(item.start_date.toString());
        let e_date = new Date(item.end_date.toString());
        const videoId = item.url.replace(
          'https://www.youtube.com/watch?v=',
          '',
        );
        const videoInfo = responseYoutubeAPI?.items?.find(
          (item) => item.id === videoId,
        );

        let now = s_date <= new Date() && new Date() < e_date;
        if (videoInfo) {
          if (
            videoInfo.liveStreamingDetails.actualEndTime !== undefined &&
            videoInfo.liveStreamingDetails.actualEndTime !== null
          ) {
            e_date = new Date(videoInfo.liveStreamingDetails.actualEndTime);
            now = true;
          }
        }

        return {
          member: {
            name: item.livers[0].name,
            icon: item.livers[0].avatar,
            color: item.livers[0].color,
            channel_id: videoInfo?.snippet?.channelId,
          },
          streaming: {
            datetime: s_date,
            description: videoInfo?.snippet?.description,
            url: item.url,
            thumbnail: item.thumbnail,
            title: videoInfo?.snippet?.title,
            now: now,
          },
          update_date: new Date(),
        };
      });
    } catch (error) {
      console.error(
        `[${this.utility.getNowDateTIme()}][ERROR]: GoogleAPIへの要求に失敗しました mgs: ${error}`,
      );
    }
  }

  /**
   * タイプガード関数
   * - 余裕ができたらちゃんと書け
   *
   * @param response APIレスポンス
   * @returns タイプガード
   */
  private _checkType(response: unknown): response is ApiResponseNijusanji {
    return true;
  }
}
