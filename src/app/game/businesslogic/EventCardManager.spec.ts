import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { BuildingModel } from 'src/app/game/model/Building';
import { EditionData } from 'src/app/game/model/data/EditionData';
import {
  EventCard,
  EventCardCondition,
  EventCardConditionType,
  EventCardEffect,
  EventCardEffectType
} from 'src/app/game/model/data/EventCard';

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
