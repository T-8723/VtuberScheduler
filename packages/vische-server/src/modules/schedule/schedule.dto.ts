import { ApiProperty } from '@nestjs/swagger';

export class Member {
  @ApiProperty()
  name: string;
  @ApiProperty()
  icon: string;
  @ApiProperty()
  color: string | null;
  @ApiProperty()
  channel_id: string | null;
}
export class Streaming {
  @ApiProperty()
  datetime: Date;
  @ApiProperty()
  url: string;
  @ApiProperty()
  thumbnail: string;
  @ApiProperty()
  title: string | null;
  @ApiProperty()
  description: string | null;
  @ApiProperty()
  now: boolean;
}
export class LiveData {
  @ApiProperty({ type: Member })
  member: Member;
  @ApiProperty({ type: Streaming })
  streaming: Streaming;
  @ApiProperty({ type: Date })
  update_date: Date;
}

export class ResponseSchedule {
  @ApiProperty({ type: [LiveData] })
  list: LiveData[];
}
