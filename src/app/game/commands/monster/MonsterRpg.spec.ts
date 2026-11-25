import { gameManager } from 'src/app/game/businesslogic/Managers';
import { createTestMonster, createTestMonsterEntity, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { MonsterRpgActionCommand, MonsterRpgSpeedCommand } from 'src/app/game/commands/monster/MonsterRpg';
import { AbilityCard } from 'src/app/game/model/data/AbilityCard';
import { DeckData } from 'src/app/game/model/data/DeckData';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { GameState } from 'src/app/game/model/Game';

describe('Monster rpg commands', () => {
  const card = (name: string, initiative: number) =>
    Object.assign(new AbilityCard(), {
      name,
      initiative,
      actions: [
        { type: 'box', value: 'Basic', subActions: [] },
        { type: 'monsterType', value: 'elite', subActions: [{ type: 'box', value: 'Close In', subActions: [] }] }
      ]
    });

  beforeEach(() => {
    resetTestGame();
    vi.spyOn(gameManager, 'rpgRules').mockReturnValue(true);
    vi.spyOn(gameManager.editionManager, 'abilityCards').mockReturnValue([
      card('rpg-fast', 21),
      card('rpg-normal', 45),
      card('rpg-slow', 80)
    ]);
    vi.spyOn(gameManager.editionManager, 'deckData').mockReturnValue(
      Object.assign(new DeckData(), { name: 'testmonster', edition: 'test' })
    );
    vi.spyOn(gameManager.entityManager, 'isAlive').mockReturnValue(true);
    vi.spyOn(gameManager.roundManager, 'sortFigures').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets the speed and the action of standees', () => {
    const monster = createTestMonster();
    createTestMonsterEntity(monster, 1, MonsterType.elite);
    createTestMonsterEntity(monster, 2);
    new MonsterRpgSpeedCommand('test-testmonster', 2).execute();
    expect(monster.ability).toBe(2);
    expect(new MonsterRpgSpeedCommand('test-testmonster', 3).validParameters('test-testmonster', 3)).toBe(false);

    new MonsterRpgActionCommand('test-testmonster', 0, 2).execute();
    expect(monster.entities.map((entity) => entity.rpgAction)).toEqual([-1, 0]);
    expect(new MonsterRpgActionCommand('test-testmonster', 1, 2).validParameters('test-testmonster', 1)).toBe(false);
    expect(new MonsterRpgActionCommand('test-testmonster', 0, 3).validParameters('test-testmonster', 0)).toBe(false);
    new MonsterRpgActionCommand('test-testmonster', 1).execute();
    expect(monster.entities.map((entity) => entity.rpgAction)).toEqual([1, 0]);
  });

  it('rejects changes during the round', () => {
    createTestMonster();
    gameManager.game.state = GameState.next;
    expect(new MonsterRpgSpeedCommand('test-testmonster', 0).validParameters('test-testmonster', 0)).toBe(false);
    expect(new MonsterRpgActionCommand('test-testmonster', 0).validParameters('test-testmonster', 0)).toBe(false);
  });
});
