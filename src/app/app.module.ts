import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { DialogComponent } from './ui/dialog/dialog';
import { CharacterComponent } from './ui/figures/character/character';
import { CharacterInitiativePicker } from './ui/figures/character/dialogs/initiativepicker';
import { CharacterSummonDialog } from './ui/figures/character/dialogs/summondialog';
import { ActionHexComponent, MonsterActionComponent, MonsterActionsComponent } from './ui/figures/monster/actions/action';
import { AbilityComponent } from './ui/figures/monster/cards/ability';
import { MonsterImageComponent } from './ui/figures/monster/cards/image';
import { MonsterStatsComponent } from './ui/figures/monster/cards/stats';
import { MonsterNumberPicker } from './ui/figures/monster/dialogs/numberpicker';
import { MonsterEntityComponent } from './ui/figures/monster/entity/entity';
import { MonsterComponent } from './ui/figures/monster/monster';
import { AttackModifierComponent } from './ui/footer/attackmodifier/attackmodifier';
import { FooterComponent } from './ui/footer/footer';
import { LevelComponent } from './ui/footer/level/level';
import { ElementIconComponent } from './ui/header/element/element';
import { HeaderComponent } from './ui/header/header';
import { EditionMenuComponent } from './ui/header/menu/edition/edition';
import { MainMenuComponent } from './ui/header/menu/menu';
import { SettingsMenuComponent } from './ui/header/menu/settings/settings';
import { CardRevealDirective } from './ui/helper/CardReveal';
import { GhsEditionFilterPipe, GhsLabelPipe, GhsSortPipe, GhsValueCalcPipe, GhsValueSignPipe } from './ui/helper/Pipes';
import { MainComponent } from './ui/main';
import { PopupComponent } from './ui/popup/popup';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    HeaderComponent, ElementIconComponent,
    MainMenuComponent, EditionMenuComponent, SettingsMenuComponent,
    FooterComponent,
    AttackModifierComponent,
    LevelComponent,
    DialogComponent, PopupComponent,
    CharacterComponent, CharacterInitiativePicker, CharacterSummonDialog,
    MonsterComponent,
    MonsterEntityComponent,
    MonsterImageComponent,
    AbilityComponent,
    MonsterStatsComponent,
    MonsterNumberPicker,
    MonsterActionsComponent, MonsterActionComponent, ActionHexComponent,
    CardRevealDirective,
    GhsValueCalcPipe, GhsValueSignPipe, GhsEditionFilterPipe, GhsLabelPipe, GhsSortPipe
  ],
  imports: [
    BrowserModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
