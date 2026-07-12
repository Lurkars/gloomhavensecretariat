import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/data/Action';
import { ConditionName } from 'src/app/game/model/data/Condition';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterStat } from 'src/app/game/model/data/MonsterStat';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ActionComponent } from 'src/app/ui/figures/actions/action';

// ActionComponent is the core renderer that turns an Action tree into displayed values/icons for
// characters and monsters — it's the densest piece of pure computation logic in the UI layer.
// Following the AppComponent.spec.ts pattern: create the component via TestBed but never call
// fixture.detectChanges(), so the (huge) template is never rendered and no child component needs
// to resolve; instead we set inputs via componentRef.setInput() and call component methods/
// update() directly. This spec covers the small standalone helpers plus the monster stat-based
// value calculation (getValue/getNormalValue/getEliteValue/getRange), which is the highest-value
// logic in the file. The full updateSubActions() stat-merging pipeline (hundreds of lines of
// monster-specific sub-action injection) is out of scope here — best exercised through the
// higher-level monster-rendering flows once those are covered.

function buildMonster(overrides: { normal?: Partial<MonsterStat>; elite?: Partial<MonsterStat> } = {}): Monster {
  const level = 1;
  const normalStat = Object.assign(new MonsterStat(MonsterType.normal, level, 10, 2, 3, 0), overrides.normal || {});
  const eliteStat = Object.assign(new MonsterStat(MonsterType.elite, level, 12, 2, 5, 0), overrides.elite || {});
  const monster = new Monster(
    Object.assign(new MonsterData(), { name: 'bandit-guard', edition: 'gh', stats: [normalStat, eliteStat] }),
    level
  );
  const normalEntity = new MonsterEntity(1, MonsterType.normal, monster);
  const eliteEntity = new MonsterEntity(2, MonsterType.elite, monster);
  monster.entities = [normalEntity, eliteEntity];
  return monster;
}

