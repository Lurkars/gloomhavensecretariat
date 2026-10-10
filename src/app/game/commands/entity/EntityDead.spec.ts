import {
  createTestCharacter,
  createTestMonster,
  createTestMonsterEntity,
  createTestSummon,
  resetTestGame
} from 'src/app/game/commands/commandsTestHelpers';
import { EntityDeadCommand } from 'src/app/game/commands/entity/EntityDead';

describe('EntityDeadCommand', () => {
  beforeEach(() => {
    resetTestGame();
  });

  it('does not apply to characters', () => {
    createTestCharacter(1);
    expect(new EntityDeadCommand(1, '').validParameters(1, '')).toBe(false);
  });

  it('kills and removes a monster standee', () => {
    const monster = createTestMonster();
    const entity = createTestMonsterEntity(monster, 1);
    new EntityDeadCommand('test-testmonster', 1).execute();
    expect(entity.dead).toBe(true);
    expect(monster.entities.length).toBe(0);
  });

  it('kills and removes a summon', () => {
    const character = createTestCharacter(1);
    const summon = createTestSummon(character);
    new EntityDeadCommand(1, summon.uuid).execute();
    expect(character.summons.length).toBe(0);
  });

  it('rejects unknown entities', () => {
    createTestMonster();
    expect(new EntityDeadCommand('test-testmonster', 5).validParameters('test-testmonster', 5)).toBe(false);
  });
});
