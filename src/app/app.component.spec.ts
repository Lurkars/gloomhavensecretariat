import { TestBed } from '@angular/core/testing';

import { BrowserModule } from '@angular/platform-browser';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DialogModule } from '@angular/cdk/dialog';
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
import { UndoDialogComponent } from './ui/header/menu/undo/dialog';
import { FooterComponent } from './ui/footer/footer';
import { LevelComponent } from './ui/footer/level/level';
import { LevelDialogComponent } from './ui/footer/level/level-dialog';
import { ElementIconComponent } from './ui/header/element/element-icon';
import { ElementComponent } from './ui/header/element/element';
import { HeaderComponent } from './ui/header/header';
import { MainMenuComponent } from './ui/header/menu/menu';
import { SettingsMenuComponent } from './ui/header/menu/settings/settings';
import { CampaignMenuComponent } from './ui/header/menu/campaign/campaign';
import { CardRevealDirective } from './ui/helper/CardReveal';
import { GhsCeilPipe, GhsDurationLabelPipe, GhsFloorPipe, GhsMinZeroPipe, GhsRangePipe, GhsScenarioSearch, GhsValueSignPipe } from './ui/helper/Pipes';
import { MainComponent } from './ui/main';
import { SummonEntityComponent } from './ui/figures/character/summon/summon';
import { SummonSheetComponent } from './ui/figures/character/summon/sheet/summon-sheet';
import { CharacterImageComponent } from './ui/figures/character/cards/image';
import { DatamanagementMenuComponent } from './ui/header/menu/datamanagement/datamanagement';
import { ScenarioMenuComponent } from './ui/header/menu/scenario/scenario';
import { CharacterInitiativeComponent } from './ui/figures/character/cards/initiative';
import { CharacterInitiativeDialogComponent } from './ui/figures/character/cards/initiative-dialog';
import { ServerMenuComponent } from './ui/header/menu/server/server';
import { FigureErrorsComponent, FigureErrorsDialogComponent } from './ui/figures/errors/errors';
import { SectionMenuComponent } from './ui/header/menu/section/section';
import { ConditionsComponent } from './ui/figures/conditions/conditions';
import { ConditionHighlightAnimationDirective, HighlightConditionsComponent } from './ui/figures/conditions/highlight';
import { HealthbarComponent } from './ui/figures/healthbar/healthbar';
import { EntityAnimationDirective } from './ui/helper/EntityAnimation';
import { GhsLabelDirective, GhsLabelElementDirective } from './ui/helper/label';
import { ValueCalcDirective } from './ui/helper/valueCalc';
import { CharacterSheetDialog } from './ui/figures/character/dialogs/character-sheet-dialog';
import { ScenarioComponent } from './ui/footer/scenario/scenario';
import { PartySheetComponent } from './ui/header/party/party-sheet';
import { PartySheetDialogComponent } from './ui/figures/party/party-sheet-dialog';
import { AutocompleteDirective } from './ui/helper/autocomplete';
import { AutoscrollDirective, FigureAutoscrollDirective } from './ui/helper/autoscroll';
import { AttackModifierDeckComponent } from './ui/figures/attackmodifier/attackmodifierdeck';
import { AttackModifierComponent } from './ui/figures/attackmodifier/attackmodifier';
import { AttackModifierToolComponent } from './ui/tools/attackmodifier/attackmodifier-tool';
import { EventCardsToolComponent } from './ui/tools/events/event-cards-tool';
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
import { AttackModifierDrawComponent } from './ui/figures/attackmodifier/attackmodifier-draw';
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
import { LootRandomItemDialogComponent } from './ui/figures/loot/random-item/random-item-dialog';
import { LootDeckFullscreenComponent } from './ui/figures/loot/loot-deck-fullscreen';
import { LootComponent } from './ui/figures/loot/loot-card';
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
import { CharacterRetirementDialog } from './ui/figures/character/sheet/retirement-dialog';
import { CharacterSheetComponent } from './ui/figures/character/sheet/character-sheet';
import { PerkLabelComponent } from './ui/figures/attackmodifier/perk/label';
import { PartyWeekDialogComponent } from './ui/figures/party/week-dialog/week-dialog';
import { CharacterItemsComponent } from './ui/figures/items/items';
import { ItemsBrewDialog } from './ui/figures/items/brew/brew';
import { PartyBuildingsComponent } from './ui/figures/party/buildings/buildings';
import { ScenarioTreasuresDialogComponent } from './ui/footer/scenario/treasures/treasures-dialog';
import { TreasureLabelComponent } from './ui/footer/scenario/treasures/label/label';
import { StatsListComponent } from './ui/footer/scenario/dialog/stats-list/stats-list';
import { KeyboardShortcuts } from './ui/helper/keyboard-shortcuts';
import { ScenarioConclusionComponent } from './ui/footer/scenario/scenario-conclusion/scenario-conclusion';
import { BuildingUpgradeDialog } from './ui/figures/party/buildings/upgrade-dialog/upgrade-dialog';
import { EventEffectsDialog } from './ui/figures/character/event-effects/event-effects';
import { EventRandomItemDialogComponent } from './ui/figures/character/event-effects/random-item/random-item-dialog';
import { EventRandomScenarioDialogComponent } from './ui/figures/character/event-effects/random-scenario/random-scenario-dialog';
import { PointerInputDirective } from './ui/helper/pointer-input';
import { StandeeComponent } from './ui/figures/standee/standee';
import { BattleGoalComponent } from './ui/figures/battlegoal/battlegoal';
import { CharacterBattleGoalsDialog } from './ui/figures/battlegoal/dialog/battlegoal-dialog';
import { BattleGoalSetupDialog } from './ui/figures/battlegoal/setup/battlegoal-setup';
import { ScenarioRequirementsComponent } from './ui/figures/party/requirements/requirements';
import { WorldMapComponent } from './ui/figures/party/world-map/world-map';
import { ObjectiveContainerComponent } from './ui/figures/objective-container/objective-container';
import { ItemComponent } from './ui/figures/items/item/item';
import { ItemsDialogComponent } from './ui/figures/items/dialog/items-dialog';
import { ItemsCharacterDialogComponent } from './ui/figures/items/character/items-character-dialog';
import { ItemDialogComponent } from './ui/figures/items/dialog/item-dialog';
import { TreasuresDialogComponent } from './ui/figures/party/treasures/treasures-dialog';
import { ValueSignDirective } from './ui/helper/ValueSign';
import { AdditionalAMSelectDialogComponent } from './ui/figures/entity-menu/additional-am-select/additional-am-select';
import { EventCardComponent } from './ui/figures/event/event-card'
import { EventConditionLabelComponent } from './ui/figures/event/label/condition-label';
import { EventRewardLabelComponent } from './ui/figures/event/label/reward-label';
import { EntityIndexKeyComponent } from './ui/figures/standee/entity-index-key/entity-index-key';
import { PartyResourcesDialogComponent } from './ui/figures/party/resources/resources';
import { CharacterItemComponent } from './ui/figures/items/character/item-character';
import { CharacterItemListComponent } from './ui/figures/character/item-list/item-list';
import { SettingMenuComponent, SettingMenuTitleComponent } from './ui/header/menu/settings/setting/setting';
import { ScenarioChartDialogComponent } from './ui/header/menu/scenario/chart/scenario-chart';
import { AbilityCardsDialogComponent } from './ui/figures/character/sheet/ability-cards-dialog';
import { GameClockDialogComponent } from './ui/header/game-clock/game-clock';
import { KeyboardShortcutsComponent } from './ui/header/menu/keyboard-shortcuts/keyboard-shortcuts';
import { GhsNumberInput } from './ui/helper/number-input/number-input';
import { TabClickDirective } from './ui/helper/tabclick';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        MainComponent,
        HeaderComponent, ElementIconComponent, ElementComponent,
        PartySheetComponent, PartySheetDialogComponent, PartyWeekDialogComponent, PartyBuildingsComponent, WorldMapComponent, ScenarioConclusionComponent, BuildingUpgradeDialog, ScenarioRequirementsComponent, TreasuresDialogComponent, PartyResourcesDialogComponent,
        MainMenuComponent, CharacterMenuComponent, MonsterMenuComponent, SettingsMenuComponent, SettingMenuComponent, SettingMenuTitleComponent, DatamanagementMenuComponent, ScenarioMenuComponent, ScenarioChartDialogComponent, SectionMenuComponent, ServerMenuComponent, SettingsDebugMenuComponent, UndoDialogComponent, CampaignMenuComponent,
        FooterComponent,
        LootComponent, LootDeckComponent, LootRandomItemDialogComponent, LootDeckFullscreenComponent, LootDeckDialogComponent, LootDeckStandaloneComponent, LootApplyDialogComponent,
        HintDialogComponent, ScenarioRulesComponent,
        AttackModifierComponent, AttackModifierEffectsComponent, AttackModifierDeckComponent, AttackModifierDeckDialogComponent, AttackModifierDrawComponent, AttackModifierDeckFullscreenComponent, AttackModifierStandaloneComponent,
        LevelComponent, LevelDialogComponent,
        ScenarioComponent, ScenarioDialogComponent, SectionDialogComponent, ScenarioSummaryComponent, StatsListComponent, ScenarioTreasuresDialogComponent, TreasureLabelComponent, EventEffectsDialog, EventRandomItemDialogComponent, EventRandomScenarioDialogComponent,
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
        ActionsComponent, ActionComponent, ActionHexComponent, ActionSummonComponent,
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
