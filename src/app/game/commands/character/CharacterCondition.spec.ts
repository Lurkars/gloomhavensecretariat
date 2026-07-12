import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CharacterConditionCommand } from 'src/app/game/commands/character/CharacterCondition';
import { CommandMissingParameterError } from 'src/app/game/commands/Command';
import { createTestCharacter, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { Condition, ConditionName } from 'src/app/game/model/data/Condition';

describe('CharacterConditionCommand', () => {
  beforeEach(() => {
    resetTestGame();
  });

  function woundIndex(): number {
    return new CharacterConditionCommand().conditions.indexOf(ConditionName.wound);
  }

  describe('constructor', () => {
    it('builds a list of negative, positive and neutral character conditions', () => {
      const command = new CharacterConditionCommand();
      expect(command.conditions.length).toBeGreaterThan(0);
      expect(command.conditions).toContain(ConditionName.wound);
      expect(command.conditions).toContain(ConditionName.poison);
      // upgrade-type conditions such as poison_x/wound_x should also be included
      expect(command.conditions).toContain(ConditionName.poison_x);
      // positive standard character conditions should also be included
      expect(command.conditions).toContain(ConditionName.strengthen);
    });
  });

  describe('checkParameters', () => {
    it('throws CommandMissingParameterError when number or conditionIndex is missing', () => {
      expect(() => new CharacterConditionCommand().checkParameters()).toThrow(CommandMissingParameterError);
      expect(() => new CharacterConditionCommand(1).checkParameters()).toThrow(CommandMissingParameterError);
    });
  });

  describe('validParameters', () => {
    it('rejects a negative conditionIndex', () => {
      const character = createTestCharacter(1);
      const command = new CharacterConditionCommand(character.number, -1);
      expect(command.validParameters(character.number, -1)).toBe(false);
    });

    it('rejects a conditionIndex beyond the known conditions', () => {
      const character = createTestCharacter(1);
      const command = new CharacterConditionCommand(character.number, 99999);
      expect(command.validParameters(character.number, 99999)).toBe(false);
    });

    it('rejects when no character with the given number exists', () => {
      const command = new CharacterConditionCommand(999, woundIndex());
      expect(command.validParameters(999, woundIndex())).toBe(false);
    });

    it('accepts a valid character number and conditionIndex', () => {
      const character = createTestCharacter(1);
      const index = woundIndex();
      const command = new CharacterConditionCommand(character.number, index);
      expect(command.validParameters(character.number, index)).toBe(true);
    });
  });

  describe('executeWithParameters', () => {
    it('adds the condition when the character does not have it yet', () => {
      const character = createTestCharacter(1);
      const index = woundIndex();
      expect(gameManager.entityManager.hasCondition(character, new Condition(ConditionName.wound))).toBe(false);

      const command = new CharacterConditionCommand(character.number, index);
      command.execute();

      expect(character.entityConditions.some((c) => c.name === ConditionName.wound)).toBe(true);
    });

    it('removes the condition when the character already has it (toggle behavior)', () => {
      const character = createTestCharacter(1);
      const index = woundIndex();

      new CharacterConditionCommand(character.number, index).execute();
      expect(character.entityConditions.some((c) => c.name === ConditionName.wound)).toBe(true);

      new CharacterConditionCommand(character.number, index).execute();
      expect(character.entityConditions.some((c) => c.name === ConditionName.wound)).toBe(false);
    });
  });

  describe('before', () => {
    it('returns a descriptive label including the condition name when valid', () => {
      const character = createTestCharacter(1);
      const index = woundIndex();
      const command = new CharacterConditionCommand(character.number, index);
      const before = command.before();
      expect(before[0]).toBe('command.character.condition');
      expect(before[2]).toBe('game.condition.' + ConditionName.wound);
    });

    it('returns an "invalid" label when the character or condition cannot be resolved', () => {
      const command = new CharacterConditionCommand(999, woundIndex());
      expect(command.before()).toEqual(['command.invalid.character.condition', 999, woundIndex()]);
    });
  });
});
