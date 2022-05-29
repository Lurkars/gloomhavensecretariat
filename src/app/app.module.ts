import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { DialogComponent } from './ui/dialog/dialog';
import { CharacterComponent } from './ui/figures/character/character';
import { CharacterInitiativePicker } from './ui/figures/character/dialogs/initiativepicker';
import { ActionHexComponent, MonsterActionComponent, MonsterActionsComponent } from './ui/figures/monster/actions/action';
import { MonsterAbilityComponent } from './ui/figures/monster/cards/ability';
import { MonsterImageComponent } from './ui/figures/monster/cards/image';
import { MonsterStatsComponent } from './ui/figures/monster/cards/stats';
import { MonsterNumberPicker } from './ui/figures/monster/dialogs/numberpicker';
import { MonsterEntityComponent } from './ui/figures/monster/entity/entity';
import { MonsterComponent } from './ui/figures/monster/monster';
import { AttackModifierComponent } from './ui/footer/attackmodifier/attackmodifier';
import { FooterComponent } from './ui/footer/footer';
import { LevelComponent } from './ui/footer/level/level';
import { HeaderComponent } from './ui/header/header';
import { MainMenuComponent } from './ui/header/menu/menu';
import { CardRevealDirective } from './ui/helper/CardReveal';
import { GhsEditionFilterPipe, GhsValueCalcPipe, GhsValueSignPipe } from './ui/helper/Pipes';
import { MainComponent } from './ui/main';
import { PopupComponent } from './ui/popup/popup';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    HeaderComponent,
    MainMenuComponent,
    FooterComponent,
    AttackModifierComponent,
    LevelComponent,
    DialogComponent, PopupComponent,
    CharacterComponent,
    CharacterInitiativePicker,
    MonsterComponent,
    MonsterEntityComponent,
    MonsterImageComponent,
    MonsterAbilityComponent,
    MonsterStatsComponent,
    MonsterNumberPicker,
    MonsterActionsComponent, MonsterActionComponent, ActionHexComponent,
    CardRevealDirective,
    GhsValueCalcPipe, GhsValueSignPipe, GhsEditionFilterPipe
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
