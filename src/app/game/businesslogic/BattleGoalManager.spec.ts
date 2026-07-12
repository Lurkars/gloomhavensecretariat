import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { BattleGoal } from 'src/app/game/model/data/BattleGoal';
import { CharacterClass, CharacterData, CharacterGender } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { Identifier } from 'src/app/game/model/data/Identifier';

function buildEditionData(edition: string, battleGoals: BattleGoal[]): EditionData {
  return new EditionData(edition, [], [], [], [], [], [], [], battleGoals);
}

function buildBattleGoal(edition: string, name: string, cardId: string, checks: number = 1, alias: Identifier | undefined = undefined) {
  const bg = new BattleGoal();
  bg.edition = edition;
  bg.name = name;
  bg.cardId = cardId;
  bg.checks = checks;
  bg.alias = alias;
  return bg;
}

function buildCharacter(name: string = 'test-char'): Character {
  const data = new CharacterData();
  data.name = name;
  data.edition = 'gh';
  data.characterClass = CharacterClass.human;
  data.gender = CharacterGender.male;
  data.stats = [new CharacterStat(1, 10)];
  return new Character(data, 1);
}

describe('BattleGoalManager', () => {
  // Reuse the manager instance already wired up on the gameManager singleton (gameManager.game
  // and gameManager.battleGoalManager.game are the same object) instead of constructing a new
  // BattleGoalManager, to avoid a module-load-order circular-import hazard between
  // BattleGoalManager.ts and GameManager.ts (both import each other).
  let battleGoalManager: typeof gameManager.battleGoalManager;

  beforeEach(() => {
    gameManager.game.figures = [];
    gameManager.game.edition = undefined;
    gameManager.game.battleGoalEditions = [];
    gameManager.game.filteredBattleGoals = [];
    gameManager.editionData = [];
    settingsManager.settings.editions = [];
    gameManager.trialsManager.apply = false;
    battleGoalManager = gameManager.battleGoalManager;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getBattleGoalEditions', () => {
    it('returns only editions enabled in settings that define battle goals', () => {
      gameManager.editionData = [
        buildEditionData('gh', [buildBattleGoal('gh', 'a', '1')]),
        buildEditionData('fh', [buildBattleGoal('fh', 'b', '1')]),
        buildEditionData('empty', [])
      ];
      settingsManager.settings.editions = ['gh', 'empty'];

      expect(battleGoalManager.getBattleGoalEditions()).toEqual(['gh']);
    });

    it('returns an empty array when no matching edition has battle goals', () => {
      gameManager.editionData = [buildEditionData('gh', [])];
      settingsManager.settings.editions = ['gh'];

      expect(battleGoalManager.getBattleGoalEditions()).toEqual([]);
    });
  });

  describe('getBattleGoals', () => {
    it('includes battle goals from editions considered relevant to the current edition', () => {
      gameManager.editionData = [buildEditionData('gh', [buildBattleGoal('gh', 'a', '1')])];
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      vi.spyOn(gameManager, 'editionRules').mockReturnValue(true);

      const result = battleGoalManager.getBattleGoals();
      expect(result.map((b) => b.name)).toEqual(['a']);
    });

    it('excludes editions not enabled in settings even if otherwise relevant', () => {
      gameManager.editionData = [buildEditionData('gh', [buildBattleGoal('gh', 'a', '1')])];
      settingsManager.settings.editions = [];
      gameManager.game.edition = 'gh';
      vi.spyOn(gameManager, 'editionRules').mockReturnValue(true);

      expect(battleGoalManager.getBattleGoals()).toEqual([]);
    });

    it('falls back to game.battleGoalEditions when there is no current game.edition', () => {
      gameManager.editionData = [buildEditionData('gh', [buildBattleGoal('gh', 'a', '1')])];
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = undefined;
      gameManager.game.battleGoalEditions = ['gh'];
      vi.spyOn(gameManager, 'editionRules').mockReturnValue(false);

      const result = battleGoalManager.getBattleGoals();
      expect(result.map((b) => b.name)).toEqual(['a']);
    });

    it('excludes battle goals listed in game.filteredBattleGoals when filtered=true (default)', () => {
      gameManager.editionData = [buildEditionData('gh', [buildBattleGoal('gh', 'a', '1'), buildBattleGoal('gh', 'b', '2')])];
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      gameManager.game.filteredBattleGoals = [new Identifier('a', 'gh')];
      vi.spyOn(gameManager, 'editionRules').mockReturnValue(true);

      const result = battleGoalManager.getBattleGoals();
      expect(result.map((b) => b.name)).toEqual(['b']);
    });

    it('ignores game.filteredBattleGoals when filtered=false', () => {
      gameManager.editionData = [buildEditionData('gh', [buildBattleGoal('gh', 'a', '1'), buildBattleGoal('gh', 'b', '2')])];
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      gameManager.game.filteredBattleGoals = [new Identifier('a', 'gh')];
      vi.spyOn(gameManager, 'editionRules').mockReturnValue(true);

      const result = battleGoalManager.getBattleGoals(false);
      expect(result.map((b) => b.name).sort()).toEqual(['a', 'b']);
    });

    it('sorts battle goals of the same edition by ascending (string-compared) cardId', () => {
      // sortAction's comparator does `a.cardId < b.cardId ? -1 : 1`, a plain string comparison
      // (not numeric), so cardIds are picked here to sort the same way under both.
      gameManager.editionData = [buildEditionData('gh', [buildBattleGoal('gh', 'b', '9'), buildBattleGoal('gh', 'a', '3')])];
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      vi.spyOn(gameManager, 'editionRules').mockReturnValue(true);

      const result = battleGoalManager.getBattleGoals();
      expect(result.map((b) => b.cardId)).toEqual(['3', '9']);
    });

    it('sorts the current edition before other editions', () => {
      gameManager.editionData = [
        buildEditionData('fh', [buildBattleGoal('fh', 'f', '1')]),
        buildEditionData('gh', [buildBattleGoal('gh', 'g', '1')])
      ];
      settingsManager.settings.editions = ['fh', 'gh'];
      gameManager.game.edition = 'gh';
      vi.spyOn(gameManager, 'editionRules').mockReturnValue(true);

      const result = battleGoalManager.getBattleGoals();
      expect(result[0].edition).toBe('gh');
    });
  });

  describe('getUnrevealedBattleGoals', () => {
    it('excludes battle goals already assigned to any character', () => {
      gameManager.editionData = [buildEditionData('gh', [buildBattleGoal('gh', 'a', '1'), buildBattleGoal('gh', 'b', '2')])];
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      vi.spyOn(gameManager, 'editionRules').mockReturnValue(true);

      const character = buildCharacter();
      character.battleGoals = [new Identifier('a', 'gh')];
      gameManager.game.figures = [character];

      const result = battleGoalManager.getUnrevealedBattleGoals();
      expect(result.map((b) => b.name)).toEqual(['b']);
    });

    it('does not exclude goals assigned only to the characterFilter figure', () => {
      gameManager.editionData = [buildEditionData('gh', [buildBattleGoal('gh', 'a', '1')])];
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      vi.spyOn(gameManager, 'editionRules').mockReturnValue(true);

      const character = buildCharacter();
      character.battleGoals = [new Identifier('a', 'gh')];
      gameManager.game.figures = [character];

      const result = battleGoalManager.getUnrevealedBattleGoals(character);
      expect(result.map((b) => b.name)).toEqual(['a']);
    });
  });

  describe('getBattleGoalsForEdition', () => {
    it('returns battle goals from editions gameManager considers relevant', () => {
      gameManager.editionData = [buildEditionData('gh', [buildBattleGoal('gh', 'a', '1')]), buildEditionData('fh', [])];
      settingsManager.settings.editions = ['gh', 'fh'];
      vi.spyOn(gameManager, 'isEditionRelevant').mockImplementation((edition) => edition === 'gh');

      const result = battleGoalManager.getBattleGoalsForEdition('gh');
      expect(result.map((b) => b.name)).toEqual(['a']);
    });
  });

  describe('getBattleGoal', () => {
    it('finds a battle goal by its identifier', () => {
      gameManager.editionData = [buildEditionData('gh', [buildBattleGoal('gh', 'a', '1')])];
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      vi.spyOn(gameManager, 'editionRules').mockReturnValue(true);

      const result = battleGoalManager.getBattleGoal(new Identifier('a', 'gh'));
      expect(result?.name).toBe('a');
    });

    it('returns undefined when no battle goal matches', () => {
      gameManager.editionData = [buildEditionData('gh', [buildBattleGoal('gh', 'a', '1')])];
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      vi.spyOn(gameManager, 'editionRules').mockReturnValue(true);

      const result = battleGoalManager.getBattleGoal(new Identifier('nonexistent', 'gh'));
      expect(result).toBeUndefined();
    });
  });

  describe('drawBattleGoal', () => {
    it('assigns a random unrevealed battle goal to the character', () => {
      gameManager.editionData = [buildEditionData('gh', [buildBattleGoal('gh', 'a', '1')])];
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      vi.spyOn(gameManager, 'editionRules').mockReturnValue(true);
      vi.spyOn(gameManager.trialsManager, 'activeTrial').mockReturnValue(false);
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const character = buildCharacter();
      gameManager.game.figures = [character];

      battleGoalManager.drawBattleGoal(character);

      expect(character.battleGoals.length).toBe(1);
      expect(character.battleGoals[0]).toMatchObject({ name: 'a', edition: 'gh' });
    });

    it('does nothing when there are no unrevealed battle goals left', () => {
      gameManager.editionData = [];
      settingsManager.settings.editions = [];

      const character = buildCharacter();
      gameManager.game.figures = [character];

      battleGoalManager.drawBattleGoal(character);

      expect(character.battleGoals).toEqual([]);
    });

    it('splices the new goal before the last two when splice=true and there are more than 2 already', () => {
      gameManager.editionData = [buildEditionData('gh', [buildBattleGoal('gh', 'new', '1')])];
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      vi.spyOn(gameManager, 'editionRules').mockReturnValue(true);
      vi.spyOn(gameManager.trialsManager, 'activeTrial').mockReturnValue(false);
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const character = buildCharacter();
      character.battleGoals = [new Identifier('x', 'gh'), new Identifier('y', 'gh'), new Identifier('z', 'gh')];
      gameManager.game.figures = [character];

      battleGoalManager.drawBattleGoal(character, true);

      expect(character.battleGoals.map((b) => b.name)).toEqual(['x', 'new', 'y', 'z']);
    });

    it('appends (rather than splices) when splice=true but 2 or fewer goals exist', () => {
      gameManager.editionData = [buildEditionData('gh', [buildBattleGoal('gh', 'new', '1')])];
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      vi.spyOn(gameManager, 'editionRules').mockReturnValue(true);
      vi.spyOn(gameManager.trialsManager, 'activeTrial').mockReturnValue(false);
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const character = buildCharacter();
      character.battleGoals = [new Identifier('x', 'gh')];
      gameManager.game.figures = [character];

      battleGoalManager.drawBattleGoal(character, true);

      expect(character.battleGoals.map((b) => b.name)).toEqual(['x', 'new']);
    });

    it('filters to 2-check battle goals only when the fh trial #360 is active and applied', () => {
      gameManager.editionData = [
        buildEditionData('gh', [buildBattleGoal('gh', 'one-check', '1', 1), buildBattleGoal('gh', 'two-check', '2', 2)])
      ];
      settingsManager.settings.editions = ['gh'];
      gameManager.game.edition = 'gh';
      vi.spyOn(gameManager, 'editionRules').mockReturnValue(true);
      gameManager.trialsManager.apply = true;
      vi.spyOn(gameManager.trialsManager, 'activeTrial').mockReturnValue(true);
      vi.spyOn(Math, 'random').mockReturnValue(0);

      const character = buildCharacter();
      gameManager.game.figures = [character];

      battleGoalManager.drawBattleGoal(character);

      expect(character.battleGoals[0].name).toBe('two-check');
    });
  });
});
