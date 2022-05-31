import { Component } from '@angular/core';
import { MenuItem, PrimeIcons } from 'primeng/api';

import { ThemeService } from 'src/app/commons/services/theme.service';
import { TimelineService } from 'src/app/views/timeline/timeline.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'vische-front-web';
  items!: MenuItem[];
  datetime: string = this.formatDate(new Date());
  darkMode = false;
  value = 50;
  subAutoSync!: unknown;
  autoSync = true;

  constructor(
    private themeService: ThemeService,
    private timelineService: TimelineService,
  ) {}

  ngOnInit() {
    this.startCounter();
    this.restoreLocalSetting();
    this.setupMenuItems();
  }

  private startCounter() {
    setInterval(() => {
      this.datetime = this.formatDate(new Date());
    }, 1000);
  }

  private restoreLocalSetting() {
    this.darkMode = window.localStorage.getItem('darkmode') === 'true';
    this.switchTheme();
    this.autoSync = window.localStorage.getItem('autosync') === 'true';
    this.switchInterval();
  }

  private switchInterval() {
    if (this.autoSync) {
      this.subAutoSync = setInterval(() => {
        this.timelineService.load();
      }, 900000);
    } else {
      if (this.subAutoSync) {
        clearInterval(this.subAutoSync as any);
      }
    }
  }

  private setupMenuItems() {
    const nowTheme = this.darkMode ? PrimeIcons.SUN : PrimeIcons.MOON;
    const changeThemeItem: MenuItem = {
      label: 'テーマ切り替え',
      icon: nowTheme,
      tooltipOptions: {
        tooltipLabel: '表示テーマを切り替えます。',
      },
      command: () => {
        this.darkMode = !this.darkMode;
        this.switchTheme();
        window.localStorage.setItem(
          'darkmode',
          this.darkMode ? 'true' : 'false',
        );
        this.setupMenuItems();
      },
    };
    const autoSyncItem: MenuItem = {
      label: '自動更新',
      icon: this.autoSync ? PrimeIcons.CHECK_CIRCLE : PrimeIcons.CIRCLE,
      tooltipOptions: {
        tooltipLabel: `15分間隔での自動更新を行います。現在は ${
          this.autoSync ? '有効' : '無効'
        } です。`,
      },
      command: () => {
        this.autoSync = !this.autoSync;
        this.switchInterval();
        window.localStorage.setItem(
          'autosync',
          this.darkMode ? 'true' : 'false',
        );
        this.setupMenuItems();
      },
    };

    this.items = [
      {
        label: '更新',
        icon: PrimeIcons.SYNC,
        items: [
          {
            label: '更新',
            icon: PrimeIcons.SYNC,
            tooltipOptions: {
              tooltipLabel: `スケジュールを更新します。`,
            },
            command: () => {
              this.timelineService.load();
            },
          },
          autoSyncItem,
        ],
      },
      {
        label: '配信中',
        icon: PrimeIcons.EJECT,
        tooltipOptions: {
          tooltipLabel: `配信中の枠一覧を表示するポップアップを表示します。`,
        },
        command: () => {
          this.timelineService.popupNowList();
        },
      },
      {
        label: '表示設定',
        icon: PrimeIcons.DESKTOP,
        items: [changeThemeItem],
      },
    ];
  }

  pageJump() {
    this.timelineService.jampToNow();
  }

  switchTheme() {
    const themeName = this.darkMode ? 'dark-indigo' : 'light-indigo';
    this.themeService.switchTheme(themeName);
  }

  private getDayJP(day: number) {
    switch (day) {
      case 0:
        return '日';
      case 1:
        return '月';
      case 2:
        return '火';
      case 3:
        return '水';
      case 4:
        return '木';
      case 5:
        return '金';
      case 6:
        return '土';
      default:
        return '';
    }
  }
  private formatDate(date: Date) {
    return `${date.getMonth() + 1}/${date.getDate()} (${this.getDayJP(
      date.getDay(),
    )}) ${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(
      -2,
    )}:${('0' + date.getSeconds()).slice(-2)}`;
  }
}
