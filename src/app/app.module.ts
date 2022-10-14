import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DEFAULT_DIALOG_CONFIG, DialogModule } from '@angular/cdk/dialog';
import { ServiceWorkerModule } from '@angular/service-worker';
import { FormsModule } from '@angular/forms';
import { APP_BASE_HREF } from '@angular/common';

import { AppComponent } from './app.component';
import { CharacterComponent } from './ui/figures/character/character';
import { CharacterSummonDialog } from './ui/figures/character/dialogs/summondialog';
import { ActionComponent } from './ui/figures/actions/action';
import { ActionsComponent } from './ui/figures/actions/actions';
import { ActionHexComponent } from './ui/figures/actions/action-hex';
import { MonsterAbilityCardComponent } from './ui/figures/monster/cards/ability-card';
import { MonsterImageComponent } from './ui/figures/monster/cards/image';
import { MonsterStatsComponent } from './ui/figures/monster/cards/stats';
import { MonsterNumberPicker, MonsterNumberPickerDialog } from './ui/figures/monster/dialogs/numberpicker';
import { MonsterEntityComponent } from './ui/figures/monster/entity/entity';
import { MonsterComponent } from './ui/figures/monster/monster';
import { FooterComponent, HintDialogComponent } from './ui/footer/footer';
import { LevelComponent, LevelDialogComponent } from './ui/footer/level/level';
import { ElementIconComponent } from './ui/header/element/element';
import { HeaderComponent } from './ui/header/header';
import { EditionMenuComponent } from './ui/header/menu/edition/edition';
import { MainMenuComponent } from './ui/header/menu/menu';
import { SettingsMenuComponent } from './ui/header/menu/settings/settings';
import { CardRevealDirective } from './ui/helper/CardReveal';
import { GhsLabelPipe, GhsRangePipe, GhsValueSignPipe } from './ui/helper/Pipes';
import { MainComponent } from './ui/main';
import { SummonEntityComponent } from './ui/figures/character/summon/summon';
import { CharacterImageComponent } from './ui/figures/character/cards/image';
import { DatamanagementMenuComponent } from './ui/header/menu/datamanagement/datamanagement';
import { ScenarioMenuComponent } from './ui/header/menu/scenario/scenario';
import { CharacterInitiativeComponent, CharacterInitiativeDialogComponent } from './ui/figures/character/cards/initiative';
import { ObjectiveComponent } from './ui/figures/objective/objective';
import { ServerMenuComponent } from './ui/header/menu/server/server';
import { FigureErrorsComponent, FigureErrorsDialogComponent } from './ui/figures/errors/errors';
import { SectionMenuComponent } from './ui/header/menu/section/section';
import { ConditionHighlightAnimationDirective, ConditionsComponent, HighlightConditionsComponent } from './ui/figures/conditions/conditions';
import { HealthbarComponent } from './ui/figures/healthbar/healthbar';
import { EntityAnimationDirective } from './ui/helper/EntityAnimation';
import { I18nDirective } from './ui/helper/i18n';
import { ValueCalcDirective } from './ui/helper/valueCalc';
import { CharacterSheetDialog } from './ui/figures/character/dialogs/character-sheet';
import { ScenarioComponent, ScenarioDialogComponent, ScenarioSummaryComponent } from './ui/footer/scenario/scenario';
import { PartySheetComponent } from './ui/header/party/party-sheet';
import { PartySheetDialogComponent } from './ui/header/party/party-sheet-dialog';
import { DragValueComponent } from './ui/helper/dragValue/drag';
import { AutoscrollDirective, FigureAutoscrollDirective } from './ui/helper/autoscroll';
import { AttackModifierDeckComponent } from './ui/figures/attackmodifier/attackmodifierdeck';
import { AttackModifierComponent } from './ui/figures/attackmodifier/attackmodifier';
import { AttackModifierToolComponent } from './ui/tools/attackmodifier/attackmodifier-tool';
import { TextShrinkDirective } from './ui/helper/textshrink';
import { EntityMenuDialogComponent } from './ui/figures/entity-menu/entity-menu-dialog';
import { AbilityComponent } from './ui/figures/ability/ability';
import { AbiltiesDialogComponent } from './ui/figures/ability/abilities-dialog';
import { AbilityDialogComponent } from './ui/figures/ability/ability-dialog';
import { MonsterStatsDialogComponent } from './ui/figures/monster/dialogs/stats-dialog';
import { MonsterLevelDialogComponent } from './ui/figures/monster/dialogs/level-dialog';
import { CharacterFullViewComponent } from './ui/figures/character/fullview/fullview';
import { AttackModifierDeckDialogComponent } from './ui/figures/attackmodifier/attackmodifierdeck-dialog';
import { AttackModifierDeckFullscreenComponent } from './ui/figures/attackmodifier/attackmodifierdeck-fullscreen';
import { AttackModifierEffectsComponent } from './ui/figures/attackmodifier/attackmodifier-effects';
import { AppRoutingModule } from './app-routing.module';
import { MonsterEditorComponent } from './ui/tools/editor/monster/monster';
import { MonsterEditorActionComponent, MonsterEditorActionDialogComponent } from './ui/tools/editor/monster/action/action';
import { SettingsDebugMenuComponent } from './ui/header/menu/debug/debug';
import { EditionEditorComponent } from './ui/tools/editor/edition';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    HeaderComponent, ElementIconComponent,
    PartySheetComponent, PartySheetDialogComponent,
    MainMenuComponent, EditionMenuComponent, SettingsMenuComponent, DatamanagementMenuComponent, ScenarioMenuComponent, SectionMenuComponent, ServerMenuComponent, SettingsDebugMenuComponent,
    FooterComponent,
    AttackModifierComponent, AttackModifierEffectsComponent, HintDialogComponent, AttackModifierDeckComponent, AttackModifierDeckDialogComponent, AttackModifierDeckFullscreenComponent,
    LevelComponent, LevelDialogComponent,
    ScenarioComponent, ScenarioDialogComponent, ScenarioSummaryComponent,
    ConditionsComponent, HighlightConditionsComponent, ConditionHighlightAnimationDirective, HealthbarComponent,
    EntityMenuDialogComponent,
    CharacterComponent, CharacterImageComponent, CharacterSummonDialog, CharacterInitiativeComponent, CharacterInitiativeDialogComponent, CharacterSheetDialog, CharacterFullViewComponent,
    ObjectiveComponent,
    SummonEntityComponent,
    MonsterComponent,
    MonsterEntityComponent,
    MonsterImageComponent,
    MonsterAbilityCardComponent,
    MonsterStatsComponent, MonsterStatsDialogComponent, MonsterLevelDialogComponent,
    MonsterNumberPicker, MonsterNumberPickerDialog,
    AbilityComponent, AbiltiesDialogComponent, AbilityDialogComponent,
    ActionsComponent, ActionComponent, ActionHexComponent,
    FigureErrorsComponent, FigureErrorsDialogComponent,
    CardRevealDirective, EntityAnimationDirective, I18nDirective, ValueCalcDirective, DragValueComponent, AutoscrollDirective, FigureAutoscrollDirective, TextShrinkDirective,
    GhsValueSignPipe, GhsLabelPipe, GhsRangePipe,
    AttackModifierToolComponent,
    EditionEditorComponent,
    MonsterEditorComponent, MonsterEditorActionComponent, MonsterEditorActionDialogComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    DragDropModule,
    DialogModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: true, registrationStrategy: 'registerImmediately' })
  ],
  providers: [{ provide: APP_BASE_HREF, useValue: '.' }, { provide: DEFAULT_DIALOG_CONFIG, useValue: { autoFocus: 'dialog', hasBackdrop: true } }],
  bootstrap: [AppComponent]
})
export class AppModule { }
