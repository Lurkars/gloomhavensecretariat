import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DialogComponent } from './ui/dialog/dialog';
import { CharacterComponent } from './ui/figures/character/character';
import { CharacterSummonDialog } from './ui/figures/character/dialogs/summondialog';
import { ActionHexComponent, ActionComponent, ActionsComponent } from './ui/figures/actions/action';
import { AbilityComponent } from './ui/figures/monster/cards/ability';
import { MonsterImageComponent } from './ui/figures/monster/cards/image';
import { MonsterStatsComponent, MonsterStatsPopupComponent } from './ui/figures/monster/cards/stats';
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
import { GhsActiveConditionsPipe, GhsEditionFilterPipe, GhsHtmlLabelPipe, GhsLabelPipe, GhsLimitPipe, GhsRangePipe, GhsSortPipe, GhsValueCalcPipe, GhsValueSignPipe } from './ui/helper/Pipes';
import { MainComponent } from './ui/main';
import { PopupComponent } from './ui/popup/popup';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { SummonEntityComponent } from './ui/figures/character/summon/summon';
import { GhsSvgComponent } from './ui/helper/svg/svg';
import { CharacterImageComponent } from './ui/figures/character/cards/image';
import { DatamanagementMenuComponent } from './ui/header/menu/datamanagement/datamanagement';
import { ScenarioMenuComponent } from './ui/header/menu/scenario/scenario';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CharacterInitiativeComponent } from './ui/figures/character/cards/initiative';
import { ObjectiveComponent } from './ui/figures/objective/objective';
import { MonsterToolComponent } from './ui/tools/monster/monster';
import { MonsterStatToolComponent } from './ui/tools/monster/stat/stat';
import { FormsModule } from '@angular/forms';
import { MonsterActionToolComponent } from './ui/tools/monster/action/action';
import { ServerMenuComponent } from './ui/header/menu/server/server';
import { APP_BASE_HREF } from '@angular/common';
import { FigureErrors } from './ui/figures/errors/errors';
import { SectionMenuComponent } from './ui/header/menu/section/section';
import { ConditionsComponent, HighlightConditionsComponent } from './ui/figures/conditions/conditions';
import { HealthbarComponent } from './ui/figures/healthbar/healthbar';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    HeaderComponent, ElementIconComponent,
    MainMenuComponent, EditionMenuComponent, SettingsMenuComponent, DatamanagementMenuComponent, ScenarioMenuComponent, SectionMenuComponent, ServerMenuComponent,
    FooterComponent,
    AttackModifierComponent,
    LevelComponent,
    DialogComponent, PopupComponent,
    ConditionsComponent, HighlightConditionsComponent, HealthbarComponent,
    CharacterComponent, CharacterImageComponent, CharacterSummonDialog, CharacterInitiativeComponent,
    ObjectiveComponent,
    SummonEntityComponent,
    MonsterComponent,
    MonsterEntityComponent,
    MonsterImageComponent,
    AbilityComponent,
    MonsterStatsComponent, MonsterStatsPopupComponent,
    MonsterNumberPicker,
    ActionsComponent, ActionComponent, ActionHexComponent,
    FigureErrors,
    CardRevealDirective,
    GhsValueCalcPipe, GhsValueSignPipe, GhsEditionFilterPipe, GhsActiveConditionsPipe, GhsLabelPipe, GhsSortPipe, GhsSvgComponent, GhsHtmlLabelPipe, GhsRangePipe, GhsLimitPipe,
    MonsterToolComponent, MonsterActionToolComponent, MonsterStatToolComponent ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    DragDropModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [ { provide: APP_BASE_HREF, useValue: '.' } ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
