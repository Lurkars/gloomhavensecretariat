import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CommandExecutionError } from 'src/app/game/commands/Command';
import { createTestCharacter, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { LootDeckDrawCommand } from 'src/app/game/commands/lootDeck/LootDeckDraw';
import { GameState } from 'src/app/game/model/Game';
import { Loot, LootType } from 'src/app/game/model/data/Loot';

describe('LootDeckDrawCommand', () => {
  beforeEach(() => {
    resetTestGame();
    gameManager.game.state = GameState.next;
    gameManager.game.lootDeck.cards = [new Loot(LootType.money, 1, 10, 8, 5)];
    gameManager.game.lootDeck.current = -1;
  });

  describe('checkParameters', () => {
    it('never throws (no required parameters, always valid)', () => {
      expect(() => new LootDeckDrawCommand().checkParameters()).not.toThrow();
    });
  });

  describe('executeWithParameters', () => {
    it('throws CommandExecutionError when the game state is not "next"', () => {
      gameManager.game.state = GameState.draw;
      const command = new LootDeckDrawCommand();
      expect(() => command.execute()).toThrow(CommandExecutionError);
    });

    it('draws the next card from the loot deck', () => {
      new LootDeckDrawCommand().execute();
      expect(gameManager.game.lootDeck.current).toBe(0);
    });

    it('applies the drawn loot to the active character', () => {
      const character = createTestCharacter(1);
      character.active = true;
      new LootDeckDrawCommand().execute();
      // single-character party -> 2P value column (5) is used
      expect(character.loot).toBe(5);
    });

    it('does not throw when there is no active character', () => {
      createTestCharacter(1).active = false;
      expect(() => new LootDeckDrawCommand().execute()).not.toThrow();
      expect(gameManager.game.lootDeck.current).toBe(0);
    });
  });

  describe('before', () => {
    it('returns the default command label with no extra parameters', () => {
      expect(new LootDeckDrawCommand().before()).toEqual(['command.lootDeck.draw']);
    });
  });
});
