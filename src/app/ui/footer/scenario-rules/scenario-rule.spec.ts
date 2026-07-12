import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import {
  RandomDungeonRule,
  ScenarioFigureRule,
  ScenarioFigureRuleIdentifier,
  ScenarioRule,
  ScenarioRuleIdentifier
} from 'src/app/game/model/data/ScenarioRule';
import { Scenario } from 'src/app/game/model/Scenario';
import { ScenarioRuleComponent } from 'src/app/ui/footer/scenario-rules/scenario-rule';

// ScenarioRuleComponent renders a single active scenario rule. Following the AppComponent.spec.ts
// pattern: create via TestBed and set the required rule/identifier inputs via setInput() — but here
// we DO call fixture.detectChanges()-equivalent manually only by invoking ngOnInit() directly (it
// has no DOM/child-component dependencies, just a figures array normalization), keeping the same
// "never render the template" discipline as elsewhere. This spec covers ngOnInit's figure-rule value
// stringification, the randomDungeon label helpers (shared logic with ScenarioRulesComponent, tested
// there against the same fixtures), prevent(), and figureNamesByIdenfifier(); sections()/rooms()/
// figureRules()/figureNames() pull in scenarioRulesManager.getScenarioForRule and are out of scope.

function createComponent(rule: ScenarioRule, identifier: ScenarioRuleIdentifier = new ScenarioRuleIdentifier()): ScenarioRuleComponent {
  const fixture = TestBed.createComponent(ScenarioRuleComponent);
  fixture.componentRef.setInput('rule', rule);
  fixture.componentRef.setInput('identifier', identifier);
  return fixture.componentInstance;
}

describe('ScenarioRuleComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ScenarioRuleComponent] }).compileComponents();

    gameManager.game.figures = [];
    gameManager.game.scenario = undefined;
    gameManager.editionData = [];
    settingsManager.settings.editions = ['gh'];
  });

  describe('ngOnInit', () => {
    it('stringifies numeric figure rule values', () => {
      const rule = Object.assign(new ScenarioRule(''), {
        figures: [Object.assign(new ScenarioFigureRule(), { value: 5 as any })]
      });
      const component = createComponent(rule);
      component.ngOnInit();
      expect(rule.figures[0].value).toEqual('5');
    });

    it('leaves an empty figure rule value untouched', () => {
      const rule = Object.assign(new ScenarioRule(''), {
        figures: [Object.assign(new ScenarioFigureRule(), { value: '' })]
      });
      const component = createComponent(rule);
      component.ngOnInit();
      expect(rule.figures[0].value).toEqual('');
    });
  });

  describe('randomDungeonsMonsterLabel / randomDungeonsDungeonLabel', () => {
    it('is empty with no randomDungeon data', () => {
      const component = createComponent(new ScenarioRule(''));
      expect(component.randomDungeonsMonsterLabel(new ScenarioRule(''))).toEqual([]);
      expect(component.randomDungeonsDungeonLabel()).toEqual([]);
    });

    it('falls back to the raw card id when no matching section is found', () => {
      gameManager.game.scenario = new Scenario(Object.assign(new ScenarioData(), { edition: 'gh', index: '1' }));
      const rule = Object.assign(new ScenarioRule(''), {
        randomDungeon: Object.assign(new RandomDungeonRule(), { monsterCards: ['m1'], dungeonCards: ['d1'] })
      });
      const component = createComponent(rule);
      expect(component.randomDungeonsMonsterLabel(rule)).toEqual(['&nbspm1']);
      expect(component.randomDungeonsDungeonLabel()).toEqual(['&nbspd1']);
    });

    it('resolves a labeled title when a matching randomDungeonCard section exists', () => {
      const section = Object.assign(new ScenarioData(), { edition: 'gh', index: 'd1', group: 'randomDungeonCard' });
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [section], []))];
      gameManager.game.scenario = new Scenario(Object.assign(new ScenarioData(), { edition: 'gh', index: '1' }));
      const rule = Object.assign(new ScenarioRule(''), {
        randomDungeon: Object.assign(new RandomDungeonRule(), { dungeonCards: ['d1'] })
      });
      const component = createComponent(rule);
      expect(component.randomDungeonsDungeonLabel()[0]).toContain('#d1');
    });
  });

  describe('prevent', () => {
    it('stops propagation and default behavior', () => {
      const component = createComponent(new ScenarioRule(''));
      let prevented = false;
      let stopped = false;
      component.prevent({ preventDefault: () => (prevented = true), stopPropagation: () => (stopped = true) });
      expect(prevented).toBe(true);
      expect(stopped).toBe(true);
    });
  });

  describe('figureNamesByIdenfifier', () => {
    it('lists character names for a matching identifier', () => {
      const data = Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] });
      const character = new Character(data, 1);
      gameManager.game.figures = [character];
      const component = createComponent(new ScenarioRule(''));
      const identifier = Object.assign(new ScenarioFigureRuleIdentifier('brute', 'gh', 'character'));
      expect(component.figureNamesByIdenfifier(identifier).length).toBeGreaterThan(0);
    });

    it('is empty when no figures match the identifier', () => {
      gameManager.game.figures = [];
      const component = createComponent(new ScenarioRule(''));
      const identifier = Object.assign(new ScenarioFigureRuleIdentifier('brute', 'gh', 'character'));
      expect(component.figureNamesByIdenfifier(identifier)).toEqual('');
    });
  });
});
