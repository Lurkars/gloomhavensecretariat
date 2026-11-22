import { EventDistribution } from 'src/app/game/businesslogic/EventCardManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { BuildingModel } from 'src/app/game/model/Building';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { EditionData } from 'src/app/game/model/data/EditionData';
import {
  EventCard,
  EventCardAttack,
  EventCardAttackTarget,
  EventCardCondition,
  EventCardConditionType,
  EventCardEffect,
  EventCardEffectType,
  EventCardIdentifier,
  EventCardOption,
  EventCardOutcome
} from 'src/app/game/model/data/EventCard';
import { ItemData, ItemFlags } from 'src/app/game/model/data/ItemData';
import { LootType } from 'src/app/game/model/data/Loot';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';

// EventCardManager also covers applyEffects()/applyEvent() (a huge switch over every event
// effect type, pulling in characters/buildings/attack modifiers/scenario progression). This
// spec sticks to the deck bookkeeping (addEvent/removeEvent/returnEvent/shuffleEvents) and the
// pure-ish lookups (resolvableCondition, applicableEffect).

describe('EventCardManager', () => {
  const eventCardManager = gameManager.eventCardManager;

  beforeEach(() => {
    gameManager.game.figures = [];
    gameManager.game.edition = 'gh';
    gameManager.game.party.eventDecks = {};
    gameManager.game.party.eventCards = [];
    gameManager.game.party.morale = 0;
    gameManager.game.party.reputation = 0;
    gameManager.game.party.weeks = 0;
    gameManager.game.party.buildings = [];
    gameManager.game.party.campaignStickers = [];
    gameManager.editionData = [
      new EditionData(
        'gh',
        [],
        [],
        [],
        [],
        [],
        [],
        undefined,
        [],
        [new EventCard('1', 'gh', 'city', '', '', []), new EventCard('2', 'gh', 'city', '', '', [])]
      )
    ];
    settingsManager.settings.editions = ['gh'];
  });

  describe('addEvent / removeEvent / returnEvent', () => {
    it('adds a known card id to the type deck', () => {
      eventCardManager.addEvent('city', '1');
      expect(gameManager.game.party.eventDecks['city']).toEqual(['1']);
    });

    it('does not add the same card id twice', () => {
      eventCardManager.addEvent('city', '1');
      eventCardManager.addEvent('city', '1');
      expect(gameManager.game.party.eventDecks['city']).toEqual(['1']);
    });

    it('warns and does not add an unknown card id', () => {
      eventCardManager.addEvent('city', 'unknown');
      expect(gameManager.game.party.eventDecks['city']).toBeUndefined();
    });

    it('newOnly skips a card that was already drawn/resolved', () => {
      gameManager.game.party.eventCards = [{ type: 'city', cardId: '1', edition: 'gh' } as any];
      eventCardManager.addEvent('city', '1', true);
      expect(gameManager.game.party.eventDecks['city']).toEqual([]);
    });

    it('removeEvent drops the card id from the deck', () => {
      eventCardManager.addEvent('city', '1');
      eventCardManager.addEvent('city', '2');
      eventCardManager.removeEvent('city', '1');
      expect(gameManager.game.party.eventDecks['city']).toEqual(['2']);
    });

    it('returnEvent removes then re-adds the card id to the deck', () => {
      eventCardManager.addEvent('city', '1');
      eventCardManager.addEvent('city', '2');
      eventCardManager.returnEvent('city', '1');
      expect((gameManager.game.party.eventDecks['city'] || []).sort()).toEqual(['1', '2']);
      expect(gameManager.game.party.eventDecks['city']).toContain('1');
    });
  });

  describe('event deck editing', () => {
    it('inserts and moves cards in the deck', () => {
      eventCardManager.insertEvent('city', '1', 0);
      eventCardManager.insertEvent('city', '2', -1);
      eventCardManager.insertEvent('city', '3', 5);
      expect(gameManager.game.party.eventDecks['city']).toEqual(['2', '1', '3']);
      eventCardManager.moveEvent('city', 0, 2);
      expect(gameManager.game.party.eventDecks['city']).toEqual(['1', '3', '2']);
      eventCardManager.moveEvent('city', 5, 0);
      expect(gameManager.game.party.eventDecks['city']).toEqual(['1', '3', '2']);
    });

    it('marks a card as drawn with the checks of its last result', () => {
      gameManager.game.party.eventCards = [new EventCardIdentifier('1', 'gh', 'city', 0, [], [1, 0], false, false)];
      const card = new EventCard('1', 'gh', 'city', '', '', []);
      eventCardManager.markEventDrawn(card, 0);
      expect(gameManager.game.party.eventCards.length).toBe(2);
      expect(gameManager.game.party.eventCards[0].selected).toBe(-1);
      expect(gameManager.game.party.eventCards[0].checks).toEqual([1, 0]);
    });

    it('resets only the drawn cards of the reset type', () => {
      gameManager.game.party.eventDecks['city'] = ['1'];
      gameManager.game.party.eventCards = [
        new EventCardIdentifier('2', 'gh', 'city', 0, [], [], false, false),
        new EventCardIdentifier('1', 'gh', 'road', 0, [], [], false, false)
      ];
      const build = vi.spyOn(eventCardManager, 'buildPartyDeck').mockImplementation(() => {});
      eventCardManager.resetEventDeck('gh', 'city');
      expect(gameManager.game.party.eventCards.map((value) => value.type)).toEqual(['road']);
      expect(build).toHaveBeenCalledWith('gh', 'city');
      build.mockRestore();
    });
  });

  describe('event rewards', () => {
    beforeEach(() => {
      gameManager.editionData[0].events.push(
        new EventCard('3', 'gh', 'city', '', '', []),
        new EventCard('4', 'gh', 'city', '', '', []),
        new EventCard('1', 'gh', 'road', '', '', [])
      );
    });

    it('expands a single card reward', () => {
      expect(eventCardManager.eventRewardCardIds('city:2', 'gh')).toEqual({ type: 'city', cardIds: ['2'] });
    });

    it('expands a range of cards of the given type', () => {
      expect(eventCardManager.eventRewardCardIds('city:2|4', 'gh')).toEqual({ type: 'city', cardIds: ['2', '3', '4'] });
    });

    it('expands an unknown range to no cards and ignores invalid rewards', () => {
      expect(eventCardManager.eventRewardCardIds('city:2|9', 'gh')).toEqual({ type: 'city', cardIds: [] });
      expect(eventCardManager.eventRewardCardIds('city', 'gh')).toBeUndefined();
    });

    it('returns already drawn cards of a reward to the deck', () => {
      gameManager.game.party.eventCards = [{ type: 'city', cardId: '2', edition: 'gh' } as any];
      eventCardManager.addEventReward('city:2', 'gh', true);
      expect(gameManager.game.party.eventDecks['city']).toEqual([]);
      eventCardManager.returnEventReward('city:2', 'gh');
      expect(gameManager.game.party.eventDecks['city']).toEqual(['2']);
    });

    it('adds all cards of a range reward to the deck', () => {
      eventCardManager.addEventReward('city:1|3', 'gh');
      expect((gameManager.game.party.eventDecks['city'] || []).sort()).toEqual(['1', '2', '3']);
      expect(gameManager.game.party.eventDecks['road']).toBeUndefined();
    });
  });

  describe('applicableEffect', () => {
    it('is true for effect types in EventCardApplyEffects (e.g. gold)', () => {
      expect(eventCardManager.applicableEffect(new EventCardEffect(EventCardEffectType.gold, [5]))).toBe(true);
    });

    it('is false for an effect type that is not implemented for auto-apply', () => {
      expect(eventCardManager.applicableEffect(new EventCardEffect(EventCardEffectType.outpostAttack, []))).toBe(false);
    });

    it('is true for collectiveResource when fhShareResources is enabled', () => {
      expect(eventCardManager.applicableEffect(new EventCardEffect(EventCardEffectType.collectiveResource, []))).toBe(false);
      settingsManager.settings.fhShareResources = true;
      expect(eventCardManager.applicableEffect(new EventCardEffect(EventCardEffectType.collectiveResource, []))).toBe(true);
    });
  });

  describe('resolvableCondition', () => {
    it('is true for a bare string condition', () => {
      expect(eventCardManager.resolvableCondition('always')).toBe(true);
    });

    it('otherwise is always true', () => {
      const condition = Object.assign(new EventCardCondition(), { type: EventCardConditionType.otherwise, values: [] });
      expect(eventCardManager.resolvableCondition(condition)).toBe(true);
    });

    it('moraleGT/moraleLT compare against game.party.morale', () => {
      gameManager.game.party.morale = 5;
      const gt = Object.assign(new EventCardCondition(), { type: EventCardConditionType.moraleGT, values: [3] });
      const lt = Object.assign(new EventCardCondition(), { type: EventCardConditionType.moraleLT, values: [3] });
      expect(eventCardManager.resolvableCondition(gt)).toBe(true);
      expect(eventCardManager.resolvableCondition(lt)).toBe(false);
    });

    it('reputationGT/reputationLT compare against game.party.reputation', () => {
      gameManager.game.party.reputation = -2;
      const gt = Object.assign(new EventCardCondition(), { type: EventCardConditionType.reputationGT, values: [0] });
      const lt = Object.assign(new EventCardCondition(), { type: EventCardConditionType.reputationLT, values: [0] });
      expect(eventCardManager.resolvableCondition(gt)).toBe(false);
      expect(eventCardManager.resolvableCondition(lt)).toBe(true);
    });

    it('campaignSticker checks membership in game.party.campaignStickers', () => {
      gameManager.game.party.campaignStickers = ['sticker-a'];
      const has = Object.assign(new EventCardCondition(), { type: EventCardConditionType.campaignSticker, values: ['sticker-a'] });
      const missing = Object.assign(new EventCardCondition(), { type: EventCardConditionType.campaignSticker, values: ['sticker-b'] });
      expect(eventCardManager.resolvableCondition(has)).toBe(true);
      expect(eventCardManager.resolvableCondition(missing)).toBe(false);
    });

    it('building requires every named building to be present and leveled', () => {
      gameManager.game.party.buildings = [new BuildingModel('sanctuary', 1)];
      const met = Object.assign(new EventCardCondition(), { type: EventCardConditionType.building, values: ['sanctuary'] });
      const unmet = Object.assign(new EventCardCondition(), { type: EventCardConditionType.building, values: ['temple'] });
      expect(eventCardManager.resolvableCondition(met)).toBe(true);
      expect(eventCardManager.resolvableCondition(unmet)).toBe(false);
    });

    it('season resolves from game.party.weeks (10-week cycle)', () => {
      gameManager.game.party.weeks = 3; // summer half
      const summer = Object.assign(new EventCardCondition(), { type: EventCardConditionType.season, values: ['summer'] });
      const winter = Object.assign(new EventCardCondition(), { type: EventCardConditionType.season, values: ['winter'] });
      expect(eventCardManager.resolvableCondition(summer)).toBe(true);
      expect(eventCardManager.resolvableCondition(winter)).toBe(false);
    });

    it('and requires every sub-condition to resolve', () => {
      gameManager.game.party.morale = 5;
      const and = Object.assign(new EventCardCondition(), {
        type: EventCardConditionType.and,
        values: [
          Object.assign(new EventCardCondition(), { type: EventCardConditionType.moraleGT, values: [3] }),
          Object.assign(new EventCardCondition(), { type: EventCardConditionType.moraleLT, values: [3] })
        ]
      });
      expect(eventCardManager.resolvableCondition(and)).toBe(false);
    });

    it('is false for conditions without a resolvable implementation (e.g. payCollectiveItem)', () => {
      const condition = Object.assign(new EventCardCondition(), { type: EventCardConditionType.payCollectiveItem, values: [] });
      expect(eventCardManager.resolvableCondition(condition)).toBe(false);
    });
  });
});

