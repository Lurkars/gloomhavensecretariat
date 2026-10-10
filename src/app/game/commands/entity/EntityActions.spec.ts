import { gameManager } from 'src/app/game/businesslogic/GameManager';
import {
  createTestCharacter,
  createTestMonster,
  createTestMonsterEntity,
  createTestSummon,
  resetTestGame
} from 'src/app/game/commands/commandsTestHelpers';
import { EntityAttackModifierCommand } from 'src/app/game/commands/entity/EntityAttackModifier';
import { EntityExtraActionRemoveCommand } from 'src/app/game/commands/entity/EntityExtraActionRemove';
import { EntityExtraActionResolveCommand } from 'src/app/game/commands/entity/EntityExtraActionResolve';
import { EntitySpecialActionCommand } from 'src/app/game/commands/entity/EntitySpecialAction';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { CharacterSpecialAction } from 'src/app/game/model/data/CharacterStat';

describe('Entity action commands', () => {
  beforeEach(() => {
    resetTestGame();
  });

  describe('EntityExtraActionRemoveCommand', () => {
    it('removes an extra action by type and value', () => {
      const character = createTestCharacter(1);
      character.extraActions = [new Action(ActionType.shield, 1), new Action(ActionType.retaliate, 2)];
      expect(new EntityExtraActionRemoveCommand(1, '', ActionType.shield, 2).validParameters(1, '', ActionType.shield, 2)).toBe(false);
      new EntityExtraActionRemoveCommand(1, '', ActionType.shield, 1).execute();
      expect(character.extraActions.map((action) => action.type)).toEqual([ActionType.retaliate]);
    });

    it('removes a persistent extra action', () => {
      const character = createTestCharacter(1);
      character.extraActionsPersistent = [new Action(ActionType.shield, 1)];
      new EntityExtraActionRemoveCommand(1, '', ActionType.shield, '1', true).execute();
      expect(character.extraActionsPersistent).toEqual([]);
    });
  });

  describe('EntityExtraActionResolveCommand', () => {
    it('accepts an extra action by adding its sub actions', () => {
      const character = createTestCharacter(1);
      character.extraActions = [new Action(ActionType.extra, 0, undefined, [new Action(ActionType.shield, 2)])];
      new EntityExtraActionResolveCommand(1, '', 0, true).execute();
      expect(character.extraActions.map((action) => action.type)).toEqual([ActionType.shield]);
    });

    it('declines an extra action by removing it', () => {
      const character = createTestCharacter(1);
      character.extraActions = [new Action(ActionType.extra, 0, undefined, [new Action(ActionType.shield, 2)])];
      new EntityExtraActionResolveCommand(1, '', 0, false).execute();
      expect(character.extraActions).toEqual([]);
    });

    it('only resolves extra actions', () => {
      const character = createTestCharacter(1);
      character.extraActions = [new Action(ActionType.shield, 2)];
      expect(new EntityExtraActionResolveCommand(1, '', 2, true).validParameters(1, '', 2, true)).toBe(false);
    });
  });

  describe('EntitySpecialActionCommand', () => {
    it('adds and removes a special action tag of a character', () => {
      const character = createTestCharacter(1);
      character.specialActions = [new CharacterSpecialAction('test-action', 0, false, false, false, false, undefined, 'manual')];
      new EntitySpecialActionCommand(1, '', 'test-action', true).execute();
      new EntitySpecialActionCommand(1, '', 'test-action', true).execute();
      expect(character.tags).toEqual(['test-action']);
      new EntitySpecialActionCommand(1, '', 'test-action', false).execute();
      expect(character.tags).toEqual([]);
    });

    it('distinguishes character and summon special actions', () => {
      const character = createTestCharacter(1);
      const summon = createTestSummon(character);
      character.specialActions = [new CharacterSpecialAction('summon-action', 0, false, false, false, true, undefined, 'manual')];
      expect(new EntitySpecialActionCommand(1, '', 'summon-action', true).validParameters(1, '', 'summon-action', true)).toBe(false);
      expect(
        new EntitySpecialActionCommand(1, summon.uuid, 'summon-action', true).validParameters(1, summon.uuid, 'summon-action', true)
      ).toBe(true);
    });
  });

  describe('EntityAttackModifierCommand', () => {
    it('adds bless cards to the deck of the figure', () => {
      const character = createTestCharacter(1);
      const before = character.attackModifierDeck.cards.length;
      new EntityAttackModifierCommand(1, '', AttackModifierType.bless, 2, 1).execute();
      expect(character.attackModifierDeck.cards.filter((am) => am.type === AttackModifierType.bless).length).toBe(2);
      expect(character.attackModifierDeck.cards.length).toBe(before + 2);
    });

    it('removes upcoming curse cards from the monster deck', () => {
      const monster = createTestMonster();
      createTestMonsterEntity(monster, 1);
      new EntityAttackModifierCommand('test-testmonster', 1, AttackModifierType.curse, 2, 1).execute();
      expect(gameManager.game.monsterAttackModifierDeck.cards.filter((am) => am.type === AttackModifierType.curse).length).toBe(2);
      new EntityAttackModifierCommand('test-testmonster', 1, AttackModifierType.curse, -1, 1).execute();
      expect(gameManager.game.monsterAttackModifierDeck.cards.filter((am) => am.type === AttackModifierType.curse).length).toBe(1);
    });

    it('requires a providing character for adding empower', () => {
      createTestCharacter(1);
      expect(
        new EntityAttackModifierCommand(1, '', AttackModifierType.empower, 1, 1).validParameters(1, '', AttackModifierType.empower, 1, 1)
      ).toBe(false);
      expect(
        new EntityAttackModifierCommand(1, '', AttackModifierType.empower, -1, 1).validParameters(1, '', AttackModifierType.empower, -1, 1)
      ).toBe(true);
    });
  });
});