describe('ActionComponent', () => {
  let component: ActionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ActionComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ActionComponent);
    component = fixture.componentInstance;

    gameManager.game.figures = [];
    gameManager.game.level = 1;
    gameManager.game.round = 0;
    settingsManager.settings.calculate = true;
    settingsManager.settings.calculateStats = true;
    settingsManager.settings.fhStyle = false;
    settingsManager.settings.calculateAdvantageStats = false;
  });

  describe('isGhsSvg', () => {
    it('is true for action types with a ghs svg icon (e.g. attack)', () => {
      expect(component.isGhsSvg(ActionType.attack)).toBe(true);
    });

    it('is false for action types without one (e.g. push)', () => {
      expect(component.isGhsSvg(ActionType.push)).toBe(false);
    });
  });

  describe('getConditionName', () => {
    it('resolves the condition name via the Condition model', () => {
      expect(component.getConditionName('poison')).toEqual(ConditionName.poison);
    });
  });

  describe('getMonsterType', () => {
    it('casts a string to a MonsterType', () => {
      expect(component.getMonsterType('elite')).toEqual(MonsterType.elite);
    });
  });

  describe('subActionExists', () => {
    it('matches on type/value/valueType', () => {
      const existing = [new Action(ActionType.attack, 1, ActionValueType.plus)];
      expect(component.subActionExists(existing, new Action(ActionType.attack, 1, ActionValueType.plus))).toBe(true);
      expect(component.subActionExists(existing, new Action(ActionType.attack, 2, ActionValueType.plus))).toBe(false);
    });

    it('treats an unspecified valueType as "fixed" for comparison purposes', () => {
      const existing = [new Action(ActionType.attack, 1, ActionValueType.fixed)];
      const probe = new Action(ActionType.attack, 1);
      probe.valueType = undefined as any;
      expect(component.subActionExists(existing, probe)).toBe(true);
    });

    it('a stackable condition sub-action is never considered "already existing" (by default)', () => {
      const existing = [new Action(ActionType.condition, ConditionName.bless)];
      const probe = new Action(ActionType.condition, ConditionName.bless);
      expect(component.subActionExists(existing, probe)).toBe(false);
      expect(component.subActionExists(existing, probe, false)).toBe(true);
    });
  });

  describe('additionAttackSubAction', () => {
    it('is true for condition/target/pierce/pull/push/swing/area sub-actions', () => {
      expect(component.additionAttackSubAction(new Action(ActionType.condition, ConditionName.poison))).toBe(true);
      expect(component.additionAttackSubAction(new Action(ActionType.target, 1))).toBe(true);
      expect(component.additionAttackSubAction(new Action(ActionType.area, ''))).toBe(true);
    });

    it('is false for an unrelated action type', () => {
      expect(component.additionAttackSubAction(new Action(ActionType.move, 1))).toBe(false);
    });

    it('is true for the "advantage" custom action when calculateAdvantageStats is on', () => {
      expect(component.additionAttackSubAction(new Action(ActionType.custom, '%game.custom.advantage%'))).toBe(false);
      settingsManager.settings.calculateAdvantageStats = true;
      expect(component.additionAttackSubAction(new Action(ActionType.custom, '%game.custom.advantage%'))).toBe(true);
    });
  });

  describe('getOrigIndex', () => {
    it('finds the index of a structurally-equal sub-action in origAction.subActions', () => {
      const sub = new Action(ActionType.range, 2);
      const orig = new Action(ActionType.attack, 1, undefined, [new Action(ActionType.move, 1), sub]);
      const fixture = TestBed.createComponent(ActionComponent);
      fixture.componentRef.setInput('action', orig);
      const comp = fixture.componentInstance;
      expect(comp.getOrigIndex(new Action(ActionType.range, 2))).toEqual(1);
    });

    it('is -1 when there is no matching sub-action', () => {
      const fixture = TestBed.createComponent(ActionComponent);
      fixture.componentRef.setInput('action', new Action(ActionType.attack, 1, undefined, [new Action(ActionType.move, 1)]));
      expect(fixture.componentInstance.getOrigIndex(new Action(ActionType.range, 5))).toEqual(-1);
    });
  });

  describe('highlightAction / toggleHighlight', () => {
    it('highlightAction reflects whether the current actionIndex is in interactiveActions', () => {
      const fixture = TestBed.createComponent(ActionComponent);
      const comp = fixture.componentInstance;
      fixture.componentRef.setInput('index', '0');
      expect(comp.highlightAction()).toBe(false);
      comp.interactiveActions.set([{ action: new Action(ActionType.attack, 1), index: '0' }]);
      expect(comp.highlightAction()).toBe(true);
    });

    it('toggleHighlight is a no-op when the action is not interactively applicable', () => {
      const fixture = TestBed.createComponent(ActionComponent);
      const comp = fixture.componentInstance;
      comp.isInteractiveApplicableAction = false;
      const event = new PointerEvent('pointerdown');
      const spy = vi.spyOn(event, 'preventDefault');
      comp.toggleHighlight(event);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('hasEntities', () => {
    it('is false with no monster set (settings.calculate=true)', () => {
      expect(component.hasEntities()).toBe(false);
    });

    it('is true regardless of monster when settings.calculate is off', () => {
      settingsManager.settings.calculate = false;
      expect(component.hasEntities()).toBe(true);
    });

    it('reflects whether the monster has a living entity of the given type', async () => {
      const fixture = TestBed.createComponent(ActionComponent);
      const comp = fixture.componentInstance;
      const monster = buildMonster();
      fixture.componentRef.setInput('monster', monster);
      expect(comp.hasEntities(MonsterType.elite)).toBe(true);

      monster.entities.find((entity) => entity.type === MonsterType.elite)!.dead = true;
      expect(comp.hasEntities(MonsterType.elite)).toBe(false);
      expect(comp.hasEntities(MonsterType.normal)).toBe(true);
    });

    it('a boss monster reports "normal" entities as "boss" entities', () => {
      const fixture = TestBed.createComponent(ActionComponent);
      const comp = fixture.componentInstance;
      const monster = buildMonster();
      monster.boss = true;
      monster.entities = [new MonsterEntity(1, MonsterType.boss, monster)];
      fixture.componentRef.setInput('monster', monster);
      expect(comp.hasEntities(MonsterType.normal)).toBe(true);
    });
  });

  describe('value calculation (getValue via getNormalValue/getEliteValue, getRange/getEliteRange)', () => {
    it('a flat attack action reports the monster stat attack plus the action value', () => {
      const fixture = TestBed.createComponent(ActionComponent);
      const comp = fixture.componentInstance;
      const monster = buildMonster({ normal: { attack: 3 }, elite: { attack: 5 } });
      fixture.componentRef.setInput('monster', monster);
      fixture.componentRef.setInput('action', new Action(ActionType.attack, 1, ActionValueType.plus));
      comp.update();
      expect(comp.normalValue).toEqual(4);
      expect(comp.eliteValue).toEqual(6);
    });

    it('a "minus" attack action subtracts from the stat, capped in display as "-" at 0', () => {
      const fixture = TestBed.createComponent(ActionComponent);
      const comp = fixture.componentInstance;
      const monster = buildMonster({ normal: { attack: 0 } });
      fixture.componentRef.setInput('monster', monster);
      fixture.componentRef.setInput('action', new Action(ActionType.attack, 1, ActionValueType.minus));
      comp.update();
      expect(comp.normalValue).toEqual('-');
    });

    it('getRange/getEliteRange read the monster stat range through valueCalc', () => {
      const fixture = TestBed.createComponent(ActionComponent);
      const comp = fixture.componentInstance;
      const monster = buildMonster({ normal: { range: 3 }, elite: { range: 4 } });
      fixture.componentRef.setInput('monster', monster);
      comp.update();
      expect(comp.getRange()).toEqual(3);
      expect(comp.getEliteRange()).toEqual(4);
    });

    it('getEliteRange falls back to the normal range when there is no living elite entity', () => {
      const fixture = TestBed.createComponent(ActionComponent);
      const comp = fixture.componentInstance;
      const monster = buildMonster({ normal: { range: 3 }, elite: { range: 4 } });
      monster.entities.find((entity) => entity.type === MonsterType.elite)!.dead = true;
      fixture.componentRef.setInput('monster', monster);
      comp.update();
      expect(comp.getEliteRange()).toEqual(3);
    });

    it('relative mode reports the raw action value instead of the calculated stat value', () => {
      const fixture = TestBed.createComponent(ActionComponent);
      const comp = fixture.componentInstance;
      const monster = buildMonster({ normal: { attack: 3 } });
      fixture.componentRef.setInput('monster', monster);
      fixture.componentRef.setInput('action', new Action(ActionType.attack, 1, ActionValueType.plus));
      fixture.componentRef.setInput('relative', true);
      comp.update();
      expect(comp.normalValue).toEqual('+ 1');
    });

    it('without a monster, falls back to the plain action value', () => {
      const fixture = TestBed.createComponent(ActionComponent);
      const comp = fixture.componentInstance;
      fixture.componentRef.setInput('action', new Action(ActionType.heal, 3, ActionValueType.plus));
      comp.update();
      expect(comp.normalValue).toEqual('+ 3');
    });
  });
});
