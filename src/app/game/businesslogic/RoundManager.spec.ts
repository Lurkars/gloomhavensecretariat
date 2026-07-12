import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import { Summon, SummonColor } from 'src/app/game/model/Summon';

// RoundManager implements the round/turn progression rules. `drawAvailable()` is fully covered
// below. `nextGameState()`/`toggleFigure()`/`turn()`/`beforeTurn()`/`afterTurn()` also carry a
// large amount of hardcoded per-character-name logic (gated behind `figure.name === '<specific
// character>'` checks) that is out of scope here — fixtures below deliberately use generic
// names/editions ('test-char', 'bandit-guard') so none of those hardcoded branches fire, letting
// the tests isolate the generic figure-activation/round-progression state machine instead.
// Collaborator managers whose own next()/draw() implementations are covered (or explicitly out of
// scope) in their own specs are mocked here so failures point at RoundManager's own orchestration.

function buildCharacter(name: string, edition: string = 'gh'): Character {
  const data = Object.assign(new CharacterData(), {
    name,
    edition,
    stats: [new CharacterStat(1, 10)]
  });
  return new Character(data, 1);
}

function buildMonster(name: string, edition: string = 'gh'): Monster {
  const data = Object.assign(new MonsterData(), { name, edition });
  return new Monster(data, 1);
}

function buildMonsterEntity(monster: Monster, number: number = 1): MonsterEntity {
  return new MonsterEntity(number, MonsterType.normal, monster);
}

function buildSummon(): Summon {
  return new Summon('summon-uuid', 'test-summon', '1', 1, 1, SummonColor.blue);
}

