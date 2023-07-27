import { Injectable, NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DEFAULT_DIALOG_CONFIG, DialogModule } from '@angular/cdk/dialog';
import { ServiceWorkerModule } from '@angular/service-worker';
import { FormsModule } from '@angular/forms';
import { InViewportModule } from 'ng-in-viewport';

import { AppComponent } from './app.component';
import { CharacterComponent } from './ui/figures/character/character';
import { CharacterSummonDialog } from './ui/figures/character/dialogs/summondialog';
import { ActionComponent } from './ui/figures/actions/action';
import { ActionsComponent } from './ui/figures/actions/actions';
import { ActionHexComponent } from './ui/figures/actions/area/action-hex';
import { MonsterAbilityCardComponent } from './ui/figures/monster/cards/ability-card';
import { MonsterImageComponent, MonsterImageDialogComponent } from './ui/figures/monster/cards/image';
import { MonsterStatsComponent } from './ui/figures/monster/stats/stats';
import { MonsterNumberPicker } from './ui/figures/monster/dialogs/numberpicker';
import { MonsterNumberPickerDialog } from './ui/figures/monster/dialogs/numberpicker-dialog';
import { MonsterComponent } from './ui/figures/monster/monster';
import { gameManager } from './game/businesslogic/GameManager';
import { UndoDialogComponent } from './ui/header/menu/undo/dialog';
import { FooterComponent } from './ui/footer/footer';
import { LevelComponent } from './ui/footer/level/level';
import { LevelDialogComponent } from './ui/footer/level/level-dialog';
import { ElementIconComponent } from './ui/header/element/element-icon';
import { ElementComponent } from './ui/header/element/element';
import { HeaderComponent } from './ui/header/header';
import { MainMenuComponent } from './ui/header/menu/menu';
import { SettingsMenuComponent } from './ui/header/menu/settings/settings';
import { SheetsMenuComponent } from './ui/header/menu/sheets/sheets';
import { CardRevealDirective } from './ui/helper/CardReveal';
import { GhsCeilPipe, GhsFloorPipe, GhsRangePipe, GhsScenarioSearch, GhsValueSignPipe } from './ui/helper/Pipes';
import { MainComponent } from './ui/main';
import { SummonEntityComponent } from './ui/figures/character/summon/summon';
import { SummonSheetComponent } from './ui/figures/character/summon/sheet/summon-sheet';
import { CharacterImageComponent } from './ui/figures/character/cards/image';
import { DatamanagementMenuComponent } from './ui/header/menu/datamanagement/datamanagement';
import { ScenarioMenuComponent } from './ui/header/menu/scenario/scenario';
import { CharacterInitiativeComponent } from './ui/figures/character/cards/initiative';
import { CharacterInitiativeDialogComponent } from './ui/figures/character/cards/initiative-dialog';
import { ObjectiveComponent } from './ui/figures/objective/objective';
import { ServerMenuComponent } from './ui/header/menu/server/server';
import { FigureErrorsComponent, FigureErrorsDialogComponent } from './ui/figures/errors/errors';
import { SectionMenuComponent } from './ui/header/menu/section/section';
import { ConditionsComponent } from './ui/figures/conditions/conditions';
import { ConditionHighlightAnimationDirective, HighlightConditionsComponent } from './ui/figures/conditions/highlight';
import { HealthbarComponent } from './ui/figures/healthbar/healthbar';
import { EntityAnimationDirective } from './ui/helper/EntityAnimation';
import { GhsLabelDirective } from './ui/helper/label';
import { ValueCalcDirective } from './ui/helper/valueCalc';
import { CharacterSheetDialog } from './ui/figures/character/dialogs/character-sheet-dialog';
import { ScenarioComponent } from './ui/footer/scenario/scenario';
import { PartySheetComponent } from './ui/header/party/party-sheet';
import { PartySheetDialogComponent } from './ui/header/party/party-sheet-dialog';
import { AutoscrollDirective, FigureAutoscrollDirective } from './ui/helper/autoscroll';
import { AttackModifierDeckComponent } from './ui/figures/attackmodifier/attackmodifierdeck';
import { AttackModifierComponent } from './ui/figures/attackmodifier/attackmodifier';
import { AttackModifierToolComponent } from './ui/tools/attackmodifier/attackmodifier-tool';
import { TreasuresToolComponent } from './ui/tools/treasures/treasures-tool';
import { TextShrinkDirective } from './ui/helper/textshrink';
import { EntityMenuDialogComponent } from './ui/figures/entity-menu/entity-menu-dialog';
import { AbilityComponent } from './ui/figures/ability/ability';
import { AbiltiesDialogComponent } from './ui/figures/ability/abilities-dialog';
import { AbilityDialogComponent } from './ui/figures/ability/ability-dialog';
import { MonsterStatDialogComponent } from './ui/figures/monster/stats/stat-dialog';
import { MonsterStatsDialogComponent } from './ui/figures/monster/stats/stats-dialog';
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
import { EntitiesMenuDialogComponent } from './ui/figures/entities-menu/entities-menu-dialog';
import { CharacterMenuComponent } from './ui/header/menu/character/character';
import { MonsterMenuComponent } from './ui/header/menu/monster/monster';
import { GhsTooltipComponent, GhsTooltipDirective } from './ui/helper/tooltip/tooltip';
import { ScenarioDialogComponent } from './ui/footer/scenario/dialog/scenario-dialog';
import { ScenarioSummaryComponent } from './ui/footer/scenario/summary/scenario-summary';
import { SectionDialogComponent } from './ui/footer/scenario/section/section-dialog';
import { CharacterLootCardsDialog } from './ui/figures/character/dialogs/loot-cards';
import { CharacterMoveResourcesDialog } from './ui/figures/character/sheet/move-resources';
import { CharacterSheetComponent } from './ui/figures/character/sheet/character-sheet';
import { PerkLabelComponent } from './ui/figures/attackmodifier/perk/label';
import { PartyWeekDialogComponent } from './ui/header/party/week-dialog/week-dialog';
import { CharacterItemsComponent } from './ui/figures/items/items';
import { ItemsBrewDialog } from './ui/figures/items/brew/brew';
import { PartyBuildingsComponent } from './ui/header/party/buildings/buildings';
import { ScenarioTreasuresDialogComponent } from './ui/footer/scenario/treasures/treasures-dialog';
import { TreasureLabelComponent } from './ui/footer/scenario/treasures/label/label';
import { StatsListComponent } from './ui/footer/scenario/dialog/stats-list/stats-list';
import { KeyboardShortcuts } from './ui/helper/keyboard-shortcuts';
import { ScenarioConclusionComponent } from './ui/footer/scenario/scenario-conclusion/scenario-conclusion';
import { SelectResourcesDialog } from './ui/header/party/buildings/select-resources/select-resources';
import { EventEffectsDialog } from './ui/figures/character/event-effects/event-effects';
import { PointerInputDirective } from './ui/helper/pointer-input';
import { StandeeComponent } from './ui/figures/standee/standee';
import { BattleGoalComponent } from './ui/figures/battlegoal/battlegoal';
import { CharacterBattleGoalsDialog } from './ui/figures/battlegoal/dialog/battlegoal-dialog';
import { BattleGoalSetupDialog } from './ui/figures/battlegoal/setup/battlegoal-setup';
import { ScenarioRequirementsComponent } from './ui/header/party/requirements/requirements';
import { WorldMapComponent } from './ui/header/party/world-map/world-map';
import { ObjectiveContainerComponent } from './ui/figures/objective-container/objective-container';
import { ItemComponent } from './ui/figures/items/item/item';
import { ItemsDialogComponent } from './ui/figures/items/dialog/items-dialog';

