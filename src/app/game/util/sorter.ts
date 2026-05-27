// ─── Helpers ──────────────────────────────────────────────────────────────────

export const sortObjectKeys = function (object: any, ...keys: string[]): any {
  if (!object) {
    return undefined;
  }
  return Object.keys(object)
    .sort((a, b) => {
      if (keys.includes(a) && !keys.includes(b)) {
        return -1;
      } else if (!keys.includes(a) && keys.includes(b)) {
        return 1;
      }
      return keys.indexOf(a) - keys.indexOf(b);
    })
    .reduce((r: any, k) => ((r[k] = object[k]), r), {});
};

export const removeEmptyValues = function (object: any, ...ignores: string[]): void {
  if (!object) {
    return;
  }
  Object.keys(object).forEach((key) => {
    if (!object[key] && (!ignores || !ignores.includes(key))) {
      object[key] = undefined;
    }
  });
};

// ─── Deck / Action / Ability / Summon ─────────────────────────────────────────

export const sortSummon = function (summon: any): any {
  if (!summon) {
    return undefined;
  }
  if (summon.action) {
    summon.action = sortAction(summon.action);
  }
  if (summon.additionalAction) {
    summon.additionalAction = sortAction(summon.additionalAction);
  }
  removeEmptyValues(summon);
  return sortObjectKeys(
    summon,
    'name',
    'cardId',
    'thumbnail',
    'level',
    'edition',
    'health',
    'attack',
    'movement',
    'range',
    'flying',
    'special',
    'count',
    'enhancements',
    'action',
    'additionalAction'
  );
};

export const sortAction = function (action: any): any {
  removeEmptyValues(action, 'value');

  if (action.subActions) {
    action.subActions = action.subActions.map((a: any) => sortAction(a));
  }

  if (action.type === 'area' && action.value) {
    const hexes: { x: number; y: number; type: string; value?: string }[] = [];
    action.value.split('|').forEach((hexString: string) => {
      const groups = /^\((\d+),(\d+),(active|target|conditional|ally|blank|enhance|invisible|custom)(?::([\w-]*))?\)$/.exec(hexString);
      if (!groups) {
        return;
      }
      const hex: { x: number; y: number; type: string; value?: string } = { x: +groups[1], y: +groups[2], type: groups[3] };
      if (groups[4]) {
        hex.value = groups[4];
      }
      hexes.push(hex);
    });
    hexes.sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
    action.value = hexes.map((h) => `(${h.x},${h.y},${h.type}${h.value ? ':' + h.value : ''})`).join('|');
  }

  if (action.type === 'summon' && action.value === 'summonData' && action.valueObject) {
    action.valueObject = sortSummon(action.valueObject);
  }

  return sortObjectKeys(action, 'type', 'value', 'valueType', 'valueObject', 'multiTarget', 'small', 'enhancementTypes', 'subActions');
};

export const sortAbility = function (ability: any): any {
  if (ability.actions) {
    ability.actions = ability.actions.map((a: any) => sortAction(a));
  }
  if (ability.bottomActions) {
    ability.bottomActions = ability.bottomActions.map((a: any) => sortAction(a));
  }
  return sortObjectKeys(
    ability,
    'name',
    'cardId',
    'replace',
    'level',
    'initiative',
    'hint',
    'shuffle',
    'lost',
    'loss',
    'actions',
    'bottomHint',
    'bottomShuffle',
    'bottomLost',
    'bottomLoss',
    'bottomActions'
  );
};

export const sortDeck = function (deck: any): any {
  if (deck.abilities) {
    deck.abilities = deck.abilities.map((ability: any) => sortAbility(ability));
    deck.abilities.sort((a: any, b: any) => {
      if (a.cardId && b.cardId) return a.cardId - b.cardId;
      if (a.cardId && !b.cardId) return 1;
      if (!a.cardId && b.cardId) return -1;
      if (a.level && b.level) return a.level - b.level;
      if (a.initiative && b.initiative) return a.initiative - b.initiative;
      if (a.name && b.name) return a.name < b.name ? -1 : 1;
      return 0;
    });
  }
  return sortObjectKeys(deck, 'name', 'edition', 'character', 'abilities');
};

