import { createTestCharacter, createTestMonster, createTestMonsterEntity, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { EntityImmunityCommand } from 'src/app/game/commands/entity/EntityImmunity';
import { EntityMarkerCommand } from 'src/app/game/commands/entity/EntityMarker';
import { ConditionName } from 'src/app/game/model/data/Condition';

describe('Entity immunity and marker commands', () => {
  beforeEach(() => {
    resetTestGame();
  });

  describe('EntityImmunityCommand', () => {
    it('adds and removes an immunity for all addressed entities', () => {
      const monster = createTestMonster();
      const first = createTestMonsterEntity(monster, 1);
      const second = createTestMonsterEntity(monster, 2);
      first.immunities.push(ConditionName.stun);

      new EntityImmunityCommand('test-testmonster', '', ConditionName.stun, true).execute();
      expect(first.immunities).toEqual([ConditionName.stun]);
      expect(second.immunities).toEqual([ConditionName.stun]);

      new EntityImmunityCommand('test-testmonster', '', ConditionName.stun, false).execute();
      expect(first.immunities).toEqual([]);
      expect(second.immunities).toEqual([]);
    });

    it('rejects unknown conditions', () => {
      createTestCharacter(1);
      expect(new EntityImmunityCommand(1, '', 'nope', true).validParameters(1, '', 'nope', true)).toBe(false);
    });
  });

  describe('EntityMarkerCommand', () => {
    it('adds and removes a character marker on an entity', () => {
      const character = createTestCharacter(1);
      new EntityMarkerCommand(1, '', 'gh-brute', true).execute();
      new EntityMarkerCommand(1, '', 'gh-brute', true).execute();
      expect(character.markers).toEqual(['gh-brute']);
      new EntityMarkerCommand(1, '', 'gh-brute', false).execute();
      expect(character.markers).toEqual([]);
    });

    it('requires an edition prefixed marker', () => {
      createTestCharacter(1);
      expect(new EntityMarkerCommand(1, '', 'brute', true).validParameters(1, '', 'brute', true)).toBe(false);
    });
  });
});
