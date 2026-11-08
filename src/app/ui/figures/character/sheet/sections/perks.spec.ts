import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { Perk, PerkType } from 'src/app/game/model/data/Perks';
import { GameState } from 'src/app/game/model/Game';
import { CharacterSheetPerksComponent } from 'src/app/ui/figures/character/sheet/sections/perks';

function buildCharacter(): Character {
  const data = Object.assign(new CharacterData(), {
    name: 'brute',
    edition: 'gh',
    stats: [new CharacterStat(1, 10)],
    perks: [Object.assign(new Perk(), { type: PerkType.add, count: 1 })]
  });
  const character = new Character(data, 1);
  character.progress.perks = [0];
  return character;
}

function createComponent(character: Character, availablePerks: number = 0, forceEdit: boolean = false): CharacterSheetPerksComponent {
  const fixture = TestBed.createComponent(CharacterSheetPerksComponent);
  fixture.componentRef.setInput('character', character);
  fixture.componentRef.setInput('forceEdit', forceEdit);
  fixture.componentInstance.availablePerks = availablePerks;
  return fixture.componentInstance;
}

describe('CharacterSheetPerksComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CharacterSheetPerksComponent] }).compileComponents();
    gameManager.game.figures = [];
    gameManager.game.state = GameState.draw;
    gameManager.game.round = 0;
    settingsManager.settings.characterSheetLocked = false;
  });

  it('renders the perk list without throwing', () => {
    const fixture = TestBed.createComponent(CharacterSheetPerksComponent);
    fixture.componentRef.setInput('character', buildCharacter());
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('cycles a perk value up to its max count then back to 0', () => {
    const character = buildCharacter();
    const component = createComponent(character, 5);
    component.togglePerk(0);
    expect(character.progress.perks[0]).toEqual(1);
    component.togglePerk(0);
    expect(character.progress.perks[0]).toEqual(0);
  });

  it('addPerk is blocked once the round has started unless forced', () => {
    const character = buildCharacter();
    gameManager.game.round = 1;
    gameManager.game.state = GameState.next;
    const component = createComponent(character, 5);
    component.addPerk(0, 1);
    expect(character.progress.perks[0]).toEqual(0);
    component.addPerk(0, 1, true);
    expect(character.progress.perks[0]).toEqual(1);
  });

  it('addPerk is blocked without available perks unless forced', () => {
    const character = buildCharacter();
    const component = createComponent(character, 0);
    component.addPerk(0, 1);
    expect(character.progress.perks[0]).toEqual(0);
    component.addPerk(0, 1, true);
    expect(character.progress.perks[0]).toEqual(1);
  });
});
