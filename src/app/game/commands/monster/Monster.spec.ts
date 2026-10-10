import { gameManager } from 'src/app/game/businesslogic/GameManager';
import {
  createTestCharacter,
  createTestEdition,
  createTestMonster,
  createTestMonsterEntity,
  resetTestGame
} from 'src/app/game/commands/commandsTestHelpers';
import {
  MonsterAbilityDrawExtraCommand,
  MonsterAbilityMoveCommand,
  MonsterAbilityRemoveCommand,
  MonsterAbilityRevealedCommand,
  MonsterAbilityShuffleCommand
} from 'src/app/game/commands/monster/MonsterAbility';
import { MonsterAddCommand } from 'src/app/game/commands/monster/MonsterAdd';
import { MonsterCatchCommand } from 'src/app/game/commands/monster/MonsterCatch';
import { MonsterEntityAddCommand } from 'src/app/game/commands/monster/MonsterEntityAdd';
import { MonsterLevelCommand } from 'src/app/game/commands/monster/MonsterLevel';
import { MonsterRemoveAllCommand, MonsterRemoveCommand } from 'src/app/game/commands/monster/MonsterRemove';
import { MonsterAlliedCommand, MonsterAllyCommand, MonsterDormantCommand } from 'src/app/game/commands/monster/MonsterToggle';
import { AdditionalIdentifier } from 'src/app/game/model/data/Identifier';
import { ItemFlags } from 'src/app/game/model/data/ItemData';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterType } from 'src/app/game/model/data/MonsterType';

