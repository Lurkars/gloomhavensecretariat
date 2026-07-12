import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Ability } from 'src/app/game/model/data/Ability';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { DeckData } from 'src/app/game/model/data/DeckData';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { AbilityCardsDialogComponent } from 'src/app/ui/figures/character/sheet/abilities/ability-cards-dialog';

// AbilityCardsDialogComponent's constructor does real work eagerly (unlike its ngOnInit-driven
// sibling AbiltiesDialogComponent): it resolves the character's ability deck and computes
// additionalLevels right away, then subscribes to dialogRef.closed. Following the
// AppComponent.spec.ts pattern: create via TestBed, never call fixture.detectChanges() (ngOnInit
// never runs — we call update() directly where needed). toggleEnhanced()/clickAbility()'s
// no-existing-enhancements / non-deck branches open dialogs (EnhancementDialogComponent/
// AbilityDialogComponent) and are avoided here by pre-populating character.progress.enhancements or
// exercising only the toggleDeck() branch, per the researched gotchas for this component.

function buildAbilities(): Ability[] {
  return [
    new Ability(1, undefined, 0, [], false, [], 1),
    Object.assign(new Ability(2), { level: 'X' }),
    new Ability(3, undefined, 0, [], false, [], 2),
    new Ability(4, undefined, 0, [], false, [], 3)
  ];
}

function buildCharacter(level: number = 2): Character {
  const data = Object.assign(new CharacterData(), {
    name: 'brute',
    edition: 'gh',
    stats: [new CharacterStat(1, 10), new CharacterStat(2, 12), new CharacterStat(3, 14)]
  });
  const character = new Character(data, level);
  character.progress.deck = [];
  return character;
}

function createComponent(character: Character, abilities: Ability[]): AbilityCardsDialogComponent {
  gameManager.editionData = [new EditionData('gh', [], [], [new DeckData('gh', 'brute', true, abilities)], [], [], [])];
  TestBed.configureTestingModule({
    imports: [AbilityCardsDialogComponent],
    providers: [
      { provide: DIALOG_DATA, useValue: { character } },
      { provide: DialogRef, useValue: { closed: { subscribe: () => {} } } },
      { provide: Dialog, useValue: {} }
    ]
  });
  const fixture = TestBed.createComponent(AbilityCardsDialogComponent);
  return fixture.componentInstance;
}

describe('AbilityCardsDialogComponent', () => {
  beforeEach(() => {
    gameManager.game.figures = [];
    settingsManager.settings.editions = ['gh'];
  });

  it('renders the template without throwing', () => {
    const character = buildCharacter();
    gameManager.editionData = [new EditionData('gh', [], [], [new DeckData('gh', 'brute', true, buildAbilities())], [], [], [])];
    TestBed.configureTestingModule({
      imports: [AbilityCardsDialogComponent],
      providers: [
        { provide: DIALOG_DATA, useValue: { character } },
        { provide: DialogRef, useValue: { closed: { subscribe: () => {} } } },
        { provide: Dialog, useValue: {} }
      ]
    });
    const fixture = TestBed.createComponent(AbilityCardsDialogComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('constructor', () => {
    it('resolves the ability deck and computes additionalLevels for special string/high-numeric levels', () => {
      const abilities = [
        ...buildAbilities(),
        Object.assign(new Ability(5), { level: '9-1' }),
        new Ability(6, undefined, 0, [], false, [], 10)
      ];
      const character = buildCharacter();
      const component = createComponent(character, abilities);
      expect(component.abilities.length).toEqual(6);
      expect(component.additionalLevels).toEqual(['9-1', 10]);
    });
  });

  describe('update (picking mode: cardsToPick > 0)', () => {
    it('computes cardsToPick/levelToPick and the level-limited visible/small ability sets', () => {
      const character = buildCharacter(2);
      const component = createComponent(character, buildAbilities());
      component.update();
      expect(component.cardsToPick).toEqual(1);
      expect(component.levelToPick).toEqual(2);
      expect(component.visibleAbilities.map((a) => a.cardId)).toEqual([3]);
      expect(component.smallAbilities.map((a) => a.cardId).sort()).toEqual([1, 2]);
    });
  });

  describe('update (deck-view mode: cardsToPick === 0)', () => {
    it('filters by the current level/exclusiveLevel and marks the character as editing abilities', () => {
      const character = buildCharacter(2);
      character.progress.deck = [2];
      const component = createComponent(character, buildAbilities());
      component.update();
      expect(component.levelToPick).toEqual(0);
      expect(component.character.tags).toContain('edit-abilities');
    });
  });

  describe('setLevel', () => {
    it('sets level and clears exclusiveLevel by default', () => {
      const character = buildCharacter(2);
      const component = createComponent(character, buildAbilities());
      component.setLevel(3);
      expect(component.level).toEqual(3);
      expect(component.exclusiveLevel).toBeUndefined();
    });

    it('sets exclusiveLevel when exclusive is requested', () => {
      const character = buildCharacter(2);
      const component = createComponent(character, buildAbilities());
      component.setLevel(3, true);
      expect(component.exclusiveLevel).toEqual(3);
    });
  });

  describe('undoLastCard / resetDeck', () => {
    it('undoLastCard removes the most recently picked card', () => {
      const character = buildCharacter(3);
      character.progress.deck = [2, 3];
      const component = createComponent(character, buildAbilities());
      component.undoLastCard();
      expect(character.progress.deck).toEqual([2]);
    });

    it('resetDeck clears the whole deck', () => {
      const character = buildCharacter(3);
      character.progress.deck = [2, 3];
      const component = createComponent(character, buildAbilities());
      component.resetDeck();
      expect(character.progress.deck).toEqual([]);
    });
  });

  describe('togglePick', () => {
    it('flips the deck flag', () => {
      const character = buildCharacter(2);
      const component = createComponent(character, buildAbilities());
      component.deck = true;
      component.togglePick();
      expect(component.deck).toBe(false);
    });
  });

  describe('toggleDeck', () => {
    it('adds an eligible ability to the deck', () => {
      const character = buildCharacter(2);
      const abilities = buildAbilities();
      const component = createComponent(character, abilities);
      component.update();
      component.toggleDeck(abilities[2]);
      expect(character.progress.deck).toContain(2);
    });

    it('removes an ability already in the deck', () => {
      const character = buildCharacter(2);
      character.progress.deck = [2];
      const abilities = buildAbilities();
      const component = createComponent(character, abilities);
      component.update();
      component.toggleDeck(abilities[2]);
      expect(character.progress.deck).not.toContain(2);
    });

    it('is a no-op for an ability above the pickable level without force', () => {
      const character = buildCharacter(2);
      const abilities = buildAbilities();
      const component = createComponent(character, abilities);
      component.update();
      component.toggleDeck(abilities[3]);
      expect(character.progress.deck).not.toContain(3);
    });
  });

  describe('toggleEnhanced', () => {
    it('flips the enhanced flag when the character already has enhancements', () => {
      const character = buildCharacter(2);
      character.progress.enhancements = [{ cardId: 1 } as any];
      const component = createComponent(character, buildAbilities());
      component.enhanced = false;
      component.toggleEnhanced();
      expect(component.enhanced).toBe(true);
    });
  });
});
