import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { GameScenarioModel, Scenario } from 'src/app/game/model/Scenario';
import { ScenarioMenuComponent } from 'src/app/ui/header/menu/scenario/scenario';

// ScenarioMenuComponent's setScenario()/scenarioChart() dialog-opening branches are out of scope
// (isLocked=false, non-current scenarios only, to exercise the direct-set path instead). Following
// the AppComponent.spec.ts pattern: create via TestBed, never call fixture.detectChanges() (ngOnInit
// never runs — we call setEditions()/updateGroups() directly instead). This spec covers the
// scenarios()/maxScenario() caching+filtering pipeline, setEditions/updateGroups, setScenario's
// direct-set path, customScenario, customScenarioName, toggleCampaignMode, and hasSpoilers/notSpoiled.

function scenario(index: string, overrides: Partial<ScenarioData> = {}): ScenarioData {
  return Object.assign(new ScenarioData(), { edition: 'gh', index }, overrides);
}

function createComponent(): ScenarioMenuComponent {
  const fixture = TestBed.createComponent(ScenarioMenuComponent);
  return fixture.componentInstance;
}

describe('ScenarioMenuComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ScenarioMenuComponent] }).compileComponents();

    gameManager.game.edition = 'gh';
    gameManager.game.scenario = undefined;
    gameManager.game.party.scenarios = [];
    gameManager.game.party.conclusions = [];
    gameManager.game.party.campaignMode = false;
    gameManager.game.unlockedCharacters = [];
    gameManager.editionData = [
      Object.assign(
        new EditionData(
          'gh',
          [],
          [],
          [],
          [scenario('1', { unlocks: ['2'], blocks: ['3'], group: 'a' }), scenario('2', { group: 'b' }), scenario('3', { group: 'a' })],
          [],
          []
        )
      )
    ];
    settingsManager.settings.editions = ['gh'];
  });

  it('renders the template without throwing', () => {
    const fixture = TestBed.createComponent(ScenarioMenuComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('setEditions', () => {
    it('lists only editions that actually have scenario data', () => {
      const component = createComponent();
      component.edition = 'gh';
      component.setEditions();
      expect(component.editions).toEqual(['gh']);
    });
  });

  describe('updateGroups', () => {
    it('collects distinct sorted groups with undefined (main campaign) first', () => {
      const component = createComponent();
      component.edition = 'gh';
      component.updateGroups();
      expect(component.groups).toEqual([undefined, 'a', 'b']);
    });

    it('still derives groups from all editions when edition is unset (scenarioData("") ignores the edition filter)', () => {
      const component = createComponent();
      component.edition = '';
      component.updateGroups();
      expect(component.groups).toEqual([undefined, 'a', 'b']);
    });
  });

  describe('scenarios / maxScenario', () => {
    it('returns scenarios for the given group, marking success/blocked state', () => {
      gameManager.game.party.scenarios = [new GameScenarioModel('1', 'gh', 'a')];
      const component = createComponent();
      component.edition = 'gh';
      const results = component.scenarios('a');
      expect(results.map((s) => s.index)).toEqual(['1', '3']);
      expect(results.find((s) => s.index === '1')!.isSuccess).toBe(true);
      expect(results.find((s) => s.index === '3')!.isBlocked).toBe(true);
    });

    it('caches results for identical query parameters', () => {
      const component = createComponent();
      component.edition = 'gh';
      const first = component.scenarios('a');
      const second = component.scenarios('a');
      expect(first).toBe(second);
    });

    it('is empty without a selected edition', () => {
      const component = createComponent();
      component.edition = '';
      expect(component.scenarios('a')).toEqual([]);
    });

    it('maxScenario returns the longest scenario index length for the group', () => {
      const component = createComponent();
      component.edition = 'gh';
      expect(component.maxScenario('a')).toEqual(1);
    });
  });

  describe('setScenario', () => {
    it('sets the scenario directly when unlocked and not already current', () => {
      const component = createComponent();
      component.setScenario(scenario('2', { group: 'b' }));
      expect(gameManager.game.scenario?.index).toEqual('2');
    });

    it('is a no-op when the scenario is already current', () => {
      gameManager.game.scenario = new Scenario(scenario('2', { group: 'b' }));
      const component = createComponent();
      const before = gameManager.game.scenario;
      component.setScenario(scenario('2', { group: 'b' }));
      expect(gameManager.game.scenario).toBe(before);
    });
  });

  describe('customScenario / customScenarioName', () => {
    it('sets a custom scenario when none is active', () => {
      const component = createComponent();
      component.customScenario();
      expect(gameManager.game.scenario?.custom).toBe(true);
    });

    it('unsets the custom scenario on a second call', () => {
      const component = createComponent();
      component.customScenario();
      component.customScenario();
      expect(gameManager.game.scenario).toBeUndefined();
    });

    it('renames the active custom scenario', () => {
      const component = createComponent();
      component.customScenario();
      component.customScenarioName({ target: { value: 'My Custom Scenario' } });
      expect(gameManager.game.scenario?.name).toEqual('My Custom Scenario');
    });

    it('is a no-op renaming without an active custom scenario', () => {
      const component = createComponent();
      component.customScenarioName({ target: { value: 'ignored' } });
      expect(gameManager.game.scenario).toBeUndefined();
    });
  });

  describe('toggleCampaignMode', () => {
    it('flips party.campaignMode and clears the scenario cache', () => {
      const component = createComponent();
      component.edition = 'gh';
      component.scenarios('a');
      expect(component.scenarioCache.length).toEqual(1);
      component.toggleCampaignMode();
      expect(gameManager.game.party.campaignMode).toBe(true);
      expect(component.scenarioCache.length).toEqual(0);
    });
  });

  describe('hasSpoilers / notSpoiled', () => {
    // Both methods scan this.scenarios(group, true) (filterSuccess=true, includeSpoiler left at its
    // default false), and that same call already excludes not-yet-unlocked spoiler scenarios from
    // its result set (per the visibility guard inside scenarios()). So a spoiler scenario is never
    // present for hasSpoilers()/notSpoiled() to find, regardless of unlock state — verified here as
    // the actual, current behavior of the public API.
    it('is false/empty for a group with an unrevealed spoiler scenario, whether or not it is unlocked', () => {
      gameManager.editionData = [
        Object.assign(new EditionData('gh', [], [], [], [scenario('4', { group: 'c', spoiler: true, name: 'secret' })], [], []))
      ];
      const component = createComponent();
      component.edition = 'gh';
      expect(component.hasSpoilers('c')).toBe(false);
      expect(component.notSpoiled('c')).toEqual([]);

      gameManager.game.unlockedCharacters = ['gh:secret'];
      const unlockedComponent = createComponent();
      unlockedComponent.edition = 'gh';
      expect(unlockedComponent.hasSpoilers('c')).toBe(false);
    });

    it('is false for a group with no spoiler scenarios at all', () => {
      const component = createComponent();
      component.edition = 'gh';
      expect(component.hasSpoilers('a')).toBe(false);
      expect(component.notSpoiled('a')).toEqual([]);
    });
  });
});
