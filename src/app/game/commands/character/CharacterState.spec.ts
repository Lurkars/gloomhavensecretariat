import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CharacterAbsentCommand } from 'src/app/game/commands/character/CharacterAbsent';
import { CharacterExhaustedCommand } from 'src/app/game/commands/character/CharacterExhausted';
import { CharacterLevelCommand } from 'src/app/game/commands/character/CharacterLevel';
import { CharacterLongRestCommand } from 'src/app/game/commands/character/CharacterLongRest';
import { CharacterMarkerCommand } from 'src/app/game/commands/character/CharacterMarker';
import { CharacterPlayerNumberCommand } from 'src/app/game/commands/character/CharacterPlayerNumber';
import { CharacterRemoveCommand } from 'src/app/game/commands/character/CharacterRemove';
import { CharacterRemoveAllCommand } from 'src/app/game/commands/character/CharacterRemoveAll';
import { CharacterSpecialActionSlotCommand } from 'src/app/game/commands/character/CharacterSpecialActionSlot';
import { CharacterTokenCommand } from 'src/app/game/commands/character/CharacterToken';
import { CharacterTokenValueCommand } from 'src/app/game/commands/character/CharacterTokenValue';
import {
  CharacterUnlockAllCommand,
  CharacterUnlockCommand,
  CharacterUnlockResetCommand
} from 'src/app/game/commands/character/CharacterUnlock';
import { createTestCharacter, createTestEdition, createTestMonster, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { ActionCardType } from 'src/app/game/model/data/Action';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterSpecialAction } from 'src/app/game/model/data/CharacterStat';

