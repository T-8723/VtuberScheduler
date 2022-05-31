import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TimelineService {
  loadEmitter: Subject<{}> = new Subject();
  jampToNowEmitter: Subject<{}> = new Subject();
  popupNowListEmitter: Subject<{}> = new Subject();

  constructor() {}

  load() {
    this.loadEmitter.next({});
  }
  jampToNow() {
    this.jampToNowEmitter.next({});
  }
  popupNowList() {
    this.popupNowListEmitter.next({});
  }
}
