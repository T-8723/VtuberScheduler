import { ApiProperty } from '@nestjs/swagger';

export class Channel {
  @ApiProperty()
  channel_id: string;
  @ApiProperty()
  channel_title: string;
  @ApiProperty()
  enable: boolean;
  @ApiProperty()
  name: string;
  @ApiProperty()
  published_date: string;
  @ApiProperty()
  icon_url: string;
  @ApiProperty()
  country: string;
  @ApiProperty()
  group_id: string;
  @ApiProperty()
  sub_group_id: string;
  @ApiProperty()
  twitterId: string;
  @ApiProperty()
  stream_hash_tag: string[];
  @ApiProperty()
  color: string | null;
}
export class PostChannelListRequest {
  @ApiProperty({ default: true })
  active_only?: boolean;
  @ApiProperty({ default: [] })
  channel_id?: string[];
  @ApiProperty({ default: [] })
  group_id?: string[];
  @ApiProperty({ default: [] })
  sub_group_id?: string[];
}
export class PostChannelListResponse {
  @ApiProperty()
  status: 'success' | 'error';
  @ApiProperty()
  message?: string;
  @ApiProperty({ type: [Channel] })
  data?: Channel[];
}
