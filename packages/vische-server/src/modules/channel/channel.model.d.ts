export interface Channel {
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