@Injectable()
export class GhsErrorHandler extends ErrorHandler {

  override handleError(error: any) {
    gameManager.stateManager.errorLog.push(error);
    super.handleError(error);
  }
}

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    HeaderComponent, ElementIconComponent, ElementComponent,
    PartySheetComponent, PartySheetDialogComponent, PartyWeekDialogComponent, PartyBuildingsComponent, WorldMapComponent, ScenarioConclusionComponent, SelectResourcesDialog, ScenarioRequirementsComponent,
    MainMenuComponent, CharacterMenuComponent, MonsterMenuComponent, SettingsMenuComponent, DatamanagementMenuComponent, ScenarioMenuComponent, SectionMenuComponent, ServerMenuComponent, SettingsDebugMenuComponent, UndoDialogComponent, SheetsMenuComponent,
    FooterComponent,
    LootComponent, LootDeckComponent, LootDeckFullscreenComponent, LootDeckDialogComponent, LootDeckStandaloneComponent, LootApplyDialogComponent,
    HintDialogComponent, ScenarioRulesComponent,
    AttackModifierComponent, AttackModifierEffectsComponent, AttackModifierDeckComponent, AttackModifierDeckDialogComponent, AttackModifierDeckFullscreenComponent, AttackModifierStandaloneComponent,
    LevelComponent, LevelDialogComponent,
    ScenarioComponent, ScenarioDialogComponent, SectionDialogComponent, ScenarioSummaryComponent, StatsListComponent, ScenarioTreasuresDialogComponent, TreasureLabelComponent, EventEffectsDialog,
    ConditionsComponent, HighlightConditionsComponent, ConditionHighlightAnimationDirective, HealthbarComponent,
    EntityMenuDialogComponent, EntitiesMenuDialogComponent,
    CharacterComponent, CharacterImageComponent, CharacterSummonDialog, CharacterInitiativeComponent, CharacterInitiativeDialogComponent, CharacterSheetComponent, CharacterSheetDialog, CharacterFullViewComponent, CharacterLootCardsDialog, PerkLabelComponent, CharacterMoveResourcesDialog, ItemComponent, ItemsDialogComponent, CharacterItemsComponent, ItemsBrewDialog, BattleGoalComponent, CharacterBattleGoalsDialog, BattleGoalSetupDialog,
    ObjectiveComponent, ObjectiveContainerComponent,
    SummonEntityComponent, SummonSheetComponent,
    StandeeComponent,
    MonsterComponent,
    MonsterImageComponent,
    MonsterAbilityCardComponent, MonsterStatsComponent,
    MonsterStatDialogComponent, MonsterStatsDialogComponent, MonsterLevelDialogComponent,
    MonsterNumberPicker, MonsterNumberPickerDialog, MonsterImageDialogComponent,
    AbilityComponent, AbiltiesDialogComponent, AbilityDialogComponent,
    ActionsComponent, ActionComponent, ActionHexComponent, ActionSummonComponent,
    FigureErrorsComponent, FigureErrorsDialogComponent,
    CardRevealDirective, EntityAnimationDirective, GhsLabelDirective, ValueCalcDirective, PointerInputDirective, AutoscrollDirective, FigureAutoscrollDirective, TextShrinkDirective,
    GhsValueSignPipe, GhsRangePipe, GhsScenarioSearch, GhsFloorPipe, GhsCeilPipe,
    AttackModifierToolComponent, TreasuresToolComponent, DecksToolComponent,
    EditionEditorComponent,
    EditorActionComponent, EditorActionDialogComponent,
    DeckEditorComponent, CharacterEditorComponent, MonsterEditorComponent,
    GhsTooltipComponent, GhsTooltipDirective,
    KeyboardShortcuts,
    FeedbackToolComponent, FeedbackDialogComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    DragDropModule,
    DialogModule,
    InViewportModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: true, registrationStrategy: 'registerImmediately' })
  ],
  providers: [
    {
      provide: DEFAULT_DIALOG_CONFIG,
      useValue: {
        autoFocus: 'dialog',
        hasBackdrop: true
      }
    },
    {
      provide: ErrorHandler,
      useClass: GhsErrorHandler
    }],
  bootstrap: [AppComponent]
})
export class AppModule { }
