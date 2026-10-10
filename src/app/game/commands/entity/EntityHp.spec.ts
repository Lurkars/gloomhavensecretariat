import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { createTestCharacter, createTestMonster, createTestMonsterEntity, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { EntityHpCommand } from 'src/app/game/commands/entity/EntityHp';
import { GameState } from 'src/app/game/model/Game';

describe('EntityHpCommand', () => {
  beforeEach(() => {
    resetTestGame();
  });

  it('rejects unknown entities and a zero delta', () => {
    createTestCharacter(1);
    expect(new EntityHpCommand(2, '', 1).validParameters(2, '', 1)).toBe(false);
    expect(new EntityHpCommand(1, '', 0).validParameters(1, '', 0)).toBe(false);
    expect(new EntityHpCommand(1, '', -2).validParameters(1, '', -2)).toBe(true);
  });

  it('changes the health of a character', () => {
    const character = createTestCharacter(1, 1, 10);
    new EntityHpCommand(1, '', -3).execute();
    expect(character.health).toBe(7);
  });

  it('changes the health of a monster standee and removes it when dead', () => {
    const monster = createTestMonster();
    const entity = createTestMonsterEntity(monster, 1);
    new EntityHpCommand('test-testmonster', 1, -2).execute();
    expect(entity.health).toBe(3);

    new EntityHpCommand('test-testmonster', 1, -10).execute();
    expect(entity.dead).toBe(true);
    expect(monster.entities).not.toContain(entity);
  });

  it('applies to all standees on figure level and ends the turn of a dead monster', () => {
    const monster = createTestMonster();
    createTestMonsterEntity(monster, 1);
    createTestMonsterEntity(monster, 2);
    gameManager.game.state = GameState.next;
    monster.active = true;
    const toggleFigure = vi.spyOn(gameManager.roundManager, 'toggleFigure').mockImplementation(() => {});

    new EntityHpCommand('test-testmonster', '', -10).execute();

    expect(monster.entities.length).toBe(0);
    expect(toggleFigure).toHaveBeenCalledWith(monster);
    toggleFigure.mockRestore();
  });
});
