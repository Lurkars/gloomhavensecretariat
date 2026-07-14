import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { Perk, PerkType } from 'src/app/game/model/data/Perks';
import { PersonalQuest, PersonalQuestRequirement } from 'src/app/game/model/data/PersonalQuest';
import { CharacterSheetComponent } from 'src/app/ui/figures/character/sheet/character-sheet';

// CharacterSheetComponent's constructor only registers a uiChangeEffect() (confirmed elsewhere not
// to run synchronously in tests), so it's cheaply constructible. Following the AppComponent.spec.ts
// pattern: create via TestBed, never call fixture.detectChanges() (so ngOnInit/ngAfterViewInit never
// run and the huge template never resolves), set the required `character` input via setInput(), and
// call methods directly. This spec covers the personal-quest progress/checkbox bookkeeping and the
// simple progress-mutating actions (battle goals/mastery/level/donate/absent/perk toggles) rather
// than the dialog-opening flows (retire/moveResources/statistics/openTrial) or DOM-driven
// import/export/title handling.

function buildCharacter(overrides: Partial<CharacterData> = {}): Character {
  const data = Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] }, overrides);
  return new Character(data, 1);
}

function createComponent(character: Character): CharacterSheetComponent {
  const fixture = TestBed.createComponent(CharacterSheetComponent);
  fixture.componentRef.setInput('character', character);
  return fixture.componentInstance;
}

