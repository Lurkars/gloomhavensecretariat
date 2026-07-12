import { ConditionName, EntityCondition } from 'src/app/game/model/data/Condition';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterStat } from 'src/app/game/model/data/MonsterStat';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';

function buildMonsterData(name: string = 'test-monster'): MonsterData {
  const data = new MonsterData();
  data.name = name;
  data.edition = 'gh';
  data.baseStat = new MonsterStat(MonsterType.normal, 1, 10, 2, 3, 1);
  data.stats = [new MonsterStat(MonsterType.normal, 1, 10, 2, 3, 1), new MonsterStat(MonsterType.elite, 1, 8, 2, 4, 1)];
  return data;
}

describe('Monster model', () => {
  describe('construction', () => {
    it('fills in missing per-stat fields (health/movement/attack/range/note) from baseStat', () => {
      // NOTE: Monster's constructor distinguishes "missing" from "explicitly 0" via
      // `!stat.health && stat.health !== 0`, so a stat built via `new MonsterStat(...)` (which
      // defaults health/movement/etc. to 0) would be treated as "explicitly 0" and NOT inherit.
      // Real game data is plain JSON without those defaults, so a genuinely absent field is
      // simulated here with a bare object missing the properties entirely.
      const data = new MonsterData();
      data.name = 'inherits';
      data.edition = 'gh';
      data.baseStat = new MonsterStat(MonsterType.normal, 1, 11, 3, 5, 2, [], [], [], 'base note');
      data.stats = [{ type: MonsterType.normal, level: 1 } as MonsterStat];
      const monster = new Monster(data, 1);

      const stat = monster.stats[0];
      expect(stat.health).toBe(11);
      expect(stat.movement).toBe(3);
      expect(stat.attack).toBe(5);
      expect(stat.range).toBe(2);
      expect(stat.note).toBe('base note');
    });

    it('does not overwrite stat fields that are already explicitly set', () => {
      const data = new MonsterData();
      data.name = 'explicit';
      data.edition = 'gh';
      data.baseStat = new MonsterStat(MonsterType.normal, 1, 11, 3, 5, 2);
      data.stats = [new MonsterStat(MonsterType.normal, 1, 99, 9, 9, 9)];
      const monster = new Monster(data, 1);

      expect(monster.stats[0].health).toBe(99);
      expect(monster.stats[0].movement).toBe(9);
    });
  });

  describe('toModel/fromModel round-trip', () => {
    it('reproduces basic scalar fields', () => {
      const monster = new Monster(buildMonsterData(), 2);
      monster.off = true;
      monster.active = true;
      monster.drawExtra = true;
      monster.lastDraw = 3;
      monster.ability = 5;
      monster.abilities = [1, 2, 3];
      monster.revealedAbilities = [true, false];
      monster.isAlly = true;
      monster.isAllied = true;
      monster.tags = ['tag-a'];

      const model = monster.toModel();
      const restored = new Monster(buildMonsterData(), 1);
      restored.fromModel(model);

      expect(restored.level).toBe(2);
      expect(restored.off).toBe(true);
      expect(restored.active).toBe(true);
      expect(restored.drawExtra).toBe(true);
      expect(restored.lastDraw).toBe(3);
      expect(restored.ability).toBe(5);
      expect(restored.abilities).toEqual([1, 2, 3]);
      expect(restored.revealedAbilities).toEqual([true, false]);
      expect(restored.isAlly).toBe(true);
      expect(restored.isAllied).toBe(true);
      expect(restored.tags).toEqual(['tag-a']);
    });

    it('round-trips monster entities including health and conditions', () => {
      const monster = new Monster(buildMonsterData(), 1);
      const entity = new MonsterEntity(1, MonsterType.normal, monster);
      entity.health = 4;
      entity.marker = 'm1';
      entity.entityConditions = [new EntityCondition(ConditionName.poison, 1)];
      monster.entities = [entity];

      const model = monster.toModel();
      const restored = new Monster(buildMonsterData(), 1);
      restored.fromModel(model);

      expect(restored.entities.length).toBe(1);
      expect(restored.entities[0]).toBeInstanceOf(MonsterEntity);
      expect(restored.entities[0].health).toBe(4);
      expect(restored.entities[0].marker).toBe('m1');
      expect(restored.entities[0].entityConditions[0].name).toBe(ConditionName.poison);
    });

    it('preserves existing entity instances across a round-trip (matched by number+type) instead of recreating them', () => {
      const monster = new Monster(buildMonsterData(), 1);
      const entity = new MonsterEntity(1, MonsterType.normal, monster);
      monster.entities = [entity];

      const model = monster.toModel();
      // fromModel on the *same* monster instance should keep the same entity object
      monster.fromModel(model);

      expect(monster.entities[0]).toBe(entity);
    });

    it('drops entities no longer present in the model', () => {
      const monster = new Monster(buildMonsterData(), 1);
      const entity1 = new MonsterEntity(1, MonsterType.normal, monster);
      const entity2 = new MonsterEntity(2, MonsterType.normal, monster);
      monster.entities = [entity1, entity2];

      const model = monster.toModel();
      model.entities = model.entities.filter((e) => e.number === 1);

      monster.fromModel(model);

      expect(monster.entities.length).toBe(1);
      expect(monster.entities[0].number).toBe(1);
    });

    it('resets statEffect to undefined on fromModel', () => {
      const monster = new Monster(buildMonsterData(), 1);
      monster.statEffect = { name: 'effect' } as any;

      const model = monster.toModel();
      monster.fromModel(model);

      expect(monster.statEffect).toBeUndefined();
    });
  });
});
