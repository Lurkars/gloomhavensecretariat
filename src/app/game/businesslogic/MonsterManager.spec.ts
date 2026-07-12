import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Ability } from 'src/app/game/model/data/Ability';
import { DeckData } from 'src/app/game/model/data/DeckData';
import { FigureErrorType } from 'src/app/game/model/data/FigureError';
import { AdditionalIdentifier } from 'src/app/game/model/data/Identifier';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterStat } from 'src/app/game/model/data/MonsterStat';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { SummonState } from 'src/app/game/model/Summon';

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
      const monster = buildMonster({ stats: [eliteStat], bb: true }, 1);

      expect(monsterManager.getStat(monster, MonsterType.elite).health).toEqual(12);
    });

    it('derives a stat from baseStat for a bb monster requesting a non-matching type', () => {
      const baseStat = new MonsterStat(MonsterType.normal, 0, 6, 1, 2, 0);
      const monster = buildMonster({ stats: [], baseStat, bb: true }, 1);

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
        const monster = buildMonster({ bb: true });
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
      expect(monsterManager.getAbility(monster)).toBeUndefined();
    });

    it('is undefined once monster.ability runs past the end of the abilities list', () => {
      const monster = buildMonster();
      monster.abilities = [0, 1];
      monster.ability = 2;
      expect(monsterManager.getAbility(monster)).toBeUndefined();
    });

    it('is undefined when the abilities setting is disabled', () => {
      settingsManager.settings.abilities = false;
      const monster = buildMonster();
      monster.abilities = [0];
      monster.ability = 0;
      expect(monsterManager.getAbility(monster)).toBeUndefined();
    });

    it('resolves the current ability by indexing through monster.abilities into the deck', () => {
      const a0 = new Ability(1, 'a0');
      const a1 = new Ability(2, 'a1');
      const a2 = new Ability(3, 'a2');
      vi.spyOn(gameManager, 'abilities').mockReturnValue([a0, a1, a2]);
      const monster = buildMonster();
      monster.abilities = [2, 0, 1];
      monster.ability = 1; // -> abilities[monster.abilities[1]] = abilities[0] = a0

      expect(monsterManager.getAbility(monster)).toBe(a0);
    });

    it('bottom=true offsets by -1 once ability > 0, otherwise by +1', () => {
      const a0 = new Ability(1, 'a0');
      const a1 = new Ability(2, 'a1');
      const a2 = new Ability(3, 'a2');
      vi.spyOn(gameManager, 'abilities').mockReturnValue([a0, a1, a2]);
      const monster = buildMonster();
      monster.abilities = [2, 0, 1];

      monster.ability = 1; // offset -1 -> abilities[monster.abilities[0]] = abilities[2] = a2
      expect(monsterManager.getAbility(monster, true)).toBe(a2);

      monster.ability = 0; // ability not > 0 -> offset +1 -> abilities[monster.abilities[1]] = abilities[0] = a0
      expect(monsterManager.getAbility(monster, true)).toBe(a0);
    });
  });

  describe('hasBottomActions', () => {
    it('is true when every ability in the deck defines bottom actions', () => {
      vi.spyOn(gameManager, 'abilities').mockReturnValue([
        new Ability(1, 'a0', 0, [], false, [{} as any]),
        new Ability(2, 'a1', 0, [], false, [{} as any])
      ]);
      expect(monsterManager.hasBottomActions(buildMonster())).toBe(true);
    });

    it('is false once any ability in the deck lacks bottom actions', () => {
      vi.spyOn(gameManager, 'abilities').mockReturnValue([
        new Ability(1, 'a0', 0, [], false, [{} as any]),
        new Ability(2, 'a1', 0, [], false, [])
      ]);
      expect(monsterManager.hasBottomActions(buildMonster())).toBe(false);
    });

    it('is false for an empty ability deck', () => {
      vi.spyOn(gameManager, 'abilities').mockReturnValue([]);
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
      vi.spyOn(gameManager, 'abilities').mockReturnValue([new Ability(1, 'a0'), new Ability(2, 'a1')]);
      const monster = buildMonster({ name: 'bandit-guard', edition: 'gh', deck: 'bandit' });
      monster.ability = 0;
      gameManager.game.figures = [monster];

      monsterManager.drawAbility(monster);

      expect(monster.ability).toBe(1);
    });

    it('advances ability by 2 for a two-sided (every ability has bottom actions) deck', () => {
      vi.spyOn(gameManager, 'abilities').mockReturnValue([
        new Ability(1, 'a0', 0, [], false, [{} as any]),
        new Ability(2, 'a1', 0, [], false, [{} as any])
      ]);
      const monster = buildMonster({ name: 'bandit-guard', edition: 'gh', deck: 'bandit' });
      monster.ability = 0;
      gameManager.game.figures = [monster];

      monsterManager.drawAbility(monster);

      expect(monster.ability).toBe(2);
    });

    it('propagates the drawn ability index to other monsters sharing the same deck', () => {
      vi.spyOn(gameManager, 'abilities').mockReturnValue([new Ability(1, 'a0'), new Ability(2, 'a1')]);
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
});
