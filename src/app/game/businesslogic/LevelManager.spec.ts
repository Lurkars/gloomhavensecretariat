import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { LevelManager } from 'src/app/game/businesslogic/LevelManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterClass, CharacterData, CharacterGender } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterStat } from 'src/app/game/model/data/MonsterStat';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Monster } from 'src/app/game/model/Monster';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';

function buildCharacterData(name: string = 'test-char', levels: number[] = [1, 2, 3]): CharacterData {
  const data = new CharacterData();
  data.name = name;
  data.edition = 'gh';
  data.characterClass = CharacterClass.human;
  data.gender = CharacterGender.male;
  data.stats = levels.map((level) => new CharacterStat(level, 10 * level));
  return data;
}

function buildCharacter(name: string = 'test-char', level: number = 1): Character {
  return new Character(buildCharacterData(name, [1, 2, 3, 4, 5, 6, 7, 8, 9]), level);
}

function buildMonster(name: string = 'test-monster', level: number = 1): Monster {
  const data = new MonsterData();
  data.name = name;
  data.edition = 'gh';
  data.baseStat = new MonsterStat(MonsterType.normal, level, 10);
  data.stats = [new MonsterStat(MonsterType.normal, level, 10)];
  return new Monster(data, level);
}

describe('LevelManager', () => {
  let levelManager: LevelManager;

  beforeEach(() => {
    // reset the shared gameManager.game fixture to known defaults
    gameManager.game.figures = [];
    gameManager.game.level = 1;
    gameManager.game.levelAdjustment = 0;
    gameManager.game.bonusAdjustment = 0;
    gameManager.game.ge5Player = false;
    gameManager.game.ge5PlayerCapped = false;
    gameManager.game.solo = false;
    gameManager.game.playerCount = -1;
    settingsManager.settings.alwaysFhSolo = false;
    settingsManager.settings.alwaysHazardousTerrain = false;

    levelManager = new LevelManager(gameManager.game);
    vi.spyOn(gameManager, 'fhRules').mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ge5PlayerOffset', () => {
    it('returns 0 when ge5Player is disabled', () => {
      gameManager.game.ge5Player = false;
      expect(levelManager.ge5PlayerOffset()).toBe(0);
    });

    it('returns 0 when ge5Player enabled but 4 or fewer characters', () => {
      gameManager.game.ge5Player = true;
      vi.spyOn(gameManager.characterManager, 'characterCount').mockReturnValue(4);
      expect(levelManager.ge5PlayerOffset()).toBe(0);
    });

    it('returns chars - 3 when ge5Player enabled and more than 4 characters', () => {
      gameManager.game.ge5Player = true;
      vi.spyOn(gameManager.characterManager, 'characterCount').mockReturnValue(5);
      expect(levelManager.ge5PlayerOffset()).toBe(2);
    });

    it('returns chars - 3 for 6 characters', () => {
      gameManager.game.ge5Player = true;
      vi.spyOn(gameManager.characterManager, 'characterCount').mockReturnValue(6);
      expect(levelManager.ge5PlayerOffset()).toBe(3);
    });
  });

  describe('adjustedLevel', () => {
    it('returns the base game level when nothing is adjusted', () => {
      gameManager.game.level = 3;
      expect(levelManager.adjustedLevel()).toBe(3);
    });

    it('subtracts 1 for solo play under non-fh rules without alwaysFhSolo', () => {
      gameManager.game.level = 3;
      gameManager.game.solo = true;
      expect(levelManager.adjustedLevel()).toBe(2);
    });

    it('does not subtract for solo play under fh rules', () => {
      gameManager.game.level = 3;
      gameManager.game.solo = true;
      vi.spyOn(gameManager, 'fhRules').mockReturnValue(true);
      expect(levelManager.adjustedLevel()).toBe(3);
    });

    it('does not subtract for solo play when alwaysFhSolo setting is enabled', () => {
      gameManager.game.level = 3;
      gameManager.game.solo = true;
      settingsManager.settings.alwaysFhSolo = true;
      expect(levelManager.adjustedLevel()).toBe(3);
    });

    it('applies bonusAdjustment', () => {
      gameManager.game.level = 3;
      gameManager.game.bonusAdjustment = 2;
      expect(levelManager.adjustedLevel()).toBe(5);
    });

    it('applies negative bonusAdjustment', () => {
      gameManager.game.level = 3;
      gameManager.game.bonusAdjustment = -2;
      expect(levelManager.adjustedLevel()).toBe(1);
    });

    it('clamps to 0 when the computed level would be negative', () => {
      gameManager.game.level = 0;
      gameManager.game.bonusAdjustment = -5;
      expect(levelManager.adjustedLevel()).toBe(0);
    });

    it('clamps to 7 when the computed level would exceed 7', () => {
      gameManager.game.level = 7;
      gameManager.game.bonusAdjustment = 5;
      expect(levelManager.adjustedLevel()).toBe(7);
    });

    it('subtracts the ge5PlayerOffset', () => {
      gameManager.game.level = 5;
      gameManager.game.ge5Player = true;
      vi.spyOn(gameManager.characterManager, 'characterCount').mockReturnValue(6);
      expect(levelManager.adjustedLevel()).toBe(2);
    });
  });

  describe('trap', () => {
    it('uses the given level when in [0,7]', () => {
      expect(levelManager.trap(4)).toBe(6);
    });

    it('uses game.level when level is out of range (negative)', () => {
      gameManager.game.level = 2;
      expect(levelManager.trap(-1)).toBe(4);
    });

    it('uses game.level when level is out of range (> 7)', () => {
      gameManager.game.level = 3;
      expect(levelManager.trap(8)).toBe(5);
    });

    it('uses game.level by default (no arg)', () => {
      gameManager.game.level = 0;
      expect(levelManager.trap()).toBe(2);
    });

    it('boundary: level 0', () => {
      expect(levelManager.trap(0)).toBe(2);
    });

    it('boundary: level 7', () => {
      expect(levelManager.trap(7)).toBe(9);
    });
  });

  describe('experience', () => {
    it('uses the given level when in [0,7]', () => {
      expect(levelManager.experience(4)).toBe(12);
    });

    it('falls back to adjustedLevel when out of range', () => {
      gameManager.game.level = 2;
      expect(levelManager.experience(-1)).toBe(8);
    });

    it('boundary: level 0', () => {
      expect(levelManager.experience(0)).toBe(4);
    });

    it('boundary: level 7', () => {
      expect(levelManager.experience(7)).toBe(18);
    });
  });

  describe('loot', () => {
    it('computes loot for a given level', () => {
      // 2 + floor(4/2) + floor(4/7) = 2 + 2 + 0 = 4
      expect(levelManager.loot(4)).toBe(4);
    });

    it('falls back to adjustedLevel when out of range', () => {
      gameManager.game.level = 6;
      // adjustedLevel() = 6 -> 2 + floor(6/2) + floor(6/7) = 2 + 3 + 0 = 5
      expect(levelManager.loot(-1)).toBe(5);
    });

    it('boundary: level 0', () => {
      expect(levelManager.loot(0)).toBe(2);
    });

    it('boundary: level 7', () => {
      // 2 + floor(7/2) + floor(7/7) = 2 + 3 + 1 = 6
      expect(levelManager.loot(7)).toBe(6);
    });
  });

  describe('terrain', () => {
    it('uses trap-based formula by default', () => {
      // trap(4) = 6, floor(6/2) = 3
      expect(levelManager.terrain(4)).toBe(3);
    });

    it('uses the hazardous terrain formula when alwaysHazardousTerrain is set', () => {
      settingsManager.settings.alwaysHazardousTerrain = true;
      // 1 + ceil(4/3) = 1 + 2 = 3
      expect(levelManager.terrain(4)).toBe(3);
    });

    it('uses the hazardous terrain formula under fh rules', () => {
      vi.spyOn(gameManager, 'fhRules').mockReturnValue(true);
      // 1 + ceil(5/3) = 1 + 2 = 3
      expect(levelManager.terrain(5)).toBe(3);
    });

    it('falls back to game.level for the hazardous formula when level is out of range', () => {
      settingsManager.settings.alwaysHazardousTerrain = true;
      gameManager.game.level = 2;
      // 1 + ceil(2/3) = 1 + 1 = 2
      expect(levelManager.terrain(-1)).toBe(2);
    });
  });

  describe('bbMonsterDifficutly', () => {
    it('computes 2 + levelAdjustment', () => {
      gameManager.game.levelAdjustment = 1;
      expect(levelManager.bbMonsterDifficutly()).toBe(3);
    });

    it('clamps to 0 minimum', () => {
      gameManager.game.levelAdjustment = -10;
      expect(levelManager.bbMonsterDifficutly()).toBe(0);
    });

    it('clamps to 4 maximum', () => {
      gameManager.game.levelAdjustment = 10;
      expect(levelManager.bbMonsterDifficutly()).toBe(4);
    });
  });

  describe('scenarioLevel', () => {
    it('returns 1 when there are no characters', () => {
      vi.spyOn(gameManager.characterManager, 'characterCount').mockReturnValue(0);
      expect(levelManager.scenarioLevel()).toBe(1);
    });

    it('computes ceil(avgCharLevel / 2) for a single character party', () => {
      const character = buildCharacter('a', 4);
      gameManager.game.figures = [character];
      vi.spyOn(gameManager.characterManager, 'characterCount').mockReturnValue(1);
      // ceil(4/2) = 2
      expect(levelManager.scenarioLevel()).toBe(2);
    });

    it('ignores absent characters when summing levels but not when counting via characterManager stub', () => {
      const a = buildCharacter('a', 4);
      const b = buildCharacter('b', 2);
      b.absent = true;
      gameManager.game.figures = [a, b];
      vi.spyOn(gameManager.characterManager, 'characterCount').mockReturnValue(1);
      // only 'a' (level 4) counted in the sum; charCount forced to 1 -> ceil(4/1/2) = 2
      expect(levelManager.scenarioLevel()).toBe(2);
    });

    it('adds 1 for solo play under non-fh rules', () => {
      const a = buildCharacter('a', 4);
      gameManager.game.figures = [a];
      gameManager.game.solo = true;
      vi.spyOn(gameManager.characterManager, 'characterCount').mockReturnValue(1);
      // ceil(4/1/2) + 1(solo, non-fh) = 2 + 1 = 3
      expect(levelManager.scenarioLevel()).toBe(3);
    });
  });

  describe('calculateScenarioLevel', () => {
    it('clamps levelAdjustment to [-6, 6] before use', () => {
      vi.spyOn(gameManager.characterManager, 'characterCount').mockReturnValue(0);
      gameManager.game.levelAdjustment = 20;
      levelManager.calculateScenarioLevel();
      expect(gameManager.game.levelAdjustment).toBe(6);
    });

    it('clamps levelAdjustment to -6 minimum', () => {
      vi.spyOn(gameManager.characterManager, 'characterCount').mockReturnValue(0);
      gameManager.game.levelAdjustment = -20;
      levelManager.calculateScenarioLevel();
      expect(gameManager.game.levelAdjustment).toBe(-6);
    });

    it('sets game.level from scenarioLevel + levelAdjustment, clamped to [0,7]', () => {
      vi.spyOn(gameManager.characterManager, 'characterCount').mockReturnValue(0);
      gameManager.game.levelAdjustment = 3;
      levelManager.calculateScenarioLevel();
      // scenarioLevel() with 0 chars = 1; 1 + 3 = 4
      expect(gameManager.game.level).toBe(4);
    });
  });

  describe('setLevel', () => {
    it('updates game.level and adjusts monster figure levels by the diff', () => {
      const monster = buildMonster('m', 2);
      gameManager.game.figures = [monster];
      gameManager.game.level = 2;
      vi.spyOn(gameManager.monsterManager, 'setLevel').mockImplementation(() => {});

      levelManager.setLevel(4);

      expect(gameManager.game.level).toBe(4);
      expect(monster.level).toBe(4);
    });

    it('clamps monster level to 7 maximum after the diff is applied', () => {
      const monster = buildMonster('m', 6);
      gameManager.game.figures = [monster];
      gameManager.game.level = 6;
      vi.spyOn(gameManager.monsterManager, 'setLevel').mockImplementation(() => {});

      levelManager.setLevel(7);
      // diff = 1, monster level goes from 6 -> 7 (still within range)
      levelManager.setLevel(20, true);
      // now diff = 13, monster level 7 + 13 = 20 clamped to 7
      expect(monster.level).toBe(7);
    });

    it('clamps monster level to 0 minimum after the diff is applied', () => {
      const monster = buildMonster('m', 2);
      gameManager.game.figures = [monster];
      gameManager.game.level = 2;
      vi.spyOn(gameManager.monsterManager, 'setLevel').mockImplementation(() => {});

      levelManager.setLevel(-5, true);
      expect(monster.level).toBe(0);
    });

    it('does nothing when the new level equals the current one and force is false', () => {
      const monster = buildMonster('m', 2);
      gameManager.game.figures = [monster];
      gameManager.game.level = 3;
      const spy = vi.spyOn(gameManager.monsterManager, 'setLevel').mockImplementation(() => {});

      levelManager.setLevel(3);

      expect(spy).not.toHaveBeenCalled();
    });

    it('caps objective entity health to the container health when it exceeds it', () => {
      const objective = new ObjectiveContainer('uuid-1');
      objective.health = 5;
      const entity = { health: 10 } as any;
      objective.entities = [entity];
      gameManager.game.figures = [objective];
      gameManager.game.level = 2;

      levelManager.setLevel(4);

      expect(entity.health).toBe(5);
      expect(objective.health).toBe(5);
    });

    it('leaves objective entity health untouched when it does not exceed container health', () => {
      const objective = new ObjectiveContainer('uuid-1');
      objective.health = 5;
      const entity = { health: 3 } as any;
      objective.entities = [entity];
      gameManager.game.figures = [objective];
      gameManager.game.level = 2;

      levelManager.setLevel(4);

      expect(entity.health).toBe(3);
      expect(objective.health).toBe(5);
    });
  });

  describe('characterCountVariable', () => {
    it('returns at least 2 even with fewer characters', () => {
      vi.spyOn(gameManager.characterManager, 'characterCount').mockReturnValue(1);
      expect(levelManager.characterCountVariable()).toBe(2);
    });

    it('returns the actual character count within [2,4] when ge5Player disabled', () => {
      vi.spyOn(gameManager.characterManager, 'characterCount').mockReturnValue(3);
      gameManager.game.ge5Player = false;
      expect(levelManager.characterCountVariable()).toBe(3);
    });

    it('caps at 4 when ge5Player disabled even with more characters', () => {
      vi.spyOn(gameManager.characterManager, 'characterCount').mockReturnValue(6);
      gameManager.game.ge5Player = false;
      expect(levelManager.characterCountVariable()).toBe(4);
    });

    it('allows more than 4 when ge5Player enabled and not capped', () => {
      vi.spyOn(gameManager.characterManager, 'characterCount').mockReturnValue(6);
      gameManager.game.ge5Player = true;
      gameManager.game.ge5PlayerCapped = false;
      expect(levelManager.characterCountVariable()).toBe(6);
    });

    it('caps at 4 when ge5Player enabled but ge5PlayerCapped is set', () => {
      vi.spyOn(gameManager.characterManager, 'characterCount').mockReturnValue(6);
      gameManager.game.ge5Player = true;
      gameManager.game.ge5PlayerCapped = true;
      expect(levelManager.characterCountVariable()).toBe(4);
    });
  });
});
