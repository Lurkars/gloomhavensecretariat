import { ConditionName, EntityCondition } from 'src/app/game/model/data/Condition';
import { SummonData } from 'src/app/game/model/data/SummonData';
import { Summon, SummonColor, SummonState } from 'src/app/game/model/Summon';

describe('Summon model', () => {
  describe('construction', () => {
    it('sets defaults (health 2/2) without summonData', () => {
      const summon = new Summon('u1', 'bear', '1', 3, 1, SummonColor.blue);
      expect(summon.maxHealth).toBe(2);
      expect(summon.health).toBe(2);
      expect(summon.level).toBe(3);
    });

    it('derives health/movement/range from summonData expressions using the given level', () => {
      const summonData = new SummonData();
      summonData.health = '2xL';
      summonData.movement = 'L+1';
      summonData.range = '1';
      summonData.attack = 2;
      summonData.flying = true;
      const summon = new Summon('u1', 'bear', '1', 3, 1, SummonColor.blue, summonData);

      expect(summon.maxHealth).toBe(6);
      expect(summon.health).toBe(6);
      expect(summon.movement).toBe(4);
      expect(summon.range).toBe(1);
      expect(summon.attack).toBe(2);
      expect(summon.flying).toBe(true);
    });
  });

  describe('toModel/fromModel round-trip', () => {
    it('reproduces basic scalar fields', () => {
      const summon = new Summon('u1', 'bear', '1', 2, 1, SummonColor.blue);
      summon.title = 'Bear';
      summon.dead = true;
      summon.state = SummonState.true;
      summon.health = 1;
      summon.maxHealth = 5;
      summon.active = true;
      summon.dormant = true;
      summon.passive = true;
      summon.afterTurn = true;
      summon.afterTurnActive = true;
      summon.markers = ['m1'];
      summon.tags = ['t1'];

      const model = summon.toModel();
      const restored = new Summon('u1', '', '', 0, 0, SummonColor.blue);
      restored.fromModel(model);

      expect(restored.title).toBe('Bear');
      expect(restored.dead).toBe(true);
      expect(restored.state).toBe(SummonState.true);
      expect(restored.health).toBe(1);
      expect(restored.maxHealth).toBe(5);
      expect(restored.active).toBe(true);
      expect(restored.dormant).toBe(true);
      expect(restored.passive).toBe(true);
      expect(restored.afterTurn).toBe(true);
      expect(restored.afterTurnActive).toBe(true);
      expect(restored.markers).toEqual(['m1']);
      expect(restored.tags).toEqual(['t1']);
      expect(restored.init).toBe(false);
    });

    it('round-trips a numeric attack value back to a number', () => {
      const summon = new Summon('u1', 'bear', '1', 1, 1, SummonColor.blue);
      summon.attack = 5;

      const model = summon.toModel();
      const restored = new Summon('u1', '', '', 0, 0, SummonColor.blue);
      restored.fromModel(model);

      expect(restored.attack).toBe(5);
    });

    it('round-trips a non-numeric attack value as a string', () => {
      const summon = new Summon('u1', 'bear', '1', 1, 1, SummonColor.blue);
      summon.attack = 'X';

      const model = summon.toModel();
      const restored = new Summon('u1', '', '', 0, 0, SummonColor.blue);
      restored.fromModel(model);

      expect(restored.attack).toBe('X');
    });

    it('round-trips entityConditions', () => {
      const summon = new Summon('u1', 'bear', '1', 1, 1, SummonColor.blue);
      summon.entityConditions = [new EntityCondition(ConditionName.strengthen, 1)];

      const model = summon.toModel();
      const restored = new Summon('u1', '', '', 0, 0, SummonColor.blue);
      restored.fromModel(model);

      expect(restored.entityConditions.length).toBe(1);
      expect(restored.entityConditions[0].name).toBe(ConditionName.strengthen);
    });

    it('round-trips action/additionalAction via JSON (de)serialization', () => {
      const summon = new Summon('u1', 'bear', '1', 1, 1, SummonColor.blue);
      summon.action = { type: 'attack', value: '2' } as any;
      summon.additionalAction = { type: 'move', value: '1' } as any;

      const model = summon.toModel();
      expect(typeof model.action).toBe('string');

      const restored = new Summon('u1', '', '', 0, 0, SummonColor.blue);
      restored.fromModel(model);

      expect(restored.action).toEqual({ type: 'attack', value: '2' });
      expect(restored.additionalAction).toEqual({ type: 'move', value: '1' });
    });

    it('folds shield/retaliate into extraActions on fromModel and clears them', () => {
      const summon = new Summon('u1', 'bear', '1', 1, 1, SummonColor.blue);
      summon.shield = { type: 'shield' } as any;
      summon.retaliate = [{ type: 'retaliate' } as any];
      summon.shieldPersistent = { type: 'shieldPersistent' } as any;
      summon.retaliatePersistent = [{ type: 'retaliatePersistent' } as any];

      const model = summon.toModel();
      const restored = new Summon('u1', '', '', 0, 0, SummonColor.blue);
      restored.fromModel(model);

      expect(restored.shield).toBeUndefined();
      expect(restored.retaliate).toEqual([]);
      expect(restored.shieldPersistent).toBeUndefined();
      expect(restored.retaliatePersistent).toEqual([]);
      expect(restored.extraActions).toEqual(expect.arrayContaining([{ type: 'shield' }, { type: 'retaliate' }]));
      expect(restored.extraActionsPersistent).toEqual(
        expect.arrayContaining([{ type: 'shieldPersistent' }, { type: 'retaliatePersistent' }])
      );
    });

    it('generates a uuid on toModel when the summon has none', () => {
      const summon = new Summon('', 'bear', '1', 1, 1, SummonColor.blue);
      summon.uuid = '';

      const model = summon.toModel();
      expect(model.uuid).toBeTruthy();
    });
  });
});
