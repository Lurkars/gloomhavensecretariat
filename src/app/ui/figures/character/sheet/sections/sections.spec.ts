import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { GameState } from 'src/app/game/model/Game';
import { CharacterSheetBattleGoalsComponent } from 'src/app/ui/figures/character/sheet/sections/battle-goals';
import { CharacterSheetGoldComponent } from 'src/app/ui/figures/character/sheet/sections/gold';
import { CharacterSheetMasteriesComponent } from 'src/app/ui/figures/character/sheet/sections/masteries';
import { CharacterSheetNameComponent } from 'src/app/ui/figures/character/sheet/sections/name';
import { CharacterSheetSetAsideComponent } from 'src/app/ui/figures/character/sheet/sections/set-aside';
import { CharacterSheetTitleComponent } from 'src/app/ui/figures/character/sheet/sections/title';

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

describe('CharacterSheet sections', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CharacterSheetBattleGoalsComponent,
        CharacterSheetGoldComponent,
        CharacterSheetMasteriesComponent,
        CharacterSheetNameComponent,
        CharacterSheetSetAsideComponent,
        CharacterSheetTitleComponent
      ]
    }).compileComponents();
    resetGame();
  });

  describe('setBattleGoals', () => {
    it('decrements when setting the already-current value', () => {
      const character = buildCharacter();
      const component = createComponent(CharacterSheetBattleGoalsComponent, character);
      character.progress.battleGoals = 5;
      component.setBattleGoals(5);
      expect(character.progress.battleGoals).toEqual(4);
    });

    it('clamps below 0 up to 0', () => {
      const character = buildCharacter();
      const component = createComponent(CharacterSheetBattleGoalsComponent, character);
      component.setBattleGoals(-3);
      expect(character.progress.battleGoals).toEqual(0);
    });

    it('clamps above 18 down to 18', () => {
      const character = buildCharacter();
      const component = createComponent(CharacterSheetBattleGoalsComponent, character);
      component.setBattleGoals(99);
      expect(character.progress.battleGoals).toEqual(18);
    });
  });
  describe('toggleMastery', () => {
    it('adds a mastery index when not already present', () => {
      const character = buildCharacter();
      const component = createComponent(CharacterSheetMasteriesComponent, character);
      component.toggleMastery(2);
      expect(character.progress.masteries).toEqual([2]);
    });

    it('removes a mastery index when already present', () => {
      const character = buildCharacter();
      character.progress.masteries = [2];
      const component = createComponent(CharacterSheetMasteriesComponent, character);
      component.toggleMastery(2);
      expect(character.progress.masteries).toEqual([]);
    });
  });
  describe('toggleCharacterAbsent', () => {
    it('is a no-op for the only character in the party (cannot mark the last character absent)', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      const component = createComponent(CharacterSheetTitleComponent, character);
      component.toggleCharacterAbsent();
      expect(character.absent).toBe(false);
    });

    it('flips absent when another character is present', () => {
      const character = buildCharacter();
      const other = buildCharacter({ name: 'scoundrel' } as any);
      gameManager.game.figures = [character, other];
      const component = createComponent(CharacterSheetTitleComponent, character);
      component.toggleCharacterAbsent();
      expect(character.absent).toBe(true);
    });

    it('un-marks absent even as the only character', () => {
      const character = buildCharacter();
      character.absent = true;
      gameManager.game.figures = [character];
      const component = createComponent(CharacterSheetTitleComponent, character);
      component.toggleCharacterAbsent();
      expect(character.absent).toBe(false);
    });
  });
  describe('donate', () => {
    it('is a no-op before round 0 threshold is met (not enough gold)', () => {
      const character = buildCharacter();
      character.progress.gold = 5;
      const component = createComponent(CharacterSheetGoldComponent, character);
      component.donate();
      expect(character.progress.donations).toEqual(0);
    });

    it('donates 10 gold and increments counters once the threshold is exceeded', () => {
      const character = buildCharacter();
      character.progress.gold = 10;
      gameManager.game.round = 0;
      const component = createComponent(CharacterSheetGoldComponent, character);
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
      const component = createComponent(CharacterSheetGoldComponent, character);
      component.donate();
      expect(character.progress.donations).toEqual(0);
    });
  });
  describe('setAside / replay', () => {
    it('setAside moves the character into party.availableCharacters and removes it from figures', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      const component = createComponent(CharacterSheetSetAsideComponent, character);
      component.setAside();
      expect(gameManager.game.figures).not.toContain(character);
      expect(gameManager.game.party.availableCharacters.length).toEqual(1);
    });

    it('replay is a no-op when the character is not currently in the available pool', () => {
      const character = buildCharacter();
      const component = createComponent(CharacterSheetSetAsideComponent, character);
      component.replayable = false;
      component.replay();
      expect(gameManager.game.figures).not.toContain(character);
    });
  });

  describe('setTitle', () => {
    it('stores a custom title and clears it again when reset to the default name', () => {
      const character = buildCharacter();
      const component = createComponent(CharacterSheetNameComponent, character);
      component.setTitle({ target: { value: 'Grok' } });
      expect(character.title).toEqual('Grok');
      component.setTitle({ target: { value: component.defaultTitle } });
      expect(character.title).toEqual('');
    });
  });
});
