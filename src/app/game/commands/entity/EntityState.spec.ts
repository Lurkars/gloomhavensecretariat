import { gameManager } from 'src/app/game/businesslogic/GameManager';
import {
  createTestCharacter,
  createTestMonster,
  createTestMonsterEntity,
  createTestObjective,
  createTestSummon,
  resetTestGame
} from 'src/app/game/commands/commandsTestHelpers';
import { EntityActiveCommand } from 'src/app/game/commands/entity/EntityActive';
import { EntityNumberCommand } from 'src/app/game/commands/entity/EntityNumber';
import { EntityObjectiveMarkerCommand } from 'src/app/game/commands/entity/EntityObjectiveMarker';
import { EntitySummonStateCommand } from 'src/app/game/commands/entity/EntitySummonState';
import { EntityTitleCommand } from 'src/app/game/commands/entity/EntityTitle';
import { EntityTypeCommand } from 'src/app/game/commands/entity/EntityType';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { GameState } from 'src/app/game/model/Game';
import { SummonState } from 'src/app/game/model/Summon';

describe('Entity state commands', () => {
  beforeEach(() => {
    resetTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('EntityActiveCommand', () => {
    it('is only valid for standees and summons during a round', () => {
      const monster = createTestMonster();
      createTestMonsterEntity(monster, 1);
      createTestCharacter(1);
      expect(new EntityActiveCommand('test-testmonster', 1, true).validParameters('test-testmonster', 1, true)).toBe(false);
      gameManager.game.state = GameState.next;
      expect(new EntityActiveCommand('test-testmonster', 1, true).validParameters('test-testmonster', 1, true)).toBe(true);
      expect(new EntityActiveCommand(1, '', true).validParameters(1, '', true)).toBe(false);
    });

    it('toggles a monster standee through the entity manager', () => {
      const monster = createTestMonster();
      const entity = createTestMonsterEntity(monster, 1);
      gameManager.game.state = GameState.next;
      const toggleActive = vi.spyOn(gameManager.entityManager, 'toggleActive').mockImplementation(() => {});
      new EntityActiveCommand('test-testmonster', 1, false).execute();
      expect(toggleActive).not.toHaveBeenCalled();
      new EntityActiveCommand('test-testmonster', 1, true).execute();
      expect(toggleActive).toHaveBeenCalledWith(monster, entity);
    });

    it('activates a summon of an inactive character', () => {
      const character = createTestCharacter(1);
      const summon = createTestSummon(character);
      gameManager.game.state = GameState.next;
      new EntityActiveCommand(1, summon.uuid, true).execute();
      expect(summon.active).toBe(true);
    });
  });

  describe('EntityNumberCommand', () => {
    it('changes a monster standee number and moves an existing standee out of the way', () => {
      const monster = createTestMonster();
      const first = createTestMonsterEntity(monster, 1);
      const second = createTestMonsterEntity(monster, 2);
      new EntityNumberCommand('test-testmonster', 1, 2).execute();
      expect(first.number).toBe(2);
      expect(second.number).toBe(-1);
    });

    it('picks a random free number with 0', () => {
      const monster = createTestMonster();
      const entity = createTestMonsterEntity(monster, -1);
      new EntityNumberCommand('test-testmonster', -1, 0).execute();
      expect(entity.number).toBeGreaterThan(0);
      expect(entity.number).toBeLessThanOrEqual(6);
    });

    it('rejects numbers above the standee count and duplicate objective numbers', () => {
      const monster = createTestMonster('testmonster', 1, 4);
      createTestMonsterEntity(monster, 1);
      expect(new EntityNumberCommand('test-testmonster', 1, 5).validParameters('test-testmonster', 1, 5)).toBe(false);
      const objective = createTestObjective(false, 2);
      const id = 'objective-' + objective.uuid;
      expect(new EntityNumberCommand(id, 1, 2).validParameters(id, 1, 2)).toBe(false);
      expect(new EntityNumberCommand(id, 1, 5).validParameters(id, 1, 5)).toBe(true);
    });
  });

  describe('EntitySummonStateCommand', () => {
    it('sets the summon state of a monster standee', () => {
      const monster = createTestMonster();
      const entity = createTestMonsterEntity(monster, 1);
      new EntitySummonStateCommand('test-testmonster', 1, SummonState.new).execute();
      expect(entity.summon).toBe(SummonState.new);
      new EntitySummonStateCommand('test-testmonster', 1, SummonState.false).execute();
      expect(entity.summon).toBe(SummonState.false);
      expect(new EntitySummonStateCommand('test-testmonster', 1, 'x').validParameters('test-testmonster', 1, 'x')).toBe(false);
    });

    it('sets a character summon new or active', () => {
      const character = createTestCharacter(1);
      const summon = createTestSummon(character);
      new EntitySummonStateCommand(1, summon.uuid, SummonState.new).execute();
      expect(summon.state).toBe(SummonState.new);
      expect(new EntitySummonStateCommand(1, summon.uuid, SummonState.false).validParameters(1, summon.uuid, SummonState.false)).toBe(
        false
      );
    });
  });

  describe('EntityTitleCommand', () => {
    it('sets and unsets the title of a character, summon and objective', () => {
      const character = createTestCharacter(1);
      const summon = createTestSummon(character);
      const objective = createTestObjective();
      new EntityTitleCommand(1, '', 'Hero').execute();
      new EntityTitleCommand(1, summon.uuid, 'Pet').execute();
      new EntityTitleCommand('objective-' + objective.uuid, '', 'Door').execute();
      expect(character.title).toBe('Hero');
      expect(summon.title).toBe('Pet');
      expect(objective.title).toBe('Door');
      new EntityTitleCommand(1, '', '').execute();
      expect(character.title).toBe('');
    });

    it('rejects monster standees', () => {
      const monster = createTestMonster();
      createTestMonsterEntity(monster, 1);
      expect(new EntityTitleCommand('test-testmonster', 1, 'x').validParameters('test-testmonster', 1, 'x')).toBe(false);
    });
  });

  describe('EntityTypeCommand', () => {
    it('sets the type of standees', () => {
      const monster = createTestMonster();
      const first = createTestMonsterEntity(monster, 1);
      const second = createTestMonsterEntity(monster, 2, MonsterType.elite);
      new EntityTypeCommand('test-testmonster', '', MonsterType.elite).execute();
      expect(first.type).toBe(MonsterType.elite);
      expect(second.type).toBe(MonsterType.elite);
      new EntityTypeCommand('test-testmonster', 2, MonsterType.normal).execute();
      expect(first.type).toBe(MonsterType.elite);
      expect(second.type).toBe(MonsterType.normal);
    });

    it('is only valid for monsters', () => {
      createTestCharacter(1);
      expect(new EntityTypeCommand(1, '', MonsterType.elite).validParameters(1, '', MonsterType.elite)).toBe(false);
    });
  });

  describe('EntityObjectiveMarkerCommand', () => {
    it('sets the marker of an objective standee or of the whole objective', () => {
      const objective = createTestObjective(false, 2);
      const id = 'objective-' + objective.uuid;
      new EntityObjectiveMarkerCommand(id, 1, 'a').execute();
      expect(objective.entities[0].marker).toBe('a');
      expect(objective.entities[1].marker).toBe('');

      new EntityObjectiveMarkerCommand(id, '', 'b').execute();
      expect(objective.marker).toBe('b');
      expect(objective.entities.every((entity) => entity.marker === 'b')).toBe(true);
    });

    it('rejects unknown markers and non objective figures', () => {
      const objective = createTestObjective();
      const id = 'objective-' + objective.uuid;
      createTestCharacter(1);
      expect(new EntityObjectiveMarkerCommand(id, '', 'zz').validParameters(id, '', 'zz')).toBe(false);
      expect(new EntityObjectiveMarkerCommand(1, '', 'a').validParameters(1, '', 'a')).toBe(false);
    });
  });
});
