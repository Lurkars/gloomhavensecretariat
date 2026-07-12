import {
  removeEmptyValues,
  sortAbility,
  sortAction,
  sortCharacter,
  sortCharacterStat,
  sortDeck,
  sortEvent,
  sortEventCondition,
  sortEventEffect,
  sortEventOption,
  sortEventOutcome,
  sortMonster,
  sortMonsterStandees,
  sortMonsterStat,
  sortObjectKeys,
  sortRoom,
  sortScenario,
  sortScenarioRule,
  sortSummon
} from 'src/app/game/util/sorter';

describe('sorter', () => {
  describe('sortObjectKeys', () => {
    it('returns undefined for undefined input', () => {
      expect(sortObjectKeys(undefined)).toBeUndefined();
    });

    it('returns undefined for null input', () => {
      expect(sortObjectKeys(null)).toBeUndefined();
    });

    it('orders keys according to the given priority list', () => {
      const result = sortObjectKeys({ c: 3, a: 1, b: 2 }, 'a', 'b', 'c');
      expect(Object.keys(result)).toEqual(['a', 'b', 'c']);
      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('puts keys from the priority list before keys not mentioned', () => {
      const result = sortObjectKeys({ z: 26, a: 1, m: 13 }, 'a');
      expect(Object.keys(result)[0]).toBe('a');
    });

    it('keeps relative order stable for keys not in the priority list', () => {
      const result = sortObjectKeys({ z: 26, y: 25, a: 1 }, 'a');
      expect(Object.keys(result)).toEqual(['a', 'z', 'y']);
    });

    it('works with an empty priority list (keys array empty)', () => {
      const result = sortObjectKeys({ b: 2, a: 1 });
      expect(Object.keys(result)).toEqual(['b', 'a']);
    });

    it('ignores priority keys that are not present on the object', () => {
      const result = sortObjectKeys({ a: 1 }, 'x', 'a', 'y');
      expect(result).toEqual({ a: 1 });
    });

    it('does not mutate the input object identity, but returns a new object', () => {
      const input = { b: 2, a: 1 };
      const result = sortObjectKeys(input, 'a', 'b');
      expect(result).not.toBe(input);
    });
  });

  describe('removeEmptyValues', () => {
    it('does nothing for undefined input', () => {
      expect(() => removeEmptyValues(undefined)).not.toThrow();
    });

    it('does nothing for null input', () => {
      expect(() => removeEmptyValues(null)).not.toThrow();
    });

    it('sets falsy values to undefined', () => {
      const obj: any = { a: 0, b: '', c: false, d: null, e: undefined, f: 'kept', g: 1 };
      removeEmptyValues(obj);
      expect(obj.a).toBeUndefined();
      expect(obj.b).toBeUndefined();
      expect(obj.c).toBeUndefined();
      expect(obj.d).toBeUndefined();
      expect(obj.e).toBeUndefined();
      expect(obj.f).toBe('kept');
      expect(obj.g).toBe(1);
    });

    it('keeps values whose key is in the ignores list even if falsy', () => {
      const obj: any = { a: 0, b: false, c: 'x' };
      removeEmptyValues(obj, 'a', 'b');
      expect(obj.a).toBe(0);
      expect(obj.b).toBe(false);
      expect(obj.c).toBe('x');
    });

    it('mutates the object in place (no return value)', () => {
      const obj: any = { a: 0 };
      const result = removeEmptyValues(obj);
      expect(result).toBeUndefined();
      expect(obj.a).toBeUndefined();
    });
  });

  describe('sortAction', () => {
    it('sorts action keys into the canonical order', () => {
      const action: any = { type: 'attack', value: '2' };
      const result = sortAction(action);
      expect(Object.keys(result)).toEqual(['type', 'value']);
    });

    it('keeps an empty subActions array (arrays are truthy, not stripped)', () => {
      const action: any = { subActions: [], type: 'attack', value: '2' };
      const result = sortAction(action);
      expect(Object.keys(result)).toEqual(['type', 'value', 'subActions']);
      expect(result.subActions).toEqual([]);
    });

    it('removes empty values except "value"', () => {
      const action: any = { type: '', value: 0, multiTarget: false };
      const result = sortAction(action);
      expect(result.value).toBe(0);
      expect(result.type).toBeUndefined();
      expect(result.multiTarget).toBeUndefined();
    });

    it('recursively sorts subActions', () => {
      const action: any = {
        type: 'attack',
        subActions: [{ type: 'target', value: '1' }]
      };
      const result = sortAction(action);
      expect(Object.keys(result.subActions[0])).toEqual(['type', 'value']);
    });

    it('sorts and normalizes area hex values by x then y', () => {
      const action: any = {
        type: 'area',
        value: '(1,1,active)|(0,0,target)|(1,0,blank)'
      };
      const result = sortAction(action);
      expect(result.value).toBe('(0,0,target)|(1,0,blank)|(1,1,active)');
    });

    it('keeps the sub-value suffix (":something") on area hexes', () => {
      const action: any = {
        type: 'area',
        value: '(2,0,conditional:foo)|(1,0,custom:bar)'
      };
      const result = sortAction(action);
      expect(result.value).toBe('(1,0,custom:bar)|(2,0,conditional:foo)');
    });

    it('ignores hex strings that do not match the expected pattern', () => {
      const action: any = {
        type: 'area',
        value: '(1,1,active)|garbage|(0,0,target)'
      };
      const result = sortAction(action);
      expect(result.value).toBe('(0,0,target)|(1,1,active)');
    });

    it('sorts nested summonData valueObject for summon-type actions', () => {
      const action: any = {
        type: 'summon',
        value: 'summonData',
        valueObject: { count: 1, name: 'bear' }
      };
      const result = sortAction(action);
      expect(Object.keys(result.valueObject)).toEqual(['name', 'count']);
    });

    it('does not touch valueObject for non-summon actions', () => {
      const action: any = { type: 'attack', value: '2', valueObject: { z: 1, a: 2 } };
      const result = sortAction(action);
      expect(Object.keys(result.valueObject)).toEqual(['z', 'a']);
    });
  });

  describe('sortSummon', () => {
    it('returns undefined for undefined/null input', () => {
      expect(sortSummon(undefined)).toBeUndefined();
      expect(sortSummon(null)).toBeUndefined();
    });

    it('sorts top-level summon keys', () => {
      const summon: any = { health: '2', name: 'bear', attack: '3' };
      const result = sortSummon(summon);
      expect(Object.keys(result)).toEqual(['name', 'health', 'attack']);
    });

    it('sorts nested action', () => {
      const summon: any = { name: 'bear', action: { value: '1', type: 'attack' } };
      const result = sortSummon(summon);
      expect(Object.keys(result.action)).toEqual(['type', 'value']);
    });

    it('sorts nested additionalAction', () => {
      const summon: any = { name: 'bear', additionalAction: { value: '1', type: 'move' } };
      const result = sortSummon(summon);
      expect(Object.keys(result.additionalAction)).toEqual(['type', 'value']);
    });

    it('strips empty values from the summon object', () => {
      const summon: any = { name: 'bear', flying: false, special: '' };
      const result = sortSummon(summon);
      expect(result.flying).toBeUndefined();
      expect(result.special).toBeUndefined();
      expect(result.name).toBe('bear');
    });
  });

  describe('sortAbility', () => {
    it('sorts top-level ability keys', () => {
      const ability: any = { initiative: 30, name: 'card', cardId: 1 };
      const result = sortAbility(ability);
      expect(Object.keys(result)).toEqual(['name', 'cardId', 'initiative']);
    });

    it('sorts nested actions and bottomActions', () => {
      const ability: any = {
        name: 'card',
        actions: [{ value: '1', type: 'attack' }],
        bottomActions: [{ value: '2', type: 'move' }]
      };
      const result = sortAbility(ability);
      expect(Object.keys(result.actions[0])).toEqual(['type', 'value']);
      expect(Object.keys(result.bottomActions[0])).toEqual(['type', 'value']);
    });

    it('leaves actions/bottomActions undefined when absent', () => {
      const ability: any = { name: 'card' };
      const result = sortAbility(ability);
      expect(result.actions).toBeUndefined();
      expect(result.bottomActions).toBeUndefined();
    });
  });

  describe('sortDeck', () => {
    it('sorts abilities by cardId when both have one', () => {
      const deck: any = {
        name: 'deck',
        abilities: [
          { name: 'b', cardId: 2 },
          { name: 'a', cardId: 1 }
        ]
      };
      const result = sortDeck(deck);
      expect(result.abilities.map((a: any) => a.cardId)).toEqual([1, 2]);
    });

    it('sorts abilities without cardId before abilities with cardId', () => {
      // NOTE: this reads as counter-intuitive, but matches the actual comparator in sorter.ts:
      // `if (!a.cardId && b.cardId) return -1;` puts card-id-less abilities first.
      const deck: any = {
        name: 'deck',
        abilities: [{ name: 'no-id' }, { name: 'has-id', cardId: 5 }]
      };
      const result = sortDeck(deck);
      expect(result.abilities[0].name).toBe('no-id');
      expect(result.abilities[1].cardId).toBe(5);
    });

    it('sorts by level when neither has a cardId', () => {
      const deck: any = {
        name: 'deck',
        abilities: [
          { name: 'b', level: 2 },
          { name: 'a', level: 1 }
        ]
      };
      const result = sortDeck(deck);
      expect(result.abilities.map((a: any) => a.level)).toEqual([1, 2]);
    });

    it('sorts top-level keys of the deck', () => {
      const deck: any = { character: 'brute', name: 'deck', edition: 'gh' };
      const result = sortDeck(deck);
      expect(Object.keys(result)).toEqual(['name', 'edition', 'character']);
    });

    it('handles a deck without abilities', () => {
      const deck: any = { name: 'deck' };
      expect(() => sortDeck(deck)).not.toThrow();
    });
  });

  describe('sortCharacterStat', () => {
    it('orders level before health', () => {
      const result = sortCharacterStat({ health: 10, level: 1 });
      expect(Object.keys(result)).toEqual(['level', 'health']);
    });
  });

  describe('sortCharacter', () => {
    it('sorts stats by level', () => {
      const character: any = {
        name: 'brute',
        stats: [
          { level: 2, health: 20 },
          { level: 1, health: 10 }
        ]
      };
      const result = sortCharacter(character);
      expect(result.stats.map((s: any) => s.level)).toEqual([1, 2]);
    });

    it('sorts summon via sortSummon', () => {
      const character: any = { name: 'summoner', summon: { health: '2', name: 'bear' } };
      const result = sortCharacter(character);
      expect(Object.keys(result.summon)).toEqual(['name', 'health']);
    });

    it('sorts availableSummons by level then cardId', () => {
      const character: any = {
        name: 'summoner',
        availableSummons: [
          { name: 'bear', level: 2, cardId: '1' },
          { name: 'wolf', level: 1, cardId: '2' },
          { name: 'fox', cardId: '3' }
        ]
      };
      const result = sortCharacter(character);
      // entries without a level come first, then ascending by level
      expect(result.availableSummons[0].name).toBe('fox');
      expect(result.availableSummons[1].name).toBe('wolf');
      expect(result.availableSummons[2].name).toBe('bear');
    });

    it('strips empty values but keeps primaryToken even if falsy', () => {
      const character: any = { name: 'brute', locked: false, primaryToken: 0 };
      const result = sortCharacter(character);
      expect(result.locked).toBeUndefined();
      expect(result.primaryToken).toBe(0);
    });

    it('orders top-level keys per the canonical character order', () => {
      const character: any = { deck: 'brute', name: 'brute', edition: 'gh' };
      const result = sortCharacter(character);
      expect(Object.keys(result)).toEqual(['name', 'edition', 'deck']);
    });
  });

  describe('sortMonsterStandees', () => {
    it('sorts by name first', () => {
      const standees = [{ name: 'b' }, { name: 'a' }];
      const result = sortMonsterStandees(standees);
      expect(result.map((s) => s.name)).toEqual(['a', 'b']);
    });

    it('sorts normal type before other types for the same name', () => {
      const standees = [
        { name: 'a', type: 'elite' },
        { name: 'a', type: 'normal' }
      ];
      const result = sortMonsterStandees(standees);
      expect(result[0].type).toBe('normal');
    });

    it('prefers entries with a type over entries without one', () => {
      const standees = [{ name: 'a' }, { name: 'a', type: 'normal' }];
      const result = sortMonsterStandees(standees);
      expect(result[0].type).toBe('normal');
    });

    it('sorts by player2/player3/player4 flags as tiebreakers', () => {
      const standees = [
        { name: 'a', type: 'normal', player2: 'elite' },
        { name: 'a', type: 'normal', player2: 'normal' }
      ];
      const result = sortMonsterStandees(standees);
      expect(result[0].player2).toBe('normal');
    });
  });

  describe('sortMonsterStat', () => {
    it('nulls out an empty actions array', () => {
      const stat: any = { type: 'normal', actions: [] };
      const result = sortMonsterStat(stat);
      expect(result.actions).toBeUndefined();
    });

    it('sorts non-empty actions', () => {
      const stat: any = { type: 'normal', actions: [{ value: '1', type: 'attack' }] };
      const result = sortMonsterStat(stat);
      expect(Object.keys(result.actions[0])).toEqual(['type', 'value']);
    });

    it('nulls out an empty special array', () => {
      const stat: any = { type: 'normal', special: [] };
      const result = sortMonsterStat(stat);
      expect(result.special).toBeUndefined();
    });

    it('sorts each action inside non-empty special groups', () => {
      const stat: any = { type: 'normal', special: [[{ value: '1', type: 'attack' }]] };
      const result = sortMonsterStat(stat);
      expect(Object.keys(result.special[0][0])).toEqual(['type', 'value']);
    });

    it('nulls out an empty immunities array', () => {
      const stat: any = { type: 'normal', immunities: [] };
      const result = sortMonsterStat(stat);
      expect(result.immunities).toBeUndefined();
    });

    it('keeps level/health even though falsy (ignored from stripping)', () => {
      const stat: any = { type: 'normal', level: 0, health: 0 };
      const result = sortMonsterStat(stat);
      expect(result.level).toBe(0);
      expect(result.health).toBe(0);
    });

    it('orders keys canonically', () => {
      const stat: any = { attack: 3, type: 'normal', level: 1, health: 10 };
      const result = sortMonsterStat(stat);
      expect(Object.keys(result)).toEqual(['type', 'level', 'health', 'attack']);
    });
  });

  describe('sortMonster', () => {
    it('sorts baseStat', () => {
      const monster: any = { name: 'bandit', baseStat: { attack: 2, type: 'normal' } };
      const result = sortMonster(monster);
      expect(Object.keys(result.baseStat)).toEqual(['type', 'attack']);
    });

    it('sorts stats: normal type first, then ascending level', () => {
      const monster: any = {
        name: 'bandit',
        stats: [
          { type: 'elite', level: 1 },
          { type: 'normal', level: 2 },
          { type: 'normal', level: 1 }
        ]
      };
      const result = sortMonster(monster);
      expect(result.stats[0]).toMatchObject({ type: 'normal', level: 1 });
      expect(result.stats[1]).toMatchObject({ type: 'normal', level: 2 });
      expect(result.stats[2]).toMatchObject({ type: 'elite', level: 1 });
    });

    it('orders top-level keys canonically (sortMonster does not strip falsy values)', () => {
      const monster: any = { boss: false, name: 'bandit', edition: 'gh' };
      const result = sortMonster(monster);
      expect(Object.keys(result)).toEqual(['name', 'edition', 'boss']);
    });
  });

  describe('sortScenarioRule', () => {
    it('sets falsy top-level values to undefined', () => {
      const rule: any = { round: 0, note: '', always: true };
      const result = sortScenarioRule(rule);
      expect(result.round).toBeUndefined();
      expect(result.note).toBeUndefined();
      expect(result.always).toBe(true);
    });

    it('sorts spawn monster and spawn keys', () => {
      const rule: any = {
        always: true,
        spawns: [{ count: 1, monster: { type: 'normal', name: 'bandit' } }]
      };
      const result = sortScenarioRule(rule);
      expect(Object.keys(result.spawns[0].monster)).toEqual(['name', 'type']);
      expect(Object.keys(result.spawns[0])).toEqual(['monster', 'count']);
    });

    it('orders top-level keys canonically', () => {
      const rule: any = { note: 'n', round: 1, always: true };
      const result = sortScenarioRule(rule);
      expect(Object.keys(result)).toEqual(['round', 'always', 'note']);
    });
  });

  describe('sortRoom', () => {
    it('sets falsy top-level values to undefined', () => {
      const room: any = { roomNumber: 0, ref: false, initial: true };
      const result = sortRoom(room);
      expect(result.roomNumber).toBeUndefined();
      expect(result.ref).toBeUndefined();
      expect(result.initial).toBe(true);
    });

    it('sorts and normalizes monster standees', () => {
      const room: any = {
        initial: true,
        monster: [
          { name: 'b', type: 'normal' },
          { name: 'a', tags: ['x'], type: 'elite' }
        ]
      };
      const result = sortRoom(room);
      expect(result.monster.map((m: any) => m.name)).toEqual(['a', 'b']);
      expect(Object.keys(result.monster[0])).toEqual(['name', 'type', 'tags']);
    });

    it('orders top-level keys canonically', () => {
      const room: any = { marker: 'a', roomNumber: 1, ref: true };
      const result = sortRoom(room);
      expect(Object.keys(result)).toEqual(['roomNumber', 'ref', 'marker']);
    });
  });

  describe('sortScenario', () => {
    it('sets falsy top-level values to undefined', () => {
      const scenario: any = { index: '1', complexity: 0, name: '' };
      const result = sortScenario(scenario);
      expect(result.complexity).toBeUndefined();
      expect(result.name).toBeUndefined();
      expect(result.index).toBe('1');
    });

    it('sorts rooms', () => {
      const scenario: any = { index: '1', rooms: [{ roomNumber: 2 }, { roomNumber: 1 }] };
      const result = sortScenario(scenario);
      expect(result.rooms.length).toBe(2);
    });

    it('sorts monsters alphabetically case-insensitively', () => {
      const scenario: any = { index: '1', monsters: ['Zombie', 'archer'] };
      const result = sortScenario(scenario);
      expect(result.monsters).toEqual(['archer', 'Zombie']);
    });

    it('sorts numeric unlocks ascending', () => {
      const scenario: any = { index: '1', unlocks: ['10', '2'] };
      const result = sortScenario(scenario);
      expect(result.unlocks).toEqual(['2', '10']);
    });

    it('sorts mixed numeric/string unlocks, numbers first', () => {
      const scenario: any = { index: '1', unlocks: ['b', '1', 'a'] };
      const result = sortScenario(scenario);
      expect(result.unlocks).toEqual(['1', 'a', 'b']);
    });

    it('sorts rewards.hints keys canonically', () => {
      const scenario: any = {
        index: '1',
        rewards: { hints: { gold: 1, globalAchievements: 'x' } }
      };
      const result = sortScenario(scenario);
      expect(Object.keys(result.rewards.hints)).toEqual(['globalAchievements', 'gold']);
    });

    it('sorts rewards top-level keys canonically', () => {
      const scenario: any = { index: '1', rewards: { gold: 5, experience: 1 } };
      const result = sortScenario(scenario);
      expect(Object.keys(result.rewards)).toEqual(['gold', 'experience']);
    });

    it('sorts rules via sortScenarioRule', () => {
      const scenario: any = { index: '1', rules: [{ round: 0, always: true }] };
      const result = sortScenario(scenario);
      expect(result.rules[0].round).toBeUndefined();
      expect(result.rules[0].always).toBe(true);
    });

    it('sorts requirements keys canonically', () => {
      const scenario: any = { index: '1', requirements: [{ solo: true, global: 'x' }] };
      const result = sortScenario(scenario);
      expect(Object.keys(result.requirements[0])).toEqual(['global', 'solo']);
    });

    it('sorts overlays by marker then type then value', () => {
      const scenario: any = {
        index: '1',
        overlays: [
          { type: 'b', value: '1', marker: '2' },
          { type: 'a', value: '1', marker: '1' }
        ]
      };
      const result = sortScenario(scenario);
      expect(result.overlays.map((o: any) => o.marker)).toEqual(['1', '2']);
    });

    it('orders top-level scenario keys canonically', () => {
      const scenario: any = { name: 'x', index: '1', edition: 'gh' };
      const result = sortScenario(scenario);
      expect(Object.keys(result)).toEqual(['index', 'name', 'edition']);
    });
  });

  describe('sortEventCondition', () => {
    it('returns strings unchanged', () => {
      expect(sortEventCondition('some-condition')).toBe('some-condition');
    });

    it('sorts nested effect', () => {
      const condition: any = { type: 'x', effect: { type: 'y', condition: 'z' } };
      const result = sortEventCondition(condition);
      expect(Object.keys(result.effect)).toEqual(['condition', 'type']);
    });

    it('orders top-level keys canonically', () => {
      const condition: any = { values: [1], type: 'x' };
      const result = sortEventCondition(condition);
      expect(Object.keys(result)).toEqual(['type', 'values']);
    });
  });

  describe('sortEventEffect', () => {
    it('returns strings unchanged', () => {
      expect(sortEventEffect('some-effect')).toBe('some-effect');
    });

    it('sorts nested condition', () => {
      const effect: any = { type: 'x', condition: { type: 'y', values: [1] } };
      const result = sortEventEffect(effect);
      expect(Object.keys(result.condition)).toEqual(['type', 'values']);
    });

    it('orders top-level keys canonically', () => {
      const effect: any = { alt: 'a', type: 'x' };
      const result = sortEventEffect(effect);
      expect(Object.keys(result)).toEqual(['type', 'alt']);
    });
  });

  describe('sortEventOutcome', () => {
    it('sorts nested effects and condition', () => {
      const outcome: any = {
        narrative: 'n',
        effects: [{ type: 'x' }],
        condition: { type: 'y' }
      };
      const result = sortEventOutcome(outcome);
      expect(Object.keys(result.effects[0])).toEqual(['type']);
      expect(Object.keys(result.condition)).toEqual(['type']);
    });

    it('orders top-level keys canonically (an explicit "condition: undefined" key still appears)', () => {
      const outcome: any = { effects: [], narrative: 'n', condition: undefined };
      const result = sortEventOutcome(outcome);
      expect(Object.keys(result)).toEqual(['condition', 'narrative', 'effects']);
    });
  });

  describe('sortEventOption', () => {
    it('sorts nested outcomes', () => {
      const option: any = { label: 'l', outcomes: [{ narrative: 'n', effects: [] }] };
      const result = sortEventOption(option);
      expect(Object.keys(result.outcomes[0])).toEqual(['narrative', 'effects']);
    });

    it('orders top-level keys canonically', () => {
      const option: any = { narrative: 'n', label: 'l' };
      const result = sortEventOption(option);
      expect(Object.keys(result)).toEqual(['label', 'narrative']);
    });
  });

  describe('sortEvent', () => {
    it('sorts options alphabetically by label', () => {
      const event: any = { cardId: 1, options: [{ label: 'b' }, { label: 'a' }] };
      const result = sortEvent(event);
      expect(result.options.map((o: any) => o.label)).toEqual(['a', 'b']);
    });

    it('sorts nested option outcomes', () => {
      const event: any = { cardId: 1, options: [{ label: 'a', outcomes: [{ narrative: 'n' }] }] };
      const result = sortEvent(event);
      expect(Object.keys(result.options[0].outcomes[0])).toEqual(['narrative']);
    });

    it('orders top-level keys canonically', () => {
      const event: any = { type: 't', cardId: 1, edition: 'gh' };
      const result = sortEvent(event);
      expect(Object.keys(result)).toEqual(['cardId', 'edition', 'type']);
    });
  });
});
