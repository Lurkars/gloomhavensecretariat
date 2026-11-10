import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { KILLED_TAG } from 'src/app/game/businesslogic/MonsterManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { AbilityCard } from 'src/app/game/model/data/AbilityCard';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { DeckData } from 'src/app/game/model/data/DeckData';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { FigureErrorType } from 'src/app/game/model/data/FigureError';
import { AdditionalIdentifier } from 'src/app/game/model/data/Identifier';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterStat } from 'src/app/game/model/data/MonsterStat';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { PersonalQuest, PersonalQuestRequirement } from 'src/app/game/model/data/PersonalQuest';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { Summon, SummonColor, SummonState } from 'src/app/game/model/Summon';

function buildCharacter(name: string, edition: string = 'gh'): Character {
  const data = Object.assign(new CharacterData(), { name, edition, stats: [new CharacterStat(1, 10)] });
  return new Character(data, 1);
}

// This spec covers the entity bookkeeping helpers that only need a Monster + MonsterEntity
// fixture (getStat, the entity/standee counting helpers, and the two entity comparators), plus the
// ability-deck logic below (getAbility/hasBottomActions/getSameDeckMonster/drawAbility/
// drawnAbilities). Those depend on loaded edition data through gameManager.abilities()/deckData(),
// which are mocked directly here to isolate MonsterManager's own deck-advancing decisions from
// that data-lookup layer.

function buildMonsterData(overrides: Partial<MonsterData> = {}): MonsterData {
  return Object.assign(new MonsterData(), overrides);
}

function buildMonster(overrides: Partial<MonsterData> = {}, level: number = 1): Monster {
  return new Monster(buildMonsterData(overrides), level);
}

