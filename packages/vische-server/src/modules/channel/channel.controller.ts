import { Controller, Post, Body, Delete, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { Response } from '../../interfaces/types';

import { ChannelsService } from './channel.service';
import { Channel } from './channel.model';
import { PostChannelListRequest, PostChannelListResponse } from './channel.dto';

@Controller('channel')
export class ChannelsController {
  constructor(private channelsService: ChannelsService) {}

  @Post('list')
  @ApiResponse({ status: HttpStatus.OK, type: PostChannelListResponse })
  async getChannels(
    @Body()
    requestData: PostChannelListRequest,
  ): Promise<PostChannelListResponse> {
    if (requestData) {
      const data = await this.channelsService.getChannels(
        requestData.channel_id,
        requestData.group_id,
        requestData.sub_group_id,
        requestData.active_only,
      );
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
  async registChannel(
    @Body()
    requestData: {
      request_to_google: boolean;
      channel_data?: Channel;
    } = {
      request_to_google: false,
    },
  ): Promise<Response<any>> {
    if (requestData) {
      if (requestData.channel_data) {
        if (requestData.channel_data.channel_id) {
          const data = await this.channelsService.registChannel(
            requestData.channel_data,
            requestData.request_to_google,
          );
          return data;
        } else {
          return {
            status: 'error',
            message: 'チャンネルIDを指定してください',
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
  async deleteChannels(
    @Body()
    requestData: {
      channel_id?: string[];
    },
  ): Promise<Response<void>> {
    if (requestData) {
      if (requestData.channel_id) {
        const data = await this.channelsService.deleteChannels(
          requestData.channel_id,
        );
        return data;
      } else {
        return {
          status: 'error',
          message: 'チャンネルIDを指定してください',
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
