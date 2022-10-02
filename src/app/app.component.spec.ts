import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { CharacterComponent } from './ui/figures/character/character';
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
import { CharacterSummonDialog } from './ui/figures/character/dialogs/summondialog';
import { SummonEntityComponent } from './ui/figures/character/summon/summon';
import { CharacterImageComponent } from './ui/figures/character/cards/image';
import { DatamanagementMenuComponent } from './ui/header/menu/datamanagement/datamanagement';
import { ScenarioMenuComponent } from './ui/header/menu/scenario/scenario';
import { ServiceWorkerModule } from '@angular/service-worker';
import { ServerMenuComponent } from './ui/header/menu/server/server';
import { CharacterInitiativeComponent, CharacterInitiativeDialogComponent } from './ui/figures/character/cards/initiative';
import { ObjectiveComponent } from './ui/figures/objective/objective';
import { MonsterToolComponent } from './ui/tools/monster/monster';
import { MonsterActionToolComponent } from './ui/tools/monster/action/action';
import { MonsterStatToolComponent } from './ui/tools/monster/stat/stat';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ConditionHighlightAnimationDirective, ConditionsComponent, HighlightConditionsComponent } from './ui/figures/conditions/conditions';
import { FigureErrorsComponent, FigureErrorsDialogComponent } from './ui/figures/errors/errors';
import { SectionMenuComponent } from './ui/header/menu/section/section';
import { HealthbarComponent } from './ui/figures/healthbar/healthbar';
import { EntityAnimationDirective } from './ui/helper/EntityAnimation';
import { I18nDirective } from './ui/helper/i18n';
import { ValueCalcDirective } from './ui/helper/valueCalc';
import { CharacterSheetDialog } from './ui/figures/character/dialogs/character-sheet';
import { PartySheetComponent, PartySheetDialogComponent } from './ui/header/party/party-sheet';
import { DragValueComponent } from './ui/helper/dragValue/drag';
import { AttackModifierDeckComponent } from './ui/figures/attackmodifier/attackmodifierdeck';
import { AttackModifierComponent } from './ui/figures/attackmodifier/attackmodifier';
import { ScenarioComponent, ScenarioDialogComponent } from './ui/footer/scenario/scenario';
import { EntityMenuDialogComponent } from './ui/figures/entity-menu/entity-menu-dialog';
import { MonsterLevelDialogComponent } from './ui/figures/monster/dialogs/level-dialog';
import { MonsterStatsDialogComponent } from './ui/figures/monster/dialogs/stats-dialog';
import { AbilityComponent } from './ui/figures/ability/ability';
import { AbiltiesDialogComponent } from './ui/figures/ability/abilities-dialog';
import { AbilityDialogComponent } from './ui/figures/ability/ability-dialog';
import { TextShrinkDirective } from './ui/helper/textshrink';
import { AutoscrollDirective, FigureAutoscrollDirective } from './ui/helper/autoscroll';
import { AttackModifierToolComponent } from './ui/tools/attackmodifier/attackmodifier-tool';
import { DialogModule } from '@angular/cdk/dialog';
import { AttackModifierDeckDialogComponent } from './ui/figures/attackmodifier/attackmodifierdeck-dialog';
import { AttackModifierDeckFullscreenComponent } from './ui/figures/attackmodifier/attackmodifierdeck-fullscreen';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        MainComponent,
        HeaderComponent, ElementIconComponent,
        PartySheetComponent, PartySheetDialogComponent,
        MainMenuComponent, EditionMenuComponent, SettingsMenuComponent, DatamanagementMenuComponent, ScenarioMenuComponent, SectionMenuComponent, ServerMenuComponent,
        FooterComponent,
        AttackModifierComponent, HintDialogComponent, AttackModifierDeckComponent, AttackModifierDeckDialogComponent, AttackModifierDeckFullscreenComponent,
        LevelComponent, LevelDialogComponent,
        ScenarioComponent, ScenarioDialogComponent,
        ConditionsComponent, HighlightConditionsComponent, ConditionHighlightAnimationDirective, HealthbarComponent,
        EntityMenuDialogComponent,
        CharacterComponent, CharacterImageComponent, CharacterSummonDialog, CharacterInitiativeComponent, CharacterInitiativeDialogComponent, CharacterSheetDialog,
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
        AttackModifierToolComponent, MonsterToolComponent, MonsterActionToolComponent, MonsterStatToolComponent ],
      imports: [
        BrowserModule,
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

  it(`should have as title 'gloomhavensecretary'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('gloomhavensecretary');
  });

});
