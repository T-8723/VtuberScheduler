import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { ChipModule } from 'primeng/chip';
import { DialogModule } from 'primeng/dialog';
import { CarouselModule } from 'primeng/carousel';
import { ImageModule } from 'primeng/image';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { BadgeModule } from 'primeng/badge';
import { BlockUIModule } from 'primeng/blockui';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';

import { TimelineComponent } from './timeline.component';

const primeNGModules = [
  DividerModule,
  ScrollPanelModule,
  PanelModule,
  CardModule,
  AvatarModule,
  ChipModule,
  DialogModule,
  CarouselModule,
  ImageModule,
  OverlayPanelModule,
  BadgeModule,
  BlockUIModule,
  ProgressSpinnerModule,
  ButtonModule,
  ToastModule,
];

@NgModule({
  declarations: [TimelineComponent],
  imports: [CommonModule, ...primeNGModules],
})
export class TimelineModule {}
