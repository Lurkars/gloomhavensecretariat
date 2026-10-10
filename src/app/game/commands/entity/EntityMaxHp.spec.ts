import { createTestCharacter, createTestMonster, createTestMonsterEntity, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { EntityMaxHpCommand } from 'src/app/game/commands/entity/EntityMaxHp';

describe('EntityMaxHpCommand', () => {
  beforeEach(() => {
    resetTestGame();
  });

  it('rejects a max health below 1', () => {
    createTestCharacter(1, 1, 3);
    expect(new EntityMaxHpCommand(1, '', -3).validParameters(1, '', -3)).toBe(false);
    expect(new EntityMaxHpCommand(1, '', -2).validParameters(1, '', -2)).toBe(true);
  });

  it('raises current health with max health when at full health', () => {
    const character = createTestCharacter(1, 1, 10);
    new EntityMaxHpCommand(1, '', 2).execute();
    expect(character.maxHealth).toBe(12);
    expect(character.health).toBe(12);
  });

  it('keeps damaged health and clamps it to the new max health', () => {
    const monster = createTestMonster();
    const entity = createTestMonsterEntity(monster, 1);
    entity.health = 4;
    new EntityMaxHpCommand('test-testmonster', 1, 1).execute();
    expect(entity.maxHealth).toBe(6);
    expect(entity.health).toBe(4);

    new EntityMaxHpCommand('test-testmonster', 1, -3).execute();
    expect(entity.maxHealth).toBe(3);
    expect(entity.health).toBe(3);
  });
});