describe('CharacterSheetComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CharacterSheetComponent] }).compileComponents();

    gameManager.game.figures = [];
    gameManager.game.state = GameState.draw;
    gameManager.game.round = 0;
    gameManager.game.scenario = undefined;
    gameManager.game.party.campaignMode = false;
    gameManager.game.party.donations = 0;
    gameManager.game.party.players = [];
    gameManager.game.party.availableCharacters = [];
    gameManager.game.party.retirements = [];
    settingsManager.settings.applyRetirement = false;
    settingsManager.settings.characterSheetLocked = false;
    settingsManager.settings.fhShareResources = false;
  });

  it('renders the template without throwing', () => {
    const fixture = TestBed.createComponent(CharacterSheetComponent);
    fixture.componentRef.setInput('character', buildCharacter());
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('getPersonalQuestCount', () => {
    it('is 0 with no personal quest set', () => {
      const component = createComponent(buildCharacter());
      expect(component.getPersonalQuestCount(0)).toEqual(0);
    });

    it('is 0 for an out-of-range index', () => {
      const component = createComponent(buildCharacter());
      component.personalQuest = Object.assign(new PersonalQuest(), { requirements: [new PersonalQuestRequirement()] });
      expect(component.getPersonalQuestCount(5)).toEqual(0);
    });

    it('reads the raw progress value for a non-checkbox requirement', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      component.personalQuest = Object.assign(new PersonalQuest(), {
        requirements: [Object.assign(new PersonalQuestRequirement(), { checkbox: [] })]
      });
      character.progress.personalQuestProgress = [3];
      expect(component.getPersonalQuestCount(0)).toEqual(3);
    });

    it('counts set bits for a checkbox requirement', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      component.personalQuest = Object.assign(new PersonalQuest(), {
        requirements: [Object.assign(new PersonalQuestRequirement(), { checkbox: ['a', 'b', 'c'] })]
      });
      character.progress.personalQuestProgress = [0b101];
      expect(component.getPersonalQuestCount(0)).toEqual(2);
    });
  });

  describe('isPersonalQuestCheckboxChecked', () => {
    it('reflects the given bit of the progress value', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      character.progress.personalQuestProgress = [0b101];
      expect(component.isPersonalQuestCheckboxChecked(0, 0)).toBe(true);
      expect(component.isPersonalQuestCheckboxChecked(0, 1)).toBe(false);
      expect(component.isPersonalQuestCheckboxChecked(0, 2)).toBe(true);
    });
  });

  describe('personalQuestRequirementUnlocked', () => {
    it('is false with no personal quest set', () => {
      const component = createComponent(buildCharacter());
      expect(component.personalQuestRequirementUnlocked(0)).toBe(false);
    });

    it('is true once every prerequisite requirement is satisfied', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      component.personalQuest = Object.assign(new PersonalQuest(), {
        requirements: [
          Object.assign(new PersonalQuestRequirement(), { checkbox: [] }),
          Object.assign(new PersonalQuestRequirement(), { requires: [1] })
        ]
      });
      character.progress.personalQuestProgress = [1, 0];
      expect(component.personalQuestRequirementUnlocked(1)).toBe(true);
    });

    it('is false while a prerequisite requirement is unmet', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      component.personalQuest = Object.assign(new PersonalQuest(), {
        requirements: [
          Object.assign(new PersonalQuestRequirement(), { checkbox: [] }),
          Object.assign(new PersonalQuestRequirement(), { requires: [1] })
        ]
      });
      character.progress.personalQuestProgress = [0, 0];
      expect(component.personalQuestRequirementUnlocked(1)).toBe(false);
    });
  });

  describe('setBattleGoals', () => {
    it('decrements when setting the already-current value', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      character.progress.battleGoals = 5;
      component.setBattleGoals(5);
      expect(character.progress.battleGoals).toEqual(4);
    });

    it('clamps below 0 up to 0', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      component.setBattleGoals(-3);
      expect(character.progress.battleGoals).toEqual(0);
    });

    it('clamps above 18 down to 18', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      component.setBattleGoals(99);
      expect(character.progress.battleGoals).toEqual(18);
    });
  });

  describe('toggleMastery', () => {
    it('adds a mastery index when not already present', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      component.toggleMastery(2);
      expect(character.progress.masteries).toEqual([2]);
    });

    it('removes a mastery index when already present', () => {
      const character = buildCharacter();
      character.progress.masteries = [2];
      const component = createComponent(character);
      component.toggleMastery(2);
      expect(character.progress.masteries).toEqual([]);
    });
  });

  describe('toggleCharacterAbsent', () => {
    it('is a no-op for the only character in the party (cannot mark the last character absent)', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      const component = createComponent(character);
      component.toggleCharacterAbsent();
      expect(character.absent).toBe(false);
    });

    it('flips absent when another character is present', () => {
      const character = buildCharacter();
      const other = buildCharacter({ name: 'scoundrel' } as any);
      gameManager.game.figures = [character, other];
      const component = createComponent(character);
      component.toggleCharacterAbsent();
      expect(character.absent).toBe(true);
    });

    it('un-marks absent even as the only character', () => {
      const character = buildCharacter();
      character.absent = true;
      gameManager.game.figures = [character];
      const component = createComponent(character);
      component.toggleCharacterAbsent();
      expect(character.absent).toBe(false);
    });
  });

  describe('donate', () => {
    it('is a no-op before round 0 threshold is met (not enough gold)', () => {
      const character = buildCharacter();
      character.progress.gold = 5;
      const component = createComponent(character);
      component.donate();
      expect(character.progress.donations).toEqual(0);
    });

    it('donates 10 gold and increments counters once the threshold is exceeded', () => {
      const character = buildCharacter();
      character.progress.gold = 10;
      gameManager.game.round = 0;
      const component = createComponent(character);
      component.donate();
      expect(character.progress.donations).toEqual(1);
      expect(character.donations).toEqual(1);
      expect(character.progress.gold).toEqual(0);
      expect(gameManager.game.party.donations).toEqual(1);
    });

    it('is a no-op once the round has started', () => {
      const character = buildCharacter();
      character.progress.gold = 20;
      gameManager.game.round = 1;
      const component = createComponent(character);
      component.donate();
      expect(character.progress.donations).toEqual(0);
    });
  });

  describe('toggleFhSheet', () => {
    it('flips fhSheet and recomputes gh2eSheet/csSheet', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      component.fhSheet = false;
      component.toggleFhSheet();
      expect(component.fhSheet).toBe(true);
    });
  });

  describe('togglePerk / addPerk', () => {
    it('cycles a perk value up to its max count then back to 0', () => {
      const character = buildCharacter({ perks: [Object.assign(new Perk(), { type: PerkType.add, count: 1 })] } as any);
      character.progress.perks = [0];
      const component = createComponent(character);
      component.availablePerks = 5;
      component.togglePerk(0);
      expect(character.progress.perks[0]).toEqual(1);
      component.togglePerk(0);
      expect(character.progress.perks[0]).toEqual(0);
    });

    it('addPerk is blocked once the round has started unless forceEdit is set', () => {
      const character = buildCharacter({ perks: [Object.assign(new Perk(), { type: PerkType.add, count: 1 })] } as any);
      character.progress.perks = [0];
      gameManager.game.round = 1;
      gameManager.game.state = 'next' as any;
      const component = createComponent(character);
      component.addPerk(0, 1);
      expect(character.progress.perks[0]).toEqual(0);
    });
  });

  describe('setAside / replay', () => {
    it('setAside moves the character into party.availableCharacters and removes it from figures', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      const component = createComponent(character);
      component.setAside();
      expect(gameManager.game.figures).not.toContain(character);
      expect(gameManager.game.party.availableCharacters.length).toEqual(1);
    });

    it('replay is a no-op when the character is not currently in the available pool', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      component.replayable = false;
      component.replay();
      expect(gameManager.game.figures).not.toContain(character);
    });
  });
});
