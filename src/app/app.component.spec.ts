import { TestBed } from '@angular/core/testing';

import { DialogModule } from '@angular/cdk/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { ServiceWorkerModule } from '@angular/service-worker';
import { InViewportModule } from 'ng-in-viewport';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AbiltiesDialogComponent } from './ui/figures/ability/abilities-dialog';
import { AbilityComponent } from './ui/figures/ability/ability';
import { AbilityDialogComponent } from './ui/figures/ability/ability-dialog';
import { ActionComponent } from './ui/figures/actions/action';
import { ActionsComponent } from './ui/figures/actions/actions';
import { ActionHexComponent } from './ui/figures/actions/area/action-hex';
import { InteractiveActionsComponent } from './ui/figures/actions/interactive/interactive-actions';
import { ActionSummonComponent } from './ui/figures/actions/summon/action-summon';
import { AttackModifierComponent } from './ui/figures/attackmodifier/attackmodifier';
import { AttackModifierDrawComponent } from './ui/figures/attackmodifier/attackmodifier-draw';
import { AttackModifierEffectsComponent } from './ui/figures/attackmodifier/attackmodifier-effects';
import { AttackModifierDeckComponent } from './ui/figures/attackmodifier/attackmodifierdeck';
import { AttackModifierDeckDialogComponent } from './ui/figures/attackmodifier/attackmodifierdeck-dialog';
import { AttackModifierDeckFullscreenComponent } from './ui/figures/attackmodifier/attackmodifierdeck-fullscreen';
import { PerkLabelComponent } from './ui/figures/attackmodifier/perk/label';
import { BattleGoalComponent } from './ui/figures/battlegoal/battlegoal';
import { CharacterBattleGoalsDialog } from './ui/figures/battlegoal/dialog/battlegoal-dialog';
import { BattleGoalSetupDialog } from './ui/figures/battlegoal/setup/battlegoal-setup';
import { CharacterImageComponent } from './ui/figures/character/cards/image';
import { CharacterInitiativeComponent } from './ui/figures/character/cards/initiative';
import { CharacterInitiativeDialogComponent } from './ui/figures/character/cards/initiative-dialog';
import { CharacterComponent } from './ui/figures/character/character';
import { CharacterSheetDialog } from './ui/figures/character/dialogs/character-sheet-dialog';
import { CharacterLootCardsDialog } from './ui/figures/character/dialogs/loot-cards';
import { CharacterSummonDialog } from './ui/figures/character/dialogs/summondialog';
import { EventEffectsDialog } from './ui/figures/character/event-effects/event-effects';
import { EventRandomItemDialogComponent } from './ui/figures/character/event-effects/random-item/random-item-dialog';
import { EventRandomScenarioDialogComponent } from './ui/figures/character/event-effects/random-scenario/random-scenario-dialog';
import { CharacterFullViewComponent } from './ui/figures/character/fullview/fullview';
import { CharacterItemListComponent } from './ui/figures/character/item-list/item-list';
import { AbilityCardsDialogComponent } from './ui/figures/character/sheet/ability-cards-dialog';
import { CharacterSheetComponent } from './ui/figures/character/sheet/character-sheet';
import { CharacterMoveResourcesDialog } from './ui/figures/character/sheet/move-resources';
import { CharacterRetirementDialog } from './ui/figures/character/sheet/retirement-dialog';
import { SummonSheetComponent } from './ui/figures/character/summon/sheet/summon-sheet';
import { SummonEntityComponent } from './ui/figures/character/summon/summon';
import { ConditionsComponent } from './ui/figures/conditions/conditions';
import { ConditionHighlightAnimationDirective, HighlightConditionsComponent } from './ui/figures/conditions/highlight';
import { EntitiesMenuDialogComponent } from './ui/figures/entities-menu/entities-menu-dialog';
import { AdditionalAMSelectDialogComponent } from './ui/figures/entity-menu/additional-am-select/additional-am-select';
import { EntityMenuDialogComponent } from './ui/figures/entity-menu/entity-menu-dialog';
import { FigureErrorsComponent, FigureErrorsDialogComponent } from './ui/figures/errors/errors';
import { EventCardComponent } from './ui/figures/event/event-card';
import { EventConditionLabelComponent } from './ui/figures/event/label/condition-label';
import { EventRewardLabelComponent } from './ui/figures/event/label/reward-label';
import { HealthbarComponent } from './ui/figures/healthbar/healthbar';
import { ItemsBrewDialog } from './ui/figures/items/brew/brew';
import { CharacterItemComponent } from './ui/figures/items/character/item-character';
import { ItemsCharacterDialogComponent } from './ui/figures/items/character/items-character-dialog';
import { ItemDialogComponent } from './ui/figures/items/dialog/item-dialog';
import { ItemsDialogComponent } from './ui/figures/items/dialog/items-dialog';
import { ItemComponent } from './ui/figures/items/item/item';
import { CharacterItemsComponent } from './ui/figures/items/items';
import { LootApplyDialogComponent } from './ui/figures/loot/loot-apply-dialog';
import { LootComponent } from './ui/figures/loot/loot-card';
import { LootDeckComponent } from './ui/figures/loot/loot-deck';
import { LootDeckDialogComponent } from './ui/figures/loot/loot-deck-dialog';
import { LootDeckFullscreenComponent } from './ui/figures/loot/loot-deck-fullscreen';
import { LootRandomItemDialogComponent } from './ui/figures/loot/random-item/random-item-dialog';
import { MonsterAbilityCardComponent } from './ui/figures/monster/cards/ability-card';
import { MonsterImageComponent, MonsterImageDialogComponent } from './ui/figures/monster/cards/image';
import { MonsterLevelDialogComponent } from './ui/figures/monster/dialogs/level-dialog';
import { MonsterNumberPicker } from './ui/figures/monster/dialogs/numberpicker';
import { MonsterNumberPickerDialog } from './ui/figures/monster/dialogs/numberpicker-dialog';
import { MonsterComponent } from './ui/figures/monster/monster';
import { MonsterStatDialogComponent } from './ui/figures/monster/stats/stat-dialog';
import { MonsterStatsComponent } from './ui/figures/monster/stats/stats';
import { MonsterStatsDialogComponent } from './ui/figures/monster/stats/stats-dialog';
import { ObjectiveContainerComponent } from './ui/figures/objective-container/objective-container';
import { PartyBuildingsComponent } from './ui/figures/party/buildings/buildings';
import { BuildingUpgradeDialog } from './ui/figures/party/buildings/upgrade-dialog/upgrade-dialog';
import { PartySheetDialogComponent } from './ui/figures/party/party-sheet-dialog';
import { ScenarioRequirementsComponent } from './ui/figures/party/requirements/requirements';
import { PartyResourcesDialogComponent } from './ui/figures/party/resources/resources';
import { ScenarioChartPopupDialog } from './ui/figures/party/scenario-chart/popup/scenario-chart-popup';
import { ScenarioChartDialogComponent } from './ui/figures/party/scenario-chart/scenario-chart';
import { TreasuresDialogComponent } from './ui/figures/party/treasures/treasures-dialog';
import { PartyWeekDialogComponent } from './ui/figures/party/week-dialog/week-dialog';
import { WorldMapComponent } from './ui/figures/party/world-map/world-map';
import { EntityIndexKeyComponent } from './ui/figures/standee/entity-index-key/entity-index-key';
import { StandeeComponent } from './ui/figures/standee/standee';
import { FooterComponent } from './ui/footer/footer';
import { HintDialogComponent } from './ui/footer/hint-dialog/hint-dialog';
import { LevelComponent } from './ui/footer/level/level';
import { LevelDialogComponent } from './ui/footer/level/level-dialog';
import { ScenarioRulesComponent } from './ui/footer/scenario-rules/scenario-rules';
import { ScenarioDialogComponent } from './ui/footer/scenario/dialog/scenario-dialog';
import { StatsListComponent } from './ui/footer/scenario/dialog/stats-list/stats-list';
import { ScenarioComponent } from './ui/footer/scenario/scenario';
import { ScenarioConclusionComponent } from './ui/footer/scenario/scenario-conclusion/scenario-conclusion';
import { ScenarioSetupComponent } from './ui/footer/scenario/scenario-setup/scenario-setup';
import { SectionDialogComponent } from './ui/footer/scenario/section/section-dialog';
import { ScenarioSummaryComponent } from './ui/footer/scenario/summary/scenario-summary';
import { TreasureLabelComponent } from './ui/footer/scenario/treasures/label/label';
import { ScenarioTreasuresDialogComponent } from './ui/footer/scenario/treasures/treasures-dialog';
import { ElementComponent } from './ui/header/element/element';
import { ElementIconComponent } from './ui/header/element/element-icon';
import { GameClockDialogComponent } from './ui/header/game-clock/game-clock';
import { HeaderComponent } from './ui/header/header';
import { CampaignMenuComponent } from './ui/header/menu/campaign/campaign';
import { CharacterMenuComponent } from './ui/header/menu/character/character';
import { DatamanagementMenuComponent } from './ui/header/menu/datamanagement/datamanagement';
import { SettingsDebugMenuComponent } from './ui/header/menu/debug/debug';
import { KeyboardShortcutsComponent } from './ui/header/menu/keyboard-shortcuts/keyboard-shortcuts';
import { MainMenuComponent } from './ui/header/menu/menu';
import { MonsterMenuComponent } from './ui/header/menu/monster/monster';
import { ScenarioMenuComponent } from './ui/header/menu/scenario/scenario';
import { SectionMenuComponent } from './ui/header/menu/section/section';
import { ServerMenuComponent } from './ui/header/menu/server/server';
import { SettingMenuComponent, SettingMenuTitleComponent } from './ui/header/menu/settings/setting/setting';
import { SettingsMenuComponent } from './ui/header/menu/settings/settings';
import { UndoDialogComponent } from './ui/header/menu/undo/dialog';
import { PartySheetComponent } from './ui/header/party/party-sheet';
import { CardRevealDirective } from './ui/helper/CardReveal';
import { EntityAnimationDirective } from './ui/helper/EntityAnimation';
import { GhsCeilPipe, GhsDurationLabelPipe, GhsFloorPipe, GhsMinZeroPipe, GhsRangePipe, GhsScenarioSearch, GhsValueSignPipe } from './ui/helper/Pipes';
import { ValueSignDirective } from './ui/helper/ValueSign';
import { AutocompleteDirective } from './ui/helper/autocomplete';
import { AutoscrollDirective, FigureAutoscrollDirective } from './ui/helper/autoscroll';
import { KeyboardShortcuts } from './ui/helper/keyboard-shortcuts';
import { GhsLabelDirective, GhsLabelElementDirective } from './ui/helper/label';
import { GhsNumberInput } from './ui/helper/number-input/number-input';
import { PointerInputDirective } from './ui/helper/pointer-input';
import { TabClickDirective } from './ui/helper/tabclick';
import { TextShrinkDirective } from './ui/helper/textshrink';
import { GhsTooltipComponent, GhsTooltipDirective } from './ui/helper/tooltip/tooltip';
import { ValueCalcDirective } from './ui/helper/valueCalc';
import { MainComponent } from './ui/main';
import { AttackModifierToolComponent } from './ui/tools/attackmodifier/attackmodifier-tool';
import { DecksToolComponent } from './ui/tools/decks/decks-tool';
import { EditorActionComponent, EditorActionDialogComponent } from './ui/tools/editor/action/action';
import { CharacterEditorComponent } from './ui/tools/editor/character/character';
import { DeckEditorComponent } from './ui/tools/editor/deck/deck';
import { EditionEditorComponent } from './ui/tools/editor/edition';
import { MonsterEditorComponent } from './ui/tools/editor/monster/monster';
import { EventCardsToolComponent } from './ui/tools/events/event-cards-tool';
import { FeedbackToolComponent } from './ui/tools/feedback/feedback';
import { FeedbackDialogComponent } from './ui/tools/feedback/feedback-dialog';
import { AttackModifierStandaloneComponent } from './ui/tools/standalone/attackmodifier-standalone';
import { LootDeckStandaloneComponent } from './ui/tools/standalone/loot-deck-standalone';
import { TreasuresToolComponent } from './ui/tools/treasures/treasures-tool';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        MainComponent,
        HeaderComponent, ElementIconComponent, ElementComponent,
        PartySheetComponent, PartySheetDialogComponent, PartyWeekDialogComponent, PartyBuildingsComponent, WorldMapComponent, ScenarioConclusionComponent, BuildingUpgradeDialog, ScenarioRequirementsComponent, TreasuresDialogComponent, PartyResourcesDialogComponent,
        MainMenuComponent, CharacterMenuComponent, MonsterMenuComponent, SettingsMenuComponent, SettingMenuComponent, SettingMenuTitleComponent, DatamanagementMenuComponent, ScenarioMenuComponent, ScenarioChartDialogComponent, ScenarioChartPopupDialog, SectionMenuComponent, ServerMenuComponent, SettingsDebugMenuComponent, UndoDialogComponent, CampaignMenuComponent,
        FooterComponent,
        LootComponent, LootDeckComponent, LootRandomItemDialogComponent, LootDeckFullscreenComponent, LootDeckDialogComponent, LootDeckStandaloneComponent, LootApplyDialogComponent,
        HintDialogComponent, ScenarioRulesComponent,
        AttackModifierComponent, AttackModifierEffectsComponent, AttackModifierDeckComponent, AttackModifierDeckDialogComponent, AttackModifierDrawComponent, AttackModifierDeckFullscreenComponent, AttackModifierStandaloneComponent,
        LevelComponent, LevelDialogComponent,
        ScenarioComponent, ScenarioDialogComponent, ScenarioSetupComponent, SectionDialogComponent, ScenarioSummaryComponent, StatsListComponent, ScenarioTreasuresDialogComponent, TreasureLabelComponent, EventEffectsDialog, EventRandomItemDialogComponent, EventRandomScenarioDialogComponent,
        ConditionsComponent, HighlightConditionsComponent, ConditionHighlightAnimationDirective, HealthbarComponent,
        EntityMenuDialogComponent, EntitiesMenuDialogComponent, AdditionalAMSelectDialogComponent,
        CharacterComponent, CharacterImageComponent, CharacterSummonDialog, CharacterInitiativeComponent, CharacterInitiativeDialogComponent, CharacterItemComponent, CharacterItemListComponent, CharacterSheetComponent, CharacterSheetDialog, AbilityCardsDialogComponent, CharacterFullViewComponent, CharacterLootCardsDialog, PerkLabelComponent, CharacterMoveResourcesDialog, CharacterRetirementDialog, ItemComponent, ItemDialogComponent, ItemsDialogComponent, ItemsCharacterDialogComponent, CharacterItemsComponent, ItemsBrewDialog, BattleGoalComponent, CharacterBattleGoalsDialog, BattleGoalSetupDialog,
        EventCardComponent, EventConditionLabelComponent, EventRewardLabelComponent,
        ObjectiveContainerComponent,
        SummonEntityComponent, SummonSheetComponent,
        StandeeComponent,
        MonsterComponent,
        MonsterImageComponent,
        MonsterAbilityCardComponent, MonsterStatsComponent,
        MonsterStatDialogComponent, MonsterStatsDialogComponent, MonsterLevelDialogComponent,
        MonsterNumberPicker, MonsterNumberPickerDialog, MonsterImageDialogComponent,
        AbilityComponent, AbiltiesDialogComponent, AbilityDialogComponent,
        ActionsComponent, ActionComponent, ActionHexComponent, ActionSummonComponent, InteractiveActionsComponent,
        FigureErrorsComponent, FigureErrorsDialogComponent, EntityIndexKeyComponent,
        CardRevealDirective, EntityAnimationDirective, GhsLabelDirective, GhsLabelElementDirective, ValueCalcDirective, PointerInputDirective, AutocompleteDirective, AutoscrollDirective, FigureAutoscrollDirective, TextShrinkDirective, ValueSignDirective,
        GhsValueSignPipe, GhsRangePipe, GhsScenarioSearch, GhsFloorPipe, GhsCeilPipe, GhsMinZeroPipe, GhsDurationLabelPipe,
        AttackModifierToolComponent, EventCardsToolComponent, TreasuresToolComponent, DecksToolComponent,
        EditionEditorComponent,
        EditorActionComponent, EditorActionDialogComponent,
        DeckEditorComponent, CharacterEditorComponent, MonsterEditorComponent,
        GhsTooltipComponent, GhsTooltipDirective, GameClockDialogComponent,
        KeyboardShortcuts, TabClickDirective, GhsNumberInput,
        FeedbackToolComponent, FeedbackDialogComponent, KeyboardShortcutsComponent],
      imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        DragDropModule,
        DialogModule,
        InViewportModule,
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: false })
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'gloomhavensecretariat'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('gloomhavensecretariat');
  });

  describe('onRightClick', () => {
    it('should return true in dev mode', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const component = fixture.componentInstance;
      spyOn(component, "isAppDevMode").and.returnValue(true);
      expect(component.onRightClick()).toEqual(true);
    });

    it('should return false in prod mode', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const component = fixture.componentInstance;
      spyOn(component, "isAppDevMode").and.returnValue(false);
      expect(component.onRightClick()).toEqual(false);
    });
  });
});
