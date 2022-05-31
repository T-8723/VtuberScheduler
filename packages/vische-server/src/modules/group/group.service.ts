import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { Response } from 'src/interfaces/types';
import { MongoQuary, Config, Utility } from '../../shared';
import { Group, Groups, initGroup } from './group.schema';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel('Groups')
    private groupsModel: Model<Groups>,
    private mongoQuary: MongoQuary,
    private config: Config,
    private utility: Utility,
  ) {}

  /** グループ情報取得処理
   ** グループIDの検索　及び　全件出力に対応
   * @param group_id 所属グループIDを配列で指定
   *  */
  public async getGroups(group_id: string[] = []) {
    try {
      let findObj = {};
      if (group_id.length > 0) {
        findObj = { group_id: this.mongoQuary.toOR(group_id) };
      }

      const dataArr: Group[] = [];
      const findResult = await this.groupsModel.find(findObj).exec();
      if (findResult.length > 0) {
        findResult.forEach((data) => {
          const init = initGroup();
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
        `[${this.utility.getNowDateTIme()}][ERROR]: グループ情報の検索に失敗しました mgs: ${error}`,
      );
      return [];
    }
  }

  /** グループ情報登録処理
   * @param group_data グループ情報（IDは必須）
   **/
  public async registGroup(group_data: Group): Promise<Response<void>> {
    const registedChannelData = await this.getGroups([group_data.group_id]);
    const exist = registedChannelData.length > 0 ? true : false;
    try {
      if (exist) {
        this.groupsModel
          .updateOne(
            {
              group_id: group_data.group_id,
            },
            {
              $set: group_data,
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
        const createData = new this.groupsModel({ ...group_data });
        await createData.save();
        return {
          status: 'success',
          message: '登録が完了しました',
        };
      }
    } catch (error) {
      console.error(
        `[${this.utility.getNowDateTIme()}][ERROR]: グループ登録に失敗しました mgs: ${error}`,
      );
      return {
        status: 'error',
        message: 'グループ登録に失敗しました',
      };
    }
  }

  /** グループ情報削除処理
   ** グループIDに一致したレコードを削除
   * @param group_id グループID
   **/
  public async deleteGroups(group_id: string[]): Promise<Response<void>> {
    try {
      await this.groupsModel.remove(
        {
          group_id: this.mongoQuary.toOR(group_id),
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
        `[${this.utility.getNowDateTIme()}][ERROR]: グループ削除に失敗しました mgs: ${error}`,
      );
      return {
        status: 'error',
        message: 'グループ削除に失敗しました',
      };
    }
  }
}
