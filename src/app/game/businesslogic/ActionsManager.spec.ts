import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Action, ActionSpecialTarget, ActionType, ActionValueType } from 'src/app/game/model/data/Action';
import { Element, ElementModel, ElementState } from 'src/app/game/model/data/Element';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';

function buildMonsterEntity(type: MonsterType): MonsterEntity {
  const monster = new Monster(Object.assign(new MonsterData(), { name: 'bandit-guard', edition: 'gh' }), 1);
  return new MonsterEntity(1, type, monster);
}

// ActionsManager also covers calcActionHints()/calcMonsterActionHints()/applyInteractiveAction()
// (deep stateful flows pulling in monsterManager/entityManager/objectiveManager). This spec
// sticks to the small, clearly-scoped pure/near-pure helpers.

describe('ActionsManager', () => {
  const actionsManager = gameManager.actionsManager;

  beforeEach(() => {
    gameManager.game.figures = [];
    gameManager.game.elementBoard = [new ElementModel(Element.fire), new ElementModel(Element.ice)];
  });

  describe('getValues', () => {
    it('splits a colon-separated string value', () => {
      expect(actionsManager.getValues(new Action(ActionType.element, 'fire:ice'))).toEqual(['fire', 'ice']);
    });

    it('is [] for a numeric value', () => {
      expect(actionsManager.getValues(new Action(ActionType.attack, 2))).toEqual([]);
    });

    it('is [] for an empty value', () => {
      expect(actionsManager.getValues(new Action(ActionType.attack, ''))).toEqual([]);
    });
  });

  describe('roundTag', () => {
    it('builds a tag from the action type, without an index prefix', () => {
      expect(actionsManager.roundTag(new Action(ActionType.shield, 1), '')).toEqual('roundAction-shield');
    });

    it('prefixes the tag with the index when given', () => {
      expect(actionsManager.roundTag(new Action(ActionType.shield, 1), '2-0')).toEqual('roundAction-2-0-shield');
    });
  });

  describe('isMultiTargetSpecial', () => {
    it('is true for special-target values known to hit multiple targets', () => {
      expect(actionsManager.isMultiTargetSpecial(new Action(ActionType.specialTarget, ActionSpecialTarget.allies))).toBe(true);
    });

    it('is false for a "self"-only special target', () => {
      expect(actionsManager.isMultiTargetSpecial(new Action(ActionType.specialTarget, 'self'))).toBe(false);
    });

    it('is false for non-specialTarget actions', () => {
      expect(actionsManager.isMultiTargetSpecial(new Action(ActionType.attack, 1))).toBe(false);
    });
  });

  describe('isMultiTarget / hasMultiTarget', () => {
    it('is true for target actions with value > 1', () => {
      expect(actionsManager.isMultiTarget(new Action(ActionType.target, 2))).toBe(true);
    });

    it('is false for target actions with value 1', () => {
      expect(actionsManager.isMultiTarget(new Action(ActionType.target, 1))).toBe(false);
    });

    it('is true for area actions when includeHex is true, false when includeHex is false', () => {
      const action = new Action(ActionType.area, '(0,0,target)');
      expect(actionsManager.isMultiTarget(action, true)).toBe(true);
      expect(actionsManager.isMultiTarget(action, false)).toBe(false);
    });

    it('is true when the multiTarget flag is set directly', () => {
      const action = Object.assign(new Action(ActionType.attack, 1), { multiTarget: true });
      expect(actionsManager.isMultiTarget(action)).toBe(true);
    });

    it('recurses into subActions', () => {
      const nested = new Action(ActionType.target, 3);
      const parent = new Action(ActionType.attack, 1, undefined, [nested]);
      expect(actionsManager.isMultiTarget(parent)).toBe(true);
    });

    it('hasMultiTarget checks the action itself and its subActions via isMultiTarget(subAction, true)', () => {
      const nestedArea = new Action(ActionType.area, '(0,0,target)');
      const parent = new Action(ActionType.attack, 1, undefined, [nestedArea]);
      expect(actionsManager.hasMultiTarget(parent)).toBe(true);
    });
  });

  describe('copyAction', () => {
    it('deep-copies an action including nested subActions', () => {
      const sub = new Action(ActionType.range, 2);
      const original = new Action(ActionType.attack, 1, undefined, [sub]);
      const copy = actionsManager.copyAction(original);

      expect(copy).not.toBe(original);
      expect(copy.subActions[0]).not.toBe(sub);
      expect(copy.type).toEqual(ActionType.attack);
      expect(copy.value).toEqual(1);
      expect(copy.subActions[0].type).toEqual(ActionType.range);
      expect(copy.subActions[0].value).toEqual(2);
    });
  });

  describe('extraActionLabel', () => {
    it('renders the action type and value', () => {
      expect(actionsManager.extraActionLabel(new Action(ActionType.retaliate, 2))).toEqual('%game.action.retaliate% 2');
    });

    it('appends a range suffix when the first subAction is a range > 1', () => {
      const action = new Action(ActionType.retaliate, 2, undefined, [new Action(ActionType.range, 3)]);
      expect(actionsManager.extraActionLabel(action)).toEqual('%game.action.retaliate% 2 %game.action.range% 3');
    });

    it('omits the range suffix when the range is 1', () => {
      const action = new Action(ActionType.retaliate, 2, undefined, [new Action(ActionType.range, 1)]);
      expect(actionsManager.extraActionLabel(action)).toEqual('%game.action.retaliate% 2');
    });
  });

  describe('subactionsMonsterType', () => {
    it('matches when the action targets the entity monster type', () => {
      const entity = buildMonsterEntity(MonsterType.elite);
      const action = new Action(ActionType.monsterType, MonsterType.elite);
      expect(actionsManager.subactionsMonsterType(action, entity)).toBe(true);
    });

    it('is false for a different monster type', () => {
      const entity = buildMonsterEntity(MonsterType.normal);
      const action = new Action(ActionType.monsterType, MonsterType.elite);
      expect(actionsManager.subactionsMonsterType(action, entity)).toBe(false);
    });
  });

  describe('isInteractiveAction', () => {
    function selfTarget(): Action {
      return new Action(ActionType.specialTarget, 'self');
    }

    it('heal is interactive only with a "self" sub-target (optionally plus conditions)', () => {
      const withSelf = new Action(ActionType.heal, 1, undefined, [selfTarget()]);
      expect(actionsManager.isInteractiveAction(withSelf)).toBe(true);

      const withoutSelf = new Action(ActionType.heal, 1);
      expect(actionsManager.isInteractiveAction(withoutSelf)).toBe(false);
    });

    it('condition is interactive only with exactly one "self" sub-target', () => {
      const action = new Action(ActionType.condition, 'poison', undefined, [selfTarget()]);
      expect(actionsManager.isInteractiveAction(action)).toBe(true);

      const noSub = new Action(ActionType.condition, 'poison');
      expect(actionsManager.isInteractiveAction(noSub)).toBe(false);
    });

    it('sufferDamage is interactive with no subActions or with a lone "self" sub-target', () => {
      expect(actionsManager.isInteractiveAction(new Action(ActionType.sufferDamage, 1))).toBe(true);
      expect(actionsManager.isInteractiveAction(new Action(ActionType.sufferDamage, 1, undefined, [selfTarget()]))).toBe(true);
    });

    it('switchType and element are always interactive', () => {
      expect(actionsManager.isInteractiveAction(new Action(ActionType.switchType, 1))).toBe(true);
      expect(actionsManager.isInteractiveAction(new Action(ActionType.element, 'fire'))).toBe(true);
    });

    it('is false for action types without special-casing (e.g. move)', () => {
      expect(actionsManager.isInteractiveAction(new Action(ActionType.move, 1))).toBe(false);
    });

    it('spawn/summon is interactive only when it carries monsterStandee/objectiveSpawn data', () => {
      const noSpawnData = new Action(ActionType.spawn, 'somethingElse');
      expect(actionsManager.isInteractiveAction(noSpawnData)).toBe(false);

      const withSpawnData = Object.assign(new Action(ActionType.spawn, 'monsterStandee'), {
        valueObject: [{ monster: { name: 'bandit-guard', type: MonsterType.normal } }]
      });
      expect(actionsManager.isInteractiveAction(withSpawnData)).toBe(true);
    });
  });

  describe('getMonsterSpawnData', () => {
    it('is [] for non-spawn/summon actions', () => {
      expect(actionsManager.getMonsterSpawnData(new Action(ActionType.attack, 1))).toEqual([]);
    });

    it('is [] when value is not "monsterStandee"', () => {
      expect(actionsManager.getMonsterSpawnData(new Action(ActionType.spawn, 'objectiveSpawn'))).toEqual([]);
    });

    it('parses monsterStandee spawn entries that already specify a type', () => {
      const action = Object.assign(new Action(ActionType.spawn, 'monsterStandee'), {
        valueObject: [{ monster: { name: 'bandit-guard', type: MonsterType.elite } }]
      });
      const result = actionsManager.getMonsterSpawnData(action);
      expect(result.length).toEqual(1);
      expect(result[0].monster.type).toEqual(MonsterType.elite);
    });
  });

  describe('getObjectiveSpawnData', () => {
    it('is [] for non-spawn/summon actions', () => {
      expect(actionsManager.getObjectiveSpawnData(new Action(ActionType.attack, 1))).toEqual([]);
    });

    it('parses objectiveSpawn entries, keeping unset counts but dropping expressions that evaluate to 0', () => {
      const action = Object.assign(new Action(ActionType.spawn, 'objectiveSpawn'), {
        valueObject: [
          { objective: { name: 'crystal' }, count: 1 },
          { objective: { name: 'unset' } },
          { objective: { name: 'gone' }, count: '0' }
        ]
      });
      const result = actionsManager.getObjectiveSpawnData(action);
      expect(result.map((spawn) => spawn.objective.name)).toEqual(['crystal', 'unset']);
    });
  });

  describe('getElementsToConsume', () => {
    it('resolves named elements that are currently consumable', () => {
      gameManager.game.elementBoard = [
        Object.assign(new ElementModel(Element.fire), { state: ElementState.strong }),
        Object.assign(new ElementModel(Element.ice), { state: ElementState.inert })
      ];
      const action = new Action(ActionType.element, 'fire', ActionValueType.minus);
      const result = actionsManager.getElementsToConsume(action);
      expect(result.map((element) => element.type)).toEqual([Element.fire]);
    });

    it('does not resolve elements that are inert/new/consumed', () => {
      gameManager.game.elementBoard = [Object.assign(new ElementModel(Element.fire), { state: ElementState.inert })];
      const action = new Action(ActionType.element, 'fire', ActionValueType.minus);
      expect(actionsManager.getElementsToConsume(action)).toEqual([]);
    });
  });
});
