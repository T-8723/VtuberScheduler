import * as mongoose from 'mongoose';
import { Schema } from '@nestjs/mongoose';

export const ChannelsSchema = new mongoose.Schema({
  channel_id: {
    type: String,
    required: true,
    unique: true,
  },
  channel_title: {
    type: String,
  },
  enable: {
    type: Boolean,
  },
  name: {
    type: String,
  },
  published_date: {
    type: String,
  },
  icon_url: {
    type: String,
  },
  country: {
    type: String,
  },
  group_id: {
    type: String,
  },
  sub_group_id: {
    type: String,
  },
  twitterId: {
    type: String,
  },
  stream_hash_tag: {
    type: Array,
  },
  color: {
    type: String,
  },
});

@Schema()
export class Channels extends mongoose.Document {
  channel_id: string;
  channel_title: string;
  enable: boolean;
  name: string;
  published_date: string;
  icon_url: string;
  country: string;
  group_id: string;
  sub_group_id: string;
  twitterId: string;
  stream_hash_tag: string[];
  color: string | null;
}
