import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { createTestCharacter, createTestMonster, createTestMonsterEntity, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { EntityRetaliateCommand } from 'src/app/game/commands/entity/EntityRetaliate';
import { EntityShieldCommand } from 'src/app/game/commands/entity/EntityShield';
import { ActionType, ActionValueType } from 'src/app/game/model/data/Action';

describe('Entity shield and retaliate commands', () => {
  let characterShieldRetaliate: boolean;
  let standeeShieldRetaliate: boolean;

  beforeEach(() => {
    resetTestGame();
    characterShieldRetaliate = settingsManager.settings.characterShieldRetaliate;
    standeeShieldRetaliate = settingsManager.settings.standeeShieldRetaliate;
    settingsManager.settings.characterShieldRetaliate = true;
    settingsManager.settings.standeeShieldRetaliate = true;
  });

  afterEach(() => {
    settingsManager.settings.characterShieldRetaliate = characterShieldRetaliate;
    settingsManager.settings.standeeShieldRetaliate = standeeShieldRetaliate;
  });

  describe('EntityShieldCommand', () => {
    it('is only valid when shield and retaliate tracking is enabled', () => {
      createTestCharacter(1);
      settingsManager.settings.characterShieldRetaliate = false;
      expect(new EntityShieldCommand(1, '', 2).validParameters(1, '', 2)).toBe(false);
      settingsManager.settings.characterShieldRetaliate = true;
      expect(new EntityShieldCommand(1, '', 2).validParameters(1, '', 2)).toBe(true);
    });

    it('sets, replaces and removes the shield of an entity', () => {
      const character = createTestCharacter(1);
      new EntityShieldCommand(1, '', 2).execute();
      expect(character.extraActions.filter((action) => action.type === ActionType.shield).map((action) => action.value)).toEqual([2]);

      new EntityShieldCommand(1, '', 3).execute();
      expect(character.extraActions.filter((action) => action.type === ActionType.shield).map((action) => action.value)).toEqual([3]);

      new EntityShieldCommand(1, '', 0).execute();
      expect(character.extraActions.some((action) => action.type === ActionType.shield)).toBe(false);
    });

    it('sets persistent and negative shields', () => {
      const character = createTestCharacter(1);
      new EntityShieldCommand(1, '', -1, true).execute();
      const shield = character.extraActionsPersistent.find((action) => action.type === ActionType.shield);
      expect(shield?.value).toBe(1);
      expect(shield?.valueType).toBe(ActionValueType.minus);
    });

    it('adds to existing shields on figure level', () => {
      const monster = createTestMonster();
      const first = createTestMonsterEntity(monster, 1);
      createTestMonsterEntity(monster, 2);
      new EntityShieldCommand('test-testmonster', 1, 1).execute();
      new EntityShieldCommand('test-testmonster', '', 1).execute();
      expect(first.extraActions.find((action) => action.type === ActionType.shield)?.value).toBe(2);
      expect(monster.entities[1].extraActions.find((action) => action.type === ActionType.shield)?.value).toBe(1);
    });
  });

  describe('EntityRetaliateCommand', () => {
    it('sets multiple retaliate values with ranges', () => {
      const character = createTestCharacter(1);
      new EntityRetaliateCommand(1, '', false, 2, 1, 1, 3).execute();
      const retaliate = character.extraActions.filter((action) => action.type === ActionType.retaliate);
      expect(retaliate.map((action) => action.value)).toEqual([2, 1]);
      expect(retaliate[0].subActions).toEqual([]);
      expect(retaliate[1].subActions[0].type).toBe(ActionType.range);
      expect(retaliate[1].subActions[0].value).toBe(3);
    });

    it('removes retaliate with a value of 0', () => {
      const character = createTestCharacter(1);
      new EntityRetaliateCommand(1, '', false, 2).execute();
      new EntityRetaliateCommand(1, '', false, 0).execute();
      expect(character.extraActions.some((action) => action.type === ActionType.retaliate)).toBe(false);
    });

    it('rejects invalid ranges', () => {
      createTestCharacter(1);
      expect(new EntityRetaliateCommand(1, '', false, 2, 0).validParameters(1, '', false, 2, 0)).toBe(false);
    });
  });
});