// ─── Character ────────────────────────────────────────────────────────────────

export const sortCharacterStat = function (characterStat: any): any {
  return sortObjectKeys(characterStat, 'level', 'health');
};

export const sortCharacter = function (character: any): any {
  if (character.stats) {
    character.stats = character.stats.map((stat: any) => sortCharacterStat(stat)).sort((a: any, b: any) => a.level - b.level);
  }

  if (character.summon) {
    character.summon = sortSummon(character.summon);
  }

  if (character.availableSummons) {
    character.availableSummons = character.availableSummons
      .map((summonData: any) => sortSummon(summonData))
      .sort((a: any, b: any) => {
        if (a.level === b.level) return +a.cardId - +b.cardId;
        if (!a.level && b.level) return -1;
        if (!b.level && a.level) return 1;
        return a.level - b.level;
      });
  }

  removeEmptyValues(character, 'primaryToken');

  return sortObjectKeys(
    character,
    'name',
    'characterClass',
    'gender',
    'icon',
    'iconUrl',
    'thumbnail',
    'thumbnailUrl',
    'noThumbnail',
    'edition',
    'identities',
    'defaultIdentity',
    'tokens',
    'primaryToken',
    'handSize',
    'unlockEvent',
    'retireEvent',
    'traits',
    'color',
    'spoiler',
    'bb',
    'specialActions',
    'locked',
    'marker',
    'deck',
    'stats',
    'summon',
    'availableSummons',
    'perkWarning',
    'perks',
    'masteries',
    'additionalModifier',
    'amTables'
  );
};

// ─── Monster ──────────────────────────────────────────────────────────────────

export const sortMonsterStandees = function (standees: any[]): any[] {
  return standees.sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;

    if (a.type && !b.type) return -1;
    if (!a.type && b.type) return 1;
    if (a.type !== b.type) return a.type === 'normal' ? -1 : 1;

    if (a.player2 && !b.player2) return -1;
    if (!a.player2 && b.player2) return 1;
    if (a.player2 !== b.player2) return a.player2 === 'normal' ? -1 : 1;

    if (a.player3 && !b.player3) return -1;
    if (!a.player3 && b.player3) return 1;
    if (a.player3 !== b.player3) return a.player3 === 'normal' ? -1 : 1;

    if (a.player4 && !b.player4) return -1;
    if (!a.player4 && b.player4) return 1;
    if (a.player4 !== b.player4) return a.player4 === 'normal' ? -1 : 1;

    return 0;
  });
};

export const sortMonsterStat = function (monsterStat: any): any {
  if (monsterStat.actions) {
    if (!monsterStat.actions.length) {
      monsterStat.actions = undefined;
    } else {
      monsterStat.actions = monsterStat.actions.map((action: any) => sortAction(action));
    }
  }

  if (monsterStat.special) {
    if (!monsterStat.special.length) {
      monsterStat.special = undefined;
    } else {
      monsterStat.special = monsterStat.special.map((special: any) => special.map((action: any) => sortAction(action)));
    }
  }

  if (monsterStat.immunities && !monsterStat.immunities.length) {
    monsterStat.immunities = undefined;
  }

  removeEmptyValues(monsterStat, 'level', 'health');

  return sortObjectKeys(monsterStat, 'type', 'level', 'health', 'movement', 'attack', 'range', 'note', 'actions', 'immunities', 'special');
};

