import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { GameState } from 'src/app/game/model/Game';
import { CharacterInitiativeComponent } from 'src/app/ui/figures/character/cards/initiative';

// CharacterInitiativeComponent's viewChild.required('initiativeInput') throws (NG0951) if read
// before the view initializes, which never happens here since we never call
// fixture.detectChanges() (per the AppComponent.spec.ts pattern). That rules out
// enableReveal()/open()/ngAfterViewInit, which all read it — this spec sticks to
// updateInitiative()/setInitiative()/disableReveal()/longRestOff()/tabindex()/ngOnChanges(), none of
// which touch the viewChild.

function buildCharacter(name: string = 'brute'): Character {
  const data = Object.assign(new CharacterData(), { name, edition: 'gh', stats: [new CharacterStat(1, 10)] });
  return new Character(data, 1);
}

function createComponent(figure: Character): CharacterInitiativeComponent {
  const fixture = TestBed.createComponent(CharacterInitiativeComponent);
  fixture.componentRef.setInput('figure', figure);
  return fixture.componentInstance;
}

describe('CharacterInitiativeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CharacterInitiativeComponent] }).compileComponents();

    gameManager.game.figures = [];
    gameManager.game.state = GameState.draw;
    settingsManager.settings.initiativeRequired = true;
  });

  describe('ngOnChanges', () => {
    it('resolves the character reference and refreshes display fields', () => {
      const character = buildCharacter();
      character.initiative = 5;
      const component = createComponent(character);
      component.ngOnInit();
      component.ngOnChanges({ initiative: { currentValue: 5, previousValue: -1, firstChange: true, isFirstChange: () => true } });
      expect(component.character).toBe(character);
      expect(component.initiativeValue).toEqual('05');
    });

    it('marks initiative hidden during draw while not yet revealed', () => {
      const character = buildCharacter();
      character.initiative = 5;
      character.initiativeVisible = false;
      const component = createComponent(character);
      component.ngOnInit();
      component.ngOnChanges({ initiative: { currentValue: 5, previousValue: -1, firstChange: true, isFirstChange: () => true } });
      expect(component.hidden).toBe(true);
    });
  });

  describe('updateInitiative', () => {
    it('applies a valid initiative value from the input event', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      component.updateInitiative({ target: { value: '5' } });
      expect(character.initiative).toEqual(5);
    });

    it('resets the input back to the current value when out of range', () => {
      const character = buildCharacter();
      character.initiative = 7;
      const component = createComponent(character);
      const event = { target: { value: '150' } };
      component.updateInitiative(event);
      expect(event.target.value).toEqual('07');
      expect(character.initiative).toEqual(7);
    });

    it('cancels an active reveal before applying the new value', () => {
      const character = buildCharacter();
      character.initiative = 5;
      const component = createComponent(character);
      component.reveal = 5;
      component.updateInitiative({ target: { value: '3' } });
      expect(component.reveal).toEqual(0);
    });
  });

  describe('setInitiative', () => {
    it('updates the figure initiative and marks it visible for a character', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      component.ngOnInit();
      component.setInitiative(6);
      expect(character.initiative).toEqual(6);
      expect(character.initiativeVisible).toBe(true);
    });

    it('sets longRest true for initiative 99', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      component.ngOnInit();
      component.setInitiative(99);
      expect(character.longRest).toBe(true);
    });

    it('is a no-op when initiative is unchanged', () => {
      const character = buildCharacter();
      character.initiative = 5;
      const component = createComponent(character);
      component.ngOnInit();
      character.initiativeVisible = false;
      component.setInitiative(5);
      expect(character.initiativeVisible).toBe(false);
    });

    it('rejects initiative 0 while initiativeRequired is on outside of draw', () => {
      const character = buildCharacter();
      character.initiative = 5;
      gameManager.game.state = GameState.next;
      const component = createComponent(character);
      component.ngOnInit();
      component.setInitiative(0);
      expect(character.initiative).toEqual(5);
    });
  });

  describe('disableReveal', () => {
    it('restores the hidden initiative value', () => {
      const character = buildCharacter();
      const component = createComponent(character);
      component.reveal = 8;
      character.initiative = 0;
      component.disableReveal();
      expect(character.initiative).toEqual(8);
      expect(component.reveal).toEqual(0);
    });

    it('is a no-op when nothing is being revealed', () => {
      const character = buildCharacter();
      character.initiative = 3;
      const component = createComponent(character);
      component.reveal = 0;
      component.disableReveal();
      expect(character.initiative).toEqual(3);
    });
  });

  describe('longRestOff', () => {
    it('clears longRest for the character', () => {
      const character = buildCharacter();
      character.longRest = true;
      const component = createComponent(character);
      component.ngOnInit();
      component.longRestOff({ preventDefault: () => {} });
      expect(character.longRest).toBe(false);
    });

    it('is a no-op when longRest is already off', () => {
      const character = buildCharacter();
      character.longRest = false;
      const component = createComponent(character);
      component.ngOnInit();
      expect(() => component.longRestOff({ preventDefault: () => {} })).not.toThrow();
    });
  });

  describe('tabindex', () => {
    it('reflects the figure position among eligible characters', () => {
      const characterA = buildCharacter('brute');
      const characterB = buildCharacter('scoundrel');
      gameManager.game.figures = [characterA, characterB];
      const component = createComponent(characterB);
      component.ngOnInit();
      expect(component.tabindex()).toEqual(1);
    });

    it('is -1 when the figure is not eligible (e.g. absent)', () => {
      const character = buildCharacter();
      character.absent = true;
      gameManager.game.figures = [character];
      const component = createComponent(character);
      component.ngOnInit();
      expect(component.tabindex()).toEqual(-1);
    });
  });
});
