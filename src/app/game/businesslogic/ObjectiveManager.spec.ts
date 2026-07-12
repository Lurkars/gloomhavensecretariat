import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { AdditionalIdentifier } from 'src/app/game/model/data/Identifier';
import { ObjectiveData, ScenarioObjectiveIdentifier } from 'src/app/game/model/data/ObjectiveData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { GameState } from 'src/app/game/model/Game';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';

// Reuse the singleton's own objectiveManager instance (backed by gameManager.game) rather than
// constructing a new one, matching the pattern used for the other business-logic manager specs.
describe('ObjectiveManager', () => {
  let objectiveManager: typeof gameManager.objectiveManager;

  beforeEach(() => {
    gameManager.game.figures = [];
    gameManager.game.state = GameState.next;
    vi.spyOn(gameManager, 'addEntityCount').mockImplementation(() => {});
    vi.spyOn(gameManager, 'sortFigures').mockImplementation(() => {});
    objectiveManager = gameManager.objectiveManager;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('objectiveName', () => {
    it('returns the title when set', () => {
      const objective = new ObjectiveContainer('u1');
      objective.title = 'Custom title';
      expect(objectiveManager.objectiveName(objective)).toBe('Custom title');
    });

    it('returns "data.objective.<name>" when title is falsy but name is set', () => {
      const objective = new ObjectiveContainer('u1');
      objective.name = 'my-objective';
      expect(objectiveManager.objectiveName(objective)).toBe('data.objective.my-objective');
    });

    it('returns "escort" when title and name are falsy but escort is true', () => {
      const objective = new ObjectiveContainer('u1');
      objective.name = '';
      objective.title = '';
      objective.escort = true;
      expect(objectiveManager.objectiveName(objective)).toBe('escort');
    });

    it('returns "objective" only when title, name and escort are all falsy', () => {
      const objective = new ObjectiveContainer('u1');
      objective.name = '';
      objective.title = '';
      objective.escort = false;
      expect(objectiveManager.objectiveName(objective)).toBe('objective');
    });
  });

  describe('addObjective', () => {
    it('creates a new ObjectiveContainer from ObjectiveData when none exists yet', () => {
      const objectiveData = new ObjectiveData('crate', 5);

      const result = objectiveManager.addObjective(objectiveData);

      expect(result).toBeInstanceOf(ObjectiveContainer);
      expect(result.name).toBe('crate');
      expect(result.health).toBe(5);
      expect(gameManager.game.figures).toContain(result);
    });

    it('applies a custom display name when provided', () => {
      const objectiveData = new ObjectiveData('crate', 5);
      const result = objectiveManager.addObjective(objectiveData, 'renamed-crate');
      expect(result.name).toBe('renamed-crate');
    });

    it('sets edition to "escort" for escort objectives and "objective" otherwise', () => {
      const escortData = new ObjectiveData('vip', 5, true);
      const escort = objectiveManager.addObjective(escortData);
      expect(escort.edition).toBe('escort');

      gameManager.game.figures = [];
      const plainData = new ObjectiveData('crate', 5, false);
      const plain = objectiveManager.addObjective(plainData);
      expect(plain.edition).toBe('objective');
    });

    it('reuses an existing matching ObjectiveContainer instead of creating a duplicate', () => {
      const objectiveData = new ObjectiveData('crate', 5);
      const first = objectiveManager.addObjective(objectiveData);
      const second = objectiveManager.addObjective(objectiveData);

      expect(second).toBe(first);
      expect(gameManager.game.figures.filter((f) => f instanceof ObjectiveContainer).length).toBe(1);
    });

    it('sets the initiative from objectiveData when provided', () => {
      const objectiveData = new ObjectiveData('crate', 5, false, -1, '', [], 42);
      const result = objectiveManager.addObjective(objectiveData);
      expect(result.initiative).toBe(42);
    });
  });

  describe('removeObjective', () => {
    it('removes the objective container from game.figures', () => {
      const objective = new ObjectiveContainer('u1');
      gameManager.game.figures = [objective];

      objectiveManager.removeObjective(objective);

      expect(gameManager.game.figures).not.toContain(objective);
    });

    it('does nothing when the container is not present', () => {
      const objective = new ObjectiveContainer('u1');
      gameManager.game.figures = [];

      expect(() => objectiveManager.removeObjective(objective)).not.toThrow();
      expect(gameManager.game.figures.length).toBe(0);
    });
  });

  describe('addObjectiveEntity', () => {
    it('assigns entity number 1 (index+1) for the first entity', () => {
      const objective = new ObjectiveContainer('u1');
      const entity = objectiveManager.addObjectiveEntity(objective);
      expect(entity.number).toBe(1);
      expect(objective.entities).toContain(entity);
    });

    it('assigns increasing numbers for subsequent entities', () => {
      const objective = new ObjectiveContainer('u1');
      objectiveManager.addObjectiveEntity(objective);
      const second = objectiveManager.addObjectiveEntity(objective);
      expect(second.number).toBe(2);
    });

    it('turns off the "off" flag on the container when adding an entity', () => {
      const objective = new ObjectiveContainer('u1');
      objective.off = true;
      objectiveManager.addObjectiveEntity(objective);
      expect(objective.off).toBe(false);
    });

    it('applies tags from objectiveData to the new entity', () => {
      const objective = new ObjectiveContainer('u1');
      const objectiveData = new ObjectiveData('crate', 5, false, -1, '', ['tag-a']);
      const entity = objectiveManager.addObjectiveEntity(objective, undefined, objectiveData);
      expect(entity.tags).toEqual(['tag-a']);
    });

    it('uses the given marker, falling back to objectiveData marker, then container marker', () => {
      const objective = new ObjectiveContainer('u1');
      objective.marker = 'container-marker';
      const entity = objectiveManager.addObjectiveEntity(objective);
      expect(entity.marker).toBe('container-marker');
    });
  });

  describe('removeObjectiveEntity', () => {
    it('removes the given entity from the container', () => {
      const objective = new ObjectiveContainer('u1');
      const entity = objectiveManager.addObjectiveEntity(objective);
      objectiveManager.addObjectiveEntity(objective); // keep one alive so container isn't auto-removed

      objectiveManager.removeObjectiveEntity(objective, entity);

      expect(objective.entities).not.toContain(entity);
    });

    it('removes the whole container from game.figures once all entities are gone and it is not active', () => {
      const objective = new ObjectiveContainer('u1');
      gameManager.game.figures = [objective];
      const entity = objectiveManager.addObjectiveEntity(objective);

      objectiveManager.removeObjectiveEntity(objective, entity);

      expect(gameManager.game.figures).not.toContain(objective);
    });

    it('toggles the figure (via roundManager) instead of removing it when the container is active during GameState.next', () => {
      const objective = new ObjectiveContainer('u1');
      objective.active = true;
      gameManager.game.figures = [objective];
      gameManager.game.state = GameState.next;
      const toggleSpy = vi.spyOn(gameManager.roundManager, 'toggleFigure').mockImplementation(() => {});
      const entity = objectiveManager.addObjectiveEntity(objective);

      objectiveManager.removeObjectiveEntity(objective, entity);

      expect(toggleSpy).toHaveBeenCalledWith(objective);
      expect(gameManager.game.figures).toContain(objective);
    });
  });

  describe('objectiveEntityCountIdentifier', () => {
    it('returns 0 when the identifier type is not "objective"', () => {
      const objective = new ObjectiveContainer('u1');
      objective.name = 'crate';
      objective.edition = 'objective';
      objectiveManager.addObjectiveEntity(objective);

      const identifier = new AdditionalIdentifier('crate', 'objective', 'monster');
      expect(objectiveManager.objectiveEntityCountIdentifier(objective, identifier)).toBe(0);
    });

    it('returns 0 when name/edition do not match and type is not "all"', () => {
      const objective = new ObjectiveContainer('u1');
      objective.name = 'crate';
      objective.edition = 'objective';
      objectiveManager.addObjectiveEntity(objective);

      const identifier = new AdditionalIdentifier('other', 'objective', 'objective');
      expect(objectiveManager.objectiveEntityCountIdentifier(objective, identifier)).toBe(0);
    });

    it('counts alive matching entities for a matching identifier', () => {
      const objective = new ObjectiveContainer('u1');
      objective.name = 'crate';
      objective.edition = 'objective';
      objectiveManager.addObjectiveEntity(objective);
      objectiveManager.addObjectiveEntity(objective);

      const identifier = new AdditionalIdentifier('crate', 'objective', 'objective');
      expect(objectiveManager.objectiveEntityCountIdentifier(objective, identifier)).toBe(2);
    });

    it('filters by marker when the identifier specifies one', () => {
      const objective = new ObjectiveContainer('u1');
      objective.name = 'crate';
      objective.edition = 'objective';
      objectiveManager.addObjectiveEntity(objective, undefined, undefined, 'm1');
      objectiveManager.addObjectiveEntity(objective, undefined, undefined, 'm2');

      const identifier = new AdditionalIdentifier('crate', 'objective', 'objective', 'm1');
      expect(objectiveManager.objectiveEntityCountIdentifier(objective, identifier)).toBe(1);
    });

    it('counts entities for identifier.type "all" regardless of name/edition mismatch', () => {
      const objective = new ObjectiveContainer('u1');
      objective.name = 'crate';
      objective.edition = 'objective';
      objectiveManager.addObjectiveEntity(objective);

      const identifier = new AdditionalIdentifier('anything', 'other-edition', 'all');
      expect(objectiveManager.objectiveEntityCountIdentifier(objective, identifier)).toBe(1);
    });
  });

  describe('skipObjective', () => {
    it('returns false for figures that are not ObjectiveContainers', () => {
      expect(objectiveManager.skipObjective({} as any)).toBe(false);
    });

    it('returns false for escort objectives', () => {
      const objective = new ObjectiveContainer('u1');
      objective.escort = true;
      expect(objectiveManager.skipObjective(objective)).toBe(false);
    });

    it('returns true for a non-escort objective without an objectiveId', () => {
      const objective = new ObjectiveContainer('u1');
      expect(objectiveManager.skipObjective(objective)).toBe(true);
    });

    it('returns true when objectiveData for the objectiveId cannot be resolved', () => {
      const identifier = new AdditionalIdentifier('unknown', 'gh', 'objective');
      const objective = new ObjectiveContainer('u1', identifier);
      vi.spyOn(gameManager, 'figuresByIdentifier').mockReturnValue([]);
      expect(objectiveManager.skipObjective(objective)).toBe(true);
    });
  });

  describe('objectiveDataByObjectiveIdentifier (scenario-based identifier)', () => {
    it('returns the objective at the given index from scenario data', () => {
      const scenarioData = new ScenarioData();
      scenarioData.index = '1';
      const objectiveData = new ObjectiveData('crate', 5);
      scenarioData.objectives = [objectiveData];
      vi.spyOn(gameManager, 'scenarioData').mockReturnValue([scenarioData]);

      const identifier = new ScenarioObjectiveIdentifier();
      identifier.edition = 'gh';
      identifier.scenario = '1';
      identifier.index = 0;

      const result = objectiveManager.objectiveDataByObjectiveIdentifier(identifier);
      expect(result).toBe(objectiveData);
    });

    it('returns undefined when the scenario cannot be found', () => {
      vi.spyOn(gameManager, 'scenarioData').mockReturnValue([]);

      const identifier = new ScenarioObjectiveIdentifier();
      identifier.edition = 'gh';
      identifier.scenario = 'missing';
      identifier.index = 0;

      expect(objectiveManager.objectiveDataByObjectiveIdentifier(identifier)).toBeUndefined();
    });

    it('looks up section data when identifier.section is true', () => {
      const sectionData = new ScenarioData();
      sectionData.index = '1';
      sectionData.group = 'g';
      const objectiveData = new ObjectiveData('crate', 5);
      sectionData.objectives = [objectiveData];
      vi.spyOn(gameManager, 'sectionData').mockReturnValue([sectionData]);

      const identifier = new ScenarioObjectiveIdentifier();
      identifier.edition = 'gh';
      identifier.scenario = '1';
      identifier.group = 'g';
      identifier.section = true;
      identifier.index = 0;

      const result = objectiveManager.objectiveDataByObjectiveIdentifier(identifier);
      expect(result).toBe(objectiveData);
    });
  });

  describe('next', () => {
    it('removes dead, non-dormant entities and resets the container "off" flag', () => {
      const objective = new ObjectiveContainer('u1');
      objective.off = true;
      gameManager.game.figures = [objective];
      const entity = objectiveManager.addObjectiveEntity(objective);
      entity.health = 0;
      entity.maxHealth = 5;

      objectiveManager.next();

      expect(objective.entities).not.toContain(entity);
      expect(objective.off).toBe(false);
    });

    it('keeps dormant dead entities', () => {
      const objective = new ObjectiveContainer('u1');
      gameManager.game.figures = [objective];
      const entity = objectiveManager.addObjectiveEntity(objective);
      entity.health = 0;
      entity.maxHealth = 5;
      entity.dormant = true;

      objectiveManager.next();

      expect(objective.entities).toContain(entity);
    });
  });

  describe('draw', () => {
    it('turns off the "off" flag when at least one entity is alive', () => {
      const objective = new ObjectiveContainer('u1');
      objective.off = true;
      gameManager.game.figures = [objective];
      const entity = objectiveManager.addObjectiveEntity(objective);
      entity.health = 5;
      entity.maxHealth = 5;

      objectiveManager.draw();

      expect(objective.off).toBe(false);
    });

    it('leaves "off" untouched when no entities are alive', () => {
      const objective = new ObjectiveContainer('u1');
      objective.off = true;
      gameManager.game.figures = [objective];
      const entity = new ObjectiveEntity('e1', 1, objective, '');
      entity.health = 0;
      entity.maxHealth = 5;
      objective.entities = [entity];

      objectiveManager.draw();

      expect(objective.off).toBe(true);
    });
  });
});
