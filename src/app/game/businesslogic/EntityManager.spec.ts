import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { Condition, ConditionName, ConditionType, EntityCondition, EntityConditionState } from 'src/app/game/model/data/Condition';
import { AdditionalIdentifier, Identifier } from 'src/app/game/model/data/Identifier';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import { Summon, SummonColor, SummonState } from 'src/app/game/model/Summon';

// This spec covers the smaller, clearly-scoped lookups (isAlive, hasCondition, activeConditions,
// isImmune, markers, highlightedConditions, figureForEntity, entities/entitiesAll and the
// entity-indexing helpers), plus checkHealth/applyCondition/applyConditionsTurn/changeHealth below.
// The condition-highlight/auto-apply sub-machinery inside changeHealthHighlightConditions/
// sufferDamageHighlightConditions (shield/retaliate highlight bookkeeping ahead of a hit landing)
// stays out of scope — it's UI-highlight plumbing rather than state-changing logic, and is best
// exercised through higher-level flows once those are covered.

function buildCharacter(name: string = 'brute'): Character {
  const data = Object.assign(new CharacterData(), { name, edition: 'gh', stats: [new CharacterStat(1, 10)] });
  return new Character(data, 1);
}

function buildMonster(name: string = 'bandit-guard'): Monster {
  return new Monster(Object.assign(new MonsterData(), { name, edition: 'gh' }), 1);
}

function buildMonsterEntity(monster: Monster, type: MonsterType = MonsterType.normal): MonsterEntity {
  return new MonsterEntity(1, type, monster);
}

function buildObjectiveContainer(escort: boolean = false): ObjectiveContainer {
  const container = new ObjectiveContainer('objective-1');
  container.escort = escort;
  return container;
}

function buildObjectiveEntity(container: ObjectiveContainer): ObjectiveEntity {
  return new ObjectiveEntity('entity-1', 1, container, undefined);
}

function buildSummon(): Summon {
  return new Summon('summon-1', 'imp', '1', 1, 1, SummonColor.blue);
}