describe('EventCardManager campaignStickerReplace', () => {
  it('replaces only the named sticker', () => {
    gameManager.game.party.campaignStickers = ['bug-in-a-jar', 'other-a', 'other-b'];
    const card = new EventCard('SR-17', 'fh', 'road', '', '', []);

    gameManager.eventCardManager.applyEffects(
      card,
      [new EventCardEffect(EventCardEffectType.campaignStickerReplace, ['empty-jar', 'bug-in-a-jar'])],
      [],
      false
    );

    expect(gameManager.game.party.campaignStickers).toEqual(['other-a', 'other-b', 'empty-jar']);
  });

  it('keeps all stickers when the replaced sticker is missing', () => {
    gameManager.game.party.campaignStickers = ['other-a', 'other-b'];
    const card = new EventCard('SR-17', 'fh', 'road', '', '', []);

    gameManager.eventCardManager.applyEffects(
      card,
      [new EventCardEffect(EventCardEffectType.campaignStickerReplace, ['empty-jar', 'bug-in-a-jar'])],
      [],
      false
    );

    expect(gameManager.game.party.campaignStickers).toEqual(['other-a', 'other-b', 'empty-jar']);
  });
});

describe('EventCardManager resolveAttack', () => {
  function so26(): EventCard {
    return new EventCard('SO-26', 'fh', 'summer-outpost', '', '', []);
  }

  function attackX(attackValueX: string): EventCardAttack {
    const attack = new EventCardAttack('15+X', 4, new EventCardAttackTarget(), '', '', [
      'text',
      new EventCardEffect(EventCardEffectType.checkbox, ['', '', '']) as any
    ]);
    attack.attackValueX = attackValueX;
    return attack;
  }

  beforeEach(() => {
    gameManager.game.party.eventCards = [];
    gameManager.game.party.defense = 0;
  });

  it('resolves X to 0 checked boxes on the first draw', () => {
    expect(gameManager.eventCardManager.resolveAttack(so26(), attackX('checks:15')).attackValue).toEqual(15);
  });

  it('resolves X from the boxes checked on the previous draw of the card', () => {
    gameManager.game.party.eventCards = [
      new EventCardIdentifier('SO-26', 'fh', 'summer-outpost', 2, [], [undefined as any, 1], true, false),
      new EventCardIdentifier('SO-26', 'fh', 'summer-outpost', 2, [], [undefined as any, 2], true, false)
    ];

    expect(gameManager.eventCardManager.resolveAttack(so26(), attackX('checks:15')).attackValue).toEqual(45);
  });

  it('resolves X to the defense of the walls', () => {
    gameManager.game.party.defense = 7;
    const card = new EventCard('SO-29', 'fh', 'summer-outpost', '', '', []);

    expect(gameManager.eventCardManager.resolveAttack(card, attackX('defense')).attackValue).toEqual(22);
  });

  it('keeps attacks without variable unchanged', () => {
    const attack = new EventCardAttack(30, 4, new EventCardAttackTarget(), '', '', []);

    expect(gameManager.eventCardManager.resolveAttack(so26(), attack)).toBe(attack);
  });

  it('lastEventCardResult returns the latest result of a card', () => {
    const first = new EventCardIdentifier('SO-26', 'fh', 'summer-outpost', 2, [], [0, 1], true, false);
    const latest = new EventCardIdentifier('SO-26', 'fh', 'summer-outpost', 2, [], [0, 2], true, false);
    gameManager.game.party.eventCards = [first, latest];

    expect(gameManager.eventCardManager.lastEventCardResult('fh', 'summer-outpost', 'SO-26')).toBe(latest);
  });
});

