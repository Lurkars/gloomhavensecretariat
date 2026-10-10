import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { createTestCharacter, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import {
  EventDeckAddCommand,
  EventDeckMarkDrawnCommand,
  EventDeckMoveCommand,
  EventDeckRemoveCommand,
  EventDeckRemoveDrawnCommand,
  EventDeckSelectionCommand,
  EventDeckShuffleCommand,
  EventDrawAcceptCommand,
  EventDrawCancelCommand
} from 'src/app/game/commands/event/EventDeck';
import {
  EventDistributionCommand,
  EventEffectCharactersCommand,
  EventEffectCommand,
  EventEffectRandomItemCommand
} from 'src/app/game/commands/event/EventEffect';
import { EventCard } from 'src/app/game/model/data/EventCard';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { LootType } from 'src/app/game/model/data/Loot';

describe('Event commands', () => {
  beforeEach(() => {
    resetTestGame();
    vi.spyOn(gameManager, 'currentEdition').mockReturnValue('test');
    vi.spyOn(gameManager.eventCardManager, 'getEventCardForEdition').mockImplementation(
      (edition: string, type: string, cardId: string) => ({ edition: edition, type: type, cardId: cardId }) as EventCard
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('event deck', () => {
    it('adds, moves and removes event cards', () => {
      gameManager.game.party.eventDecks['road'] = ['01', '02'];
      new EventDeckAddCommand('road', '03', 1, 0).execute();
      expect(gameManager.game.party.eventDecks['road']).toEqual(['03', '01', '02']);
      expect(new EventDeckAddCommand('road', '03', 1).validParameters('road', '03', 1)).toBe(false);

      new EventDeckMoveCommand('road', '03', 2).execute();
      expect(gameManager.game.party.eventDecks['road']).toEqual(['01', '02', '03']);

      new EventDeckRemoveCommand('road', '02').execute();
      expect(gameManager.game.party.eventDecks['road']).toEqual(['01', '03']);
    });

    it('shuffles an event deck with the same result for the same seed', () => {
      gameManager.game.party.eventDecks['road'] = ['01', '02', '03', '04', '05'];
      new EventDeckShuffleCommand('road', 3).execute();
      const shuffled = [...gameManager.game.party.eventDecks['road']];
      gameManager.game.party.eventDecks['road'] = ['01', '02', '03', '04', '05'];
      new EventDeckShuffleCommand('road', 3).execute();
      expect(gameManager.game.party.eventDecks['road']).toEqual(shuffled);
    });

    it('marks cards drawn, changes their selection and removes them', () => {
      new EventDeckMarkDrawnCommand('city', '05').execute();
      expect(gameManager.game.party.eventCards.map((card) => card.cardId)).toEqual(['05']);
      expect(new EventDeckSelectionCommand('road', '05', 1).validParameters('road', '05', 1)).toBe(false);
      new EventDeckSelectionCommand('city', '05', 1, '0,2').execute();
      expect(gameManager.game.party.eventCards[0].selected).toBe(1);
      expect(gameManager.game.party.eventCards[0].subSelections).toEqual([0, 2]);
      new EventDeckRemoveDrawnCommand('city', '05').execute();
      expect(gameManager.game.party.eventCards).toEqual([]);
    });
  });

  describe('event draw', () => {
    it('resolves the top event card', () => {
      gameManager.game.party.eventDecks['road'] = ['01'];
      gameManager.game.eventDraw = 'road';
      const applyEvent = vi.spyOn(gameManager.eventCardManager, 'applyEvent').mockReturnValue([]);
      expect(new EventDrawAcceptCommand('road', -1, 1).validParameters('road', -1, 1)).toBe(false);
      new EventDrawAcceptCommand('road', 0, 1, true, false, '1').execute();
      expect(applyEvent).toHaveBeenCalledWith(expect.objectContaining({ cardId: '01' }), 0, [1], [], false, false, true);
      expect(gameManager.game.eventDraw).toBeUndefined();
    });

    it('cancels a pending event draw', () => {
      expect(new EventDrawCancelCommand().validParameters()).toBe(false);
      gameManager.game.eventDraw = 'city';
      new EventDrawCancelCommand().execute();
      expect(gameManager.game.eventDraw).toBeUndefined();
    });
  });

  describe('event effects', () => {
    it('applies campaign effects', () => {
      new EventEffectCommand('inspiration', 2).execute();
      new EventEffectCommand('reputation', -1).execute();
      expect(gameManager.game.party.inspiration).toBe(2);
      expect(gameManager.game.party.reputation).toBe(-1);
      expect(new EventEffectCommand('factionReputation', 1).validParameters('factionReputation', 1)).toBe(false);
    });

    it('applies character effects and party resources', () => {
      const first = createTestCharacter(1);
      const second = createTestCharacter(2);
      new EventEffectCharactersCommand('gold', 5, '', 1, 2).execute();
      new EventEffectCharactersCommand('experience', -3, '', 1).execute();
      new EventEffectCharactersCommand('resource', 2, LootType.metal).execute();
      expect(first.progress.gold).toBe(5);
      expect(second.progress.gold).toBe(5);
      expect(first.progress.experience).toBe(0);
      expect(gameManager.game.party.loot[LootType.metal]).toBe(2);
      expect(new EventEffectCharactersCommand('gold', 5, '').validParameters('gold', 5, '')).toBe(false);
    });

    it('unlocks a given or drawn random item', () => {
      const item = Object.assign(new ItemData(), { id: 9, edition: 'test', name: 'item' });
      vi.spyOn(gameManager.itemManager, 'getItem').mockReturnValue(item);
      new EventEffectRandomItemCommand(false, 'test', 9).execute();
      expect(gameManager.game.party.unlockedItems.map((identifier) => identifier.name)).toEqual(['9']);
    });

    it('applies a collective distribution', () => {
      const character = createTestCharacter(1);
      character.progress.loot[LootType.hide] = 3;
      gameManager.game.party.loot[LootType.lumber] = 2;
      const distribution = {
        receive: { 1: { gold: 4, experience: 2 } },
        spend: { 1: { hide: 2 } },
        spendParty: { lumber: 5 }
      };
      new EventDistributionCommand(JSON.stringify(distribution)).execute();
      expect(character.progress.gold).toBe(4);
      expect(character.progress.experience).toBe(2);
      expect(character.progress.loot[LootType.hide]).toBe(1);
      expect(gameManager.game.party.loot[LootType.lumber]).toBe(0);
      expect(new EventDistributionCommand('{"receive":{"7":{}}}').validParameters('{"receive":{"7":{}}}')).toBe(false);
    });
  });
});
