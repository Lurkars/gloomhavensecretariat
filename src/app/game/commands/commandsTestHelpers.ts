// Shared fixtures for command spec files. Not a spec file itself (no *.spec.ts suffix), so it is not
// picked up as a test suite, but it may be imported by any Command spec under this directory.
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { AttackModifierDeck } from 'src/app/game/model/data/AttackModifier';
import { ChallengeDeck } from 'src/app/game/model/data/Challenges';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { defaultElementBoard } from 'src/app/game/model/data/Element';
import { LootDeck } from 'src/app/game/model/data/Loot';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterStat } from 'src/app/game/model/data/MonsterStat';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { ObjectiveData } from 'src/app/game/model/data/ObjectiveData';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { Summon, SummonColor, SummonState } from 'src/app/game/model/Summon';

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
  gameManager.game.challengeDeck = new ChallengeDeck();
  gameManager.game.elementBoard = JSON.parse(JSON.stringify(defaultElementBoard));
  gameManager.game.scenario = undefined;
  gameManager.game.sections = [];
  gameManager.game.scenarioRules = [];
  gameManager.game.appliedScenarioRules = [];
  gameManager.game.discardedScenarioRules = [];
  gameManager.game.activeScenarioRules = [];
  gameManager.game.finish = undefined;
  gameManager.game.eventDraw = undefined;
  gameManager.game.unlockedCharacters = [];
  gameManager.game.unlockedPersonalQuests = [];
  gameManager.game.roundResetsHidden = [];
  gameManager.game.gameClock = [];
  gameManager.game.favors = [];
  gameManager.game.favorPoints = [];
  gameManager.game.keepFavors = false;
  gameManager.game.level = 1;
  gameManager.game.levelCalculation = true;
  gameManager.game.levelAdjustment = 0;
  gameManager.game.bonusAdjustment = 0;
  gameManager.game.playerCount = -1;
  gameManager.game.solo = false;
  gameManager.game.lootDeckEnhancements = [];
  gameManager.game.lootDeckFixed = [];
  gameManager.game.lootDeckSections = [];
  gameManager.game.battleGoalEditions = [];
  gameManager.game.filteredBattleGoals = [];
  const party = new (gameManager.game.party.constructor as new () => typeof gameManager.game.party)();
  gameManager.game.party = party;
  gameManager.game.parties = [party];
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

export function createTestMonster(name: string = 'testmonster', level: number = 1, count: number = 6): Monster {
  const data = Object.assign(new MonsterData(), {
    name: name,
    edition: 'test',
    count: count,
    stats: [new MonsterStat(MonsterType.normal, level, 5, 1, 2, 0), new MonsterStat(MonsterType.elite, level, 8, 2, 3, 0)]
  });
  const monster = new Monster(data, level);
  gameManager.game.figures.push(monster);
  return monster;
}

export function createTestMonsterEntity(monster: Monster, number: number, type: MonsterType = MonsterType.normal): MonsterEntity {
  const entity = new MonsterEntity(number, type, monster);
  monster.entities.push(entity);
  return entity;
}

export function createTestObjective(escort: boolean = false, entities: number = 1): ObjectiveContainer {
  const objectiveContainer = gameManager.objectiveManager.addObjective(new ObjectiveData('', escort ? 3 : 7, escort));
  for (let i = 0; i < entities; i++) {
    gameManager.objectiveManager.addObjectiveEntity(objectiveContainer);
  }
  return objectiveContainer;
}

export function createTestSummon(character: Character, name: string = 'testsummon', number: number = 1): Summon {
  const summon = new Summon('uuid-' + name + '-' + number, name, '', character.level, number, SummonColor.blue);
  summon.init = false;
  summon.state = SummonState.true;
  summon.health = 4;
  summon.maxHealth = 4;
  character.summons.push(summon);
  return summon;
}

export function createTestEdition(data: Partial<EditionData> = {}): EditionData {
  const editionData = Object.assign(new EditionData('test', [], [], [], [], [], []), data);
  gameManager.editionData = [editionData];
  if (!settingsManager.settings.editions.includes('test')) {
    settingsManager.settings.editions.push('test');
  }
  return editionData;
}