describe('EntityManager', () => {
  const entityManager = gameManager.entityManager;

  beforeEach(() => {
    gameManager.game.figures = [];
  });

  describe('isAlive', () => {
    it('a healthy, non-exhausted, non-absent character is alive', () => {
      const character = buildCharacter();
      expect(entityManager.isAlive(character)).toBe(true);
    });

    it('a character at 0 health is not alive', () => {
      const character = buildCharacter();
      character.health = 0;
      expect(entityManager.isAlive(character)).toBe(false);
    });

    it('an exhausted or absent character is not alive', () => {
      const exhausted = buildCharacter();
      exhausted.exhausted = true;
      expect(entityManager.isAlive(exhausted)).toBe(false);

      const absent = buildCharacter();
      absent.absent = true;
      expect(entityManager.isAlive(absent)).toBe(false);
    });

    it('a dead or dormant monster entity is not alive', () => {
      const monster = buildMonster();
      const dead = buildMonsterEntity(monster);
      dead.dead = true;
      expect(entityManager.isAlive(dead)).toBe(false);

      const dormant = buildMonsterEntity(monster);
      dormant.dormant = true;
      expect(entityManager.isAlive(dormant)).toBe(false);
    });

    it('a freshly-summoned monster entity is not alive while acting', () => {
      const monster = buildMonster();
      const entity = buildMonsterEntity(monster);
      entity.summon = SummonState.new;
      expect(entityManager.isAlive(entity, false)).toBe(true);
      expect(entityManager.isAlive(entity, true)).toBe(false);
    });

    it('a dead or dormant summon is not alive', () => {
      const dead = buildSummon();
      dead.dead = true;
      expect(entityManager.isAlive(dead)).toBe(false);

      const dormant = buildSummon();
      dormant.dormant = true;
      expect(entityManager.isAlive(dormant)).toBe(false);
    });

    it('a dead or dormant objective entity is not alive', () => {
      const container = buildObjectiveContainer();
      const dead = buildObjectiveEntity(container);
      dead.dead = true;
      expect(entityManager.isAlive(dead)).toBe(false);

      const dormant = buildObjectiveEntity(container);
      dormant.dormant = true;
      expect(entityManager.isAlive(dormant)).toBe(false);
    });
  });

  describe('hasCondition', () => {
    it('is true for an active, non-removed, non-expired matching condition', () => {
      const character = buildCharacter();
      character.entityConditions = [new EntityCondition(ConditionName.poison, 1)];
      expect(entityManager.hasCondition(character, new Condition(ConditionName.poison))).toBe(true);
    });

    it('is false once the condition is removed or expired', () => {
      const character = buildCharacter();
      const removed = Object.assign(new EntityCondition(ConditionName.poison, 1), { state: EntityConditionState.removed });
      character.entityConditions = [removed];
      expect(entityManager.hasCondition(character, new Condition(ConditionName.poison))).toBe(false);

      const expired = Object.assign(new EntityCondition(ConditionName.poison, 1), { expired: true });
      character.entityConditions = [expired];
      expect(entityManager.hasCondition(character, new Condition(ConditionName.poison))).toBe(false);
    });

    it('permanent=true requires the entityCondition to be permanent', () => {
      const character = buildCharacter();
      character.entityConditions = [new EntityCondition(ConditionName.poison, 1)];
      expect(entityManager.hasCondition(character, new Condition(ConditionName.poison), true)).toBe(false);

      character.entityConditions = [Object.assign(new EntityCondition(ConditionName.poison, 1), { permanent: true })];
      expect(entityManager.hasCondition(character, new Condition(ConditionName.poison), true)).toBe(true);
    });
  });

  describe('activeConditions', () => {
    it('excludes expired conditions by default', () => {
      const character = buildCharacter();
      const active = new EntityCondition(ConditionName.poison, 1);
      const expired = Object.assign(new EntityCondition(ConditionName.wound, 1), { expired: true });
      character.entityConditions = [active, expired];
      expect(entityManager.activeConditions(character)).toEqual([active]);
    });

    it('includes expired conditions carrying expiredIndicator when expiredIndicator=true', () => {
      const character = buildCharacter();
      const expired = Object.assign(new EntityCondition(ConditionName.wound, 1), {
        expired: true,
        types: [ConditionType.expiredIndicator]
      });
      character.entityConditions = [expired];
      expect(entityManager.activeConditions(character)).toEqual([]);
      expect(entityManager.activeConditions(character, true)).toEqual([expired]);
    });

    it('excludes hidden conditions unless hidden=true', () => {
      const character = buildCharacter();
      const hidden = Object.assign(new EntityCondition(ConditionName.poison, 1), { types: [ConditionType.hidden] });
      character.entityConditions = [hidden];
      expect(entityManager.activeConditions(character)).toEqual([]);
      expect(entityManager.activeConditions(character, false, true)).toEqual([hidden]);
    });
  });

  describe('isImmune', () => {
    it('a non-escort objective entity is always immune', () => {
      const container = buildObjectiveContainer(false);
      const entity = buildObjectiveEntity(container);
      expect(entityManager.isImmune(entity, container, ConditionName.poison)).toBe(true);
    });

    it('respects manual entity.immunities unless ignoreManual is set', () => {
      const character = buildCharacter();
      character.immunities = [ConditionName.poison];
      expect(entityManager.isImmune(character, character, ConditionName.poison)).toBe(true);
      expect(entityManager.isImmune(character, character, ConditionName.poison, true)).toBe(false);
    });

    it('grants stun/muddle immunity from the gh item 38 (Eagle Eye Goggles)', () => {
      const character = buildCharacter();
      character.progress.items = [new Identifier(38, 'gh')];
      character.progress.equippedItems = [new AdditionalIdentifier(38, 'gh')];
      expect(entityManager.isImmune(character, character, ConditionName.stun)).toBe(true);
      expect(entityManager.isImmune(character, character, ConditionName.muddle)).toBe(true);
      expect(entityManager.isImmune(character, character, ConditionName.poison)).toBe(false);
    });

    it('a monster entity is immune to a character-only condition (type mismatch, e.g. impair)', () => {
      const monster = buildMonster();
      const entity = buildMonsterEntity(monster);
      expect(entityManager.isImmune(entity, monster, ConditionName.impair)).toBe(true);
    });

    it('a character is not immune to a condition applicable to characters (e.g. poison)', () => {
      const character = buildCharacter();
      expect(entityManager.isImmune(character, character, ConditionName.poison)).toBe(false);
    });

    it('wound_x/poison_x immunity aliases to the base wound/poison immunity', () => {
      const character = buildCharacter();
      character.immunities = [ConditionName.wound];
      expect(entityManager.isImmune(character, character, ConditionName.wound_x)).toBe(true);
    });
  });

  describe('hasMarker / toggleMarker', () => {
    it('hasMarker reflects membership in entity.markers', () => {
      const character = buildCharacter();
      character.markers = ['frozen'];
      expect(entityManager.hasMarker(character, 'frozen')).toBe(true);
      expect(entityManager.hasMarker(character, 'burning')).toBeFalsy();
    });

    it('toggleMarker adds when absent and removes when present', () => {
      const character = buildCharacter();
      character.markers = [];
      entityManager.toggleMarker(character, 'frozen');
      expect(character.markers).toEqual(['frozen']);
      entityManager.toggleMarker(character, 'frozen');
      expect(character.markers).toEqual([]);
    });
  });

  describe('highlightedConditions', () => {
    it('returns only highlighted conditions', () => {
      const character = buildCharacter();
      const highlighted = Object.assign(new EntityCondition(ConditionName.poison, 1), { highlight: true });
      const notHighlighted = new EntityCondition(ConditionName.wound, 1);
      character.entityConditions = [highlighted, notHighlighted];
      expect(entityManager.highlightedConditions(character)).toEqual([highlighted]);
    });

    it('sorts double-type conditions first', () => {
      const character = buildCharacter();
      const single = Object.assign(new EntityCondition(ConditionName.poison, 1), { highlight: true, types: [] });
      const double = Object.assign(new EntityCondition(ConditionName.wound, 1), { highlight: true, types: [ConditionType.double] });
      character.entityConditions = [single, double];
      expect(entityManager.highlightedConditions(character)).toEqual([double, single]);
    });
  });

  describe('figureForEntity', () => {
    it('a character entity resolves to itself', () => {
      const character = buildCharacter();
      expect(entityManager.figureForEntity(character)).toBe(character);
    });

    it('a monster entity resolves to its owning monster figure', () => {
      const monster = buildMonster();
      const entity = buildMonsterEntity(monster);
      monster.entities = [entity];
      gameManager.game.figures = [monster];
      expect(entityManager.figureForEntity(entity)).toBe(monster);
    });

    it('an objective entity resolves to its owning objective container', () => {
      const container = buildObjectiveContainer();
      const entity = buildObjectiveEntity(container);
      container.entities = [entity];
      gameManager.game.figures = [container];
      expect(entityManager.figureForEntity(entity)).toBe(container);
    });

    it('a summon resolves to the character it belongs to', () => {
      const character = buildCharacter();
      const summon = buildSummon();
      character.summons = [summon];
      gameManager.game.figures = [character];
      expect(entityManager.figureForEntity(summon)).toBe(character);
    });

    it('falls back to a placeholder monster when no owning figure is found', () => {
      const summon = buildSummon();
      gameManager.game.figures = [];
      expect(entityManager.figureForEntity(summon)).toBeInstanceOf(Monster);
    });
  });

  describe('entities / entitiesAll', () => {
    it('entities() returns only the alive entities of a monster figure', () => {
      const monster = buildMonster();
      const alive = buildMonsterEntity(monster);
      const dead = buildMonsterEntity(monster);
      dead.dead = true;
      monster.entities = [alive, dead];
      expect(entityManager.entities(monster)).toEqual([alive]);
    });

    it('entitiesAll() includes a character plus its alive summons', () => {
      const character = buildCharacter();
      const aliveSummon = buildSummon();
      const deadSummon = buildSummon();
      deadSummon.dead = true;
      character.summons = [aliveSummon, deadSummon];
      expect(entityManager.entitiesAll(character)).toEqual([character, aliveSummon]);
    });

    it('entitiesAll(alive=false) includes dead entities too', () => {
      const monster = buildMonster();
      const dead = buildMonsterEntity(monster);
      dead.dead = true;
      monster.entities = [dead];
      expect(entityManager.entitiesAll(monster, false)).toEqual([dead]);
    });
  });

  describe('getIndexedEntities / getIndexForEntity', () => {
    it('flattens figures into entity/figure pairs in figure order', () => {
      const characterA = buildCharacter('brute');
      const monster = buildMonster();
      const monsterEntity = buildMonsterEntity(monster);
      monster.entities = [monsterEntity];
      gameManager.game.figures = [characterA, monster];

      const indexed = entityManager.getIndexedEntities();
      expect(indexed.map((value) => value.entity)).toEqual([characterA, monsterEntity]);
      expect(indexed.map((value) => value.figure)).toEqual([characterA, monster]);
    });

    it('getIndexForEntity finds the position of a given entity', () => {
      const characterA = buildCharacter('brute');
      const characterB = buildCharacter('spellweaver');
      gameManager.game.figures = [characterA, characterB];
      expect(entityManager.getIndexForEntity(characterB)).toEqual(1);
    });

    it('getIndexForEntity is -1 for an entity not present in the game', () => {
      const character = buildCharacter();
      gameManager.game.figures = [];
      expect(entityManager.getIndexForEntity(character)).toEqual(-1);
    });
  });

  describe('checkHealth', () => {
    it('clamps health down to maxHealth when it exceeds it', () => {
      const character = buildCharacter();
      character.maxHealth = 10;
      character.health = 15;
      entityManager.checkHealth(character, character);
      expect(character.health).toBe(10);
    });

    it('exhausts a character once health drops to 0', () => {
      const character = buildCharacter();
      character.maxHealth = 10;
      character.health = 0;
      character.exhausted = false;
      entityManager.checkHealth(character, character);
      expect(character.exhausted).toBe(true);
      expect(character.off).toBe(true);
    });

    it('revives (un-exhausts) a character once health rises back above 0', () => {
      const character = buildCharacter();
      character.maxHealth = 10;
      character.health = 5;
      character.exhausted = true;
      character.off = true;
      entityManager.checkHealth(character, character);
      expect(character.exhausted).toBe(false);
      expect(character.off).toBe(false);
    });

    it('marks a monster entity dead once health drops to 0', () => {
      const monster = buildMonster();
      const entity = buildMonsterEntity(monster);
      entity.maxHealth = 8;
      entity.health = 0;
      entity.dead = false;
      entityManager.checkHealth(entity, monster);
      expect(entity.dead).toBe(true);
    });

    it('revives a dead monster entity once health rises back above 0', () => {
      const monster = buildMonster();
      const entity = buildMonsterEntity(monster);
      entity.maxHealth = 8;
      entity.health = 3;
      entity.dead = true;
      entityManager.checkHealth(entity, monster);
      expect(entity.dead).toBe(false);
    });

    it('marks a summon dead at 0 health and revives it above 0', () => {
      const summon = buildSummon();
      summon.maxHealth = 4;
      summon.health = 0;
      entityManager.checkHealth(summon, buildCharacter());
      expect(summon.dead).toBe(true);

      summon.health = 2;
      entityManager.checkHealth(summon, buildCharacter());
      expect(summon.dead).toBe(false);
    });

    it('does nothing when maxHealth is 0 (no stat resolved)', () => {
      const character = buildCharacter();
      character.maxHealth = 0;
      character.health = 0;
      character.exhausted = false;
      entityManager.checkHealth(character, character);
      expect(character.exhausted).toBe(false);
    });
  });

  describe('applyCondition', () => {
    let originalApplyConditions: boolean;
    let originalExcludes: ConditionName[];

    beforeEach(() => {
      originalApplyConditions = settingsManager.settings.applyConditions;
      originalExcludes = settingsManager.settings.applyConditionsExcludes;
      settingsManager.settings.applyConditions = true;
      settingsManager.settings.applyConditionsExcludes = [];
    });

    afterEach(() => {
      settingsManager.settings.applyConditions = originalApplyConditions;
      settingsManager.settings.applyConditionsExcludes = originalExcludes;
    });

    it('poison: reduces health by the condition value and runs checkHealth', () => {
      const character = buildCharacter();
      character.maxHealth = 10;
      character.health = 5;
      const poison = new EntityCondition(ConditionName.poison, 3);
      character.entityConditions = [poison];

      entityManager.applyCondition(character, character, poison);

      expect(character.health).toBe(2);
    });

    it('poison: adds its value onto an active ward instead of just being absorbed', () => {
      const character = buildCharacter();
      character.maxHealth = 10;
      character.health = 5;
      const poison = new EntityCondition(ConditionName.poison, 3);
      const ward = new EntityCondition(ConditionName.ward, 1);
      character.entityConditions = [poison, ward];

      entityManager.applyCondition(character, character, poison);

      expect(ward.value).toBe(4);
    });

    it('is a no-op when the entity is immune to the condition', () => {
      const character = buildCharacter();
      character.maxHealth = 10;
      character.health = 5;
      character.immunities = [ConditionName.poison];
      const poison = new EntityCondition(ConditionName.poison, 3);
      character.entityConditions = [poison];

      entityManager.applyCondition(character, character, poison);

      expect(character.health).toBe(5);
      expect(poison.expired).toBe(false);
    });

    it('ward (autoApply): heals for half the value (rounded down subtracted)', () => {
      const character = buildCharacter();
      character.maxHealth = 20;
      character.health = 5;
      const ward = new EntityCondition(ConditionName.ward, 5);
      character.entityConditions = [ward];

      entityManager.applyCondition(character, character, ward, false, true);

      // value=5 -> floor(5/2)=2 -> heals by 5-2=3
      expect(character.health).toBe(8);
      expect(ward.value).toBe(1);
      expect(ward.expired).toBe(true);
    });

    it('ward (manual apply): applies then reverts half the value net', () => {
      const character = buildCharacter();
      character.maxHealth = 20;
      character.health = 5;
      const ward = new EntityCondition(ConditionName.ward, 5);
      character.entityConditions = [ward];

      entityManager.applyCondition(character, character, ward, false, false);

      // += 5 -> 10, then -= floor(5/2)=2 -> 8
      expect(character.health).toBe(8);
      expect(ward.value).toBe(1);
      expect(ward.expired).toBe(true);
    });

    it('brittle (autoApply): subtracts the value from health', () => {
      const character = buildCharacter();
      character.maxHealth = 20;
      character.health = 10;
      const brittle = new EntityCondition(ConditionName.brittle, 4);
      character.entityConditions = [brittle];

      entityManager.applyCondition(character, character, brittle, false, true);

      expect(character.health).toBe(6);
      expect(brittle.value).toBe(1);
      expect(brittle.expired).toBe(true);
    });

    it('brittle (manual apply): nets out to the same single subtraction', () => {
      const character = buildCharacter();
      character.maxHealth = 20;
      character.health = 10;
      const brittle = new EntityCondition(ConditionName.brittle, 4);
      character.entityConditions = [brittle];

      entityManager.applyCondition(character, character, brittle, false, false);

      // += 4 -> 14, then -= 4*2=8 -> 6
      expect(character.health).toBe(6);
    });

    it('shield: adds its value to health and expires', () => {
      const character = buildCharacter();
      character.maxHealth = 20;
      character.health = 10;
      const shield = new EntityCondition(ConditionName.shield, 3);
      character.entityConditions = [shield];

      entityManager.applyCondition(character, character, shield);

      expect(character.health).toBe(13);
      expect(shield.expired).toBe(true);
    });

    it('retaliate: simply expires without changing health', () => {
      const character = buildCharacter();
      character.health = 10;
      const retaliate = new EntityCondition(ConditionName.retaliate, 2);
      character.entityConditions = [retaliate];

      entityManager.applyCondition(character, character, retaliate);

      expect(character.health).toBe(10);
      expect(retaliate.expired).toBe(true);
    });

    it('heal: applies its value when state/lastState are both "new"', () => {
      const character = buildCharacter();
      character.maxHealth = 20;
      character.health = 10;
      const heal = new EntityCondition(ConditionName.heal, 4);
      heal.state = EntityConditionState.new;
      heal.lastState = EntityConditionState.new;
      character.entityConditions = [heal];

      entityManager.applyCondition(character, character, heal);

      expect(character.health).toBe(14);
      expect(heal.expired).toBe(true);
    });

    it('heal: does not change health when not in the new/new state, but still expires', () => {
      const character = buildCharacter();
      character.maxHealth = 20;
      character.health = 10;
      const heal = new EntityCondition(ConditionName.heal, 4); // default state=normal, lastState=new
      character.entityConditions = [heal];

      entityManager.applyCondition(character, character, heal);

      expect(character.health).toBe(10);
      expect(heal.expired).toBe(true);
    });

    it('sets highlight=true synchronously when highlight is requested and animations are enabled', () => {
      settingsManager.settings.animations = true;
      const character = buildCharacter();
      character.health = 10;
      const shield = new EntityCondition(ConditionName.shield, 1);
      character.entityConditions = [shield];

      entityManager.applyCondition(character, character, shield, true);

      expect(shield.highlight).toBe(true);
    });

    it('a permanent condition is forced back to non-expired regardless of the branch above', () => {
      const character = buildCharacter();
      character.health = 10;
      const shield = new EntityCondition(ConditionName.shield, 1);
      shield.permanent = true;
      character.entityConditions = [shield];

      entityManager.applyCondition(character, character, shield);

      expect(shield.expired).toBe(false);
    });

    it('resolves the entity condition by name+value when the given condition object is a detached copy', () => {
      const character = buildCharacter();
      character.maxHealth = 20;
      character.health = 10;
      const stored = new EntityCondition(ConditionName.shield, 3);
      character.entityConditions = [stored];
      const detachedProbe = new EntityCondition(ConditionName.shield, 3);

      entityManager.applyCondition(character, character, detachedProbe);

      expect(character.health).toBe(13);
      expect(stored.expired).toBe(true);
    });
  });

  describe('changeHealth', () => {
    let originalApplyConditions: boolean;
    let originalScenarioStats: boolean;

    beforeEach(() => {
      originalApplyConditions = settingsManager.settings.applyConditions;
      originalScenarioStats = settingsManager.settings.scenarioStats;
      settingsManager.settings.applyConditions = false;
      settingsManager.settings.scenarioStats = false;
    });

    afterEach(() => {
      settingsManager.settings.applyConditions = originalApplyConditions;
      settingsManager.settings.scenarioStats = originalScenarioStats;
      vi.restoreAllMocks();
    });

    it('adds the (positive or negative) value to health', () => {
      const character = buildCharacter();
      character.maxHealth = 10;
      character.health = 5;

      entityManager.changeHealth(character, character, 3);
      expect(character.health).toBe(8);

      entityManager.changeHealth(character, character, -4);
      expect(character.health).toBe(4);
    });

    it('runs checkHealth as part of the change (exhausts the character at 0)', () => {
      const character = buildCharacter();
      character.maxHealth = 10;
      character.health = 3;

      entityManager.changeHealth(character, character, -5);

      expect(character.health).toBe(-2);
      expect(character.exhausted).toBe(true);
    });

    it('records scenario stats via scenarioStatsManager when the scenarioStats setting is on', () => {
      settingsManager.settings.scenarioStats = true;
      const character = buildCharacter();
      character.active = true;
      character.maxHealth = 10;
      character.health = 10;
      gameManager.game.figures = [character];
      const damageSpy = vi.spyOn(gameManager.scenarioStatsManager, 'applyDamage').mockImplementation(() => {});

      entityManager.changeHealth(character, character, -3);

      expect(damageSpy).toHaveBeenCalledWith(character, character, 3);
    });

    it('does not call scenarioStatsManager when the scenarioStats setting is off', () => {
      const character = buildCharacter();
      character.maxHealth = 10;
      character.health = 10;
      const damageSpy = vi.spyOn(gameManager.scenarioStatsManager, 'applyDamage').mockImplementation(() => {});

      entityManager.changeHealth(character, character, -3);

      expect(damageSpy).not.toHaveBeenCalled();
    });
  });

  describe('applyConditionsTurn', () => {
    let originalExcludes: ConditionName[];

    beforeEach(() => {
      originalExcludes = settingsManager.settings.applyConditionsExcludes;
      settingsManager.settings.applyConditionsExcludes = [];
    });

    afterEach(() => {
      settingsManager.settings.applyConditionsExcludes = originalExcludes;
    });

    it('wound: reduces health by its value and flips condition state from normal to turn', () => {
      const character = buildCharacter();
      character.maxHealth = 10;
      character.health = 10;
      const wound = new EntityCondition(ConditionName.wound, 2);
      character.entityConditions = [wound];

      entityManager.applyConditionsTurn(character, character);

      expect(character.health).toBe(8);
      expect(wound.state).toBe(EntityConditionState.turn);
    });

    it('wound: is skipped once the condition has already expired', () => {
      const character = buildCharacter();
      character.maxHealth = 10;
      character.health = 10;
      const wound = Object.assign(new EntityCondition(ConditionName.wound, 2), { expired: true });
      character.entityConditions = [wound];

      entityManager.applyConditionsTurn(character, character);

      expect(character.health).toBe(10);
    });

    it('wound: is skipped when the entity is immune to it', () => {
      const character = buildCharacter();
      character.maxHealth = 10;
      character.health = 10;
      character.immunities = [ConditionName.wound];
      const wound = new EntityCondition(ConditionName.wound, 2);
      character.entityConditions = [wound];

      entityManager.applyConditionsTurn(character, character);

      expect(character.health).toBe(10);
      expect(wound.state).toBe(EntityConditionState.normal);
    });

    it('regenerate: heals for its value once per turn while below maxHealth', () => {
      const character = buildCharacter();
      character.maxHealth = 10;
      character.health = 5;
      const regenerate = new EntityCondition(ConditionName.regenerate, 3);
      character.entityConditions = [regenerate];

      entityManager.applyConditionsTurn(character, character);

      expect(character.health).toBe(8);
      expect(regenerate.state).toBe(EntityConditionState.expire);
    });

    it('regenerate: does not heal once the entity is already at maxHealth', () => {
      const character = buildCharacter();
      character.maxHealth = 10;
      character.health = 10;
      const regenerate = new EntityCondition(ConditionName.regenerate, 3);
      character.entityConditions = [regenerate];

      entityManager.applyConditionsTurn(character, character);

      expect(character.health).toBe(10);
    });
  });
});
