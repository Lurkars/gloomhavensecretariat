import { NgModule } from '@angular/core';
import { BrowserModule, HammerGestureConfig, HammerModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DEFAULT_DIALOG_CONFIG, DialogModule } from '@angular/cdk/dialog';
import { ServiceWorkerModule } from '@angular/service-worker';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { CharacterComponent } from './ui/figures/character/character';
import { CharacterSummonDialog } from './ui/figures/character/dialogs/summondialog';
import { ActionComponent } from './ui/figures/actions/action';
import { ActionsComponent } from './ui/figures/actions/actions';
import { ActionHexComponent } from './ui/figures/actions/area/action-hex';
import { MonsterAbilityCardComponent } from './ui/figures/monster/cards/ability-card';
import { MonsterImageComponent } from './ui/figures/monster/cards/image';
import { MonsterStatsComponent } from './ui/figures/monster/cards/stats';
import { MonsterNumberPicker, MonsterNumberPickerDialog } from './ui/figures/monster/dialogs/numberpicker';
import { MonsterEntityComponent } from './ui/figures/monster/entity/entity';
import { MonsterComponent } from './ui/figures/monster/monster';
import { FooterComponent } from './ui/footer/footer';
import { LevelComponent, LevelDialogComponent } from './ui/footer/level/level';
import { ElementIconComponent } from './ui/header/element/element-icon';
import { ElementComponent } from './ui/header/element/element';
import { HeaderComponent } from './ui/header/header';
import { EditionMenuComponent } from './ui/header/menu/edition/edition';
import { MainMenuComponent } from './ui/header/menu/menu';
import { SettingsMenuComponent } from './ui/header/menu/settings/settings';
import { CardRevealDirective } from './ui/helper/CardReveal';
import { GhsLabelPipe, GhsRangePipe, GhsScenarioSearch, GhsValueSignPipe } from './ui/helper/Pipes';
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
import { ScenarioComponent, ScenarioDialogComponent, ScenarioSummaryComponent, SectionDialogComponent } from './ui/footer/scenario/scenario';
import { PartySheetComponent } from './ui/header/party/party-sheet';
import { PartySheetDialogComponent } from './ui/header/party/party-sheet-dialog';
import { DragClickComponent } from './ui/helper/drag/drag';
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
import { EditorActionComponent, EditorActionDialogComponent } from './ui/tools/editor/action/action';
import { SettingsDebugMenuComponent } from './ui/header/menu/debug/debug';
import { EditionEditorComponent } from './ui/tools/editor/edition';
import { HintDialogComponent } from './ui/footer/hint-dialog/hint-dialog';
import { CharacterEditorComponent } from './ui/tools/editor/character/character';
import { DecksToolComponent } from './ui/tools/decks/decks-tool';
import { ActionSummonComponent } from './ui/figures/actions/summon/action-summon';
import { DeckEditorComponent } from './ui/tools/editor/deck/deck';
import { ScenarioRulesComponent } from './ui/footer/scenario-rules/scenario-rules';
import { FeedbackToolComponent } from './ui/tools/feedback/feedback';
import { FeedbackDialogComponent } from './ui/tools/feedback/feedback-dialog';
import { LootDeckComponent } from './ui/figures/loot/loot-deck';
import { LootDeckFullscreenComponent } from './ui/figures/loot/loot-deck-fullscreen';
import { LootComponent } from './ui/figures/loot/loot';
import { LootDeckDialogComponent } from './ui/figures/loot/loot-deck-dialog';
import { LootDeckStandaloneComponent } from './ui/tools/standalone/loot-deck-standalone';
import { AttackModifierStandaloneComponent } from './ui/tools/standalone/attackmodifier-standalone';
import { LootApplyDialogComponent } from './ui/figures/loot/loot-apply-dialog';
import 'hammerjs'

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    HeaderComponent, ElementIconComponent, ElementComponent,
    PartySheetComponent, PartySheetDialogComponent,
    MainMenuComponent, EditionMenuComponent, SettingsMenuComponent, DatamanagementMenuComponent, ScenarioMenuComponent, SectionMenuComponent, ServerMenuComponent, SettingsDebugMenuComponent,
    FooterComponent,
    LootComponent, LootDeckComponent, LootDeckFullscreenComponent, LootDeckDialogComponent, LootDeckStandaloneComponent, LootApplyDialogComponent,
    HintDialogComponent, ScenarioRulesComponent,
    AttackModifierComponent, AttackModifierEffectsComponent, AttackModifierDeckComponent, AttackModifierDeckDialogComponent, AttackModifierDeckFullscreenComponent, AttackModifierStandaloneComponent,
    LevelComponent, LevelDialogComponent,
    ScenarioComponent, ScenarioDialogComponent, SectionDialogComponent, ScenarioSummaryComponent,
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
    ActionsComponent, ActionComponent, ActionHexComponent, ActionSummonComponent,
    FigureErrorsComponent, FigureErrorsDialogComponent,
    CardRevealDirective, EntityAnimationDirective, I18nDirective, ValueCalcDirective, DragClickComponent, AutoscrollDirective, FigureAutoscrollDirective, TextShrinkDirective,
    GhsValueSignPipe, GhsLabelPipe, GhsRangePipe, GhsScenarioSearch,
    AttackModifierToolComponent, DecksToolComponent,
    EditionEditorComponent,
    EditorActionComponent, EditorActionDialogComponent,
    DeckEditorComponent, CharacterEditorComponent, MonsterEditorComponent,
    FeedbackToolComponent, FeedbackDialogComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    DragDropModule,
    DialogModule,
    HammerModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: true, registrationStrategy: 'registerImmediately' })
  ],
  providers: [{ provide: DEFAULT_DIALOG_CONFIG, useValue: { autoFocus: 'dialog', hasBackdrop: true } }],
  bootstrap: [AppComponent]
})
export class AppModule { }
