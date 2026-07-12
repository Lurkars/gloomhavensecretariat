import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { RandomDungeonRule, ScenarioFigureRule, ScenarioRule } from 'src/app/game/model/data/ScenarioRule';
import { Scenario } from 'src/app/game/model/Scenario';
import { ScenarioRulesComponent } from 'src/app/ui/footer/scenario-rules/scenario-rules';

// ScenarioRulesComponent's constructor only registers a uiChangeEffect() (confirmed elsewhere not to
// run synchronously in tests), so it's cheaply constructible. Following the AppComponent.spec.ts
// pattern: create via TestBed, never call fixture.detectChanges(), and call methods directly. This
// spec covers apply() (a pure boolean OR over rule fields — the highest-value logic in the file) and
// the randomDungeon label helpers; sections()/rooms()/visible()/figureRules()/applyRule() pull in
// several other managers (scenarioRulesManager.getScenarioForRule, entityManager, roundManager) and
// are out of scope here.

function createComponent(): ScenarioRulesComponent {
  const fixture = TestBed.createComponent(ScenarioRulesComponent);
  return fixture.componentInstance;
}

describe('ScenarioRulesComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ScenarioRulesComponent] }).compileComponents();

    gameManager.game.scenario = undefined;
    gameManager.game.scenarioRules = [];
    gameManager.editionData = [];
    settingsManager.settings.editions = ['gh'];
    settingsManager.settings.scenarioRooms = true;
  });

  it('renders the template without throwing', () => {
    const fixture = TestBed.createComponent(ScenarioRulesComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('update', () => {
    it('copies the current game scenarioRules into a fresh array', () => {
      const entry = { identifier: { edition: 'gh', scenario: '1', index: 0, section: false }, rule: new ScenarioRule('') } as any;
      gameManager.game.scenarioRules = [entry];
      const component = createComponent();
      component.update();
      expect(component.scenarioRules).toEqual([entry]);
      expect(component.scenarioRules).not.toBe(gameManager.game.scenarioRules);
    });
  });

  describe('apply', () => {
    it('is false for a rule with no applicable fields', () => {
      const component = createComponent();
      expect(component.apply(new ScenarioRule(''))).toBe(false);
    });

    it('is true once finish is set', () => {
      const component = createComponent();
      const rule = Object.assign(new ScenarioRule(''), { finish: 'won' });
      expect(component.apply(rule)).toBe(true);
    });

    it('is true once sections are present', () => {
      const component = createComponent();
      const rule = Object.assign(new ScenarioRule(''), { sections: ['s1'] });
      expect(component.apply(rule)).toBe(true);
    });

    it('is true for rooms only when scenarioRooms setting is enabled', () => {
      const component = createComponent();
      const rule = Object.assign(new ScenarioRule(''), { rooms: [1] });
      expect(component.apply(rule)).toBe(true);
      settingsManager.settings.scenarioRooms = false;
      expect(component.apply(rule)).toBe(false);
    });

    it('is true for elements or reverseInitiative or randomDungeon', () => {
      const component = createComponent();
      expect(component.apply(Object.assign(new ScenarioRule(''), { elements: [{ type: 'fire', state: 'strong' }] }))).toBe(true);
      expect(component.apply(Object.assign(new ScenarioRule(''), { reverseInitiative: true }))).toBe(true);
      expect(component.apply(Object.assign(new ScenarioRule(''), { randomDungeon: new RandomDungeonRule() }))).toBe(true);
    });

    it('is true once statEffects are present', () => {
      const component = createComponent();
      const rule = Object.assign(new ScenarioRule(''), { statEffects: [{ type: 'health', value: 1 }] });
      expect(component.apply(rule)).toBe(true);
    });

    it('is true for a non-hidden figure rule type but false when only hidden types are present', () => {
      const component = createComponent();
      const hiddenOnly = Object.assign(new ScenarioRule(''), {
        figures: [Object.assign(new ScenarioFigureRule(), { type: 'present' })]
      });
      expect(component.apply(hiddenOnly)).toBe(false);

      const visibleRule = Object.assign(new ScenarioRule(''), {
        figures: [Object.assign(new ScenarioFigureRule(), { type: 'gainCondition' })]
      });
      expect(component.apply(visibleRule)).toBe(true);
    });
  });

  describe('prevent', () => {
    it('stops propagation and default behavior', () => {
      const component = createComponent();
      let prevented = false;
      let stopped = false;
      component.prevent({
        preventDefault: () => (prevented = true),
        stopPropagation: () => (stopped = true)
      });
      expect(prevented).toBe(true);
      expect(stopped).toBe(true);
    });
  });

  describe('randomDungeonsMonsterLabel / randomDungeonsDungeonLabel', () => {
    it('is empty with no randomDungeon data', () => {
      const component = createComponent();
      expect(component.randomDungeonsMonsterLabel(new ScenarioRule(''))).toEqual([]);
      expect(component.randomDungeonsDungeonLabel(new ScenarioRule(''))).toEqual([]);
    });

    it('falls back to the raw card id when no matching section is found', () => {
      const component = createComponent();
      gameManager.game.scenario = new Scenario(Object.assign(new ScenarioData(), { edition: 'gh', index: '1' }));
      const rule = Object.assign(new ScenarioRule(''), {
        randomDungeon: Object.assign(new RandomDungeonRule(), { monsterCards: ['m1'], dungeonCards: ['d1'] })
      });
      expect(component.randomDungeonsMonsterLabel(rule)).toEqual(['&nbspm1']);
      expect(component.randomDungeonsDungeonLabel(rule)).toEqual(['&nbspd1']);
    });

    it('excludes card ids already present in additionalSections', () => {
      const component = createComponent();
      gameManager.game.scenario = new Scenario(Object.assign(new ScenarioData(), { edition: 'gh', index: '1' }), [], ['m1']);
      const rule = Object.assign(new ScenarioRule(''), {
        randomDungeon: Object.assign(new RandomDungeonRule(), { monsterCards: ['m1', 'm2'] })
      });
      expect(component.randomDungeonsMonsterLabel(rule)).toEqual(['&nbspm2']);
    });

    it('resolves a labeled title when a matching randomMonsterCard section exists', () => {
      const component = createComponent();
      const section = Object.assign(new ScenarioData(), { edition: 'gh', index: 'm1', group: 'randomMonsterCard' });
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [section], []))];
      gameManager.game.scenario = new Scenario(Object.assign(new ScenarioData(), { edition: 'gh', index: '1' }));
      const rule = Object.assign(new ScenarioRule(''), {
        randomDungeon: Object.assign(new RandomDungeonRule(), { monsterCards: ['m1'] })
      });
      expect(component.randomDungeonsMonsterLabel(rule)[0]).toContain('#m1');
    });
  });
});