describe('MonsterManager', () => {
  const monsterManager = gameManager.monsterManager;

  beforeEach(() => {
    gameManager.game.figures = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStat', () => {
    it('finds the stat matching the monster level and type', () => {
      const normalStat = new MonsterStat(MonsterType.normal, 1, 8, 2, 3, 0);
      const eliteStat = new MonsterStat(MonsterType.elite, 1, 10, 2, 4, 0);
      const monster = buildMonster({ stats: [normalStat, eliteStat] }, 1);

      expect(monsterManager.getStat(monster, MonsterType.normal)).toEqual(normalStat);
      expect(monsterManager.getStat(monster, MonsterType.elite)).toEqual(eliteStat);
    });

    it('falls back to a default stat and records a stat FigureError when nothing matches', () => {
      const monster = buildMonster({ stats: [], name: 'bandit-guard', edition: 'gh' }, 3);

      const stat = monsterManager.getStat(monster, MonsterType.normal);

      expect(stat.level).toEqual(3);
      expect(stat.type).toEqual(MonsterType.normal);
      expect(monster.errors && monster.errors.some((e) => e.type === FigureErrorType.stat)).toBe(true);
    });

    it('uses stats[0] for a bb elite monster when it is the elite stat', () => {
      const eliteStat = new MonsterStat(MonsterType.elite, 1, 12, 2, 5, 0);
      const monster = buildMonster({ stats: [eliteStat], editionRules: 'bb' }, 1);

      expect(monsterManager.getStat(monster, MonsterType.elite).health).toEqual(12);
    });

    it('derives a stat from baseStat for a bb monster requesting a non-matching type', () => {
      const baseStat = new MonsterStat(MonsterType.normal, 0, 6, 1, 2, 0);
      const monster = buildMonster({ stats: [], baseStat, editionRules: 'bb' }, 1);

      const stat = monsterManager.getStat(monster, MonsterType.normal);
      expect(stat.health).toEqual(6);
    });
  });

  describe('monsterEntityCount', () => {
    it('counts alive entities, optionally restricted to standees (number > 0) and type', () => {
      const monster = buildMonster({ stats: [new MonsterStat(MonsterType.normal, 1, 10, 2, 3, 0)] }, 1);
      const standee = new MonsterEntity(1, MonsterType.normal, monster);
      const summonEntity = new MonsterEntity(0, MonsterType.normal, monster); // number 0 => not a "standee"
      monster.entities = [standee, summonEntity];

      expect(monsterManager.monsterEntityCount(monster)).toEqual(2);
      expect(monsterManager.monsterEntityCount(monster, true)).toEqual(1);
    });

    it('excludes dead entities unless they are dormant', () => {
      const monster = buildMonster({ stats: [new MonsterStat(MonsterType.normal, 1, 10, 2, 3, 0)] }, 1);
      const dead = new MonsterEntity(1, MonsterType.normal, monster);
      dead.health = 0;
      const dormant = new MonsterEntity(2, MonsterType.normal, monster);
      dormant.health = 0;
      dormant.dormant = true;
      monster.entities = [dead, dormant];

      expect(monsterManager.monsterEntityCount(monster)).toEqual(1);
    });

    it('filters by monster type when given', () => {
      const monster = buildMonster(
        { stats: [new MonsterStat(MonsterType.normal, 1, 10, 2, 3, 0), new MonsterStat(MonsterType.elite, 1, 12, 2, 4, 0)] },
        1
      );
      const normal = new MonsterEntity(1, MonsterType.normal, monster);
      const elite = new MonsterEntity(2, MonsterType.elite, monster);
      monster.entities = [normal, elite];

      expect(monsterManager.monsterEntityCount(monster, false, MonsterType.elite)).toEqual(1);
    });
  });

  describe('removeMonsterEntity', () => {
    it('is a no-op when called again for an entity already removed, instead of splicing out an unrelated standee', () => {
      // Several UI flows (health dialog, standee drag, condition resolution) independently detect
      // the same dead entity and each schedule their own delayed removal; a redundant second call
      // must not touch the entities array at all, since `indexOf` returning -1 would otherwise make
      // `splice(-1, 1)` delete the last (unrelated) entity instead of doing nothing.
      const original = settingsManager.settings.scenarioStats;
      settingsManager.settings.scenarioStats = true;

      const monster = buildMonster({ name: 'bandit-guard', edition: 'gh', stats: [new MonsterStat(MonsterType.normal, 1, 10)] }, 1);
      const killedEntity = new MonsterEntity(1, MonsterType.normal, monster);
      killedEntity.dead = true;
      const survivor = new MonsterEntity(2, MonsterType.normal, monster);
      monster.entities = [killedEntity, survivor];

      const character = buildCharacter('brute');
      character.active = true;
      gameManager.game.figures = [character, monster];

      monsterManager.removeMonsterEntity(monster, killedEntity);
      monsterManager.removeMonsterEntity(monster, killedEntity);

      expect(monster.entities).toEqual([survivor]);
      expect(character.scenarioStats.normalKills).toEqual(1);

      settingsManager.settings.scenarioStats = original;
    });

    it('bumps personal quest "kill" progress for the active character on a monster death, independent of scenarioStats', () => {
      const original = settingsManager.settings.scenarioStats;
      settingsManager.settings.scenarioStats = false;

      const monster = buildMonster({ name: 'forest-imp', edition: 'gh', stats: [new MonsterStat(MonsterType.elite, 1, 10)] }, 1);
      const killedEntity = new MonsterEntity(1, MonsterType.elite, monster);
      killedEntity.dead = true;
      monster.entities = [killedEntity];

      const character = buildCharacter('brute', 'gh');
      character.active = true;
      character.progress.personalQuest = '513';
      character.progress.personalQuestAutotrack = true;
      gameManager.editionData = [
        Object.assign(new EditionData('gh', [], [], [], [], [], []), {
          personalQuests: [
            Object.assign(new PersonalQuest(), {
              cardId: '513',
              edition: 'gh',
              requirements: [Object.assign(new PersonalQuestRequirement(), { counter: 8, autotrack: 'kill:forest-imp' })]
            })
          ]
        })
      ];
      settingsManager.settings.editions = ['gh'];
      gameManager.game.figures = [character, monster];

      monsterManager.removeMonsterEntity(monster, killedEntity);

      expect(character.progress.personalQuestProgress[0]).toEqual(1);

      settingsManager.settings.scenarioStats = original;
    });
  });

  describe('kill attribution', () => {
    let original: boolean;

    beforeEach(() => {
      original = settingsManager.settings.scenarioStats;
      settingsManager.settings.scenarioStats = true;
    });

    afterEach(() => {
      settingsManager.settings.scenarioStats = original;
    });

    function setup(type: MonsterType = MonsterType.normal) {
      const monster = buildMonster({ name: 'forest-imp', edition: 'gh', stats: [new MonsterStat(type, 1, 3)] }, 1);
      const entity = new MonsterEntity(1, type, monster);
      entity.maxHealth = 3;
      entity.health = 3;
      monster.entities = [entity];
      const killer = buildCharacter('brute');
      killer.active = true;
      const other = buildCharacter('tinkerer');
      gameManager.game.figures = [killer, other, monster];
      return { monster, entity, killer, other };
    }

    function assignKillQuest(character: Character) {
      character.progress.personalQuest = '513';
      character.progress.personalQuestAutotrack = true;
      gameManager.editionData = [
        Object.assign(new EditionData('gh', [], [], [], [], [], []), {
          personalQuests: [
            Object.assign(new PersonalQuest(), {
              cardId: '513',
              edition: 'gh',
              requirements: [Object.assign(new PersonalQuestRequirement(), { counter: 8, autotrack: 'kill:forest-imp' })]
            })
          ]
        })
      ];
      settingsManager.settings.editions = ['gh'];
    }

    it('credits the character active at the moment of death, not at removal', () => {
      const { monster, entity, killer, other } = setup();

      gameManager.entityManager.changeHealth(entity, monster, -3);
      expect(entity.dead).toBe(true);
      expect(killer.scenarioStats.normalKills).toBe(1);

      // turn passes before the delayed removal happens
      killer.active = false;
      other.active = true;
      monsterManager.removeMonsterEntity(monster, entity);

      expect(killer.scenarioStats.normalKills).toBe(1);
      expect(other.scenarioStats.normalKills).toBe(0);
    });

    it('keeps the kill when a dead entity with lingering conditions is removed at round end with nobody active', () => {
      const { monster, entity, killer } = setup();

      gameManager.entityManager.changeHealth(entity, monster, -3);
      killer.active = false;
      monsterManager.removeMonsterEntity(monster, entity);

      expect(killer.scenarioStats.normalKills).toBe(1);
    });

    it('credits summon kills to the summons stats of the owner', () => {
      const { monster, entity, killer } = setup(MonsterType.elite);
      const summon = new Summon('summon-1', 'bear', '1', 1, 1, SummonColor.blue);
      summon.active = true;
      killer.summons = [summon];

      gameManager.entityManager.changeHealth(entity, monster, -3);
      summon.active = false;
      monsterManager.removeMonsterEntity(monster, entity);

      expect(killer.scenarioStats.summons.eliteKills).toBe(1);
      expect(killer.scenarioStats.eliteKills).toBe(0);
    });

    it('reverts stats and personal quest progress when the entity is revived', () => {
      const { monster, entity, killer, other } = setup();
      assignKillQuest(killer);

      gameManager.entityManager.changeHealth(entity, monster, -3);
      expect(killer.progress.personalQuestProgress[0]).toBe(1);

      killer.active = false;
      other.active = true;
      gameManager.entityManager.changeHealth(entity, monster, 2);

      expect(entity.dead).toBe(false);
      expect(entity.tags.some((tag) => tag.startsWith(KILLED_TAG))).toBe(false);
      expect(killer.scenarioStats.normalKills).toBe(0);
      expect(killer.progress.personalQuestProgress[0]).toBe(0);

      // killed again, now by the other character
      gameManager.entityManager.changeHealth(entity, monster, -2);
      expect(other.scenarioStats.normalKills).toBe(1);
      expect(killer.scenarioStats.normalKills).toBe(0);
    });

    it('tracks personal quest kills at death independent of the scenarioStats setting', () => {
      settingsManager.settings.scenarioStats = false;
      const { monster, entity, killer } = setup();
      assignKillQuest(killer);

      gameManager.entityManager.changeHealth(entity, monster, -3);
      killer.active = false;
      monsterManager.removeMonsterEntity(monster, entity);

      expect(killer.progress.personalQuestProgress[0]).toBe(1);
      expect(killer.scenarioStats.normalKills).toBe(0);
    });

    it('does not count a death twice when it is marked dead repeatedly', () => {
      const { monster, entity, killer } = setup();

      entity.dead = true;
      monsterManager.monsterEntityKilled(monster, entity);
      monsterManager.monsterEntityKilled(monster, entity);
      gameManager.entityManager.changeHealth(entity, monster, -3);

      expect(killer.scenarioStats.normalKills).toBe(1);
    });

    it('marks the death even when no character is active, so a later removal does not credit anyone', () => {
      const { monster, entity, killer } = setup();
      killer.active = false;

      gameManager.entityManager.changeHealth(entity, monster, -3);
      killer.active = true;
      monsterManager.removeMonsterEntity(monster, entity);

      expect(killer.scenarioStats.normalKills).toBe(0);
    });
  });

  describe('monsterEntityCountIdentifier', () => {
    it('is 0 for an identifier of a different monster', () => {
      const monster = buildMonster({ name: 'bandit-guard', edition: 'gh', stats: [new MonsterStat(MonsterType.normal, 1, 10)] }, 1);
      monster.entities = [new MonsterEntity(1, MonsterType.normal, monster)];
      const identifier = new AdditionalIdentifier('bandit-archer', 'gh', 'monster');

      expect(monsterManager.monsterEntityCountIdentifier(monster, identifier)).toEqual(0);
    });

    it('is 0 when the identifier type is not "monster" (and not "all")', () => {
      const monster = buildMonster({ name: 'bandit-guard', edition: 'gh', stats: [new MonsterStat(MonsterType.normal, 1, 10)] }, 1);
      monster.entities = [new MonsterEntity(1, MonsterType.normal, monster)];
      const identifier = new AdditionalIdentifier('bandit-guard', 'gh', 'character');

      expect(monsterManager.monsterEntityCountIdentifier(monster, identifier)).toEqual(0);
    });

    it('counts alive entities matching name/edition, optionally restricted by marker/tags', () => {
      const monster = buildMonster({ name: 'bandit-guard', edition: 'gh', stats: [new MonsterStat(MonsterType.normal, 1, 10)] }, 1);
      const e1 = new MonsterEntity(1, MonsterType.normal, monster);
      const e2 = new MonsterEntity(2, MonsterType.normal, monster);
      e2.marker = 'elite-marker';
      monster.entities = [e1, e2];

      const anyIdentifier = new AdditionalIdentifier('bandit-guard', 'gh', 'monster');
      expect(monsterManager.monsterEntityCountIdentifier(monster, anyIdentifier)).toEqual(2);

      const markedIdentifier = new AdditionalIdentifier('bandit-guard', 'gh', 'monster', 'elite-marker');
      expect(monsterManager.monsterEntityCountIdentifier(monster, markedIdentifier)).toEqual(1);
    });
  });

  describe('monsterStandeeShared / monsterStandeeCount / monsterStandeeMax', () => {
    it('monsterStandeeShared returns just the monster itself when it shares with nothing', () => {
      const monster = buildMonster({ name: 'bandit-guard', edition: 'gh' });
      gameManager.game.figures = [monster];
      expect(monsterManager.monsterStandeeShared(monster, [])).toEqual([monster]);
    });

    it('monsterStandeeShared follows the standeeShare chain to parent and child monsters', () => {
      const parent = buildMonster({ name: 'bandit-guard', edition: 'gh' });
      const child = buildMonster({ name: 'bandit-guard-ally', edition: 'gh', standeeShare: 'bandit-guard' });
      gameManager.game.figures = [parent, child];

      const shared = monsterManager.monsterStandeeShared(child, []);
      expect(shared).toContain(parent);
      expect(shared).toContain(child);
    });

    it('monsterStandeeCount counts alive standees across the whole shared group', () => {
      const parent = buildMonster({ name: 'bandit-guard', edition: 'gh', stats: [new MonsterStat(MonsterType.normal, 1, 10)] });
      parent.entities = [new MonsterEntity(1, MonsterType.normal, parent)];
      const child = buildMonster({
        name: 'bandit-guard-ally',
        edition: 'gh',
        standeeShare: 'bandit-guard',
        stats: [new MonsterStat(MonsterType.normal, 1, 10)]
      });
      child.entities = [new MonsterEntity(2, MonsterType.normal, child)];
      gameManager.game.figures = [parent, child];

      expect(monsterManager.monsterStandeeCount(child)).toEqual(2);
    });

    it('monsterStandeeMax returns 10 for a bb monster when bbStandeeLimit is disabled', () => {
      const original = settingsManager.settings.bbStandeeLimit;
      settingsManager.settings.bbStandeeLimit = false;
      try {
        const monster = buildMonster({ editionRules: 'bb' });
        expect(monsterManager.monsterStandeeMax(monster)).toEqual(10);
      } finally {
        settingsManager.settings.bbStandeeLimit = original;
      }
    });

    it('monsterStandeeMax evaluates the standeeCount expression for the monster level', () => {
      const monster = buildMonster({ standeeCount: '2+L' }, 3);
      expect(monsterManager.monsterStandeeMax(monster)).toEqual(5);
    });
  });

  describe('sortEntities / sortEntitiesByNumber', () => {
    it('sortEntities places elite entities before normal entities', () => {
      const monster = buildMonster({ stats: [new MonsterStat(MonsterType.normal, 1, 10), new MonsterStat(MonsterType.elite, 1, 12)] });
      const normal = new MonsterEntity(1, MonsterType.normal, monster);
      const elite = new MonsterEntity(2, MonsterType.elite, monster);

      expect(monsterManager.sortEntities(elite, normal)).toBeLessThan(0);
      expect(monsterManager.sortEntities(normal, elite)).toBeGreaterThan(0);
    });

    it('sortEntitiesByNumber orders by ascending standee number', () => {
      const monster = buildMonster({ stats: [new MonsterStat(MonsterType.normal, 1, 10)] });
      const a = new MonsterEntity(1, MonsterType.normal, monster);
      const b = new MonsterEntity(3, MonsterType.normal, monster);
      expect(monsterManager.sortEntitiesByNumber(a, b)).toEqual(-1);
      expect(monsterManager.sortEntitiesByNumber(b, a)).toEqual(1);
    });

    it('sortEntitiesByNumber places brand-new summons last', () => {
      const monster = buildMonster({ stats: [new MonsterStat(MonsterType.normal, 1, 10)] });
      const existing = new MonsterEntity(1, MonsterType.normal, monster);
      const freshSummon = new MonsterEntity(2, MonsterType.normal, monster);
      freshSummon.summon = SummonState.new;

      expect(monsterManager.sortEntitiesByNumber(freshSummon, existing)).toEqual(1);
      expect(monsterManager.sortEntitiesByNumber(existing, freshSummon)).toEqual(-1);
    });

    it('sortEntitiesByNumber treats negative numbers as sorting last', () => {
      const monster = buildMonster({ stats: [new MonsterStat(MonsterType.normal, 1, 10)] });
      const negative = new MonsterEntity(-1, MonsterType.normal, monster);
      const positive = new MonsterEntity(1, MonsterType.normal, monster);
      expect(monsterManager.sortEntitiesByNumber(negative, positive)).toEqual(1);
      expect(monsterManager.sortEntitiesByNumber(positive, negative)).toEqual(-1);
    });
  });

  describe('monsterThumbnail / monsterArtwork', () => {
    it('monsterThumbnail prefers thumbnailUrl', () => {
      const data = buildMonsterData({ thumbnailUrl: 'thumb.png' });
      expect(monsterManager.monsterThumbnail(data)).toEqual('thumb.png');
    });

    it('monsterThumbnail falls back to edition-name and records it on the data', () => {
      const data = buildMonsterData({ edition: 'gh', name: 'bandit-guard' });
      expect(monsterManager.monsterThumbnail(data)).toEqual('./assets/images/monster/thumbnail/gh-bandit-guard.png');
      expect(data.thumbnail).toEqual('gh-bandit-guard');
    });

    it('monsterArtwork uses the artwork path unless noArtwork is set', () => {
      const data = buildMonsterData({ edition: 'gh', name: 'bandit-guard' });
      expect(monsterManager.monsterArtwork(data)).toEqual('./assets/artwork/monster/gh-bandit-guard.png');
    });

    it('monsterArtwork falls back to the thumbnail when noArtwork is set', () => {
      const data = buildMonsterData({ edition: 'gh', name: 'bandit-guard', noArtwork: true });
      expect(monsterManager.monsterArtwork(data)).toEqual('./assets/images/monster/thumbnail/gh-bandit-guard.png');
    });
  });

  describe('getAbility', () => {
    beforeEach(() => {
      settingsManager.settings.abilities = true;
    });

    it('is undefined when monster.ability is negative (no card drawn yet)', () => {
      const monster = buildMonster();
      monster.abilities = [0, 1, 2];
      monster.ability = -1;
      expect(monsterManager.getAbilityCard(monster)).toBeUndefined();
    });

    it('is undefined once monster.ability runs past the end of the abilities list', () => {
      const monster = buildMonster();
      monster.abilities = [0, 1];
      monster.ability = 2;
      expect(monsterManager.getAbilityCard(monster)).toBeUndefined();
    });

    it('is undefined when the abilities setting is disabled', () => {
      settingsManager.settings.abilities = false;
      const monster = buildMonster();
      monster.abilities = [0];
      monster.ability = 0;
      expect(monsterManager.getAbilityCard(monster)).toBeUndefined();
    });

    it('resolves the current ability by indexing through monster.abilities into the deck', () => {
      const a0 = new AbilityCard(1, 'a0');
      const a1 = new AbilityCard(2, 'a1');
      const a2 = new AbilityCard(3, 'a2');
      vi.spyOn(gameManager, 'abilityCards').mockReturnValue([a0, a1, a2]);
      const monster = buildMonster();
      monster.abilities = [2, 0, 1];
      monster.ability = 1; // -> abilities[monster.abilities[1]] = abilities[0] = a0

      expect(monsterManager.getAbilityCard(monster)).toBe(a0);
    });

    it('bottom=true offsets by -1 once ability > 0, otherwise by +1', () => {
      const a0 = new AbilityCard(1, 'a0');
      const a1 = new AbilityCard(2, 'a1');
      const a2 = new AbilityCard(3, 'a2');
      vi.spyOn(gameManager, 'abilityCards').mockReturnValue([a0, a1, a2]);
      const monster = buildMonster();
      monster.abilities = [2, 0, 1];

      monster.ability = 1; // offset -1 -> abilities[monster.abilities[0]] = abilities[2] = a2
      expect(monsterManager.getAbilityCard(monster, true)).toBe(a2);

      monster.ability = 0; // ability not > 0 -> offset +1 -> abilities[monster.abilities[1]] = abilities[0] = a0
      expect(monsterManager.getAbilityCard(monster, true)).toBe(a0);
    });
  });

  describe('hasBottomActions', () => {
    it('is true when every ability in the deck defines bottom actions', () => {
      vi.spyOn(gameManager, 'abilityCards').mockReturnValue([
        new AbilityCard(1, 'a0', 0, [], false, [{} as any]),
        new AbilityCard(2, 'a1', 0, [], false, [{} as any])
      ]);
      expect(monsterManager.hasBottomActions(buildMonster())).toBe(true);
    });

    it('is false once any ability in the deck lacks bottom actions', () => {
      vi.spyOn(gameManager, 'abilityCards').mockReturnValue([
        new AbilityCard(1, 'a0', 0, [], false, [{} as any]),
        new AbilityCard(2, 'a1', 0, [], false, [])
      ]);
      expect(monsterManager.hasBottomActions(buildMonster())).toBe(false);
    });

    it('is false for an empty ability deck', () => {
      vi.spyOn(gameManager, 'abilityCards').mockReturnValue([]);
      expect(monsterManager.hasBottomActions(buildMonster())).toBe(false);
    });
  });

  describe('getSameDeckMonster', () => {
    function mockDeckDataByName() {
      vi.spyOn(gameManager, 'deckData').mockImplementation((figure) => new DeckData((figure as Monster).edition, (figure as Monster).deck));
    }

    it('finds another monster figure sharing the same deck', () => {
      mockDeckDataByName();
      const bandit = buildMonster({ name: 'bandit-guard', edition: 'gh', deck: 'bandit' });
      const ally = buildMonster({ name: 'bandit-ally', edition: 'gh', deck: 'bandit' });
      gameManager.game.figures = [bandit, ally];

      expect(monsterManager.getSameDeckMonster(bandit)).toBe(ally);
    });

    it('does not match itself (same name+edition)', () => {
      mockDeckDataByName();
      const bandit = buildMonster({ name: 'bandit-guard', edition: 'gh', deck: 'bandit' });
      gameManager.game.figures = [bandit];

      expect(monsterManager.getSameDeckMonster(bandit)).toBeUndefined();
    });

    it('does not match a figure from a different deck', () => {
      mockDeckDataByName();
      const bandit = buildMonster({ name: 'bandit-guard', edition: 'gh', deck: 'bandit' });
      const other = buildMonster({ name: 'other-monster', edition: 'gh', deck: 'other' });
      gameManager.game.figures = [bandit, other];

      expect(monsterManager.getSameDeckMonster(bandit)).toBeUndefined();
    });

    it('excludes a same-deck figure that is itself mid drawExtra', () => {
      mockDeckDataByName();
      const bandit = buildMonster({ name: 'bandit-guard', edition: 'gh', deck: 'bandit' });
      const ally = buildMonster({ name: 'bandit-ally', edition: 'gh', deck: 'bandit' });
      ally.drawExtra = true;
      gameManager.game.figures = [bandit, ally];

      expect(monsterManager.getSameDeckMonster(bandit)).toBeUndefined();
    });
  });

  describe('drawAbility', () => {
    beforeEach(() => {
      vi.spyOn(gameManager, 'deckData').mockImplementation((figure) => new DeckData((figure as Monster).edition, (figure as Monster).deck));
    });

    it('advances ability by 1 for a single-sided deck', () => {
      vi.spyOn(gameManager, 'abilityCards').mockReturnValue([new AbilityCard(1, 'a0'), new AbilityCard(2, 'a1')]);
      const monster = buildMonster({ name: 'bandit-guard', edition: 'gh', deck: 'bandit' });
      monster.ability = 0;
      gameManager.game.figures = [monster];

      monsterManager.drawAbility(monster);

      expect(monster.ability).toBe(1);
    });

    it('advances ability by 2 for a two-sided (every ability has bottom actions) deck', () => {
      vi.spyOn(gameManager, 'abilityCards').mockReturnValue([
        new AbilityCard(1, 'a0', 0, [], false, [{} as any]),
        new AbilityCard(2, 'a1', 0, [], false, [{} as any])
      ]);
      const monster = buildMonster({ name: 'bandit-guard', edition: 'gh', deck: 'bandit' });
      monster.ability = 0;
      gameManager.game.figures = [monster];

      monsterManager.drawAbility(monster);

      expect(monster.ability).toBe(2);
    });

    it('propagates the drawn ability index to other monsters sharing the same deck', () => {
      vi.spyOn(gameManager, 'abilityCards').mockReturnValue([new AbilityCard(1, 'a0'), new AbilityCard(2, 'a1')]);
      const bandit = buildMonster({ name: 'bandit-guard', edition: 'gh', deck: 'bandit' });
      const ally = buildMonster({ name: 'bandit-ally', edition: 'gh', deck: 'bandit' });
      bandit.ability = 0;
      ally.ability = 0;
      gameManager.game.figures = [bandit, ally];

      monsterManager.drawAbility(bandit);

      expect(ally.ability).toBe(bandit.ability);
    });
  });

  describe('drawnAbilities', () => {
    beforeEach(() => {
      vi.spyOn(gameManager, 'deckData').mockImplementation((figure) => new DeckData((figure as Monster).edition, (figure as Monster).deck));
    });

    it('is ability+1 for the monster itself when nothing else has drawn further', () => {
      const monster = buildMonster({ name: 'bandit-guard', edition: 'gh', deck: 'bandit' });
      monster.ability = 2;
      gameManager.game.figures = [monster];

      expect(monsterManager.drawnAbilities(monster)).toBe(3);
    });

    it('is 0 when ability is still -1 (nothing drawn yet)', () => {
      const monster = buildMonster({ name: 'bandit-guard', edition: 'gh', deck: 'bandit' });
      monster.ability = -1;
      gameManager.game.figures = [monster];

      expect(monsterManager.drawnAbilities(monster)).toBe(0);
    });

    it('follows through to a same-deck figure that has drawn further ahead', () => {
      const bandit = buildMonster({ name: 'bandit-guard', edition: 'gh', deck: 'bandit' });
      const ally = buildMonster({ name: 'bandit-ally', edition: 'gh', deck: 'bandit' });
      bandit.ability = 0;
      ally.ability = 3;
      gameManager.game.figures = [bandit, ally];

      expect(monsterManager.drawnAbilities(bandit)).toBe(4);
    });
  });

  describe('Gloomhaven RPG speed and action', () => {
    function rpgMonster(): Monster {
      const monster = buildMonster({ name: 'archer', edition: 'rpg' });
      monster.abilities = [2, 0, 1];
      monster.entities = [
        new MonsterEntity(1, MonsterType.elite, monster),
        new MonsterEntity(2, MonsterType.normal, monster),
        new MonsterEntity(3, MonsterType.normal, monster)
      ];
      gameManager.game.figures = [monster];
      vi.spyOn(gameManager, 'rpgRules').mockReturnValue(true);
      vi.spyOn(gameManager.entityManager, 'isAlive').mockReturnValue(true);
      const card = (name: string, initiative: number) =>
        Object.assign(new AbilityCard(), {
          name,
          initiative,
          actions: [
            { type: 'box', value: 'Basic', subActions: [] },
            { type: 'monsterType', value: 'elite', subActions: [{ type: 'box', value: 'Close In', subActions: [] }] }
          ]
        });
      vi.spyOn(gameManager, 'abilityCards').mockReturnValue([card('rpg-fast', 21), card('rpg-normal', 45), card('rpg-slow', 80)]);
      vi.spyOn(gameManager, 'deckData').mockReturnValue(Object.assign(new DeckData(), { name: 'archer', edition: 'rpg' }));
      return monster;
    }

    it('setRpgSpeed keeps the speed cards in order and resets chosen actions on change', () => {
      const monster = rpgMonster();
      monster.entities[0].rpgAction = 1;
      monsterManager.setRpgSpeed(monster, 2);
      expect(monster.abilities).toEqual([0, 1, 2]);
      expect(monster.ability).toBe(2);
      expect(monster.entities[0].rpgAction).toBe(-1);
      expect(monster.abilityVisible).toBe(true);
    });

    it('setRpgAction assigns per standee and toggles off when all already have it', () => {
      const monster = rpgMonster();
      monsterManager.setRpgSpeed(monster, 1);
      monster.abilityVisible = false;
      monsterManager.setRpgAction(monster, 0, [monster.entities[1]]);
      expect(monster.entities.map((entity) => entity.rpgAction)).toEqual([-1, 0, -1]);
      expect(monster.abilityVisible).toBe(true);
      monsterManager.setRpgAction(monster, 0, [monster.entities[1]]);
      expect(monster.entities[1].rpgAction).toBe(-1);
    });

    it('elite actions are only assigned to elite standees', () => {
      const monster = rpgMonster();
      monsterManager.setRpgSpeed(monster, 1);
      monsterManager.setRpgAction(monster, 1);
      expect(monster.entities.map((entity) => entity.rpgAction)).toEqual([1, -1, -1]);
    });

    it('new standees take over the action of their type when active standees are off', () => {
      const monster = rpgMonster();
      settingsManager.settings.activeStandees = false;
      vi.spyOn(gameManager, 'addEntityCount').mockImplementation(() => {});
      monster.stats = [new MonsterStat(MonsterType.normal, 1), new MonsterStat(MonsterType.elite, 1)];
      monsterManager.setRpgSpeed(monster, 1);
      monsterManager.setRpgAction(monster, 0, [monster.entities[1], monster.entities[2]]);
      const added = monsterManager.addMonsterEntity(monster, 4, MonsterType.normal);
      expect(added?.rpgAction).toBe(0);
      settingsManager.settings.activeStandees = true;
    });

    it('draw keeps the chosen speed and defaults to normal speed', () => {
      const monster = rpgMonster();
      vi.spyOn(gameManager, 'gameplayFigure').mockReturnValue(true);
      monsterManager.draw();
      expect(monster.ability).toBe(1);
      expect(monster.abilities).toEqual([0, 1, 2]);

      monsterManager.setRpgSpeed(monster, 0);
      monsterManager.draw();
      expect(monster.ability).toBe(0);
    });

    it('next resets actions and the speed to normal for the following round', () => {
      const monster = rpgMonster();
      monsterManager.setRpgSpeed(monster, 2);
      monsterManager.setRpgAction(monster, 0);
      monster.off = true;
      monsterManager.next();
      expect(monster.off).toBe(false);
      expect(monster.ability).toBe(1);
      expect(monster.entities.every((entity) => entity.rpgAction === -1)).toBe(true);
    });
  });
});