describe('Character state commands', () => {
  beforeEach(() => {
    resetTestGame();
  });

  describe('CharacterRemoveCommand / CharacterRemoveAllCommand', () => {
    it('removes a single character or all characters', () => {
      createTestCharacter(1);
      createTestCharacter(2);
      const monster = createTestMonster();
      new CharacterRemoveCommand(1).execute();
      expect(gameManager.game.figures.length).toBe(2);
      new CharacterRemoveAllCommand().execute();
      expect(gameManager.game.figures).toEqual([monster]);
    });
  });

  describe('CharacterLongRestCommand', () => {
    it('sets long rest with initiative 99 and toggles it off again', () => {
      const character = createTestCharacter(1);
      character.initiative = 20;
      new CharacterLongRestCommand(1, true).execute();
      expect(character.longRest).toBe(true);
      expect(character.initiative).toBe(99);
      new CharacterLongRestCommand(1, true).execute();
      expect(character.longRest).toBe(true);
      new CharacterLongRestCommand(1, false).execute();
      expect(character.longRest).toBe(false);
    });
  });

  describe('CharacterExhaustedCommand', () => {
    it('sets a character exhausted and counts exhausts once', () => {
      const character = createTestCharacter(1);
      settingsManager.settings.scenarioStats = true;
      new CharacterExhaustedCommand(1, true).execute();
      new CharacterExhaustedCommand(1, true).execute();
      expect(character.exhausted).toBe(true);
      expect(character.scenarioStats.exhausts).toBe(1);
      new CharacterExhaustedCommand(1, false).execute();
      expect(character.exhausted).toBe(false);
    });
  });

  describe('CharacterAbsentCommand', () => {
    it('toggles absent but keeps at least one present character', () => {
      const character = createTestCharacter(1);
      expect(new CharacterAbsentCommand(1, true).validParameters(1, true)).toBe(false);
      expect(new CharacterAbsentCommand(1, false).validParameters(1, false)).toBe(true);
      createTestCharacter(2);
      new CharacterAbsentCommand(1, true).execute();
      expect(character.absent).toBe(true);
      new CharacterAbsentCommand(1, false).execute();
      expect(character.absent).toBe(false);
    });
  });

  describe('CharacterLevelCommand', () => {
    it('sets the level through the character manager', () => {
      createTestCharacter(1);
      const setLevel = vi.spyOn(gameManager.characterManager, 'setLevel').mockImplementation(() => {});
      expect(new CharacterLevelCommand(1, 10).validParameters(1, 10)).toBe(false);
      new CharacterLevelCommand(1, 3).execute();
      expect(setLevel).toHaveBeenCalledWith(gameManager.game.figures[0], 3);
      setLevel.mockRestore();
    });
  });

  describe('CharacterTokenCommand / CharacterTokenValueCommand', () => {
    it('changes tokens and never goes below 0', () => {
      const character = createTestCharacter(1);
      new CharacterTokenCommand(1, 2).execute();
      expect(character.token).toBe(2);
      new CharacterTokenCommand(1, -5).execute();
      expect(character.token).toBe(0);
    });

    it('changes character specific token values', () => {
      const character = createTestCharacter(1);
      character.tokens = ['time'];
      character.tokenValues = [0];
      expect(new CharacterTokenValueCommand(1, 1, 1).validParameters(1, 1, 1)).toBe(false);
      new CharacterTokenValueCommand(1, 0, 3).execute();
      expect(character.tokenValues[0]).toBe(3);
    });
  });

  describe('CharacterMarkerCommand', () => {
    it('sets the character marker', () => {
      const character = createTestCharacter(1);
      new CharacterMarkerCommand(1, true).execute();
      expect(character.marker).toBe(true);
      new CharacterMarkerCommand(1, false).execute();
      expect(character.marker).toBe(false);
    });
  });

  describe('CharacterPlayerNumberCommand', () => {
    it('swaps player numbers with an existing character', () => {
      const first = createTestCharacter(1);
      const second = createTestCharacter(2);
      new CharacterPlayerNumberCommand(1, 2).execute();
      expect(first.number).toBe(2);
      expect(second.number).toBe(1);
    });
  });

  describe('CharacterSpecialActionSlotCommand', () => {
    it('moves the slot marker of a manual slotted special action', () => {
      const character = createTestCharacter(1);
      const specialAction = new CharacterSpecialAction(
        'slots',
        0,
        false,
        false,
        false,
        false,
        ['start', 'a', 'b'] as unknown as ActionCardType[],
        'manual'
      );
      character.specialActions = [specialAction];
      character.tags = ['slots', 'slots', 'slots'];
      expect(new CharacterSpecialActionSlotCommand(1, 'slots', 0).validParameters(1, 'slots', 0)).toBe(false);
      const triggerSlot = vi.spyOn(gameManager.specialActionsManager, 'triggerSlot').mockImplementation(() => {});
      new CharacterSpecialActionSlotCommand(1, 'slots', 2).execute();
      expect(triggerSlot).toHaveBeenCalledTimes(2);
      triggerSlot.mockRestore();
    });
  });

  describe('CharacterUnlock commands', () => {
    beforeEach(() => {
      createTestEdition({
        characters: [
          Object.assign(new CharacterData(), { name: 'hidden1', edition: 'test', spoiler: true }),
          Object.assign(new CharacterData(), { name: 'hidden2', edition: 'test', spoiler: true })
        ]
      });
    });

    it('unlocks and locks a single character', () => {
      new CharacterUnlockCommand('test', 'hidden1', true).execute();
      new CharacterUnlockCommand('test', 'hidden1', true).execute();
      expect(gameManager.game.unlockedCharacters).toEqual(['test:hidden1']);
      new CharacterUnlockCommand('test', 'hidden1', false).execute();
      expect(gameManager.game.unlockedCharacters).toEqual([]);
      expect(new CharacterUnlockCommand('test', 'unknown', true).validParameters('test', 'unknown', true)).toBe(false);
    });

    it('unlocks all locked characters of an edition and resets all unlocks', () => {
      new CharacterUnlockCommand('test', 'hidden1', true).execute();
      new CharacterUnlockAllCommand('test').execute();
      expect(gameManager.game.unlockedCharacters).toEqual(['test:hidden1', 'test:hidden2']);
      expect(new CharacterUnlockAllCommand('test').validParameters('test')).toBe(false);
      new CharacterUnlockResetCommand().execute();
      expect(gameManager.game.unlockedCharacters).toEqual([]);
    });
  });
});
