import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { PersonalQuest, PersonalQuestRequirement } from 'src/app/game/model/data/PersonalQuest';
import { GameState } from 'src/app/game/model/Game';
import { CharacterSheetPersonalQuestComponent } from 'src/app/ui/figures/character/sheet/sections/personal-quest';

function buildCharacter(overrides: Partial<CharacterData> = {}): Character {
  const data = Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] }, overrides);
  return new Character(data, 1);
}

function createComponent<T>(type: Type<T>, character: Character): T {
  const fixture = TestBed.createComponent(type);
  fixture.componentRef.setInput('character', character);
  return fixture.componentInstance;
}

function resetGame() {
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
}

describe('CharacterSheetPersonalQuestComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CharacterSheetPersonalQuestComponent] }).compileComponents();
    resetGame();
  });

  describe('getPersonalQuestCount', () => {
    it('is 0 with no personal quest set', () => {
      const component = createComponent(CharacterSheetPersonalQuestComponent, buildCharacter());
      expect(component.getPersonalQuestCount(0)).toEqual(0);
    });

    it('is 0 for an out-of-range index', () => {
      const component = createComponent(CharacterSheetPersonalQuestComponent, buildCharacter());
      component.personalQuest = Object.assign(new PersonalQuest(), { requirements: [new PersonalQuestRequirement()] });
      expect(component.getPersonalQuestCount(5)).toEqual(0);
    });

    it('reads the raw progress value for a non-checkbox requirement', () => {
      const character = buildCharacter();
      const component = createComponent(CharacterSheetPersonalQuestComponent, character);
      component.personalQuest = Object.assign(new PersonalQuest(), {
        requirements: [Object.assign(new PersonalQuestRequirement(), { checkbox: [] })]
      });
      character.progress.personalQuestProgress = [3];
      expect(component.getPersonalQuestCount(0)).toEqual(3);
    });

    it('counts set bits for a checkbox requirement', () => {
      const character = buildCharacter();
      const component = createComponent(CharacterSheetPersonalQuestComponent, character);
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
      const component = createComponent(CharacterSheetPersonalQuestComponent, character);
      character.progress.personalQuestProgress = [0b101];
      expect(component.isPersonalQuestCheckboxChecked(0, 0)).toBe(true);
      expect(component.isPersonalQuestCheckboxChecked(0, 1)).toBe(false);
      expect(component.isPersonalQuestCheckboxChecked(0, 2)).toBe(true);
    });
  });
  describe('personalQuestRequirementUnlocked', () => {
    it('is false with no personal quest set', () => {
      const component = createComponent(CharacterSheetPersonalQuestComponent, buildCharacter());
      expect(component.personalQuestRequirementUnlocked(0)).toBe(false);
    });

    it('is true once every prerequisite requirement is satisfied', () => {
      const character = buildCharacter();
      const component = createComponent(CharacterSheetPersonalQuestComponent, character);
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
      const component = createComponent(CharacterSheetPersonalQuestComponent, character);
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
  describe('personal quest autotrack', () => {
    it('personalQuestAutotrackSupported is false with no personal quest set', () => {
      const component = createComponent(CharacterSheetPersonalQuestComponent, buildCharacter());
      expect(component.personalQuestAutotrackSupported()).toBe(false);
    });

    it('personalQuestAutotrackSupported is true once at least one requirement has a recognized autotrack tag', () => {
      const component = createComponent(CharacterSheetPersonalQuestComponent, buildCharacter());
      component.personalQuest = Object.assign(new PersonalQuest(), {
        edition: 'gh',
        requirements: [
          Object.assign(new PersonalQuestRequirement(), { counter: 1 }),
          Object.assign(new PersonalQuestRequirement(), { counter: 1, autotrack: 'loot' })
        ]
      });
      expect(component.personalQuestAutotrackSupported()).toBe(true);
    });

    it('togglePersonalQuestAutotrack flips the persisted flag', () => {
      const character = buildCharacter();
      character.progress.personalQuestAutotrack = false;
      const component = createComponent(CharacterSheetPersonalQuestComponent, character);

      component.togglePersonalQuestAutotrack();
      expect(character.progress.personalQuestAutotrack).toBe(true);

      component.togglePersonalQuestAutotrack();
      expect(character.progress.personalQuestAutotrack).toBe(false);
    });

    it('personalQuestRequirementAutotracked reflects the toggle, per requirement', () => {
      const character = buildCharacter();
      const component = createComponent(CharacterSheetPersonalQuestComponent, character);
      component.personalQuest = Object.assign(new PersonalQuest(), {
        edition: 'gh',
        requirements: [
          Object.assign(new PersonalQuestRequirement(), { counter: 1, autotrack: 'loot' }),
          Object.assign(new PersonalQuestRequirement(), { counter: 1 })
        ]
      });

      expect(component.personalQuestRequirementAutotracked(0)).toBe(false);
      character.progress.personalQuestAutotrack = true;
      expect(component.personalQuestRequirementAutotracked(0)).toBe(true);
      expect(component.personalQuestRequirementAutotracked(1)).toBe(false);
    });
  });
  describe('refreshPersonalQuestRetireState', () => {
    it('only triggers auto-retire once on the false -> true edge, not again on repeated calls', () => {
      const character = buildCharacter();
      character.progress.personalQuest = 'PQ1';
      gameManager.game.party.campaignMode = true;
      settingsManager.settings.applyRetirement = true;
      const component = createComponent(CharacterSheetPersonalQuestComponent, character);
      component.personalQuest = Object.assign(new PersonalQuest(), {
        edition: 'gh',
        requirements: [Object.assign(new PersonalQuestRequirement(), { counter: 1 })]
      });
      character.progress.personalQuestProgress = [1];
      const retireSpy = vi.spyOn(component, 'retire').mockImplementation(() => {});

      component.refreshPersonalQuestRetireState();
      component.refreshPersonalQuestRetireState();
      component.refreshPersonalQuestRetireState();

      expect(retireSpy).toHaveBeenCalledTimes(1);
    });

    it('does not trigger auto-retire while requirements stay unmet', () => {
      const character = buildCharacter();
      character.progress.personalQuest = 'PQ1';
      gameManager.game.party.campaignMode = true;
      settingsManager.settings.applyRetirement = true;
      const component = createComponent(CharacterSheetPersonalQuestComponent, character);
      component.personalQuest = Object.assign(new PersonalQuest(), {
        edition: 'gh',
        requirements: [Object.assign(new PersonalQuestRequirement(), { counter: 1 })]
      });
      character.progress.personalQuestProgress = [0];
      const retireSpy = vi.spyOn(component, 'retire').mockImplementation(() => {});

      component.refreshPersonalQuestRetireState();
      component.refreshPersonalQuestRetireState();

      expect(retireSpy).not.toHaveBeenCalled();
    });
  });
});
