import { AdditionalIdentifier } from 'src/app/game/model/data/Identifier';
import { ScenarioObjectiveIdentifier } from 'src/app/game/model/data/ObjectiveData';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';

describe('ObjectiveContainer model', () => {
  describe('construction', () => {
    it('applies defaults', () => {
      const objective = new ObjectiveContainer('u1');
      expect(objective.uuid).toBe('u1');
      expect(objective.health).toBe(7);
      expect(objective.initiative).toBe(99);
      expect(objective.objectiveId).toBeUndefined();
    });

    it('stores the given objectiveId', () => {
      const identifier = new AdditionalIdentifier('crate', 'gh', 'objective');
      const objective = new ObjectiveContainer('u1', identifier);
      expect(objective.objectiveId).toBe(identifier);
    });
  });

  describe('toModel/fromModel round-trip', () => {
    it('reproduces basic scalar fields', () => {
      const objective = new ObjectiveContainer('u1');
      objective.marker = 'm1';
      objective.title = 'Crate';
      objective.name = 'crate';
      objective.escort = false;
      objective.level = 3;
      objective.off = true;
      objective.active = true;
      objective.health = 12;
      objective.initiative = 42;
      objective.amDeck = 'A';

      const model = objective.toModel();
      const restored = new ObjectiveContainer('u1');
      restored.fromModel(model);

      expect(restored.marker).toBe('m1');
      expect(restored.title).toBe('Crate');
      expect(restored.name).toBe('crate');
      expect(restored.escort).toBe(false);
      expect(restored.level).toBe(3);
      expect(restored.off).toBe(true);
      expect(restored.active).toBe(true);
      expect(restored.health).toBe(12);
      expect(restored.initiative).toBe(42);
      expect(restored.amDeck).toBe('A');
    });

    it('sets edition based on escort after fromModel', () => {
      const objective = new ObjectiveContainer('u1');
      objective.escort = true;

      const model = objective.toModel();
      const restored = new ObjectiveContainer('u1');
      restored.fromModel(model);

      expect(restored.edition).toBe('escort');
    });

    it('round-trips entities, preserving matched instances by uuid', () => {
      const objective = new ObjectiveContainer('u1');
      const entity = new ObjectiveEntity('e1', 1, objective, 'm1');
      entity.health = 3;
      objective.entities = [entity];

      const model = objective.toModel();
      objective.fromModel(model);

      expect(objective.entities.length).toBe(1);
      expect(objective.entities[0]).toBe(entity);
      expect(objective.entities[0].health).toBe(3);
    });

    it('creates a fresh entity instance on a different ObjectiveContainer instance', () => {
      const objective = new ObjectiveContainer('u1');
      const entity = new ObjectiveEntity('e1', 1, objective, 'm1');
      entity.health = 3;
      objective.entities = [entity];

      const model = objective.toModel();
      const restored = new ObjectiveContainer('u1');
      restored.fromModel(model);

      expect(restored.entities.length).toBe(1);
      expect(restored.entities[0]).not.toBe(entity);
      expect(restored.entities[0].uuid).toBe('e1');
      expect(restored.entities[0].health).toBe(3);
    });

    it('drops entities no longer present in the model', () => {
      const objective = new ObjectiveContainer('u1');
      const entity1 = new ObjectiveEntity('e1', 1, objective, '');
      const entity2 = new ObjectiveEntity('e2', 2, objective, '');
      objective.entities = [entity1, entity2];

      const model = objective.toModel();
      model.entities = model.entities.filter((e) => e.uuid === 'e1');

      objective.fromModel(model);

      expect(objective.entities.length).toBe(1);
      expect(objective.entities[0].uuid).toBe('e1');
    });

    it('round-trips a scenario-based objectiveId', () => {
      const identifier = new ScenarioObjectiveIdentifier();
      identifier.edition = 'gh';
      identifier.scenario = '1';
      identifier.index = 0;
      const objective = new ObjectiveContainer('u1', identifier);

      const model = objective.toModel();
      expect(model.objectiveId).toEqual(identifier);
      expect(model.additionalObjectiveId).toBeUndefined();

      const restored = new ObjectiveContainer('u1');
      restored.fromModel(model);
      expect(restored.objectiveId).toEqual(identifier);
    });

    it('round-trips an additional (non-scenario) objectiveId', () => {
      const identifier = new AdditionalIdentifier('crate', 'gh', 'objective');
      const objective = new ObjectiveContainer('u1', identifier);

      const model = objective.toModel();
      expect(model.additionalObjectiveId).toEqual(identifier);
      expect(model.objectiveId).toBeUndefined();

      const restored = new ObjectiveContainer('u1');
      restored.fromModel(model);
      expect(restored.objectiveId).toEqual(identifier);
    });
  });
});
