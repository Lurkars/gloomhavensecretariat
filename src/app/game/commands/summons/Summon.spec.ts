import {
  createTestCharacter,
  createTestMonster,
  createTestMonsterEntity,
  createTestSummon,
  resetTestGame
} from 'src/app/game/commands/commandsTestHelpers';
import { SummonAddCommand } from 'src/app/game/commands/summons/SummonAdd';
import { SummonAddCustomCommand } from 'src/app/game/commands/summons/SummonAddCustom';
import { SummonInitCommand } from 'src/app/game/commands/summons/SummonInit';
import { SummonStatCommand } from 'src/app/game/commands/summons/SummonStat';
import { SummonTrapCommand } from 'src/app/game/commands/summons/SummonTrap';
import { ConditionName, EntityCondition } from 'src/app/game/model/data/Condition';
import { SummonData } from 'src/app/game/model/data/SummonData';
import { SummonColor, SummonState } from 'src/app/game/model/Summon';

describe('Summon commands', () => {
  beforeEach(() => {
    resetTestGame();
  });

  describe('SummonAddCommand', () => {
    it('adds a summon from the character summon data with the next free number', () => {
      const character = createTestCharacter(1);
      character.availableSummons = [Object.assign(new SummonData(), { name: 'wolf', cardId: '5', health: 6, count: 2 })];
      new SummonAddCommand(1, 'wolf', 1).execute();
      new SummonAddCommand(1, 'wolf', 1).execute();
      expect(character.summons.map((summon) => summon.number)).toEqual([1, 2]);
      expect(character.summons[0].color).toBe(SummonColor.blue);
      expect(character.summons[0].state).toBe(SummonState.new);
      expect(character.summons[0].init).toBe(false);
    });

    it('rejects unknown summons and exceeding the summon count', () => {
      const character = createTestCharacter(1);
      character.availableSummons = [Object.assign(new SummonData(), { name: 'wolf', cardId: '5', count: 1 })];
      expect(new SummonAddCommand(1, 'bear', 1).validParameters(1, 'bear', 1)).toBe(false);
      new SummonAddCommand(1, 'wolf', 1).execute();
      expect(new SummonAddCommand(1, 'wolf', 1).validParameters(1, 'wolf', 1)).toBe(false);
    });
  });

  describe('SummonAddCustomCommand', () => {
    it('adds a custom summon', () => {
      const character = createTestCharacter(1);
      new SummonAddCustomCommand(1, 'Ghost', 3, SummonColor.red, 1).execute();
      expect(character.summons[0].name).toBe('Ghost');
      expect(character.summons[0].number).toBe(3);
      expect(character.summons[0].color).toBe(SummonColor.red);
    });

    it('rejects duplicates and invalid colors', () => {
      createTestCharacter(1);
      new SummonAddCustomCommand(1, 'Ghost', 3, SummonColor.red, 1).execute();
      expect(new SummonAddCustomCommand(1, 'Ghost', 3, SummonColor.red, 1).validParameters(1, 'Ghost', 3, SummonColor.red, 1)).toBe(false);
      expect(new SummonAddCustomCommand(1, 'Ghost', 4, 'rainbow', 1).validParameters(1, 'Ghost', 4, 'rainbow', 1)).toBe(false);
    });
  });

  describe('SummonStatCommand', () => {
    it('changes summon stats', () => {
      const character = createTestCharacter(1);
      const summon = createTestSummon(character);
      summon.movement = 2;
      summon.range = 1;
      new SummonStatCommand(1, summon.uuid, 'maxHp', 2).execute();
      new SummonStatCommand(1, summon.uuid, 'attack', 1).execute();
      new SummonStatCommand(1, summon.uuid, 'movement', 1).execute();
      new SummonStatCommand(1, summon.uuid, 'range', 2).execute();
      expect(summon.maxHealth).toBe(6);
      expect(summon.attack).toBe(1);
      expect(summon.movement).toBe(3);
      expect(summon.range).toBe(3);
    });

    it('rejects unknown stats, trap stats for non traps and negative results', () => {
      const character = createTestCharacter(1);
      const summon = createTestSummon(character);
      expect(new SummonStatCommand(1, summon.uuid, 'speed', 1).validParameters(1, summon.uuid, 'speed', 1)).toBe(false);
      expect(new SummonStatCommand(1, summon.uuid, 'trapDamage', 1).validParameters(1, summon.uuid, 'trapDamage', 1)).toBe(false);
      expect(new SummonStatCommand(1, summon.uuid, 'attack', -1).validParameters(1, summon.uuid, 'attack', -1)).toBe(false);
    });
  });

  describe('SummonInitCommand', () => {
    it('initializes a new summon with stat adjustments', () => {
      const character = createTestCharacter(1);
      const summon = createTestSummon(character);
      summon.init = true;
      new SummonInitCommand(1, summon.uuid, 0, 2, 1).execute();
      expect(summon.init).toBe(false);
      expect(summon.maxHealth).toBe(6);
      expect(summon.health).toBe(6);
      expect(summon.attack).toBe(1);
      expect(character.summons).toContain(summon);
    });

    it('is only valid for uninitialized summons', () => {
      const character = createTestCharacter(1);
      const summon = createTestSummon(character);
      expect(new SummonInitCommand(1, summon.uuid).validParameters(1, summon.uuid)).toBe(false);
    });
  });

  describe('SummonTrapCommand', () => {
    it('damages the target, applies conditions and removes the trap', () => {
      const character = createTestCharacter(1);
      const trap = createTestSummon(character, 'trap');
      trap.trap = true;
      trap.movement = 3;
      trap.attack = 'X';
      trap.entityConditions.push(new EntityCondition(ConditionName.poison));
      const monster = createTestMonster();
      const entity = createTestMonsterEntity(monster, 1);

      new SummonTrapCommand(1, trap.uuid, 'test-testmonster', 1).execute();

      expect(entity.health).toBe(2);
      expect(entity.entityConditions.some((condition) => condition.name === ConditionName.poison)).toBe(true);
      expect(character.summons).not.toContain(trap);
    });

    it('requires a trap summon', () => {
      const character = createTestCharacter(1);
      const summon = createTestSummon(character);
      createTestCharacter(2);
      expect(new SummonTrapCommand(1, summon.uuid, 2, '').validParameters(1, summon.uuid, 2, '')).toBe(false);
    });
  });
});