describe('EventCardManager applyEvent return to deck', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns a card to the deck when the unlabeled attack outcome is marked return to deck (e.g. SO-26)', () => {
    const attackOutcome = Object.assign(new EventCardOutcome(), {
      returnToDeck: true,
      attack: new EventCardAttack('15+X', 4, new EventCardAttackTarget(), '', '', [])
    });
    const card = new EventCard('SO-26', 'fh', 'summer-outpost', '', '', [
      new EventCardOption('A', '', [new EventCardOutcome()]),
      new EventCardOption('', '', [attackOutcome])
    ]);
    gameManager.game.party.eventCards = [];
    const returnEvent = vi.spyOn(gameManager.eventCardManager, 'returnEvent').mockImplementation(() => {});
    const removeEvent = vi.spyOn(gameManager.eventCardManager, 'removeEvent').mockImplementation(() => {});

    gameManager.eventCardManager.applyEvent(card, 0, [], [], false, true, false);

    expect(returnEvent).toHaveBeenCalledWith('summer-outpost', 'SO-26');
    expect(removeEvent).not.toHaveBeenCalled();
  });
});

describe('EventCardManager applyEvent checked boxes', () => {
  function cardWithItemBoxes(): EventCard {
    const outcome = Object.assign(new EventCardOutcome(), {
      effects: [
        new EventCardEffect(EventCardEffectType.checkbox, [new EventCardEffect(EventCardEffectType.custom, ['first box'])]),
        new EventCardEffect(EventCardEffectType.checkbox, [new EventCardEffect(EventCardEffectType.custom, ['second box'])])
      ]
    });
    return new EventCard('SR-26', 'fh', 'summer-road', '', '', [new EventCardOption('A', '', [outcome])]);
  }

  beforeEach(() => {
    gameManager.game.party.eventCards = [];
    settingsManager.settings.eventsApply = true;
    vi.spyOn(gameManager.eventCardManager, 'returnEvent').mockImplementation(() => {});
    vi.spyOn(gameManager.eventCardManager, 'removeEvent').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  function customValues(results: any[]): string[] {
    return results.filter((result) => result instanceof EventCardEffect).flatMap((effect) => effect.values as string[]);
  }

  it('applies only boxes checked on this draw', () => {
    gameManager.game.party.eventCards = [new EventCardIdentifier('SR-26', 'fh', 'summer-road', 0, [0], [1], false, false)];

    const results = gameManager.eventCardManager.applyEvent(cardWithItemBoxes(), 0, [0], [1, 1], false, false, true);

    expect(customValues(results)).toEqual(['second box']);
  });

  it('keeps boxes checked on previous draws in the stored result', () => {
    gameManager.game.party.eventCards = [new EventCardIdentifier('SR-26', 'fh', 'summer-road', 0, [0], [1], false, false)];

    gameManager.eventCardManager.applyEvent(cardWithItemBoxes(), 0, [0], [], false, false, true);

    expect(gameManager.eventCardManager.lastEventCardResult('fh', 'summer-road', 'SR-26')?.checks).toEqual([1]);
  });
});

describe('EventCardManager distribution and random effects', () => {
  const eventCardManager = gameManager.eventCardManager;

  function buildCharacter(name: string): Character {
    return new Character(Object.assign(new CharacterData(), { name, edition: 'gh', stats: [new CharacterStat(1, 10)] }), 1);
  }

  beforeEach(() => {
    gameManager.game.party.loot = {};
    gameManager.game.party.inspiration = 0;
    gameManager.game.party.unlockedItems = [];
    gameManager.game.party.conclusions = [];
    gameManager.game.party.manualScenarios = [];
  });

  afterEach(() => vi.restoreAllMocks());

  it('distributes received and spent values to characters and party', () => {
    const brute = buildCharacter('brute');
    brute.progress.gold = 3;
    brute.progress.loot = { [LootType.hide]: 1 };
    gameManager.game.party.loot = { [LootType.lumber]: 1 };
    const distribution = new EventDistribution();
    distribution.receive = [{ character: brute, values: { gold: 5, experience: 2, [LootType.metal]: 1 } }];
    distribution.receiveParty = { [LootType.hide]: 2, gold: 10 };
    distribution.spend = [{ character: brute, values: { gold: 10, [LootType.hide]: 1 } }];
    distribution.spendParty = { [LootType.lumber]: 3 };
    eventCardManager.applyDistribution(distribution);

    expect(brute.progress.gold).toBe(0);
    expect(brute.progress.experience).toBe(2);
    expect(brute.progress.loot).toEqual({ [LootType.hide]: 0, [LootType.metal]: 1 });
    expect(gameManager.game.party.loot).toEqual({ [LootType.lumber]: 0, [LootType.hide]: 2 });
  });

  it('distributes received, consumed and lost items', () => {
    const brute = buildCharacter('brute');
    const item = Object.assign(new ItemData(), { id: 5, edition: 'gh' });
    const addItem = vi.spyOn(gameManager.itemManager, 'addItem').mockImplementation(() => {});
    const removeItem = vi.spyOn(gameManager.itemManager, 'removeItem').mockImplementation(() => {});
    const distribution = new EventDistribution();
    distribution.itemsReceive = [{ item, character: brute }];
    distribution.itemsConsume = [{ item, character: brute }];
    distribution.itemsLose = [{ item, character: brute }];
    eventCardManager.applyDistribution(distribution);

    expect(addItem).toHaveBeenCalledWith(item, brute);
    expect(removeItem).toHaveBeenCalledWith(item, brute);
    expect(brute.progress.equippedItems[0].tags).toEqual([ItemFlags.consumed]);
  });

  it('applies random items and scenarios or grants inspiration in FH', () => {
    vi.spyOn(gameManager, 'fhRules').mockReturnValue(true);
    const item = Object.assign(new ItemData(), { id: 5, edition: 'fh' });
    eventCardManager.applyRandomItem(item);
    eventCardManager.applyRandomItem(undefined);
    expect(gameManager.game.party.unlockedItems.map((identifier) => identifier.name)).toEqual(['5']);
    expect(gameManager.game.party.inspiration).toBe(1);

    const scenario = Object.assign(new ScenarioData(), { index: '7', edition: 'fh' });
    eventCardManager.applyRandomScenario(scenario);
    eventCardManager.applyRandomScenario(scenario, true);
    eventCardManager.applyRandomScenario(undefined, true);
    expect(gameManager.game.party.manualScenarios.map((model) => model.index)).toEqual(['7']);
    expect(gameManager.game.party.conclusions.map((model) => model.index)).toEqual(['7']);
    expect(gameManager.game.party.inspiration).toBe(2);
  });
});

describe('EventCardManager addEvents', () => {
  afterEach(() => vi.restoreAllMocks());

  it('adds typed events and untyped ones to city and road', () => {
    const addEvent = vi.spyOn(gameManager.eventCardManager, 'addEvent').mockImplementation(() => {});
    gameManager.eventCardManager.addEvents('boat:12|81');
    expect(addEvent.mock.calls).toEqual([
      ['boat', '12', true],
      ['city', '81', true],
      ['road', '81', true]
    ]);
    addEvent.mockClear();
    gameManager.eventCardManager.addEvents(undefined);
    gameManager.eventCardManager.addEvents('');
    expect(addEvent).not.toHaveBeenCalled();
  });
});
