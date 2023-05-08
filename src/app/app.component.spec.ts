import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { CharacterComponent } from './ui/figures/character/character';
import { CharacterSummonDialog } from './ui/figures/character/dialogs/summondialog';
import { ActionComponent } from './ui/figures/actions/action';
import { ActionsComponent } from './ui/figures/actions/actions';
import { ActionHexComponent } from './ui/figures/actions/area/action-hex';
import { MonsterAbilityCardComponent } from './ui/figures/monster/cards/ability-card';
import { MonsterImageComponent } from './ui/figures/monster/cards/image';
import { MonsterStatsComponent } from './ui/figures/monster/stats/stats';
import { MonsterNumberPicker } from './ui/figures/monster/dialogs/numberpicker';
import { MonsterNumberPickerDialog } from './ui/figures/monster/dialogs/numberpicker-dialog';
import { MonsterEntityComponent } from './ui/figures/monster/entity/entity';
import { MonsterComponent } from './ui/figures/monster/monster';
import { UndoDialogComponent } from './ui/header/menu/undo/dialog';
import { FooterComponent } from './ui/footer/footer';
import { LevelComponent } from './ui/footer/level/level';
import { LevelDialogComponent } from './ui/footer/level/level-dialog';
import { ElementIconComponent } from './ui/header/element/element-icon';
import { ElementComponent } from './ui/header/element/element';
import { HeaderComponent } from './ui/header/header';
import { EditionMenuComponent } from './ui/header/menu/edition/edition';
import { MainMenuComponent } from './ui/header/menu/menu';
import { SettingsMenuComponent } from './ui/header/menu/settings/settings';
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
import { CharacterSheetDialog } from './ui/figures/character/dialogs/character-sheet';
import { ScenarioComponent } from './ui/footer/scenario/scenario';
import { PartySheetComponent } from './ui/header/party/party-sheet';
import { PartySheetDialogComponent } from './ui/header/party/party-sheet-dialog';
import { MapComponent } from './ui/header/party/map/map';
import { DragClickDirective } from './ui/helper/drag';
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
import { GhsTooltipComponent, GhsTooltipDirective } from './ui/helper/tooltip/tooltip';
import { ScenarioDialogComponent } from './ui/footer/scenario/dialog/scenario-dialog';
import { ScenarioSummaryComponent } from './ui/footer/scenario/summary/scenario-summary';
import { SectionDialogComponent } from './ui/footer/scenario/section/section-dialog';
import { CharacterLootCardsDialog } from './ui/figures/character/dialogs/loot-cards';
import { PerkLabelComponent } from './ui/figures/attackmodifier/perk/label';
import { CharacterMoveResourcesDialog } from './ui/figures/character/dialogs/move-resources';
import { PartyWeekDialogComponent } from './ui/header/party/week-dialog/week-dialog';
import { CharacterItemsComponent } from './ui/figures/character/items/items';
import { PartyBuildingsComponent } from './ui/header/party/buildings/buildings';
import { ScenarioTreasuresDialogComponent } from './ui/footer/scenario/treasures/treasures-dialog';
import { TreasureLabelComponent } from './ui/footer/scenario/treasures/label/label';
import { StatsListComponent } from './ui/footer/scenario/dialog/stats-list/stats-list';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DialogModule } from '@angular/cdk/dialog';
import { ServiceWorkerModule } from '@angular/service-worker';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        MainComponent,
        HeaderComponent, ElementIconComponent, ElementComponent,
        PartySheetComponent, PartySheetDialogComponent, PartyWeekDialogComponent, PartyBuildingsComponent, MapComponent,
        MainMenuComponent, CharacterMenuComponent, EditionMenuComponent, SettingsMenuComponent, DatamanagementMenuComponent, ScenarioMenuComponent, SectionMenuComponent, ServerMenuComponent, SettingsDebugMenuComponent, UndoDialogComponent,
        FooterComponent,
        LootComponent, LootDeckComponent, LootDeckFullscreenComponent, LootDeckDialogComponent, LootDeckStandaloneComponent, LootApplyDialogComponent,
        HintDialogComponent, ScenarioRulesComponent,
        AttackModifierComponent, AttackModifierEffectsComponent, AttackModifierDeckComponent, AttackModifierDeckDialogComponent, AttackModifierDeckFullscreenComponent, AttackModifierStandaloneComponent,
        LevelComponent, LevelDialogComponent,
        ScenarioComponent, ScenarioDialogComponent, SectionDialogComponent, ScenarioSummaryComponent, StatsListComponent, ScenarioTreasuresDialogComponent, TreasureLabelComponent,
        ConditionsComponent, HighlightConditionsComponent, ConditionHighlightAnimationDirective, HealthbarComponent,
        EntityMenuDialogComponent, EntitiesMenuDialogComponent,
        CharacterComponent, CharacterImageComponent, CharacterSummonDialog, CharacterInitiativeComponent, CharacterInitiativeDialogComponent, CharacterSheetDialog, CharacterFullViewComponent, CharacterLootCardsDialog, PerkLabelComponent, CharacterMoveResourcesDialog, CharacterItemsComponent,
        ObjectiveComponent,
        SummonEntityComponent, SummonSheetComponent,
        MonsterComponent,
        MonsterEntityComponent,
        MonsterImageComponent,
        MonsterAbilityCardComponent, MonsterStatsComponent,
        MonsterStatDialogComponent, MonsterStatsDialogComponent, MonsterLevelDialogComponent,
        MonsterNumberPicker, MonsterNumberPickerDialog,
        AbilityComponent, AbiltiesDialogComponent, AbilityDialogComponent,
        ActionsComponent, ActionComponent, ActionHexComponent, ActionSummonComponent,
        FigureErrorsComponent, FigureErrorsDialogComponent,
        CardRevealDirective, EntityAnimationDirective, GhsLabelDirective, ValueCalcDirective, DragClickDirective, AutoscrollDirective, FigureAutoscrollDirective, TextShrinkDirective,
        GhsValueSignPipe, GhsRangePipe, GhsScenarioSearch, GhsFloorPipe, GhsCeilPipe,
        AttackModifierToolComponent, TreasuresToolComponent, DecksToolComponent,
        EditionEditorComponent,
        EditorActionComponent, EditorActionDialogComponent,
        DeckEditorComponent, CharacterEditorComponent, MonsterEditorComponent,
        GhsTooltipComponent, GhsTooltipDirective,
        FeedbackToolComponent, FeedbackDialogComponent],
      imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        DragDropModule,
        DialogModule,
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
