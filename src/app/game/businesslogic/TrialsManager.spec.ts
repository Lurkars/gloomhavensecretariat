import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { BuildingModel } from 'src/app/game/model/Building';
import { Character } from 'src/app/game/model/Character';
import { AttackModifier, AttackModifierDeck, AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { CharacterClass, CharacterData, CharacterGender } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { TrialCard } from 'src/app/game/model/data/Trials';

function buildCharacter(name: string = 'test-char'): Character {
  const data = new CharacterData();
  data.name = name;
  data.edition = 'fh';
  data.characterClass = CharacterClass.human;
  data.gender = CharacterGender.male;
  data.stats = [new CharacterStat(1, 10)];
  return new Character(data, 1);
}

function buildTrialCard(cardId: number, edition: string = 'fh'): TrialCard {
  const card = new TrialCard();
  card.cardId = cardId;
  card.edition = edition;
  return card;
}

function buildEditionData(edition: string, trials: TrialCard[]): EditionData {
  const data = new EditionData(edition, [], [], [], [], [], [], [], [], [], []);
  data.trials = trials;
  return data;
}

describe('TrialsManager', () => {
  let trialsManager: typeof gameManager.trialsManager;

  beforeEach(() => {
    gameManager.game.figures = [];
    gameManager.game.party.buildings = [];
    gameManager.game.party.trials = -1;
    gameManager.game.party.retirements = [];
    gameManager.game.favorPoints = [];
    gameManager.game.favors = [];
    gameManager.game.monsterAttackModifierDeck = new AttackModifierDeck();
    gameManager.editionData = [];
    settingsManager.settings.fhTrials = false;
    settingsManager.settings.fhTrialsApply = false;
    settingsManager.settings.battleGoals = true;
    vi.spyOn(gameManager, 'fhRules').mockReturnValue(true);
    vi.spyOn(gameManager, 'currentEdition').mockReturnValue('fh');

    trialsManager = gameManager.trialsManager;
    trialsManager.available = false;
    trialsManager.trialsAvailable = false;
    trialsManager.favorsAvailable = false;
    trialsManager.trialsEnabled = false;
    trialsManager.favorsEnabled = false;
    trialsManager.apply = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('update', () => {
    it('is unavailable without fh rules', () => {
      vi.spyOn(gameManager, 'fhRules').mockReturnValue(false);
      gameManager.game.party.buildings = [new BuildingModel('hall-of-revelry', 1)];

      trialsManager.update();

      expect(trialsManager.available).toBe(false);
    });

    it('is unavailable without a hall-of-revelry building', () => {
      gameManager.game.party.buildings = [];

      trialsManager.update();

      expect(trialsManager.available).toBe(false);
    });

    it('is unavailable when the hall-of-revelry is wrecked', () => {
      const hall = new BuildingModel('hall-of-revelry', 1);
      hall.state = 'wrecked';
      gameManager.game.party.buildings = [hall];

      trialsManager.update();

      expect(trialsManager.available).toBe(false);
    });

    it('marks trials available at level 1 and favors available at level 2', () => {
      gameManager.game.party.buildings = [new BuildingModel('hall-of-revelry', 1)];
      trialsManager.update();
      expect(trialsManager.available).toBe(true);
      expect(trialsManager.trialsAvailable).toBe(true);
      expect(trialsManager.favorsAvailable).toBe(false);

      gameManager.game.party.buildings = [new BuildingModel('hall-of-revelry', 2)];
      trialsManager.update();
      expect(trialsManager.trialsAvailable).toBe(false);
      expect(trialsManager.favorsAvailable).toBe(true);
    });

    it('does not enable trials/favors when the fhTrials setting is off, even if available', () => {
      gameManager.game.party.buildings = [new BuildingModel('hall-of-revelry', 1)];
      settingsManager.settings.fhTrials = false;

      trialsManager.update();

      expect(trialsManager.trialsEnabled).toBe(false);
      expect(trialsManager.favorsEnabled).toBe(false);
    });

    it('enables trials and sets "apply" from settings when fhTrials setting is on', () => {
      gameManager.game.party.buildings = [new BuildingModel('hall-of-revelry', 1)];
      settingsManager.settings.fhTrials = true;
      settingsManager.settings.fhTrialsApply = true;

      trialsManager.update();

      expect(trialsManager.trialsEnabled).toBe(true);
      expect(trialsManager.apply).toBe(true);
    });
  });

  describe('applyTrialCards', () => {
    it('does nothing to characters that already have a trial in progress', () => {
      trialsManager.trialsEnabled = true;
      gameManager.editionData = [buildEditionData('fh', [buildTrialCard(100)])];

      const character = buildCharacter();
      character.progress.trial = new Identifier('999', 'fh');
      gameManager.game.figures = [character];

      trialsManager.applyTrialCards();

      expect(character.progress.trial?.name).toBe('999');
    });

    it('assigns the next trial card from the edition trial deck to characters without one', () => {
      trialsManager.trialsEnabled = true;
      gameManager.editionData = [buildEditionData('fh', [buildTrialCard(100), buildTrialCard(200)])];

      const character = buildCharacter();
      gameManager.game.figures = [character];

      trialsManager.applyTrialCards();

      expect(gameManager.game.party.trials).toBe(0);
      expect(character.progress.trial).toEqual(new Identifier(100, 'fh'));
    });

    it('restores a retired character trial from party retirements instead of drawing a new one', () => {
      trialsManager.trialsEnabled = true;
      gameManager.editionData = [buildEditionData('fh', [buildTrialCard(100)])];

      const character = buildCharacter();
      gameManager.game.party.retirements = [{ number: character.number, progress: { trial: new Identifier('55', 'fh') } } as any];
      gameManager.game.figures = [character];

      trialsManager.applyTrialCards();

      expect(character.progress.trial?.name).toBe('55');
      expect(gameManager.game.party.trials).toBe(-1);
    });

    it('does not redraw when party.trials===0 ("first card already drawn") with a single-card deck', () => {
      trialsManager.trialsEnabled = true;
      gameManager.editionData = [buildEditionData('fh', [buildTrialCard(100)])];
      gameManager.game.party.trials = 0; // already drawn the only card (index 0)

      const character = buildCharacter();
      gameManager.game.figures = [character];

      trialsManager.applyTrialCards();

      expect(character.progress.trial).toBeUndefined();
      expect(gameManager.game.party.trials).toBe(0);
    });

    it('does not exceed the length of the edition trial deck once the counter is above 0', () => {
      trialsManager.trialsEnabled = true;
      gameManager.editionData = [buildEditionData('fh', [buildTrialCard(100), buildTrialCard(200)])];
      gameManager.game.party.trials = 1; // already drawn both cards (indices 0 and 1)

      const character = buildCharacter();
      gameManager.game.figures = [character];

      trialsManager.applyTrialCards();

      expect(character.progress.trial).toBeUndefined();
    });

    it('clears all character trials when trials are disabled and there is no active hall (level 1)', () => {
      trialsManager.trialsEnabled = false;
      gameManager.game.party.buildings = [];

      const character = buildCharacter();
      character.progress.trial = new Identifier('1', 'fh');
      gameManager.game.figures = [character];

      trialsManager.applyTrialCards();

      expect(character.progress.trial).toBeUndefined();
      expect(gameManager.game.party.trials).toBe(-1);
    });

    it('keeps character trials when disabled but a level-1 hall is still present', () => {
      trialsManager.trialsEnabled = false;
      gameManager.game.party.buildings = [new BuildingModel('hall-of-revelry', 1)];

      const character = buildCharacter();
      character.progress.trial = new Identifier('1', 'fh');
      gameManager.game.figures = [character];

      trialsManager.applyTrialCards();

      expect(character.progress.trial?.name).toBe('1');
    });
  });

  describe('activeTrial', () => {
    it('returns false when trials are not enabled', () => {
      trialsManager.trialsEnabled = false;
      const character = buildCharacter();
      character.progress.trial = new Identifier('360', 'fh');
      gameManager.game.figures = [character];

      expect(trialsManager.activeTrial('fh', 360)).toBe(false);
    });

    it('returns true when a character has the matching trial and trials are enabled', () => {
      trialsManager.trialsEnabled = true;
      const character = buildCharacter();
      character.progress.trial = new Identifier('360', 'fh');
      gameManager.game.figures = [character];

      expect(trialsManager.activeTrial('fh', 360)).toBe(true);
    });

    it('returns false when no character has the matching trial', () => {
      trialsManager.trialsEnabled = true;
      const character = buildCharacter();
      character.progress.trial = new Identifier('1', 'fh');
      gameManager.game.figures = [character];

      expect(trialsManager.activeTrial('fh', 360)).toBe(false);
    });
  });

  describe('applyFavorPoints', () => {
    it('removes a minus1 modifier from the monster deck for each favor point of value 1', () => {
      gameManager.game.monsterAttackModifierDeck.cards = [
        new AttackModifier(AttackModifierType.minus1),
        new AttackModifier(AttackModifierType.plus1)
      ];
      gameManager.game.favorPoints = [1];

      trialsManager.applyFavorPoints();

      expect(gameManager.game.monsterAttackModifierDeck.cards.some((am) => am.type === AttackModifierType.minus1)).toBe(false);
    });

    it('removes a minus2 modifier from the monster deck for each favor point of value other than 1', () => {
      gameManager.game.monsterAttackModifierDeck.cards = [new AttackModifier(AttackModifierType.minus2)];
      gameManager.game.favorPoints = [2];

      trialsManager.applyFavorPoints();

      expect(gameManager.game.monsterAttackModifierDeck.cards.length).toBe(0);
    });

    it('does nothing when the targeted modifier is not present in the deck', () => {
      gameManager.game.monsterAttackModifierDeck.cards = [new AttackModifier(AttackModifierType.plus1)];
      gameManager.game.favorPoints = [1];

      expect(() => trialsManager.applyFavorPoints()).not.toThrow();
      expect(gameManager.game.monsterAttackModifierDeck.cards.length).toBe(1);
    });
  });

  describe('activeFavor', () => {
    it('counts matching favor identifiers', () => {
      gameManager.game.favors = [new Identifier('a', 'fh'), new Identifier('a', 'fh'), new Identifier('b', 'fh')];
      expect(trialsManager.activeFavor('fh', 'a')).toBe(2);
    });

    it('returns 0 when there is no match', () => {
      gameManager.game.favors = [new Identifier('a', 'fh')];
      expect(trialsManager.activeFavor('fh', 'z')).toBe(0);
    });
  });

  describe('cardIdSecondPrinting', () => {
    it('computes 708 - cardId', () => {
      expect(trialsManager.cardIdSecondPrinting(360)).toBe(348);
    });

    it('computes correctly for cardId 12 (documented example, 360 - 12)', () => {
      expect(trialsManager.cardIdSecondPrinting(12)).toBe(696);
    });
  });

  describe('next', () => {
    it('draws a fh trial-356 battle goal and removes the tag when all conditions match', () => {
      trialsManager.apply = true;
      trialsManager.trialsEnabled = true;
      const drawSpy = vi.spyOn(gameManager.battleGoalManager, 'drawBattleGoal').mockImplementation(() => {});

      const character = buildCharacter();
      character.health = 10;
      character.progress.trial = new Identifier('356', 'fh');
      character.tags = ['trial-fh-356'];

      trialsManager.next(character);

      expect(character.tags).not.toContain('trial-fh-356');
      expect(drawSpy).toHaveBeenCalledWith(character, true);
    });

    it('does nothing when the character does not have the trial-fh-356 tag', () => {
      trialsManager.apply = true;
      trialsManager.trialsEnabled = true;
      const drawSpy = vi.spyOn(gameManager.battleGoalManager, 'drawBattleGoal').mockImplementation(() => {});

      const character = buildCharacter();
      character.health = 10;
      character.progress.trial = new Identifier('356', 'fh');
      character.tags = [];

      trialsManager.next(character);

      expect(drawSpy).not.toHaveBeenCalled();
    });

    it('does nothing when trials are not enabled', () => {
      trialsManager.apply = true;
      trialsManager.trialsEnabled = false;
      const drawSpy = vi.spyOn(gameManager.battleGoalManager, 'drawBattleGoal').mockImplementation(() => {});

      const character = buildCharacter();
      character.health = 10;
      character.progress.trial = new Identifier('356', 'fh');
      character.tags = ['trial-fh-356'];

      trialsManager.next(character);

      expect(drawSpy).not.toHaveBeenCalled();
      expect(character.tags).toContain('trial-fh-356');
    });
  });

  describe('draw', () => {
    it('removes the trial-fh-356 tag when all conditions match', () => {
      trialsManager.apply = true;
      trialsManager.trialsEnabled = true;

      const character = buildCharacter();
      character.absent = false;
      character.progress.trial = new Identifier('356', 'fh');
      character.tags = ['trial-fh-356'];

      trialsManager.draw(character);

      expect(character.tags).not.toContain('trial-fh-356');
    });

    it('does nothing for an absent character', () => {
      trialsManager.apply = true;
      trialsManager.trialsEnabled = true;

      const character = buildCharacter();
      character.absent = true;
      character.progress.trial = new Identifier('356', 'fh');
      character.tags = ['trial-fh-356'];

      trialsManager.draw(character);

      expect(character.tags).toContain('trial-fh-356');
    });
  });
});
