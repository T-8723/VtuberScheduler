import * as mongoose from 'mongoose';
import { Schema } from '@nestjs/mongoose';

export interface Group {
  group_id: string;
  parent_group_id: string;
  group_title: string;
  enable: boolean;
  published_date: string;
  icon_url: string;
  country: string;
  twitter_id: string;
}

export function initGroup() {
  return {
    group_id: null,
    parent_group_id: null,
    group_title: null,
    enable: true,
    published_date: null,
    icon_url: null,
    country: null,
    twitter_id: null,
  } as Group;
}

export const GroupsSchema = new mongoose.Schema({
  group_id: {
    type: String,
    required: true,
    unique: true,
  },
  parent_group_id: {
    type: String,
  },
  group_title: {
    type: String,
    required: true,
    unique: true,
  },
  enable: {
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
  twitter_id: {
    type: String,
  },
});

@Schema()
export class Groups extends mongoose.Document {
  group_id: string;
  parent_group_id: string;
  group_title: string;
  enable: boolean;
  published_date: string;
  icon_url: string;
  country: string;
  twitter_id: string;
}