export const sortMonster = function (monster: any): any {
  if (monster.baseStat) {
    monster.baseStat = sortMonsterStat(monster.baseStat);
  }

  if (monster.stats) {
    monster.stats = monster.stats
      .map((stat: any) => sortMonsterStat(stat))
      .sort((a: any, b: any) => {
        if (a.type && !b.type) return 1;
        if (!a.type && b.type) return -1;
        if (a.type === 'normal' && b.type !== a.type) return -1;
        return a.level - b.level;
      });
  }

  return sortObjectKeys(
    monster,
    'name',
    'thumbnail',
    'thumbnailUrl',
    'noThumbnail',
    'noArtwork',
    'edition',
    'deck',
    'boss',
    'bb',
    'flying',
    'immortal',
    'pet',
    'hidden',
    'count',
    'randomCount',
    'standeeCount',
    'standeeShare',
    'standeeShareEdition',
    'firstActiveAction',
    'baseStat',
    'stats'
  );
};

// ─── Scenario ─────────────────────────────────────────────────────────────────

export const sortScenarioRule = function (scenarioRule: any): any {
  Object.keys(scenarioRule).forEach((key) => {
    if (!scenarioRule[key]) {
      scenarioRule[key] = undefined;
    }
  });

  if (scenarioRule.spawns) {
    scenarioRule.spawns = scenarioRule.spawns.map((spawnData: any) => {
      if (spawnData.monster) {
        spawnData.monster = sortObjectKeys(spawnData.monster, 'name', 'type', 'player2', 'player3', 'player4', 'marker', 'tags');
      }
      return sortObjectKeys(spawnData, 'monster', 'count', 'marker', 'summon', 'manual');
    });
  }

  return sortObjectKeys(
    scenarioRule,
    'round',
    'start',
    'always',
    'once',
    'requiredRooms',
    'requiredRules',
    'note',
    'rooms',
    'sections',
    'figures',
    'spawns',
    'objectiveSpawns',
    'elements',
    'disableRules',
    'finish'
  );
};

export const sortRoom = function (room: any): any {
  Object.keys(room).forEach((key) => {
    if (!room[key]) {
      room[key] = undefined;
    }
  });

  if (room.monster) {
    room.monster = room.monster.map((standeeData: any) =>
      sortObjectKeys(standeeData, 'name', 'type', 'player2', 'player3', 'player4', 'marker', 'tags')
    );
    room.monster = sortMonsterStandees(room.monster);
  }

  return sortObjectKeys(room, 'roomNumber', 'ref', 'initial', 'marker', 'rooms', 'treasures', 'monster', 'allies', 'objectives');
};

