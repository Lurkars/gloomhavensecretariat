import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterClass, CharacterData, CharacterGender } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { Loot, LootDeck, LootType } from 'src/app/game/model/data/Loot';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterStat } from 'src/app/game/model/data/MonsterStat';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { Scenario } from 'src/app/game/model/Scenario';
import { Summon, SummonColor } from 'src/app/game/model/Summon';

function buildCharacter(name: string = 'test-char'): Character {
  const data = new CharacterData();
  data.name = name;
  data.edition = 'gh';
  data.characterClass = CharacterClass.human;
  data.gender = CharacterGender.male;
  data.stats = [new CharacterStat(1, 10)];
  return new Character(data, 1);
}

function buildMonster(name: string = 'test-monster', level: number = 1): Monster {
  const data = new MonsterData();
  data.name = name;
  data.edition = 'gh';
  data.baseStat = new MonsterStat(MonsterType.normal, level, 10);
  data.stats = [new MonsterStat(MonsterType.normal, level, 10)];
  return new Monster(data, level);
}

function buildMonsterEntity(monster: Monster): MonsterEntity {
  const entity = new MonsterEntity(1, MonsterType.normal, monster);
  return entity;
}

function buildSummon(): Summon {
  return new Summon('uuid-1', 'bear', '1', 1, 1, SummonColor.blue);
}

