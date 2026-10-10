import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { createTestCharacter, createTestMonster, createTestMonsterEntity, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { EntityConditionCommand } from 'src/app/game/commands/entity/EntityCondition';
import { EntityConditionApplyCommand } from 'src/app/game/commands/entity/EntityConditionApply';
import { EntityConditionValueCommand } from 'src/app/game/commands/entity/EntityConditionValue';
import { Condition, ConditionName, EntityCondition } from 'src/app/game/model/data/Condition';

describe('Entity condition commands', () => {
  beforeEach(() => {
    resetTestGame();
  });

  describe('EntityConditionCommand', () => {
    it('rejects unknown and attack modifier deck conditions', () => {
      createTestCharacter(1);
      expect(new EntityConditionCommand(1, '', 'unknown', true).validParameters(1, '', 'unknown', true)).toBe(false);
      expect(new EntityConditionCommand(1, '', ConditionName.bless, true).validParameters(1, '', ConditionName.bless, true)).toBe(false);
      expect(new EntityConditionCommand(1, '', ConditionName.wound, true).validParameters(1, '', ConditionName.wound, true)).toBe(true);
    });

    it('adds and removes a condition on a character', () => {
      const character = createTestCharacter(1);
      new EntityConditionCommand(1, '', ConditionName.wound, true).execute();
      new EntityConditionCommand(1, '', ConditionName.wound, true).execute();
      expect(gameManager.entityManager.hasCondition(character, new Condition(ConditionName.wound))).toBe(true);
      expect(character.entityConditions.filter((entityCondition) => entityCondition.name === ConditionName.wound).length).toBe(1);

      new EntityConditionCommand(1, '', ConditionName.wound, false).execute();
      expect(gameManager.entityManager.hasCondition(character, new Condition(ConditionName.wound))).toBe(false);
    });

    it('adds a condition to all standees of a monster that miss it', () => {
      const monster = createTestMonster();
      const first = createTestMonsterEntity(monster, 1);
      const second = createTestMonsterEntity(monster, 2);
      gameManager.entityManager.addCondition(first, monster, new Condition(ConditionName.poison));
      new EntityConditionCommand('test-testmonster', '', ConditionName.poison, true).execute();
      expect(gameManager.entityManager.hasCondition(first, new Condition(ConditionName.poison))).toBe(true);
      expect(gameManager.entityManager.hasCondition(second, new Condition(ConditionName.poison))).toBe(true);
    });
  });

  describe('EntityConditionValueCommand', () => {
    it('only accepts stack or upgrade conditions', () => {
      createTestCharacter(1);
      expect(new EntityConditionValueCommand(1, '', ConditionName.wound, 2).validParameters(1, '', ConditionName.wound, 2)).toBe(false);
      expect(new EntityConditionValueCommand(1, '', ConditionName.plague, 2).validParameters(1, '', ConditionName.plague, 2)).toBe(true);
    });

    it('sets, clamps and removes a stack condition value', () => {
      const character = createTestCharacter(1);
      new EntityConditionValueCommand(1, '', ConditionName.plague, 2).execute();
      const plague = character.entityConditions.find((entityCondition) => entityCondition.name === ConditionName.plague);
      expect(plague?.value).toBe(2);

      new EntityConditionValueCommand(1, '', ConditionName.plague, 5).execute();
      expect(plague?.value).toBe(3);

      new EntityConditionValueCommand(1, '', ConditionName.plague, 0).execute();
      expect(character.entityConditions.some((entityCondition) => entityCondition.name === ConditionName.plague)).toBe(false);
    });
  });

  describe('EntityConditionApplyCommand', () => {
    it('requires an existing condition', () => {
      createTestCharacter(1);
      expect(new EntityConditionApplyCommand(1, '', ConditionName.wound).validParameters(1, '', ConditionName.wound)).toBe(false);
    });

    it('applies or declines a condition through the entity manager', () => {
      const character = createTestCharacter(1);
      const wound = new EntityCondition(ConditionName.wound);
      character.entityConditions.push(wound);
      const apply = vi.spyOn(gameManager.entityManager, 'applyCondition').mockImplementation(() => {});
      const decline = vi.spyOn(gameManager.entityManager, 'declineApplyCondition').mockImplementation(() => {});

      new EntityConditionApplyCommand(1, '', ConditionName.wound, false, true).execute();
      expect(apply).toHaveBeenCalledTimes(2);

      new EntityConditionApplyCommand(1, '', ConditionName.wound, true).execute();
      expect(decline).toHaveBeenCalledWith(character, character, wound);

      vi.restoreAllMocks();
    });
  });
});
