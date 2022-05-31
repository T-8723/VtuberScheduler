import { LiveData } from 'src/app/commons/services/api';

export interface EventItem {}

export interface Timeline {
  displayStr: string;
  timelineDateTime: string;
  streamingStatus: 0 | 1;
  timelineItemList: LiveData[];
}
