import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { createTestCharacter, createTestEdition, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { PartyAddCommand, PartyChangeCommand, PartyRemoveCommand } from 'src/app/game/commands/party/Party';
import { PartyCharacterPlayerNumberCommand, PartyCharacterReactivateCommand } from 'src/app/game/commands/party/PartyCharacter';
import {
  PartyAchievementCommand,
  PartyItemCountCommand,
  PartyItemFilterCommand,
  PartyItemUnlockCommand,
  PartyTreasureCommand
} from 'src/app/game/commands/party/PartyLists';
import {
  PartyConclusionRemoveCommand,
  PartyScenarioManualCommand,
  PartyScenarioRemoveCommand,
  PartyWeekSectionCommand
} from 'src/app/game/commands/party/PartyScenario';
import { PartyBattleGoalEditionCommand } from 'src/app/game/commands/party/PartySetup';
import {
  PartyEnvelopeBCommand,
  PartyMoraleCommand,
  PartyPlayerCommand,
  PartyReputationCommand,
  PartyResourceCommand,
  PartySetCommand,
  PartySoldiersCommand
} from 'src/app/game/commands/party/PartyValues';
import { payment, paymentValid } from 'src/app/game/commands/party/payment';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { LootType } from 'src/app/game/model/data/Loot';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { GameScenarioModel } from 'src/app/game/model/Scenario';

describe('Party commands', () => {
  beforeEach(() => {
    resetTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('party values', () => {
    it('sets plain party values', () => {
      new PartySetCommand('name', 'Heroes').execute();
      new PartySetCommand('inspiration', 3).execute();
      new PartySetCommand('defense', -2).execute();
      expect(gameManager.game.party.name).toBe('Heroes');
      expect(gameManager.game.party.inspiration).toBe(3);
      expect(gameManager.game.party.defense).toBe(-2);
      expect(new PartySetCommand('name', 3).validParameters('name', 3)).toBe(false);
      expect(new PartySetCommand('weeks', 3).validParameters('weeks', 3)).toBe(false);
    });

    it('resets envelope B when donations drop below 10', () => {
      new PartyEnvelopeBCommand(true).execute();
      expect(gameManager.game.party.envelopeB).toBe(true);
      new PartySetCommand('donations', 5).execute();
      expect(gameManager.game.party.envelopeB).toBe(false);
    });

    it('sets reputation and morale within their bounds', () => {
      new PartyReputationCommand(5).execute();
      new PartyMoraleCommand(7).execute();
      expect(gameManager.game.party.reputation).toBe(5);
      expect(gameManager.game.party.morale).toBe(7);
      expect(new PartyReputationCommand(21).validParameters(21)).toBe(false);
      expect(new PartyMoraleCommand(21).validParameters(21)).toBe(false);
    });

    it('sets resources and soldiers with an optional payment', () => {
      const character = createTestCharacter(1);
      character.progress.gold = 5;
      gameManager.game.party.loot[LootType.hide] = 2;
      new PartyResourceCommand(LootType.lumber, 4).execute();
      new PartySoldiersCommand(1, 1, 'gold', 3, -1, 'hide', 1).execute();
      expect(gameManager.game.party.loot[LootType.lumber]).toBe(4);
      expect(gameManager.game.party.soldiers).toBe(1);
      expect(character.progress.gold).toBe(2);
      expect(gameManager.game.party.loot[LootType.hide]).toBe(1);
      expect(new PartySoldiersCommand(1, 1, 'gold').validParameters(1, 1, 'gold')).toBe(false);
    });

    it('sets and removes players', () => {
      new PartyPlayerCommand(0, 'Alice').execute();
      new PartyPlayerCommand(1, 'Bob').execute();
      new PartyPlayerCommand(0, '').execute();
      expect(gameManager.game.party.players).toEqual(['Bob']);
    });
  });

  describe('payment', () => {
    it('validates and builds payments', () => {
      createTestCharacter(1);
      expect(paymentValid([1, 'gold', 3, -1, 'lumber', 1, -1, 'morale', 1])).toBe(true);
      expect(paymentValid([-1, 'gold', 3])).toBe(false);
      expect(paymentValid([1, 'morale', 1])).toBe(false);
      expect(paymentValid([2, 'gold', 1])).toBe(false);
      expect(paymentValid([1, 'gold'])).toBe(false);
      const result = payment([1, 'gold', 3, -1, 'lumber', 1, -1, 'morale', 1]);
      expect(result?.characterSpent[0].gold).toBe(3);
      expect(result?.fhSupportSpent.lumber).toBe(1);
      expect(result?.morale).toBe(1);
      expect(payment([])).toBeUndefined();
    });
  });

  describe('parties', () => {
    it('adds, changes and removes parties', () => {
      const changeParty = vi.spyOn(gameManager, 'changeParty').mockImplementation((party) => (gameManager.game.party = party));
      const first = gameManager.game.party;
      new PartyAddCommand('Second').execute();
      expect(gameManager.game.parties.length).toBe(2);
      expect(gameManager.game.party.name).toBe('Second');
      expect(gameManager.game.party.id).toBe(1);

      new PartyChangeCommand(first.id).execute();
      expect(gameManager.game.party).toBe(first);

      new PartyRemoveCommand(first.id).execute();
      expect(gameManager.game.parties.length).toBe(1);
      expect(changeParty).toHaveBeenLastCalledWith(gameManager.game.parties[0]);
      expect(new PartyRemoveCommand(1).validParameters(1)).toBe(false);
    });
  });

  describe('party lists', () => {
    it('adds and removes achievements and treasures', () => {
      new PartyAchievementCommand('first-steps', true).execute();
      new PartyAchievementCommand('first-steps', true).execute();
      expect(gameManager.game.party.achievementsList).toEqual(['first-steps']);
      new PartyAchievementCommand('first-steps', false).execute();
      expect(gameManager.game.party.achievementsList).toEqual([]);

      new PartyTreasureCommand('test', 4, true).execute();
      new PartyTreasureCommand('test', 4, true).execute();
      expect(gameManager.game.party.treasures.map((treasure) => treasure.name)).toEqual(['4']);
      new PartyTreasureCommand('test', 4, false).execute();
      expect(gameManager.game.party.treasures).toEqual([]);
    });

    it('unlocks, counts and filters items', () => {
      const item = Object.assign(new ItemData(), { id: 3, edition: 'test', name: 'item', count: 2 });
      vi.spyOn(gameManager.itemManager, 'getItem').mockReturnValue(item);
      expect(new PartyItemCountCommand('test', 3, 1).validParameters('test', 3, 1)).toBe(false);
      new PartyItemUnlockCommand('test', 3, true).execute();
      new PartyItemUnlockCommand('test', 3, true).execute();
      expect(gameManager.game.party.unlockedItems.length).toBe(1);
      new PartyItemCountCommand('test', 3, 1).execute();
      expect(gameManager.game.party.unlockedItems[0].count).toBe(1);
      new PartyItemCountCommand('test', 3, -1).execute();
      expect(gameManager.game.party.unlockedItems[0].count).toBe(-1);
      expect(new PartyItemCountCommand('test', 3, 2).validParameters('test', 3, 2)).toBe(false);
      new PartyItemUnlockCommand('test', 3, false).execute();
      expect(gameManager.game.party.unlockedItems).toEqual([]);

      new PartyItemFilterCommand('test', 3, true).execute();
      new PartyItemFilterCommand('test', 3, true).execute();
      expect(gameManager.game.party.filteredItems.length).toBe(1);
      new PartyItemFilterCommand('test', 3, false).execute();
      expect(gameManager.game.party.filteredItems).toEqual([]);
    });
  });

  describe('scenarios and conclusions', () => {
    beforeEach(() => {
      createTestEdition({ scenarios: [Object.assign(new ScenarioData(), { index: '1', edition: 'test', name: 'first' })] });
    });

    it('adds and removes manually unlocked scenarios', () => {
      vi.spyOn(gameManager.scenarioManager, 'scenarioData').mockReturnValue([]);
      new PartyScenarioManualCommand('test', '1', true).execute();
      new PartyScenarioManualCommand('test', '1', true).execute();
      expect(gameManager.game.party.manualScenarios.map((model) => model.index)).toEqual(['1']);
      new PartyScenarioManualCommand('test', '1', false).execute();
      expect(gameManager.game.party.manualScenarios).toEqual([]);
    });

    it('removes finished scenarios', () => {
      gameManager.game.party.scenarios = [new GameScenarioModel('1', 'test')];
      expect(new PartyScenarioRemoveCommand('test', '1', '', true).validParameters('test', '1', '', true)).toBe(false);
      new PartyScenarioRemoveCommand('test', '1').execute();
      expect(gameManager.game.party.scenarios).toEqual([]);
    });

    it('removes conclusions and sets week sections', () => {
      gameManager.game.party.conclusions = [new GameScenarioModel('2.1', 'test')];
      new PartyConclusionRemoveCommand('test', '2.1').execute();
      expect(gameManager.game.party.conclusions).toEqual([]);

      new PartyWeekSectionCommand(3, '10.1', true).execute();
      new PartyWeekSectionCommand(3, '10.1', true).execute();
      expect(gameManager.game.party.weekSections[3]).toEqual(['10.1']);
      new PartyWeekSectionCommand(3, '10.1', false).execute();
      expect(gameManager.game.party.weekSections[3]).toBeUndefined();
    });
  });

  describe('party characters', () => {
    it('reactivates a retired character and changes player numbers of party character models', () => {
      const data = Object.assign(new CharacterData(), { name: 'testchar1', edition: 'test', stats: [new CharacterStat(1, 10)] });
      createTestEdition({ characters: [data] });
      const character = createTestCharacter(1);
      character.progress.retired = true;
      gameManager.game.party.retirements = [character.toModel()];
      gameManager.game.figures = [];

      new PartyCharacterPlayerNumberCommand('test', 'testchar1', 1, 3).execute();
      expect(gameManager.game.party.retirements[0].number).toBe(3);

      new PartyCharacterReactivateCommand('test', 'testchar1').execute();
      expect(gameManager.game.party.retirements).toEqual([]);
      expect(gameManager.game.figures.length).toBe(1);
    });
  });

  describe('battle goal setup', () => {
    it('adds and removes battle goal editions', () => {
      createTestEdition();
      vi.spyOn(gameManager, 'editionRules').mockReturnValue(false);
      new PartyBattleGoalEditionCommand('test', true).execute();
      new PartyBattleGoalEditionCommand('test', true).execute();
      expect(gameManager.game.battleGoalEditions).toEqual(['test']);
      new PartyBattleGoalEditionCommand('test', false).execute();
      expect(gameManager.game.battleGoalEditions).toEqual([]);
    });
  });
});
