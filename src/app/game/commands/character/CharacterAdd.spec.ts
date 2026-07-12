import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CharacterAddCommand } from 'src/app/game/commands/character/CharacterAdd';
import { CommandInvalidParametersError, CommandMissingParameterError } from 'src/app/game/commands/Command';
import { resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { EditionData } from 'src/app/game/model/data/EditionData';

describe('CharacterAddCommand', () => {
  beforeEach(() => {
    resetTestGame();
    settingsManager.settings.editions = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
    settingsManager.settings.editions = [];
  });

  function registerEditionCharacter(edition: string, name: string): CharacterData {
    const characterData = new CharacterData();
    characterData.name = name;
    characterData.edition = edition;
    characterData.stats = [new CharacterStat(1, 10)];
    gameManager.editionData = [new EditionData(edition, [characterData], [], [], [], [], [])];
    settingsManager.settings.editions = [edition];
    return characterData;
  }

  describe('checkParameters', () => {
    it('throws CommandMissingParameterError when edition, name or level is missing', () => {
      expect(() => new CharacterAddCommand().checkParameters()).toThrow(CommandMissingParameterError);
      expect(() => new CharacterAddCommand('test').checkParameters()).toThrow(CommandMissingParameterError);
      expect(() => new CharacterAddCommand('test', 'brute').checkParameters()).toThrow(CommandMissingParameterError);
    });
  });

  describe('validParameters', () => {
    it('accepts a known character name for a registered, enabled edition', () => {
      registerEditionCharacter('test', 'brute');
      const command = new CharacterAddCommand('test', 'brute', 1);
      expect(command.validParameters('test', 'brute', 1)).toBe(true);
    });

    it('rejects an unknown character name', () => {
      registerEditionCharacter('test', 'brute');
      const command = new CharacterAddCommand('test', 'unknown', 1);
      expect(command.validParameters('test', 'unknown', 1)).toBe(false);
    });

    it('rejects a level of 10 or higher', () => {
      registerEditionCharacter('test', 'brute');
      const command = new CharacterAddCommand('test', 'brute', 10);
      expect(command.validParameters('test', 'brute', 10)).toBe(false);
    });

    it('rejects a level of 0', () => {
      registerEditionCharacter('test', 'brute');
      const command = new CharacterAddCommand('test', 'brute', 0);
      expect(command.validParameters('test', 'brute', 0)).toBe(false);
    });

    it('rejects when the edition is not enabled in settings', () => {
      registerEditionCharacter('test', 'brute');
      settingsManager.settings.editions = [];
      const command = new CharacterAddCommand('test', 'brute', 1);
      expect(command.validParameters('test', 'brute', 1)).toBe(false);
    });
  });

  describe('executeWithParameters', () => {
    it('looks up the matching character data and delegates to characterManager.addCharacter', () => {
      registerEditionCharacter('test', 'brute');
      const addCharacterSpy = vi.spyOn(gameManager.characterManager, 'addCharacter').mockImplementation(() => {});

      const command = new CharacterAddCommand('test', 'brute', 3);
      command.execute();

      // gameManager.charactersData() wraps every match in a fresh `new CharacterData(...)`, so compare
      // against what that lookup itself produces rather than the raw fixture object.
      const expectedCharacterData = gameManager.charactersData('test').find((char) => char.name === 'brute');
      expect(addCharacterSpy).toHaveBeenCalledTimes(1);
      expect(addCharacterSpy).toHaveBeenCalledWith(expectedCharacterData, 3);
    });

    it('throws CommandInvalidParametersError via checkParameters when no character matches (checked before execution)', () => {
      registerEditionCharacter('test', 'brute');
      const addCharacterSpy = vi.spyOn(gameManager.characterManager, 'addCharacter').mockImplementation(() => {});

      const command = new CharacterAddCommand('test', 'does-not-exist', 1);
      expect(() => command.execute()).toThrow(CommandInvalidParametersError);
      expect(addCharacterSpy).not.toHaveBeenCalled();
    });
  });

  describe('before', () => {
    it('uses the default command label with all parameters', () => {
      const command = new CharacterAddCommand('test', 'brute', 3);
      expect(command.before()).toEqual(['command.character.add', 'test', 'brute', 3]);
    });
  });
});
