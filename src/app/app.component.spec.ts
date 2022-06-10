import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { DialogComponent } from './ui/dialog/dialog';
import { CharacterComponent } from './ui/figures/character/character';
import { ActionHexComponent, ActionComponent, ActionsComponent } from './ui/figures/actions/action';
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
import { CharacterSummonDialog } from './ui/figures/character/dialogs/summondialog';
import { SummonEntityComponent } from './ui/figures/character/summon/summon';
import { GhsSvgComponent } from './ui/helper/svg/svg';
import { CharacterImageComponent } from './ui/figures/character/cards/image';
import { DatamanagementMenuComponent } from './ui/header/menu/datamanagement/datamanagement';
import { ScenarioMenuComponent } from './ui/header/menu/scenario/scenario';
import { ServiceWorkerModule } from '@angular/service-worker';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        MainComponent,
        HeaderComponent, ElementIconComponent,
        MainMenuComponent, EditionMenuComponent, SettingsMenuComponent, DatamanagementMenuComponent, ScenarioMenuComponent,
        FooterComponent,
        AttackModifierComponent,
        LevelComponent,
        DialogComponent, PopupComponent,
        CharacterComponent, CharacterImageComponent, CharacterSummonDialog,
        SummonEntityComponent,
        MonsterComponent,
        MonsterEntityComponent,
        MonsterImageComponent,
        AbilityComponent,
        MonsterStatsComponent,
        MonsterNumberPicker,
        ActionsComponent, ActionComponent, ActionHexComponent,
        CardRevealDirective,
        GhsValueCalcPipe, GhsValueSignPipe, GhsEditionFilterPipe, GhsLabelPipe, GhsSortPipe, GhsSvgComponent
      ],
      imports: [
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
