import * as mongoose from 'mongoose';
import { Schema } from '@nestjs/mongoose';

export interface Feed {
  video_id: string;
  channel_id: string;
  create_date_time: string;
  update_date_time: string;
  video_title: string;
  video_title_short: string;
  description: string;
  scheduled_time: string;
  start_time: string;
  end_time: string;
  thumbnail_url: string;
  steaming_status: 0 | 1 | 2;
  tags: string[];
}

export function initFeed() {
  return {
    video_id: null,
    channel_id: null,
    create_date_time: null,
    update_date_time: null,
    video_title: null,
    video_title_short: null,
    description: null,
    scheduled_time: null,
    start_time: null,
    end_time: null,
    thumbnail_url: null,
    steaming_status: 0,
    tags: [],
  } as Feed;
}

export const FeedsSchema = new mongoose.Schema({
  video_id: {
    type: String,
    required: true,
    unique: true,
  },
  channel_id: {
    type: String,
  },
  create_date_time: {
    type: String,
  },
  update_date_time: {
    type: String,
  },
  video_title: {
    type: String,
  },
  video_title_short: {
    type: String,
  },
  description: {
    type: String,
  },
  scheduled_time: {
    type: String,
  },
  start_time: {
    type: String,
  },
  end_time: {
    type: String,
  },
  thumbnail_url: {
    type: String,
  },
  steaming_status: {
    type: Number,
  },
  tags: {
    type: Array,
  },
});

@Schema()
export class Feeds extends mongoose.Document {
  video_id: string;
  channel_id: string;
  create_date_time: string;
  update_date_time: string;
  video_title: string;
  video_title_short: string;
  description: string;
  scheduled_time: string;
  start_time: string;
  end_time: string;
  thumbnail_url: string;
  steaming_status: 0 | 1 | 2;
  tags: string[];
}
