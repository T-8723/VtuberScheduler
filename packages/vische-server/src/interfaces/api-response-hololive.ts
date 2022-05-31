export interface ApiResponseHololive {
  status: string | 'ok';
  data: DataHololive;
}

export interface DataHololive {
  events: EventHololive[];
}

export interface EventHololive {
  member: Member;
  streaming: Streaming;
}

export interface Member {
  name: string;
  icon: string;
  color?: string;
}

export interface Streaming {
  datetime: Date;
  url: string;
  thumbnail: string;
  now: boolean;
}