export const sortScenario = function (scenario: any): any {
  Object.keys(scenario).forEach((key) => {
    if (!scenario[key]) {
      scenario[key] = undefined;
    }
  });

  if (scenario.rooms) {
    scenario.rooms = scenario.rooms.map((room: any) => sortRoom(room));
  }

  if (scenario.monsters) {
    scenario.monsters = scenario.monsters.sort((a: string, b: string) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1));
  }

  if (scenario.unlocks) {
    scenario.unlocks = scenario.unlocks.sort((a: any, b: any) => {
      if (!isNaN(+a) && !isNaN(+b)) return +a - +b;
      if (!isNaN(a)) return -1;
      if (!isNaN(b)) return 1;
      return a < b ? -1 : 1;
    });
  }

  if (scenario.rewards) {
    if (scenario.rewards.hints) {
      scenario.rewards.hints = sortObjectKeys(
        scenario.rewards.hints,
        'globalAchievements',
        'partyAchievements',
        'lostPartyAchievements',
        'envelopes',
        'gold',
        'experience',
        'collectiveGold',
        'reputation',
        'prosperity',
        'perks',
        'battleGoals',
        'items',
        'chooseItem',
        'itemDesigns',
        'events',
        'eventDeck',
        'custom'
      );
    }
    scenario.rewards = sortObjectKeys(
      scenario.rewards,
      'globalAchievements',
      'partyAchievements',
      'lostPartyAchievements',
      'envelopes',
      'gold',
      'experience',
      'collectiveGold',
      'reputation',
      'prosperity',
      'perks',
      'battleGoals',
      'items',
      'chooseItem',
      'itemDesigns',
      'events',
      'eventDeck',
      'overlayCampaignSticker',
      'overlaySticker',
      'custom',
      'ignoredBonus',
      'hints'
    );
  }

  if (scenario.rules) {
    scenario.rules = scenario.rules.map((rule: any) => sortScenarioRule(rule));
  }

  if (scenario.requirements) {
    scenario.requirements = scenario.requirements.map((requirements: any) =>
      sortObjectKeys(requirements, 'global', 'party', 'buildings', 'campaignSticker', 'puzzle', 'solo')
    );
  }

  if (scenario.overlays) {
    scenario.overlays = scenario.overlays
      .map((overlay: any) => sortObjectKeys(overlay, 'type', 'value', 'count', 'values', 'marker'))
      .sort((a: any, b: any) => {
        if (a.marker === b.marker) {
          if (a.type === b.type) return a.value < b.value ? -1 : 1;
          return a.type < b.type ? -1 : 1;
        }
        if (a.marker && !b.marker) return 1;
        if (!a.marker && b.marker) return -1;
        if (!isNaN(+a.marker) && !isNaN(+b.marker)) return +a.marker - +b.marker;
        return a.marker < b.marker ? -1 : 1;
      });
  }

  return sortObjectKeys(
    scenario,
    'index',
    'group',
    'name',
    'flowChartGroup',
    'errata',
    'coordinates',
    'edition',
    'complexity',
    'parent',
    'parentSections',
    'level',
    'eventType',
    'conclusion',
    'repeatable',
    'named',
    'hideIndex',
    'blockedSections',
    'marker',
    'spoiler',
    'initial',
    'random',
    'solo',
    'allyDeck',
    'recaps',
    'resetRound',
    'unlocks',
    'requires',
    'requirements',
    'blocks',
    'links',
    'forcedLinks',
    'rewards',
    'monsters',
    'allies',
    'allied',
    'drawExtra',
    'objectives',
    'lootDeckConfig',
    'rules',
    'rooms',
    'overlays'
  );
};

// ─── Event ────────────────────────────────────────────────────────────────────

export const sortEventCondition = function (condition: any): any {
  if (typeof condition === 'string') {
    return condition;
  }
  if (condition.effect) {
    condition.effect = sortEventEffect(condition.effect);
  }
  return sortObjectKeys(condition, 'type', 'values', 'effect');
};

export const sortEventEffect = function (effect: any): any {
  if (typeof effect === 'string') {
    return effect;
  }
  if (effect.condition) {
    effect.condition = sortEventCondition(effect.condition);
  }
  return sortObjectKeys(effect, 'condition', 'type', 'alt', 'values');
};

export const sortEventOutcome = function (outcome: any): any {
  if (outcome.effects) {
    outcome.effects = outcome.effects.map((effect: any) => sortEventEffect(effect));
  }
  if (outcome.condition) {
    outcome.condition = sortEventCondition(outcome.condition);
  }
  return sortObjectKeys(outcome, 'condition', 'narrative', 'returnToDeck', 'removeFromDeck', 'inlineEffects', 'effects');
};

export const sortEventOption = function (option: any): any {
  if (option.outcomes) {
    option.outcomes = option.outcomes.map((outcome: any) => sortEventOutcome(outcome));
  }
  return sortObjectKeys(option, 'label', 'narrative', 'returnToDeck', 'removeFromDeck', 'outcomes');
};

export const sortEvent = function (event: any): any {
  if (event.options) {
    event.options = event.options.map((option: any) => sortEventOption(option));
    event.options.sort((a: any, b: any) => (a.label < b.label ? -1 : 1));
  }
  return sortObjectKeys(event, 'cardId', 'edition', 'type', 'narrative', 'options');
};
