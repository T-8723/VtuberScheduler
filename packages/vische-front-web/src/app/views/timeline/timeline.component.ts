import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { ScrollPanel } from 'primeng/scrollpanel';
import { Subscription } from 'rxjs';
import {
  DefaultApi,
  LiveData,
  ResponseSchedule,
} from 'src/app/commons/services/api';
import { Timeline } from 'src/app/commons/types/view/timeline-item';
import { environment } from 'src/environments/environment';
import { MessageService } from 'primeng/api';

import { TimelineService } from './timeline.service';
import { Dialog } from 'primeng/dialog';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  providers: [MessageService],
})
export class TimelineComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('date')
  date!: QueryList<ElementRef<HTMLHeadingElement>>;
  @ViewChild('scrollPanel')
  scrollPanel!: ScrollPanel;
  @ViewChild('dialog')
  dialog!: Dialog;
  @ViewChild('dialogMini')
  dialogMini!: Dialog;

  defaultApi = new DefaultApi({
    basePath: environment.url,
    isJsonMime: () => false,
  });

  timelineList: Timeline[] = [];
  nowOnAirList: LiveData[] = [];

  width_num = 300;
  width_unit = 'px';
  width = this.width_num + this.width_unit;
  display = false;
  displayMini = false;
  blocked = false;
  defaultDisplay = true;

  responsiveOptions!: {
    breakpoint: string;
    numVisible: number;
    numScroll: number;
  }[];

  subLoadEmitter!: Subscription;
  subJumpToNowEmitter!: Subscription;
  subPopupNowListEmitter!: Subscription;

  constructor(
    private timelineService: TimelineService,
    private messageService: MessageService,
  ) {
    this.initResponsiveOptions();
  }

  ngOnInit(): void {
    this.restoreLocalSetting();
    this.makeTimeline();
    this.getDataList();
    this.setServiceLoad();
  }

  ngAfterViewInit(): void {
    this.scrollNowLine();
  }

  ngOnDestroy(): void {
    this.subLoadEmitter.unsubscribe();
  }

  private restoreLocalSetting() {}

  private setServiceLoad() {
    this.subLoadEmitter = this.timelineService.loadEmitter.subscribe(() => {
      this.blocked = true;
      this.makeTimeline();
      this.getDataList();
      this.scrollNowLine();
    });
    this.subJumpToNowEmitter = this.timelineService.jampToNowEmitter.subscribe(
      () => {
        this.scrollNowLine();
      },
    );
    this.subPopupNowListEmitter =
      this.timelineService.popupNowListEmitter.subscribe(() => {
        if (this.nowOnAirList.length > 0) {
          this.maximize();
        } else {
          this.minimize();
          this.messageService.add({
            severity: 'info',
            detail: `配信中の枠がありません。アーカイブ消化チャンス !`,
          });
        }
      });
  }

  private scrollNowLine() {
    const nowIndex = this.timelineList.findIndex(
      (timeline) => timeline.streamingStatus === 1,
    );
    // const nowPosition: string | null =
    //   this.scrollPanel.xBarViewChild.nativeElement.style.left;
    // const nowPositionOffset = nowPosition
    //   ? Number(nowPosition?.replace('%', ''))
    //   : 50;
    // const targetIndex = nowPositionOffset > 50 ? nowIndex - 1 : nowIndex + 1;
    const nowElement = this.date.find(
      (item, index) =>
        item.nativeElement.id === this.timelineList[nowIndex].timelineDateTime,
    );
    nowElement?.nativeElement.scrollIntoView();
  }

  private initResponsiveOptions() {
    const init = [
      {
        breakpoint: '2400px',
        numVisible: 5,
        numScroll: 5,
      },
      {
        breakpoint: '2000px',
        numVisible: 4,
        numScroll: 4,
      },
      {
        breakpoint: '1600px',
        numVisible: 3,
        numScroll: 3,
      },
      {
        breakpoint: '1075px',
        numVisible: 2,
        numScroll: 2,
      },
      {
        breakpoint: '760px',
        numVisible: 1,
        numScroll: 1,
      },
    ];
    this.responsiveOptions = init;
  }

  private async getDataList() {
    this.blocked = true;
    await this.defaultApi.scheduleControllerGetHololivelist().then((res1) => {
      this.setTimelineItem(res1.data);
    });
    await this.defaultApi.scheduleControllerGetNijisanjilist().then((res2) => {
      this.setTimelineItem(res2.data);
    });
    await this.defaultApi.scheduleControllerGetPersonallist().then((res3) => {
      this.setTimelineItem(res3.data);
    });
    this.makeNowOnAirList();
    this.blocked = false;
  }

  private makeTimeline(interval: 15 | 30 | 60 = 60) {
    const baseMinutes = this.calcMinutes(interval);
    const newTimeLine = this.makeScheduledTimelineObjects(
      interval,
      baseMinutes,
    );
    this.timelineList = this.timelineList.filter((item) => {
      const existTimeline = newTimeLine.find(
        (data) => data.timelineDateTime === item.timelineDateTime,
      );
      if (existTimeline) {
        return true;
      } else {
        return false;
      }
    });
    newTimeLine.forEach((item) => {
      const existTimelineIndex = this.timelineList.findIndex(
        (data) => data.timelineDateTime === item.timelineDateTime,
      );
      if (existTimelineIndex === -1) {
        this.timelineList.push(item);
      } else {
        this.timelineList[existTimelineIndex] = item;
      }
    });
  }

  private setTimelineItem(rowData: ResponseSchedule) {
    if (rowData.list) {
      this.timelineList.forEach((timeline, index) => {
        if (this.timelineList[index + 1]) {
          const rowDataList = rowData.list.filter((resData) => {
            const datetime = new Date(resData.streaming.datetime);
            return (
              new Date(timeline.timelineDateTime) <= datetime &&
              datetime < new Date(this.timelineList[index + 1].timelineDateTime)
            );
          });
          const inputList: LiveData[] = [];
          rowDataList.forEach((item) => {
            const sameItemIndex =
              timeline.timelineItemList.length > 0
                ? timeline.timelineItemList.findIndex(
                    (data) => data?.streaming.url === item.streaming.url,
                  )
                : -1;
            if (sameItemIndex === -1) {
              inputList.push(item);
            } else {
              timeline.timelineItemList[sameItemIndex] = item;
            }
          });
          timeline.timelineItemList.push(...inputList);
          timeline.timelineItemList.sort((a, b) => {
            if (
              new Date(a.streaming.datetime) > new Date(b.streaming.datetime)
            ) {
              return 1;
            } else if (
              new Date(a.streaming.datetime) === new Date(b.streaming.datetime)
            ) {
              return 0;
            } else {
              return -1;
            }
          });
        }
      });
    }
  }

  minimize() {
    this.display = false;
    this.displayMini = true;
  }
  maximize() {
    if (this.nowOnAirList.length > 0) {
      this.display = true;
      this.displayMini = false;
    }
  }

  private makeNowOnAirList() {
    this.nowOnAirList = [];
    const now =
      this.timelineList.length > 0
        ? this.timelineList
            .map((item) => item.timelineItemList)
            .reduce((a, b) => [...a, ...b])
            .filter((resData) => resData.streaming.now)
        : [];
    this.nowOnAirList.push(...now);

    const schduled =
      this.timelineList.length > 0
        ? this.timelineList
            .filter((item) => item.streamingStatus === 1)
            .map((item) => item.timelineItemList)
            .reduce((a, b) => [...a, ...b])
            .filter((resData) => !resData.streaming.now)
        : [];
    this.nowOnAirList.push(...schduled);

    this.display = this.nowOnAirList.length !== 0;
    this.displayMini = this.nowOnAirList.length === 0;
  }

  private makeScheduledTimelineObjects(
    interval: 15 | 30 | 60 = 60,
    baseMinutes = 0,
  ): Timeline[] {
    const timeline: Timeline[] = [];
    const d = new Date();
    for (let index = -this.maxArryCount(interval); index < 0; index++) {
      const _i = interval * index;
      const _d = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        d.getHours(),
        baseMinutes,
        0,
      );
      const baseTinme = new Date(_d.setMinutes(_i));
      const object: Timeline = {
        displayStr: `${baseTinme.getDate()}日 ${baseTinme.getHours()}時`,
        timelineDateTime: baseTinme.toISOString(),
        streamingStatus: index === -1 ? 1 : 0,
        timelineItemList: [],
      };
      timeline.push(object);
    }
    for (let index = 0; index < this.maxArryCount(interval); index++) {
      const _i = interval * index;
      const _d = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        d.getHours(),
        baseMinutes,
        0,
      );
      const baseTinme = new Date(_d.setMinutes(_i));
      const object: Timeline = {
        displayStr: `${baseTinme.getDate()}日 ${baseTinme.getHours()}時`,
        timelineDateTime: baseTinme.toISOString(),
        streamingStatus: 0,
        timelineItemList: [],
      };
      timeline.push(object);
    }
    return timeline;
  }

  colorConvert(code: string, opacity: number = 1) {
    if (code) {
      const red = parseInt(code.substring(1, 3), 16);
      const green = parseInt(code.substring(3, 5), 16);
      const blue = parseInt(code.substring(5, 7), 16);
      return `rgb(${red},${green},${blue},${opacity})`;
    } else {
      return '';
    }
  }

  formDateString(dateString: string) {
    const d = new Date(dateString);
    return `${d.getHours()}:${('0' + d.getMinutes()).slice(-2)}`;
  }

  getTranslateX(index: number, offsetPx: number = 0) {
    return `translateX(${this.width_num * index - offsetPx}px)`;
  }

  calcMinutes(interval: 15 | 30 | 60) {
    const d = new Date();
    const m = d.getMinutes();
    let baseMinutes = 0;
    if (interval === 15) {
      if (m >= 0 && m < 15) {
        baseMinutes = 0;
      } else if (m >= 15 && m < 30) {
        baseMinutes = 15;
      } else if (m >= 30 && m < 45) {
        baseMinutes = 30;
      } else {
        baseMinutes = 45;
      }
    } else if (interval === 30) {
      if (m >= 0 && m < 30) {
        baseMinutes = 0;
      } else {
        baseMinutes = 30;
      }
    }
    return baseMinutes + interval;
  }

  maxArryCount(interval: 15 | 30 | 60) {
    let count = 24;
    switch (interval) {
      case 30:
        count = 24;
        break;
      case 60:
        count = 24;
        break;
      default:
        break;
    }
    return count;
  }
}
