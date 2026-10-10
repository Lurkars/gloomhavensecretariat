import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CharacterAbilityDeckCommand } from 'src/app/game/commands/character/CharacterAbilityDeck';
import { CharacterAbilityDeckResetCommand } from 'src/app/game/commands/character/CharacterAbilityDeckReset';
import { CharacterAbilityDeckUndoCommand } from 'src/app/game/commands/character/CharacterAbilityDeckUndo';
import { CharacterBattleGoalSelectCommand } from 'src/app/game/commands/character/CharacterBattleGoalSelect';
import { CharacterDonateCommand } from 'src/app/game/commands/character/CharacterDonate';
import { CharacterEnhancementAddCommand } from 'src/app/game/commands/character/CharacterEnhancementAdd';
import { CharacterEnhancementRemoveCommand } from 'src/app/game/commands/character/CharacterEnhancementRemove';
import { CharacterImportCommand } from 'src/app/game/commands/character/CharacterImport';
import { CharacterMasteryCommand } from 'src/app/game/commands/character/CharacterMastery';
import { CharacterMoveResourceCommand } from 'src/app/game/commands/character/CharacterMoveResource';
import { CharacterPerkCommand } from 'src/app/game/commands/character/CharacterPerk';
import { CharacterPersonalQuestCommand } from 'src/app/game/commands/character/CharacterPersonalQuest';
import { CharacterPersonalQuestAutotrackCommand } from 'src/app/game/commands/character/CharacterPersonalQuestAutotrack';
import { CharacterPersonalQuestProgressCommand } from 'src/app/game/commands/character/CharacterPersonalQuestProgress';
import { CharacterProgressExperienceCommand } from 'src/app/game/commands/character/CharacterProgressExperience';
import { CharacterProgressResourceCommand } from 'src/app/game/commands/character/CharacterProgressResource';
import { CharacterProgressSetCommand } from 'src/app/game/commands/character/CharacterProgressSet';
import { CharacterReplayCommand } from 'src/app/game/commands/character/CharacterReplay';
import { CharacterRetireCommand } from 'src/app/game/commands/character/CharacterRetire';
import { CharacterSetAsideCommand } from 'src/app/game/commands/character/CharacterSetAside';
import { createTestCharacter, createTestEdition, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { LootType } from 'src/app/game/model/data/Loot';
import { Perk, PerkType } from 'src/app/game/model/data/Perks';

describe('Character progress commands', () => {
  beforeEach(() => {
    resetTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CharacterProgressSetCommand', () => {
    it('sets numeric and text sheet values', () => {
      const character = createTestCharacter(1);
      new CharacterProgressSetCommand(1, 'gold', 25).execute();
      new CharacterProgressSetCommand(1, 'notes', 'some notes').execute();
      new CharacterProgressSetCommand(1, 'battleGoals', 4).execute();
      expect(character.progress.gold).toBe(25);
      expect(character.progress.notes).toBe('some notes');
      expect(character.progress.battleGoals).toBe(4);
    });

    it('rejects unknown fields and wrong value types', () => {
      createTestCharacter(1);
      expect(new CharacterProgressSetCommand(1, 'level', 2).validParameters(1, 'level', 2)).toBe(false);
      expect(new CharacterProgressSetCommand(1, 'gold', 'x').validParameters(1, 'gold', 'x')).toBe(false);
      expect(new CharacterProgressSetCommand(1, 'notes', 2).validParameters(1, 'notes', 2)).toBe(false);
    });
  });

  describe('CharacterProgressExperienceCommand', () => {
    it('adds experience and does not allow negative totals', () => {
      const character = createTestCharacter(1);
      new CharacterProgressExperienceCommand(1, 10).execute();
      expect(character.progress.experience).toBe(10);
      expect(new CharacterProgressExperienceCommand(1, -11).validParameters(1, -11)).toBe(false);
    });
  });

  describe('resource commands', () => {
    it('sets a resource of the character sheet', () => {
      const character = createTestCharacter(1);
      new CharacterProgressResourceCommand(1, LootType.lumber, 3).execute();
      expect(character.progress.loot[LootType.lumber]).toBe(3);
      expect(new CharacterProgressResourceCommand(1, 'wood', 3).validParameters(1, 'wood', 3)).toBe(false);
    });

    it('moves resources to the party supply', () => {
      const character = createTestCharacter(1);
      character.progress.loot[LootType.metal] = 3;
      expect(new CharacterMoveResourceCommand(1, LootType.metal, 4).validParameters(1, LootType.metal, 4)).toBe(false);
      new CharacterMoveResourceCommand(1, LootType.metal, 2).execute();
      expect(character.progress.loot[LootType.metal]).toBe(1);
      expect(gameManager.game.party.loot[LootType.metal]).toBe(2);
    });
  });

  describe('CharacterDonateCommand', () => {
    it('donates 10 gold outside of a scenario round', () => {
      const character = createTestCharacter(1);
      vi.spyOn(gameManager, 'fhRules').mockReturnValue(false);
      vi.spyOn(gameManager, 'editionRules').mockReturnValue(false);
      character.progress.gold = 9;
      expect(new CharacterDonateCommand(1).validParameters(1)).toBe(false);
      character.progress.gold = 15;
      new CharacterDonateCommand(1).execute();
      expect(character.progress.gold).toBe(5);
      expect(character.progress.donations).toBe(1);
      expect(gameManager.game.party.donations).toBe(1);
    });
  });

  describe('personal quest commands', () => {
    it('sets a personal quest and resets its progress', () => {
      const character = createTestCharacter(1);
      character.progress.personalQuestProgress = [2];
      new CharacterPersonalQuestCommand(1, '510').execute();
      expect(character.progress.personalQuest).toBe('510');
      expect(character.progress.personalQuestProgress).toEqual([]);
    });

    it('sets personal quest progress', () => {
      const character = createTestCharacter(1);
      new CharacterPersonalQuestProgressCommand(1, 2, 3).execute();
      expect(character.progress.personalQuestProgress).toEqual([0, 0, 3]);
    });

    it('sets autotracking', () => {
      const character = createTestCharacter(1);
      new CharacterPersonalQuestAutotrackCommand(1, true).execute();
      expect(character.progress.personalQuestAutotrack).toBe(true);
      new CharacterPersonalQuestAutotrackCommand(1, false).execute();
      expect(character.progress.personalQuestAutotrack).toBe(false);
    });
  });

  describe('CharacterMasteryCommand / CharacterPerkCommand', () => {
    it('sets masteries', () => {
      const character = createTestCharacter(1);
      character.masteries = ['a', 'b'];
      new CharacterMasteryCommand(1, 1, true).execute();
      new CharacterMasteryCommand(1, 1, true).execute();
      expect(character.progress.masteries).toEqual([1]);
      new CharacterMasteryCommand(1, 1, false).execute();
      expect(character.progress.masteries).toEqual([]);
      expect(new CharacterMasteryCommand(1, 2, true).validParameters(1, 2, true)).toBe(false);
    });

    it('sets perk checks and rebuilds the attack modifier deck', () => {
      const character = createTestCharacter(1);
      character.perks = [Object.assign(new Perk(), { type: PerkType.remove, count: 2 })];
      const merge = vi.spyOn(gameManager.attackModifierManager, 'mergeAttackModifierDeck').mockReturnValue(true);
      expect(new CharacterPerkCommand(1, 0, 3).validParameters(1, 0, 3)).toBe(false);
      new CharacterPerkCommand(1, 0, 2).execute();
      expect(character.progress.perks[0]).toBe(2);
      expect(merge).toHaveBeenCalled();
    });
  });

  describe('retire, set aside and replay', () => {
    it('retires a character into the party retirements in campaign mode', () => {
      createTestCharacter(1);
      gameManager.game.party.campaignMode = true;
      new CharacterRetireCommand(1).execute();
      expect(gameManager.game.figures.length).toBe(0);
      expect(gameManager.game.party.retirements.length).toBe(1);
      expect(gameManager.game.party.retirements[0].progress?.retired).toBe(true);
    });

    it('sets a character aside and replays it', () => {
      const data = Object.assign(new CharacterData(), { name: 'testchar1', edition: 'test', stats: [new CharacterStat(1, 10)] });
      createTestEdition({ characters: [data] });
      createTestCharacter(1);
      new CharacterSetAsideCommand(1).execute();
      expect(gameManager.game.figures.length).toBe(0);
      expect(gameManager.game.party.availableCharacters.length).toBe(1);

      expect(new CharacterReplayCommand('test', 'testchar1', 1).validParameters('test', 'testchar1', 1)).toBe(true);
      new CharacterReplayCommand('test', 'testchar1', 1).execute();
      expect(gameManager.game.figures.length).toBe(1);
      expect(gameManager.game.party.availableCharacters.length).toBe(0);
    });
  });

  describe('CharacterImportCommand', () => {
    it('imports a character model of the same character', () => {
      const character = createTestCharacter(1);
      character.progress.gold = 42;
      const model = character.toModel();
      character.progress.gold = 0;
      new CharacterImportCommand(1, JSON.stringify(model)).execute();
      expect(character.progress.gold).toBe(42);
    });

    it('rejects invalid json and other characters', () => {
      const character = createTestCharacter(1);
      expect(new CharacterImportCommand(1, '{').validParameters(1, '{')).toBe(false);
      const model = character.toModel();
      model.name = 'other';
      expect(new CharacterImportCommand(1, JSON.stringify(model)).validParameters(1, JSON.stringify(model))).toBe(false);
    });
  });

  describe('ability deck commands', () => {
    it('picks, undoes and resets picked ability cards', () => {
      const character = createTestCharacter(1);
      vi.spyOn(gameManager, 'deckData').mockReturnValue({ abilities: [{ cardId: 1 }, { cardId: 2 }] } as never);
      new CharacterAbilityDeckCommand(1, 1, true).execute();
      new CharacterAbilityDeckCommand(1, 2, true).execute();
      expect(character.progress.deck).toEqual([0, 1]);
      new CharacterAbilityDeckCommand(1, 1, false).execute();
      expect(character.progress.deck).toEqual([1]);
      expect(new CharacterAbilityDeckCommand(1, 3, true).validParameters(1, 3, true)).toBe(false);
      new CharacterAbilityDeckUndoCommand(1).execute();
      expect(character.progress.deck).toEqual([]);
      expect(new CharacterAbilityDeckUndoCommand(1).validParameters(1)).toBe(false);
      character.progress.deck = [0, 1];
      new CharacterAbilityDeckResetCommand(1).execute();
      expect(character.progress.deck).toEqual([]);
    });
  });

  describe('enhancement commands', () => {
    it('adds an enhancement paying the given costs and removes it again', () => {
      const character = createTestCharacter(1);
      character.progress.gold = 50;
      new CharacterEnhancementAddCommand(1, 7, '0', 0, 'plus1', 30).execute();
      expect(character.progress.enhancements.length).toBe(1);
      expect(character.progress.gold).toBe(20);
      expect(new CharacterEnhancementAddCommand(1, 7, '0', 0, 'plus1', 0).validParameters(1, 7, '0', 0, 'plus1', 0)).toBe(false);

      new CharacterEnhancementRemoveCommand(1, 7, '0', 0).execute();
      expect(character.progress.enhancements.length).toBe(0);
    });

    it('rejects enhancements the character cannot afford', () => {
      createTestCharacter(1);
      expect(new CharacterEnhancementAddCommand(1, 7, '0', 0, 'plus1', 30).validParameters(1, 7, '0', 0, 'plus1', 30)).toBe(false);
    });
  });

  describe('CharacterBattleGoalSelectCommand', () => {
    it('selects a drawn battle goal and deselects it', () => {
      const character = createTestCharacter(1);
      character.battleGoals = [new Identifier('a', 'test'), new Identifier('b', 'test')];
      new CharacterBattleGoalSelectCommand(1, 'test', 'b').execute();
      expect(character.battleGoal).toBe(true);
      expect(character.battleGoals[0].name).toBe('b');
      new CharacterBattleGoalSelectCommand(1, '', '').execute();
      expect(character.battleGoal).toBe(false);
      expect(new CharacterBattleGoalSelectCommand(1, 'test', 'c').validParameters(1, 'test', 'c')).toBe(false);
    });
  });
});
