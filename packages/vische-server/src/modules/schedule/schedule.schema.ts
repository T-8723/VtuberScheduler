import * as mongoose from 'mongoose';
import { Schema } from '@nestjs/mongoose';

export interface OriginalLiveData {
  member: {
    name: string;
    icon: string;
  };
  streaming: {
    datetime: Date;
    url: string;
    thumbnail: string;
    now: boolean;
  };
}
export interface Schedule {
  group_id: string;
  last_sync: Date;
  response_data_str: string;
}

export const ScheduleSchema = new mongoose.Schema({
  group_id: {
    type: String,
    required: true,
  },
  last_sync: {
    type: Date,
    required: true,
  },
  response_data_str: {
    type: String,
    required: true,
  },
});

@Schema()
export class Schedules extends mongoose.Document {
  group_id: string;
  last_sync: Date;
  response_data_str: string;
}
