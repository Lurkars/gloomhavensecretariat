// Shared fixtures for command spec files. Not a spec file itself (no *.spec.ts suffix), so it is not
// picked up as a test suite, but it may be imported by any Command spec under this directory.
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { AttackModifierDeck } from 'src/app/game/model/data/AttackModifier';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { LootDeck } from 'src/app/game/model/data/Loot';
import { GameState } from 'src/app/game/model/Game';

/**
 * Resets the shared `gameManager.game` instance in place. `gameManager.game` is never reassigned by
 * application code (every business-logic manager captures a reference to the original `Game` instance
 * in its constructor), so tests must mutate the existing object rather than replacing it wholesale.
 */
export function resetTestGame(): void {
  gameManager.game.figures = [];
  gameManager.game.state = GameState.draw;
  gameManager.game.round = 0;
  gameManager.game.edition = undefined;
  gameManager.game.conditions = [];
  gameManager.game.lootDeck = new LootDeck();
  gameManager.game.monsterAttackModifierDeck = new AttackModifierDeck();
  gameManager.game.allyAttackModifierDeck = new AttackModifierDeck();
  gameManager.editionData = [];
}

/**
 * Builds and registers a minimal, real `Character` figure (via the real `Character` model constructor,
 * not a mock) for use as command fixture data. Bypasses `CharacterManager.addCharacter` on purpose:
 * that method belongs to a manager covered elsewhere and pulls in unrelated business logic
 * (level calculation, trials, enhancements, ...) that isn't relevant to exercising a single command.
 */
export function createTestCharacter(number: number, level: number = 1, health: number = 10): Character {
  const data = new CharacterData();
  data.name = 'testchar' + number;
  data.edition = 'test';
  data.identities = ['identityA', 'identityB'];
  data.stats = [new CharacterStat(level, health)];
  const character = new Character(data, level);
  character.number = number;
  gameManager.game.figures.push(character);
  return character;
}