describe('Monster commands', () => {
  beforeEach(() => {
    resetTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('MonsterAddCommand', () => {
    it('adds a monster of the edition and tags it as added manually', () => {
      createTestEdition({ monsters: [Object.assign(new MonsterData(), { name: 'bandit', edition: 'test' })] });
      expect(new MonsterAddCommand('test', 'unknown', 1).validParameters('test', 'unknown', 1)).toBe(false);
      const addMonster = vi.spyOn(gameManager.monsterManager, 'addMonster');
      new MonsterAddCommand('test', 'bandit', 1).execute();
      expect(addMonster).toHaveBeenCalled();
      expect(addMonster.mock.results[0].value.tags).toContain('addedManually');
    });
  });

  describe('MonsterRemoveCommand / MonsterRemoveAllCommand', () => {
    it('removes a monster', () => {
      createTestMonster();
      new MonsterRemoveCommand('test-testmonster').execute();
      expect(gameManager.game.figures).toEqual([]);
    });

    it('removes all or only unused monsters', () => {
      const used = createTestMonster('used');
      createTestMonsterEntity(used, 1);
      createTestMonster('unused');
      const character = createTestCharacter(1);
      new MonsterRemoveAllCommand(true).execute();
      expect(gameManager.game.figures).toEqual([used, character]);
      new MonsterRemoveAllCommand().execute();
      expect(gameManager.game.figures).toEqual([character]);
    });
  });

  describe('MonsterLevelCommand', () => {
    it('sets the monster level', () => {
      const monster = createTestMonster();
      const setLevel = vi.spyOn(gameManager.monsterManager, 'setLevel').mockImplementation(() => {});
      new MonsterLevelCommand('test-testmonster', 3).execute();
      expect(setLevel).toHaveBeenCalledWith(monster, 3);
      expect(new MonsterLevelCommand('test-testmonster', 8).validParameters('test-testmonster', 8)).toBe(false);
    });
  });

  describe('monster toggles', () => {
    it('sets ally, allied and dormant', () => {
      const monster = createTestMonster();
      const entity = createTestMonsterEntity(monster, 1);
      new MonsterAllyCommand('test-testmonster', true).execute();
      new MonsterAlliedCommand('test-testmonster', true).execute();
      new MonsterDormantCommand('test-testmonster', true).execute();
      expect(monster.isAlly).toBe(true);
      expect(monster.isAllied).toBe(true);
      expect(entity.dormant).toBe(true);
      new MonsterDormantCommand('test-testmonster', false).execute();
      expect(entity.dormant).toBe(false);
      expect(new MonsterAllyCommand('unknown', true).validParameters('unknown', true)).toBe(false);
    });
  });

  describe('MonsterEntityAddCommand', () => {
    it('adds a standee with a given, the next or a random number', () => {
      const monster = createTestMonster();
      new MonsterEntityAddCommand('test-testmonster', 2, MonsterType.elite, 1).execute();
      new MonsterEntityAddCommand('test-testmonster', -1, MonsterType.normal, 1).execute();
      new MonsterEntityAddCommand('test-testmonster', 0, MonsterType.normal, 1).execute();
      expect(monster.entities.map((entity) => entity.number).slice(0, 2)).toEqual([2, 1]);
      expect(monster.entities[0].type).toBe(MonsterType.elite);
      expect(monster.entities.length).toBe(3);
      expect(
        new MonsterEntityAddCommand('test-testmonster', 2, MonsterType.normal, 1).validParameters(
          'test-testmonster',
          2,
          MonsterType.normal,
          1
        )
      ).toBe(false);
    });
  });

  describe('monster ability commands', () => {
    it('shuffles and toggles drawing an extra ability', () => {
      const monster = createTestMonster();
      const shuffle = vi.spyOn(gameManager.monsterManager, 'shuffleAbilities').mockImplementation(() => {});
      new MonsterAbilityShuffleCommand('test-testmonster', 1, true).execute();
      expect(shuffle).toHaveBeenCalledWith(monster, true);

      new MonsterAbilityDrawExtraCommand('test-testmonster', true).execute();
      expect(monster.drawExtra).toBe(true);
      new MonsterAbilityDrawExtraCommand('test-testmonster', false).execute();
      expect(monster.drawExtra).toBe(false);
    });

    it('moves an ability card from the discard pile to the upcoming cards', () => {
      const monster = createTestMonster();
      monster.abilities = [0, 1, 2, 3];
      monster.ability = 1;
      vi.spyOn(gameManager, 'abilityCards').mockReturnValue([{ cardId: 10 }, { cardId: 11 }, { cardId: 12 }, { cardId: 13 }] as never);
      new MonsterAbilityMoveCommand('test-testmonster', 11, 'upcoming', 0).execute();
      expect(monster.abilities).toEqual([0, 1, 2, 3]);
      expect(monster.ability).toBe(0);
      new MonsterAbilityMoveCommand('test-testmonster', 13, 'upcoming', 0).execute();
      expect(monster.abilities).toEqual([0, 3, 1, 2]);
      expect(
        new MonsterAbilityMoveCommand('test-testmonster', 15, 'upcoming', 0).validParameters('test-testmonster', 15, 'upcoming', 0)
      ).toBe(false);
    });

    it('removes ability cards and keeps ability cards revealed', () => {
      const monster = createTestMonster();
      monster.abilities = [0, 1, 2];
      const removeAbility = vi.spyOn(gameManager.monsterManager, 'removeAbility').mockImplementation(() => {});
      vi.spyOn(gameManager, 'abilityCards').mockReturnValue([{ cardId: 10 }, { cardId: 11 }, { cardId: 12 }] as never);
      new MonsterAbilityRemoveCommand('test-testmonster', 11).execute();
      expect(removeAbility).toHaveBeenCalledWith(monster, 1);

      new MonsterAbilityRevealedCommand('test-testmonster', 12, true).execute();
      expect(monster.revealedAbilities[2]).toBe(true);
      expect(new MonsterAbilityRevealedCommand('test-testmonster', 12, true).validParameters('test-testmonster', 12, true)).toBe(false);
      new MonsterAbilityRevealedCommand('test-testmonster', 12, false).execute();
      expect(monster.revealedAbilities[2]).toBe(false);
    });
  });

  describe('MonsterCatchCommand', () => {
    it('catches a standee as pet and consumes the capture item', () => {
      const monster = createTestMonster();
      monster.pet = 'testpet';
      createTestMonsterEntity(monster, 1);
      const character = createTestCharacter(1);
      const captureItem = new AdditionalIdentifier('247', 'fh');
      character.progress.equippedItems.push(captureItem);
      gameManager.buildingsManager.petsEnabled = true;

      new MonsterCatchCommand('test-testmonster', 1).execute();

      expect(monster.entities.length).toBe(0);
      expect(gameManager.game.party.pets.map((pet) => pet.name)).toEqual(['testpet']);
      expect(captureItem.tags).toContain(ItemFlags.consumed);
      gameManager.buildingsManager.petsEnabled = false;
    });

    it('requires the capture item unless forced', () => {
      const monster = createTestMonster();
      monster.pet = 'testpet';
      createTestMonsterEntity(monster, 1);
      gameManager.buildingsManager.petsEnabled = true;
      expect(new MonsterCatchCommand('test-testmonster', 1).validParameters('test-testmonster', 1)).toBe(false);
      expect(new MonsterCatchCommand('test-testmonster', 1, true).validParameters('test-testmonster', 1, true)).toBe(true);
      gameManager.buildingsManager.petsEnabled = false;
    });
  });
});
