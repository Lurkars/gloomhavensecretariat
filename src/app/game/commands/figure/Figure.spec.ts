import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { createTestCharacter, createTestMonster, createTestObjective, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { FigureActiveCommand } from 'src/app/game/commands/figure/FigureActive';
import { FigureInitiativeCommand } from 'src/app/game/commands/figure/FigureInitiative';
import { FigureInteractiveActionsCommand } from 'src/app/game/commands/figure/FigureInteractiveActions';
import { FigureReorderCommand } from 'src/app/game/commands/figure/FigureReorder';
import { GameState } from 'src/app/game/model/Game';

describe('Figure commands', () => {
  beforeEach(() => {
    resetTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('FigureActiveCommand', () => {
    it('is only valid during a round for present characters', () => {
      const character = createTestCharacter(1);
      character.initiative = 10;
      expect(new FigureActiveCommand(1, 1).validParameters(1, 1)).toBe(false);
      gameManager.game.state = GameState.next;
      expect(new FigureActiveCommand(1, 1).validParameters(1, 1)).toBe(true);
      character.absent = true;
      expect(new FigureActiveCommand(1, 1).validParameters(1, 1)).toBe(false);
    });

    it('toggles the figure through the round manager', () => {
      const monster = createTestMonster();
      gameManager.game.state = GameState.next;
      const toggleFigure = vi.spyOn(gameManager.roundManager, 'toggleFigure').mockImplementation(() => {});
      new FigureActiveCommand('test-testmonster', 1).execute();
      expect(toggleFigure).toHaveBeenCalledWith(monster);
    });
  });

  describe('FigureInitiativeCommand', () => {
    it('sets the initiative of a character and handles long rest', () => {
      const character = createTestCharacter(1);
      new FigureInitiativeCommand(1, 99).execute();
      expect(character.initiative).toBe(99);
      expect(character.longRest).toBe(true);
      new FigureInitiativeCommand(1, 20).execute();
      expect(character.longRest).toBe(false);
    });

    it('sets the initiative of an objective', () => {
      const objective = createTestObjective(true);
      new FigureInitiativeCommand('escort-' + objective.uuid, 45).execute();
      expect(objective.initiative).toBe(45);
    });

    it('rejects monsters and out of range values', () => {
      createTestMonster();
      createTestCharacter(1);
      expect(new FigureInitiativeCommand('test-testmonster', 10).validParameters('test-testmonster', 10)).toBe(false);
      expect(new FigureInitiativeCommand(1, 100).validParameters(1, 100)).toBe(false);
    });
  });

  describe('FigureReorderCommand', () => {
    it('moves a figure in the figure list', () => {
      const first = createTestCharacter(1);
      const second = createTestCharacter(2);
      const third = createTestCharacter(3);
      new FigureReorderCommand(1, '').execute();
      expect(gameManager.game.figures).toEqual([second, third, first]);
      new FigureReorderCommand(3, 2).execute();
      expect(gameManager.game.figures).toEqual([third, second, first]);
      expect(new FigureReorderCommand(1, 1).validParameters(1, 1)).toBe(false);
      expect(new FigureReorderCommand(1, 4).validParameters(1, 4)).toBe(false);
    });
  });

  describe('FigureInteractiveActionsCommand', () => {
    it('is only valid with interactive abilities enabled for an active figure', () => {
      const interactiveAbilities = settingsManager.settings.interactiveAbilities;
      settingsManager.settings.interactiveAbilities = false;
      createTestMonster();
      expect(new FigureInteractiveActionsCommand('test-testmonster').validParameters('test-testmonster')).toBe(false);
      settingsManager.settings.interactiveAbilities = interactiveAbilities;
    });
  });
});