describe('RoundManager', () => {
  const roundManager = gameManager.roundManager;

  beforeEach(() => {
    gameManager.game.figures = [];
    gameManager.game.state = GameState.draw;
    gameManager.game.scenario = undefined;
    gameManager.game.round = 0;
    gameManager.game.elementBoard = [];
    gameManager.game.challengeDeck.active = true;
    settingsManager.settings.initiativeRequired = true;
    settingsManager.settings.sortFigures = false;
    settingsManager.settings.scenarioRules = false;
    settingsManager.settings.moveElements = false;
    settingsManager.settings.removeUnusedMonster = false;
    settingsManager.settings.automaticEndRound = false;
    settingsManager.settings.automaticFirstFigure = true;
    roundManager.firstRound = false;
    roundManager.working = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('drawAvailable', () => {
    it('is false when there are no figures', () => {
      gameManager.game.figures = [];
      expect(roundManager.drawAvailable()).toBe(false);
    });

    it('is true whenever the state is already "next", regardless of initiative', () => {
      gameManager.game.state = GameState.next;
      gameManager.game.figures = [buildCharacter('brute')];
      expect(roundManager.drawAvailable()).toBe(true);
    });

    it('is true in draw state once every figure has set initiative (monsters always count)', () => {
      gameManager.game.state = GameState.draw;
      const monster = buildMonster('bandit-guard');
      const character = buildCharacter('brute');
      character.initiative = 30;
      gameManager.game.figures = [monster, character];
      expect(roundManager.drawAvailable()).toBe(true);
    });

    it('is false in draw state when a character has not set initiative yet', () => {
      gameManager.game.state = GameState.draw;
      const character = buildCharacter('brute');
      character.initiative = 0; // getInitiative() -> 0 - 0.9 = -0.9, not > 0
      gameManager.game.figures = [character];
      expect(roundManager.drawAvailable()).toBe(false);
    });

    it('treats an exhausted or absent character as having initiative for draw purposes', () => {
      gameManager.game.state = GameState.draw;
      const exhausted = buildCharacter('brute');
      exhausted.initiative = 0;
      exhausted.exhausted = true;
      gameManager.game.figures = [exhausted];
      expect(roundManager.drawAvailable()).toBe(true);

      const absent = buildCharacter('spellweaver');
      absent.initiative = 0;
      absent.absent = true;
      gameManager.game.figures = [absent];
      expect(roundManager.drawAvailable()).toBe(true);
    });

    it('ignores missing initiative when initiativeRequired is disabled', () => {
      settingsManager.settings.initiativeRequired = false;
      gameManager.game.state = GameState.draw;
      const character = buildCharacter('brute');
      character.initiative = 0;
      gameManager.game.figures = [character];
      expect(roundManager.drawAvailable()).toBe(true);
    });

    it('requires objective containers to have initiative too, unless initiativeRequired is disabled', () => {
      gameManager.game.state = GameState.draw;
      settingsManager.settings.initiativeRequired = true;
      const objective = new ObjectiveContainer('uuid-1');
      objective.initiative = -100; // getInitiative() = -100 + 0.9, not > 0
      gameManager.game.figures = [objective];
      expect(roundManager.drawAvailable()).toBe(false);

      settingsManager.settings.initiativeRequired = false;
      expect(roundManager.drawAvailable()).toBe(true);
    });
  });

  describe('nextGameState', () => {
    beforeEach(() => {
      gameManager.challengesManager.enabled = false;
      gameManager.challengesManager.apply = false;
      gameManager.trialsManager.favorsEnabled = false;
      gameManager.trialsManager.apply = false;
      vi.spyOn(gameManager.entityManager, 'next').mockImplementation(() => {});
      vi.spyOn(gameManager.characterManager, 'next').mockImplementation(() => {});
      vi.spyOn(gameManager.characterManager, 'draw').mockImplementation(() => {});
      vi.spyOn(gameManager.monsterManager, 'next').mockImplementation(() => {});
      vi.spyOn(gameManager.monsterManager, 'draw').mockImplementation(() => {});
      vi.spyOn(gameManager.objectiveManager, 'next').mockImplementation(() => {});
      vi.spyOn(gameManager.objectiveManager, 'draw').mockImplementation(() => {});
      vi.spyOn(gameManager.attackModifierManager, 'next').mockImplementation(() => {});
      vi.spyOn(gameManager.attackModifierManager, 'firstRound').mockImplementation(() => {});
      vi.spyOn(gameManager.lootManager, 'firstRound').mockImplementation(() => {});
      vi.spyOn(gameManager.scenarioRulesManager, 'cleanActiveScenarioRules').mockImplementation(() => {});
      vi.spyOn(gameManager, 'sortFigures').mockImplementation(() => {});
    });

    it('flips state from next to draw, delegates to the per-manager next() hooks, and clears figure.active', () => {
      gameManager.game.state = GameState.next;
      const character = buildCharacter('test-char');
      character.active = true;
      gameManager.game.figures = [character];

      roundManager.nextGameState();

      expect(gameManager.game.state).toBe(GameState.draw);
      expect(character.active).toBe(false);
      expect(gameManager.entityManager.next).toHaveBeenCalled();
      expect(gameManager.characterManager.next).toHaveBeenCalled();
      expect(gameManager.monsterManager.next).toHaveBeenCalled();
      expect(gameManager.objectiveManager.next).toHaveBeenCalled();
      expect(gameManager.attackModifierManager.next).toHaveBeenCalled();
    });

    it('stays in draw state when drawAvailable() is false and force is not set', () => {
      gameManager.game.state = GameState.draw;
      const character = buildCharacter('test-char');
      character.initiative = 0;
      gameManager.game.figures = [character];

      roundManager.nextGameState();

      expect(gameManager.game.state).toBe(GameState.draw);
      expect(gameManager.game.round).toBe(0);
      expect(gameManager.characterManager.draw).not.toHaveBeenCalled();
    });

    it('advances draw to next, increments the round, and delegates to the per-manager draw() hooks once drawAvailable', () => {
      gameManager.game.state = GameState.draw;
      const character = buildCharacter('test-char');
      character.initiative = 5;
      gameManager.game.figures = [character];

      roundManager.nextGameState();

      expect(gameManager.game.state).toBe(GameState.next);
      expect(gameManager.game.round).toBe(1);
      expect(gameManager.characterManager.draw).toHaveBeenCalled();
      expect(gameManager.monsterManager.draw).toHaveBeenCalled();
      expect(gameManager.objectiveManager.draw).toHaveBeenCalled();
    });

    it('force=true advances draw to next even though drawAvailable() would otherwise be false', () => {
      gameManager.game.state = GameState.draw;
      const character = buildCharacter('test-char');
      character.initiative = 0;
      gameManager.game.figures = [character];

      roundManager.nextGameState(true);

      expect(gameManager.game.state).toBe(GameState.next);
      expect(gameManager.game.round).toBe(1);
    });

    it('runs firstRound setup (attack modifier/loot firstRound, scenario auto-creation, closing the challenge deck) only when firstRound is true', () => {
      roundManager.firstRound = true;
      gameManager.game.state = GameState.draw;
      gameManager.game.scenario = undefined;
      gameManager.game.challengeDeck.active = true;
      gameManager.game.figures = [];

      roundManager.nextGameState(true);

      expect(gameManager.attackModifierManager.firstRound).toHaveBeenCalled();
      expect(gameManager.lootManager.firstRound).toHaveBeenCalled();
      expect(gameManager.game.scenario).toBeDefined();
      expect(gameManager.game.challengeDeck.active).toBe(false);
    });

    it('does not run firstRound setup when the firstRound flag is false', () => {
      roundManager.firstRound = false;
      gameManager.game.state = GameState.draw;
      gameManager.game.figures = [];

      roundManager.nextGameState();

      expect(gameManager.attackModifierManager.firstRound).not.toHaveBeenCalled();
      expect(gameManager.lootManager.firstRound).not.toHaveBeenCalled();
    });

    it('removes off, entity-less, non-manually-added monsters when removeUnusedMonster is enabled', () => {
      settingsManager.settings.removeUnusedMonster = true;
      const monster = buildMonster('bandit-guard');
      monster.off = true;
      monster.entities = [];
      gameManager.game.state = GameState.next;
      gameManager.game.figures = [monster];
      const removeSpy = vi.spyOn(gameManager.monsterManager, 'removeMonster').mockImplementation(() => {});

      roundManager.nextGameState();

      expect(removeSpy).toHaveBeenCalledWith(monster);
    });

    it('keeps a manually-added empty monster even when removeUnusedMonster is enabled', () => {
      settingsManager.settings.removeUnusedMonster = true;
      const monster = buildMonster('bandit-guard');
      monster.off = true;
      monster.entities = [];
      monster.tags = ['addedManually'];
      gameManager.game.state = GameState.next;
      gameManager.game.figures = [monster];
      const removeSpy = vi.spyOn(gameManager.monsterManager, 'removeMonster').mockImplementation(() => {});

      roundManager.nextGameState();

      expect(removeSpy).not.toHaveBeenCalled();
    });

    it('auto-activates the first gameplay figure once drawAvailable, when automaticFirstFigure/initiativeRequired allow it', () => {
      gameManager.game.state = GameState.draw;
      const character = buildCharacter('test-char');
      character.initiative = 5;
      gameManager.game.figures = [character];
      const toggleSpy = vi.spyOn(roundManager, 'toggleFigure').mockImplementation(() => {});

      roundManager.nextGameState();

      expect(toggleSpy).toHaveBeenCalledWith(character, true);
    });

    it('does not auto-activate a figure when automaticFirstFigure and initiativeRequired are both disabled', () => {
      settingsManager.settings.automaticFirstFigure = false;
      settingsManager.settings.initiativeRequired = false;
      gameManager.game.state = GameState.draw;
      const character = buildCharacter('test-char');
      character.initiative = 5;
      gameManager.game.figures = [character];
      const toggleSpy = vi.spyOn(roundManager, 'toggleFigure').mockImplementation(() => {});

      roundManager.nextGameState();

      expect(toggleSpy).not.toHaveBeenCalled();
    });

    it('sets working=true synchronously and resets it to false after a tick', async () => {
      gameManager.game.state = GameState.draw;
      gameManager.game.figures = [];

      roundManager.nextGameState();

      expect(roundManager.working).toBe(true);
      await new Promise((resolve) => setTimeout(resolve, 5));
      expect(roundManager.working).toBe(false);
    });
  });

  describe('beforeTurn', () => {
    it('turns a figure back on and deactivates its monster entities', () => {
      const monster = buildMonster('bandit-guard');
      const entity = buildMonsterEntity(monster);
      entity.active = true;
      monster.entities = [entity];
      monster.off = true;
      monster.active = false;

      roundManager.beforeTurn(monster);

      expect(monster.off).toBe(false);
      expect(entity.active).toBe(false);
    });

    it('resets an active summon back to inactive when activeSummons is enabled', () => {
      settingsManager.settings.activeSummons = true;
      const character = buildCharacter('test-char');
      character.off = true;
      const summon = buildSummon();
      summon.active = true;
      character.summons = [summon];

      roundManager.beforeTurn(character);

      expect(summon.active).toBe(false);
    });

    it('always clears figure.active at the end', () => {
      const character = buildCharacter('test-char');
      character.active = true;
      character.off = false;

      roundManager.beforeTurn(character);

      expect(character.active).toBe(false);
    });
  });

  describe('turn', () => {
    it('marks the figure active', () => {
      const character = buildCharacter('test-char');
      character.active = false;

      roundManager.turn(character);

      expect(character.active).toBe(true);
    });

    it('activates all alive, non-newly-summoned monster entities when none is already active', () => {
      const monster = buildMonster('bandit-guard');
      const e1 = buildMonsterEntity(monster, 1);
      const e2 = buildMonsterEntity(monster, 2);
      monster.entities = [e1, e2];

      roundManager.turn(monster);

      expect(e1.active).toBe(true);
      expect(e2.active).toBe(true);
    });

    it('does not touch monster entity activation when one entity is already active', () => {
      const monster = buildMonster('bandit-guard');
      const e1 = buildMonsterEntity(monster, 1);
      const e2 = buildMonsterEntity(monster, 2);
      e1.active = true;
      e2.active = false;
      monster.entities = [e1, e2];

      roundManager.turn(monster);

      expect(e1.active).toBe(true);
      expect(e2.active).toBe(false);
    });

    it('ends the turn immediately (delegates to toggleFigure) for a character with no alive entities', () => {
      const character = buildCharacter('test-char');
      character.health = 0;
      const toggleSpy = vi.spyOn(roundManager, 'toggleFigure').mockImplementation(() => {});

      roundManager.turn(character);

      expect(toggleSpy).toHaveBeenCalledWith(character);
    });
  });

  describe('afterTurn', () => {
    it('marks the figure off and inactive', () => {
      const character = buildCharacter('test-char');
      character.off = false;
      character.active = true;

      roundManager.afterTurn(character);

      expect(character.off).toBe(true);
      expect(character.active).toBe(false);
    });

    it('deactivates and marks off every monster entity', () => {
      const monster = buildMonster('bandit-guard');
      const e1 = buildMonsterEntity(monster, 1);
      const e2 = buildMonsterEntity(monster, 2);
      e1.active = true;
      e2.active = true;
      monster.entities = [e1, e2];
      monster.off = false;

      roundManager.afterTurn(monster);

      expect(e1.active).toBe(false);
      expect(e1.off).toBe(true);
      expect(e2.active).toBe(false);
      expect(e2.off).toBe(true);
    });

    it('skips entity deactivation when the figure was already off', () => {
      const monster = buildMonster('bandit-guard');
      const e1 = buildMonsterEntity(monster, 1);
      e1.active = true;
      e1.off = false;
      monster.entities = [e1];
      monster.off = true;

      roundManager.afterTurn(monster);

      // guarded body skipped: entity untouched, figure stays off/inactive
      expect(e1.active).toBe(true);
      expect(monster.off).toBe(true);
      expect(monster.active).toBe(false);
    });

    it('advances a bb-elite monster to its next ability and keeps it on for an extra activation', () => {
      const monster = buildMonster('bandit-guard');
      monster.bb = true;
      monster.tags = ['bb-elite'];
      monster.abilities = ['a1', 'a2', 'a3'] as any;
      monster.ability = 0;
      monster.off = false;

      roundManager.afterTurn(monster);

      expect(monster.tags).toContain('roundAction-bb-elite');
      expect(monster.ability).toBe(1);
      expect(monster.off).toBe(false);
    });

    it('wraps the bb-elite ability index back to 0 once it reaches the end of the abilities list', () => {
      const monster = buildMonster('bandit-guard');
      monster.bb = true;
      monster.tags = ['bb-elite'];
      monster.abilities = ['a1', 'a2'] as any;
      monster.ability = 1;
      monster.off = false;

      roundManager.afterTurn(monster);

      expect(monster.ability).toBe(0);
    });
  });

  describe('toggleFigure', () => {
    it('activates the given figure when nothing else is active', () => {
      const figure1 = buildCharacter('test-char');
      const figure2 = buildCharacter('test-char2');
      gameManager.game.figures = [figure1, figure2];

      roundManager.toggleFigure(figure1);

      expect(figure1.active).toBe(true);
      expect(figure1.off).toBe(false);
    });

    it('logs an error and makes no changes for a figure that is not part of game.figures', () => {
      const figure1 = buildCharacter('test-char');
      gameManager.game.figures = [figure1];
      const foreign = buildCharacter('other-char');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      roundManager.toggleFigure(foreign);

      expect(errorSpy).toHaveBeenCalledWith('Invalid figure');
      expect(foreign.active).toBe(false);
    });

    it("ends the active figure's turn and activates the next gameplay figure in order", () => {
      const figure1 = buildCharacter('test-char');
      const figure2 = buildCharacter('test-char2');
      figure1.active = true;
      gameManager.game.figures = [figure1, figure2];

      roundManager.toggleFigure(figure1);

      expect(figure1.active).toBe(false);
      expect(figure1.off).toBe(true);
      expect(figure2.active).toBe(true);
    });

    it('skips a non-escort objective container without an objectiveId while advancing to the next figure', () => {
      const figure1 = buildCharacter('test-char');
      const objective = new ObjectiveContainer('uuid-1'); // no identifier -> skipObjective() is true
      objective.entities = [new ObjectiveEntity('entity-1', 1, objective, undefined)]; // gives it a live entity so it is a gameplayFigure candidate
      const figure2 = buildCharacter('test-char2');
      figure1.active = true;
      gameManager.game.figures = [figure1, objective, figure2];

      roundManager.toggleFigure(figure1);

      expect(figure2.active).toBe(true);
      expect(objective.off).toBe(true);
    });

    it('does not advance to the next figure while the character has an active, non-afterTurn summon still to resolve', () => {
      settingsManager.settings.activeSummons = true;
      const figure1 = buildCharacter('test-char');
      const figure2 = buildCharacter('test-char2');
      figure1.active = true;
      const summon = buildSummon();
      summon.active = true;
      summon.afterTurn = false;
      figure1.summons = [summon];
      gameManager.game.figures = [figure1, figure2];

      roundManager.toggleFigure(figure1);

      expect(figure1.active).toBe(true);
      expect(figure2.active).toBe(false);
    });

    it('automatically starts the next round when automaticEndRound is enabled and every figure has finished', () => {
      settingsManager.settings.automaticEndRound = true;
      gameManager.game.state = GameState.next;
      const figure1 = buildCharacter('test-char');
      figure1.active = true;
      gameManager.game.figures = [figure1];
      const nextGameStateSpy = vi.spyOn(roundManager, 'nextGameState').mockImplementation(() => {});

      roundManager.toggleFigure(figure1);

      expect(nextGameStateSpy).toHaveBeenCalled();
    });

    it('does not auto-end the round when automaticEndRound is disabled', () => {
      settingsManager.settings.automaticEndRound = false;
      gameManager.game.state = GameState.next;
      const figure1 = buildCharacter('test-char');
      figure1.active = true;
      gameManager.game.figures = [figure1];
      const nextGameStateSpy = vi.spyOn(roundManager, 'nextGameState').mockImplementation(() => {});

      roundManager.toggleFigure(figure1);

      expect(nextGameStateSpy).not.toHaveBeenCalled();
    });
  });
});
