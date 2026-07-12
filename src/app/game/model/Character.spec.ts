import { Character } from 'src/app/game/model/Character';
import { CharacterClass, CharacterData, CharacterGender } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { ConditionName, EntityCondition } from 'src/app/game/model/data/Condition';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { Summon, SummonColor } from 'src/app/game/model/Summon';

function buildCharacterData(name: string = 'test-char'): CharacterData {
  const data = new CharacterData();
  data.name = name;
  data.edition = 'gh';
  data.characterClass = CharacterClass.human;
  data.gender = CharacterGender.male;
  data.stats = [new CharacterStat(1, 10), new CharacterStat(2, 12)];
  return data;
}

describe('Character model', () => {
  describe('construction', () => {
    it('sets maxHealth/health from the matching level stat', () => {
      const character = new Character(buildCharacterData(), 2);
      expect(character.level).toBe(2);
      expect(character.maxHealth).toBe(12);
      expect(character.health).toBe(12);
    });

    it('clamps a requested level below 1 up to 1', () => {
      const character = new Character(buildCharacterData(), 0);
      expect(character.level).toBe(1);
      expect(character.maxHealth).toBe(10);
    });

    it('clamps a requested level above 9 down to 9', () => {
      const data = buildCharacterData();
      data.stats.push(new CharacterStat(9, 40));
      const character = new Character(data, 20);
      expect(character.level).toBe(9);
      expect(character.maxHealth).toBe(40);
    });

    it('records a stat FigureError when no stat exists for the (clamped) level', () => {
      const data = buildCharacterData();
      data.stats = [new CharacterStat(1, 10)]; // no stat for level 5
      const character = new Character(data, 5);
      expect(character.level).toBe(0);
      expect(character.maxHealth).toBe(0);
      expect(character.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('toModel/fromModel round-trip', () => {
    it('reproduces basic scalar fields', () => {
      const character = new Character(buildCharacterData(), 1);
      character.title = 'The Brute';
      character.initiative = 42;
      character.experience = 15;
      character.loot = 3;
      character.exhausted = true;
      character.off = true;
      character.active = false;
      character.health = 7;
      character.number = 2;
      character.donations = 5;
      character.token = 1;
      character.absent = true;
      character.longRest = true;
      character.battleGoal = true;

      const model = character.toModel();

      const restored = new Character(buildCharacterData(), 1);
      restored.fromModel(model);

      expect(restored.title).toBe('The Brute');
      expect(restored.initiative).toBe(42);
      expect(restored.experience).toBe(15);
      expect(restored.loot).toBe(3);
      expect(restored.exhausted).toBe(true);
      expect(restored.off).toBe(true);
      expect(restored.active).toBe(false);
      expect(restored.health).toBe(7);
      expect(restored.number).toBe(2);
      expect(restored.donations).toBe(5);
      expect(restored.token).toBe(1);
      expect(restored.absent).toBe(true);
      expect(restored.longRest).toBe(true);
      expect(restored.battleGoal).toBe(true);
    });

    it('round-trips lootCards, treasures, markers and tags', () => {
      const character = new Character(buildCharacterData(), 1);
      character.lootCards = [1, 2, 3];
      character.treasures = ['12', 5, 'special'];
      character.markers = ['a', 'b'];
      character.tags = ['tag1'];

      const model = character.toModel();
      const restored = new Character(buildCharacterData(), 1);
      restored.fromModel(model);

      expect(restored.lootCards).toEqual([1, 2, 3]);
      // treasures round-trip through string, then get coerced back to number when numeric
      expect(restored.treasures).toEqual([12, 5, 'special']);
      expect(restored.markers).toEqual(['a', 'b']);
      expect(restored.tags).toEqual(['tag1']);
    });

    it('round-trips entityConditions', () => {
      const character = new Character(buildCharacterData(), 1);
      const condition = new EntityCondition(ConditionName.poison, 2);
      character.entityConditions = [condition];

      const model = character.toModel();
      const restored = new Character(buildCharacterData(), 1);
      restored.fromModel(model);

      expect(restored.entityConditions.length).toBe(1);
      expect(restored.entityConditions[0].name).toBe(ConditionName.poison);
      expect(restored.entityConditions[0].value).toBe(2);
    });

    it('round-trips battleGoals identifiers', () => {
      const character = new Character(buildCharacterData(), 1);
      character.battleGoals = [new Identifier('goal-a', 'gh')];

      const model = character.toModel();
      const restored = new Character(buildCharacterData(), 1);
      restored.fromModel(model);

      expect(restored.battleGoals).toEqual([new Identifier('goal-a', 'gh')]);
    });

    it('round-trips summons (creating new Summon instances on the restored character)', () => {
      const character = new Character(buildCharacterData(), 1);
      const summon = new Summon('summon-uuid-1', 'bear', '1', 1, 1, SummonColor.blue);
      summon.health = 4;
      character.summons = [summon];

      const model = character.toModel();
      const restored = new Character(buildCharacterData(), 1);
      restored.fromModel(model);

      expect(restored.summons.length).toBe(1);
      expect(restored.summons[0]).toBeInstanceOf(Summon);
      expect(restored.summons[0].uuid).toBe('summon-uuid-1');
      expect(restored.summons[0].name).toBe('bear');
      expect(restored.summons[0].health).toBe(4);
    });

    it('drops an empty summons array cleanly (round-trip with no summons)', () => {
      const character = new Character(buildCharacterData(), 1);
      character.summons = [];

      const model = character.toModel();
      expect(model.summons).toEqual([]);

      const restored = new Character(buildCharacterData(), 1);
      restored.fromModel(model);
      expect(restored.summons).toEqual([]);
    });

    it('resolves edition from character data lookup when model.edition is empty (needs gameManager, smoke-tested only for no-throw)', () => {
      const character = new Character(buildCharacterData(), 1);
      const model = character.toModel();
      model.edition = '';

      const restored = new Character(buildCharacterData(), 1);
      expect(() => restored.fromModel(model)).not.toThrow();
    });

    it('round-trips shield/retaliate/extraActions by folding shield and retaliate into extraActions', () => {
      const character = new Character(buildCharacterData(), 1);
      character.shield = { type: 'shield' } as any;
      character.retaliate = [{ type: 'retaliate' } as any];

      const model = character.toModel();
      const restored = new Character(buildCharacterData(), 1);
      restored.fromModel(model);

      // per Character.fromModel(), shield/retaliate get folded into extraActions and cleared
      expect(restored.shield).toBeUndefined();
      expect(restored.retaliate).toEqual([]);
      expect(restored.extraActions).toEqual(expect.arrayContaining([{ type: 'shield' }, { type: 'retaliate' }]));
    });
  });
});
