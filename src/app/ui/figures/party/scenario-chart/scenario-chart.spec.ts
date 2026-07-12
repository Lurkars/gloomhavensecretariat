import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { ScenarioData, ScenarioRequirement } from 'src/app/game/model/data/ScenarioData';
import { GameScenarioModel } from 'src/app/game/model/Scenario';
import { ScenarioChartDialogComponent } from 'src/app/ui/figures/party/scenario-chart/scenario-chart';

// ScenarioChartDialogComponent's update() is a large pure function that turns edition scenario data
// into a mermaid flowchart string (node coloring by success/blocked/locked, plus unlock/link edges).
// It never touches the DOM/chart itself (that's initMap()/updateMap(), which we deliberately never
// call — they dynamic-import mermaid/leaflet and render into a #chart element that doesn't exist in
// this environment). Following the AppComponent.spec.ts pattern: create via TestBed, never call
// fixture.detectChanges(), and call update() directly to inspect component.flow/flowString.

function scenario(index: string, overrides: Partial<ScenarioData> = {}): ScenarioData {
  return Object.assign(new ScenarioData(), { edition: 'gh', index }, overrides);
}

function createComponent(edition: string = 'gh'): ScenarioChartDialogComponent {
  TestBed.configureTestingModule({
    imports: [ScenarioChartDialogComponent],
    providers: [
      { provide: DIALOG_DATA, useValue: { edition } },
      { provide: DialogRef, useValue: {} },
      { provide: Dialog, useValue: {} }
    ]
  });
  const fixture = TestBed.createComponent(ScenarioChartDialogComponent);
  return fixture.componentInstance;
}

describe('ScenarioChartDialogComponent', () => {
  beforeEach(() => {
    settingsManager.settings.editions = ['gh'];
    gameManager.game.party.campaignMode = true;
    gameManager.game.party.scenarios = [];
    gameManager.game.party.conclusions = [];
    gameManager.game.party.achievementsList = [];
    gameManager.game.party.globalAchievementsList = [];
    gameManager.game.unlockedCharacters = [];
    gameManager.editionData = [
      Object.assign(
        new EditionData('gh', [], [], [], [scenario('1', { unlocks: ['2'], blocks: ['3'] }), scenario('2'), scenario('3')], [], [])
      )
    ];
  });

  it('constructs successfully and detects the campaign mode from the current party', () => {
    gameManager.game.party.campaignMode = false;
    const component = createComponent();
    expect(component).toBeTruthy();
    expect(component.campaignMode).toBe(false);
  });

  it('flags worldMap when the edition declares one', () => {
    gameManager.editionData[0].worldMap = { width: 100, height: 100 };
    const component = createComponent();
    component.update();
    expect(component.worldMap).toBe(true);
  });

  describe('update', () => {
    it('renders an unplayed node for a scenario with no special state', () => {
      const component = createComponent();
      component.update();
      expect(component.flow.some((line) => line.includes('2((002))') && line.includes(':::unplayed'))).toBe(true);
    });

    it('renders a success node for a completed scenario', () => {
      gameManager.game.party.scenarios = [new GameScenarioModel('1', 'gh')];
      const component = createComponent();
      component.update();
      expect(component.flow.some((line) => line.includes('1((001))') && line.includes(':::success'))).toBe(true);
    });

    it('renders a blocked node for a scenario blocked by a completed predecessor', () => {
      gameManager.game.party.scenarios = [new GameScenarioModel('1', 'gh')];
      const component = createComponent();
      component.update();
      expect(component.flow.some((line) => line.includes('3((003))') && line.includes(':::blocked'))).toBe(true);
    });

    it('renders a locked node for a scenario whose requirements are unmet', () => {
      gameManager.editionData[0].scenarios.push(
        scenario('4', { requirements: [Object.assign(new ScenarioRequirement(), { party: ['secret'] })] })
      );
      const component = createComponent();
      component.update();
      expect(component.flow.some((line) => line.includes('4((004))') && line.includes(':::locked'))).toBe(true);
    });

    it('unlocks a previously-locked scenario once its requirement is met', () => {
      gameManager.editionData[0].scenarios.push(
        scenario('4', { requirements: [Object.assign(new ScenarioRequirement(), { party: ['secret'] })] })
      );
      gameManager.game.party.achievementsList = ['secret'];
      const component = createComponent();
      component.update();
      expect(component.flow.some((line) => line.includes('4((004))') && line.includes(':::unplayed'))).toBe(true);
    });

    it('draws an unlock edge from a completed scenario to what it unlocks', () => {
      gameManager.game.party.scenarios = [new GameScenarioModel('1', 'gh')];
      const component = createComponent();
      component.update();
      expect(component.flow.some((line) => line.includes('1 --- 2') || line.includes('1  --- 2'))).toBe(true);
    });

    it('outside campaign mode, ignores completion/blocking state (everything unplayed)', () => {
      gameManager.game.party.campaignMode = false;
      gameManager.game.party.scenarios = [new GameScenarioModel('1', 'gh')];
      const component = createComponent();
      component.update();
      expect(component.flow.some((line) => line.includes('1((001))') && line.includes(':::unplayed'))).toBe(true);
      expect(component.flow.some((line) => line.includes('3((003))') && line.includes(':::blocked'))).toBe(false);
    });

    it('returns true the first time and false on a no-op re-run', () => {
      const component = createComponent();
      expect(component.update()).toBe(true);
      expect(component.update()).toBe(false);
    });

    it('returns true again once the underlying party state changes the flow', () => {
      const component = createComponent();
      component.update();
      gameManager.game.party.scenarios = [new GameScenarioModel('1', 'gh')];
      expect(component.update()).toBe(true);
    });
  });

  describe('toggleCampaignMode', () => {
    it('flips campaignMode on (false -> true) and triggers an update', () => {
      const component = createComponent();
      component.campaignMode = false;
      const updateMapSpy = vi.spyOn(component, 'updateMap').mockImplementation(() => {});
      const event = { preventDefault: () => {}, stopPropagation: () => {} } as any;
      component.toggleCampaignMode(event);
      expect(component.campaignMode).toBe(true);
      expect(updateMapSpy).toHaveBeenCalled();
    });

    it('is a no-op once campaignMode is already true, without force', () => {
      const component = createComponent();
      component.campaignMode = true;
      const updateMapSpy = vi.spyOn(component, 'updateMap').mockImplementation(() => {});
      const event = { preventDefault: () => {}, stopPropagation: () => {} } as any;
      component.toggleCampaignMode(event);
      expect(component.campaignMode).toBe(true);
      expect(updateMapSpy).not.toHaveBeenCalled();
    });

    it('force flips regardless of the current state', () => {
      const component = createComponent();
      component.campaignMode = true;
      vi.spyOn(component, 'updateMap').mockImplementation(() => {});
      const event = { preventDefault: () => {}, stopPropagation: () => {} } as any;
      component.toggleCampaignMode(event, true);
      expect(component.campaignMode).toBe(false);
    });
  });
});
