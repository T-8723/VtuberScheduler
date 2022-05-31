import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ResponseSchedule } from './schedule.dto';

import { ScheduleService } from './schedule.service';

@Controller('schedule')
export class ScheduleController {
  constructor(private scheduleService: ScheduleService) {}

  @Get('hololivelist')
  @ApiResponse({ status: HttpStatus.OK, type: ResponseSchedule })
  async getHololivelist(): Promise<ResponseSchedule> {
    return { list: await this.scheduleService.getHololivelist() };
  }

  @Get('nijisanjilist')
  @ApiResponse({ status: HttpStatus.OK, type: ResponseSchedule })
  async getNijisanjilist(): Promise<ResponseSchedule> {
    return { list: await this.scheduleService.getNijisanjilist() };
  }

  @Get('personallist')
  @ApiResponse({ status: HttpStatus.OK, type: ResponseSchedule })
  async getPersonallist(): Promise<ResponseSchedule> {
    return { list: await this.scheduleService.getPersonalList() };
  }
}
