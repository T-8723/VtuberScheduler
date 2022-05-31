import { Controller, Post, Body, Delete } from '@nestjs/common';
import { Response } from '../../interfaces/types';

import { GroupsService } from './group.service';
import { Group } from './group.schema';

@Controller('group')
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Post('list')
  async getGroups(
    @Body()
    requestData: {
      group_id?: string[];
    } = {
      group_id: [],
    },
  ): Promise<Response<Group[]>> {
    if (requestData) {
      const data = await this.groupsService.getGroups(requestData.group_id);
      return {
        status: 'success',
        data: data,
      };
    } else {
      return {
        status: 'error',
        message: 'リクエストの形式が正しくありません',
      };
    }
  }

  @Post('regist')
  async registGroup(
    @Body()
    requestData: {
      group_data?: Group;
    },
  ): Promise<Response<any>> {
    if (requestData) {
      if (requestData.group_data) {
        if (requestData.group_data.group_id) {
          const data = await this.groupsService.registGroup(
            requestData.group_data,
          );
          return data;
        } else {
          return {
            status: 'error',
            message: 'グループIDを指定してください',
          };
        }
      } else {
        return {
          status: 'error',
          message: 'リクエストの形式が正しくありません',
        };
      }
    } else {
      return {
        status: 'error',
        message: 'リクエストの形式が正しくありません',
      };
    }
  }

  @Delete('delete')
  async deleteGroups(
    @Body()
    requestData: {
      group_id?: string[];
    },
  ): Promise<Response<void>> {
    if (requestData) {
      if (requestData.group_id) {
        const data = await this.groupsService.deleteGroups(
          requestData.group_id,
        );
        return data;
      } else {
        return {
          status: 'error',
          message: 'グループIDを指定してください',
        };
      }
    } else {
      return {
        status: 'error',
        message: 'リクエストの形式が正しくありません',
      };
    }
  }
}
