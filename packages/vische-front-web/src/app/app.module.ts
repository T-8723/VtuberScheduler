import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { MegaMenuModule } from 'primeng/megamenu';
import { SplitterModule } from 'primeng/splitter';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { MenubarModule } from 'primeng/menubar';
import { ToggleButtonModule } from 'primeng/togglebutton';

import { TimelineModule } from './views/timeline/timeline.module';

const primeNGModules = [
  MegaMenuModule,
  SplitterModule,
  MessagesModule,
  MessageModule,
  TooltipModule,
  ProgressBarModule,
  ButtonModule,
  MenubarModule,
  ToggleButtonModule,
];
const addModules = [TimelineModule];

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,
    ...primeNGModules,
    ...addModules,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