describe('ScenarioStatsManager', () => {
  let scenarioStatsManager: typeof gameManager.scenarioStatsManager;

  beforeEach(() => {
    gameManager.game.figures = [];
    scenarioStatsManager = gameManager.scenarioStatsManager;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('applyDamage', () => {
    it('tracks damage a character deals to another character as monsterDamage when a monster is active', () => {
      const attacker = buildMonster();
      attacker.active = true;
      const target = buildCharacter('target');
      target.health = 10;
      gameManager.game.figures = [attacker, target];

      scenarioStatsManager.applyDamage(target, target, 3);

      expect(target.scenarioStats.monsterDamage).toBe(3);
      expect(target.scenarioStats.otherDamage).toBe(0);
    });

    it('tracks damage a character deals to another character as otherDamage when no monster is active', () => {
      const attacker = buildCharacter('attacker');
      attacker.active = true;
      const target = buildCharacter('target');
      target.health = 10;
      gameManager.game.figures = [attacker, target];

      scenarioStatsManager.applyDamage(target, target, 3);

      expect(target.scenarioStats.otherDamage).toBe(3);
      expect(target.scenarioStats.monsterDamage).toBe(0);
    });

    it('increments exhausts when damage brings health from positive to <= 0', () => {
      // applyDamage() is called *after* the health field has already been decremented by
      // `value` elsewhere; it infers "this hit exhausted the character" via
      // `entity.health <= 0 && entity.health + value > 0` (i.e. post-hit health is non-positive,
      // but pre-hit health, health + value, was positive).
      const target = buildCharacter('target');
      target.health = -2; // post-hit health; pre-hit health was -2 + 5 = 3 (positive)
      gameManager.game.figures = [target];

      scenarioStatsManager.applyDamage(target, target, 5);

      expect(target.scenarioStats.exhausts).toBe(1);
    });

    it('does not increment exhausts when health was already <= 0 before the damage', () => {
      const target = buildCharacter('target');
      target.health = -6; // post-hit health; pre-hit health was -6 + 5 = -1 (already <= 0)
      gameManager.game.figures = [target];

      scenarioStatsManager.applyDamage(target, target, 5);

      expect(target.scenarioStats.exhausts).toBe(0);
    });

    it('tracks maxDamage as the running maximum single hit', () => {
      const target = buildCharacter('target');
      target.health = 100;
      gameManager.game.figures = [target];

      scenarioStatsManager.applyDamage(target, target, 3);
      scenarioStatsManager.applyDamage(target, target, 7);
      scenarioStatsManager.applyDamage(target, target, 2);

      expect(target.scenarioStats.maxDamage).toBe(7);
    });

    it('tracks damage dealt to a summon under figure.scenarioStats.summons', () => {
      const owner = buildCharacter('owner');
      owner.health = 100;
      const summon = buildSummon();
      summon.health = 5;
      owner.summons = [summon];
      gameManager.game.figures = [owner];

      scenarioStatsManager.applyDamage(summon, owner, 4);

      expect(owner.scenarioStats.summons.otherDamage).toBe(4);
    });

    it('increments summons.exhausts when a summon dies from the hit', () => {
      const owner = buildCharacter('owner');
      const summon = buildSummon();
      summon.health = -2; // post-hit health; pre-hit health was -2 + 5 = 3 (positive)
      owner.summons = [summon];
      gameManager.game.figures = [owner];

      scenarioStatsManager.applyDamage(summon, owner, 5);

      expect(owner.scenarioStats.summons.exhausts).toBe(1);
    });

    it('tracks damage dealt BY an active character to a monster as dealtDamage', () => {
      const character = buildCharacter('attacker');
      character.active = true;
      const monster = buildMonster();
      gameManager.game.figures = [character, monster];

      scenarioStatsManager.applyDamage(monster as any, monster, 6);

      expect(character.scenarioStats.dealtDamage).toBe(6);
      expect(character.scenarioStats.maxDealtDamage).toBe(6);
    });

    it('attributes damage dealt to a monster to the summons stats when the character summon is active', () => {
      const character = buildCharacter('attacker');
      character.active = true;
      const summon = buildSummon();
      summon.active = true;
      character.summons = [summon];
      const monster = buildMonster();
      gameManager.game.figures = [character, monster];

      scenarioStatsManager.applyDamage(monster as any, monster, 6);

      expect(character.scenarioStats.summons.dealtDamage).toBe(6);
      expect(character.scenarioStats.dealtDamage).toBe(0);
    });

    it('does nothing when neither figure nor active figure is a character', () => {
      const monster = buildMonster();
      monster.active = true;
      const otherMonster = buildMonster('other');
      gameManager.game.figures = [monster, otherMonster];

      expect(() => scenarioStatsManager.applyDamage(otherMonster as any, otherMonster, 5)).not.toThrow();
    });
  });

  describe('applyHeal', () => {
    it('tracks healedDamage on the healed character and heals on the active character', () => {
      const healer = buildCharacter('healer');
      healer.active = true;
      const target = buildCharacter('target');
      gameManager.game.figures = [healer, target];

      scenarioStatsManager.applyHeal(target, target, 4);

      expect(target.scenarioStats.healedDamage).toBe(4);
      expect(healer.scenarioStats.heals).toBe(4);
    });

    it('tracks healed summon damage under figure.scenarioStats.summons.healedDamage', () => {
      const healer = buildCharacter('healer');
      healer.active = true;
      const owner = buildCharacter('owner');
      const summon = buildSummon();
      owner.summons = [summon];
      gameManager.game.figures = [healer, owner];

      scenarioStatsManager.applyHeal(summon, owner, 4);

      expect(owner.scenarioStats.summons.healedDamage).toBe(4);
    });

    it('attributes heals to summons.heals when the active character summon is active', () => {
      const healer = buildCharacter('healer');
      healer.active = true;
      const summon = buildSummon();
      summon.active = true;
      healer.summons = [summon];
      const target = buildCharacter('target');
      gameManager.game.figures = [healer, target];

      scenarioStatsManager.applyHeal(target, target, 4);

      expect(healer.scenarioStats.summons.heals).toBe(4);
      expect(healer.scenarioStats.heals).toBe(0);
    });

    it('does nothing when the active figure is not a character', () => {
      const monster = buildMonster();
      monster.active = true;
      const target = buildCharacter('target');
      gameManager.game.figures = [monster, target];

      scenarioStatsManager.applyHeal(target, target, 4);

      expect(target.scenarioStats.healedDamage).toBe(0);
    });
  });

  describe('killMonsterEntity', () => {
    it('increments normalKills for the active character on a dead normal monster entity', () => {
      const character = buildCharacter('attacker');
      character.active = true;
      const monster = buildMonster();
      const entity = buildMonsterEntity(monster);
      entity.dead = true;
      gameManager.game.figures = [character, monster];

      scenarioStatsManager.killMonsterEntity(entity);

      expect(character.scenarioStats.normalKills).toBe(1);
    });

    it('increments eliteKills for elite-type monster entities', () => {
      const character = buildCharacter('attacker');
      character.active = true;
      const monster = buildMonster();
      const entity = buildMonsterEntity(monster);
      entity.type = MonsterType.elite;
      entity.dead = true;
      gameManager.game.figures = [character, monster];

      scenarioStatsManager.killMonsterEntity(entity);

      expect(character.scenarioStats.eliteKills).toBe(1);
    });

    it('increments bossKills for boss-type monster entities', () => {
      const character = buildCharacter('attacker');
      character.active = true;
      const monster = buildMonster();
      const entity = buildMonsterEntity(monster);
      entity.type = MonsterType.boss;
      entity.dead = true;
      gameManager.game.figures = [character, monster];

      scenarioStatsManager.killMonsterEntity(entity);

      expect(character.scenarioStats.bossKills).toBe(1);
    });

    it('attributes kills to summons.normalKills when the active character summon is active', () => {
      const character = buildCharacter('attacker');
      character.active = true;
      const summon = buildSummon();
      summon.active = true;
      character.summons = [summon];
      const monster = buildMonster();
      const entity = buildMonsterEntity(monster);
      entity.dead = true;
      gameManager.game.figures = [character, monster];

      scenarioStatsManager.killMonsterEntity(entity);

      expect(character.scenarioStats.summons.normalKills).toBe(1);
      expect(character.scenarioStats.normalKills).toBe(0);
    });

    it('does nothing for an entity that is not dead', () => {
      const character = buildCharacter('attacker');
      character.active = true;
      const monster = buildMonster();
      const entity = buildMonsterEntity(monster);
      entity.dead = false;
      gameManager.game.figures = [character, monster];

      scenarioStatsManager.killMonsterEntity(entity);

      expect(character.scenarioStats.normalKills).toBe(0);
    });
  });

  describe('applyScenarioStats', () => {
    it('records scenario identity, success, level, difficulty, gold, xp and treasure count', () => {
      const character = buildCharacter();
      character.loot = 12;
      character.experience = 34;
      character.treasures = ['a', 'b'];
      character.level = 3;
      gameManager.game.level = 4;

      const scenarioData = new ScenarioData();
      scenarioData.index = '1';
      scenarioData.edition = 'gh';
      const scenario = new Scenario(scenarioData);

      scenarioStatsManager.applyScenarioStats(character, scenario, true);

      expect(character.scenarioStats.success).toBe(true);
      expect(character.scenarioStats.level).toBe(3);
      expect(character.scenarioStats.difficulty).toBe(4);
      expect(character.scenarioStats.gold).toBe(12);
      expect(character.scenarioStats.xp).toBe(34);
      expect(character.scenarioStats.treasures).toBe(2);
      expect(character.scenarioStats.scenario).toMatchObject({ index: '1', edition: 'gh' });
    });

    it('records success=false when the scenario was not successful', () => {
      const character = buildCharacter();
      const scenario = new Scenario(new ScenarioData());

      scenarioStatsManager.applyScenarioStats(character, scenario, false);

      expect(character.scenarioStats.success).toBe(false);
    });

    it('aggregates loot value per type from lootCards using lootManager.getValue', () => {
      const character = buildCharacter();
      character.lootCards = [0, 1];
      gameManager.game.lootDeck = new LootDeck();
      gameManager.game.lootDeck.cards = [new Loot(LootType.money, 1, 2), new Loot(LootType.money, 2, 3)];
      vi.spyOn(gameManager.lootManager, 'getValue').mockImplementation((loot) => loot.value4P);

      const scenario = new Scenario(new ScenarioData());
      scenarioStatsManager.applyScenarioStats(character, scenario, true);

      expect(character.scenarioStats.loot[LootType.money]).toBe(5);
    });

    it('ignores lootCards indices that do not resolve to a loot card', () => {
      const character = buildCharacter();
      character.lootCards = [99];
      gameManager.game.lootDeck = new LootDeck();
      gameManager.game.lootDeck.cards = [];

      const scenario = new Scenario(new ScenarioData());
      expect(() => scenarioStatsManager.applyScenarioStats(character, scenario, true)).not.toThrow();
      expect(character.scenarioStats.loot).toEqual({});
    });
  });
});
