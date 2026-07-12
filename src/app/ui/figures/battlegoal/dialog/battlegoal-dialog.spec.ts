import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { BattleGoal } from 'src/app/game/model/data/BattleGoal';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { CharacterBattleGoalsDialog } from 'src/app/ui/figures/battlegoal/dialog/battlegoal-dialog';

// CharacterBattleGoalsDialog's constructor opens a BattleGoalSetupDialog immediately if the edition
// has zero configured battle goals — since that's a dialog-driven flow, this spec always sets up at
// least one battle goal in editionData and passes draw=false, landing in the safe `else { this.update() }`
// branch. Following the AppComponent.spec.ts pattern: create via TestBed, never call
// fixture.detectChanges(), and call methods directly. drawCards()/setup() (both dialog-adjacent) are
// out of scope; select()/accept()/cancel()/drawCard()/update() are covered.

function buildCharacter(): Character {
  const data = Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] });
  return new Character(data, 1);
}

function createComponent(character: Character, overrides: Record<string, any> = {}): CharacterBattleGoalsDialog {
  TestBed.configureTestingModule({
    imports: [CharacterBattleGoalsDialog],
    providers: [
      { provide: DIALOG_DATA, useValue: { character, draw: false, cardOnly: false, ...overrides } },
      { provide: DialogRef, useValue: { close: () => {} } },
      { provide: Dialog, useValue: {} }
    ]
  });
  const fixture = TestBed.createComponent(CharacterBattleGoalsDialog);
  return fixture.componentInstance;
}

describe('CharacterBattleGoalsDialog', () => {
  beforeEach(() => {
    gameManager.game.figures = [];
    gameManager.game.edition = 'gh';
    gameManager.game.battleGoalEditions = [];
    gameManager.roundManager.firstRound = true;
    settingsManager.settings.editions = ['gh'];
    settingsManager.settings.animations = false;
    gameManager.editionData = [
      Object.assign(
        new EditionData('gh', [], [], [], [], [], [], undefined, [Object.assign(new BattleGoal(), { name: 'bg1', edition: 'gh' })])
      )
    ];
  });

  it('constructs without opening the setup dialog when battle goals already exist', () => {
    const character = buildCharacter();
    const component = createComponent(character);
    expect(component).toBeTruthy();
    expect(component.available).toEqual(1);
  });

  describe('update', () => {
    it('resolves the character battleGoals identifiers into BattleGoal objects', () => {
      const character = buildCharacter();
      character.battleGoals = [new Identifier('bg1', 'gh')];
      const component = createComponent(character);
      expect(component.battleGoals.map((bg) => bg.name)).toEqual(['bg1']);
    });

    it('marks index 0 as revealed once the character has an active battle goal', () => {
      const character = buildCharacter();
      character.battleGoal = true;
      const component = createComponent(character);
      expect(component.revealed).toContain(0);
    });
  });

  describe('select', () => {
    it('selects the given index and records it as revealed', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      component.select(1);
      expect(component.selected).toEqual(1);
      expect(component.revealed).toContain(1);
    });

    it('deselects when selecting the already-selected index', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      component.select(1);
      component.select(1);
      expect(component.selected).toEqual(-1);
    });

    it('is a no-op when cardOnly is set', () => {
      const character = buildCharacter();
      const component = createComponent(character, { cardOnly: true });
      component.select(1);
      expect(component.selected).toEqual(-1);
    });
  });

  describe('accept', () => {
    it('sets battleGoal true and moves the selected index to the front', () => {
      const character = buildCharacter();
      character.battleGoals = [new Identifier('bg1', 'gh'), new Identifier('bg2', 'gh')];
      const component = createComponent(character);
      component.select(1);
      component.accept();
      expect(character.battleGoal).toBe(true);
      expect(character.battleGoals[0].name).toEqual('bg2');
    });

    it('deselects battleGoal when selected is -1 and the character had one active', () => {
      const character = buildCharacter();
      character.battleGoal = true;
      const component = createComponent(character);
      component.selected = -1;
      component.accept();
      expect(character.battleGoal).toBe(false);
    });
  });

  describe('cancel', () => {
    it('resets selected to 0 when the character already has an active battle goal', () => {
      const character = buildCharacter();
      character.battleGoal = true;
      const component = createComponent(character);
      component.selected = 5;
      component.cancel();
      expect(component.selected).toEqual(0);
    });

    it('resets selected to -1 without an active battle goal', () => {
      const character = buildCharacter();
      character.battleGoal = false;
      const component = createComponent(character);
      component.selected = 5;
      component.cancel();
      expect(component.selected).toEqual(-1);
    });
  });

  describe('drawCard', () => {
    it('is a no-op once no unrevealed battle goals remain', () => {
      const character = buildCharacter();
      const otherCharacter = buildCharacter();
      otherCharacter.battleGoals = [new Identifier('bg1', 'gh')];
      gameManager.game.figures = [otherCharacter];
      const component = createComponent(character);
      component.drawCard();
      expect(character.battleGoals).toEqual([]);
    });
  });
});
