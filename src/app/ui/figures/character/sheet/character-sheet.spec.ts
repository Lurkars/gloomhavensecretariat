import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { GameState } from 'src/app/game/model/Game';
import { CharacterSheetComponent } from 'src/app/ui/figures/character/sheet/character-sheet';

function buildCharacter(overrides: Partial<CharacterData> = {}): Character {
  const data = Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] }, overrides);
  return new Character(data, 1);
}

describe('CharacterSheetComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CharacterSheetComponent] }).compileComponents();
    gameManager.game.figures = [];
    gameManager.game.state = GameState.draw;
    gameManager.game.round = 0;
    gameManager.game.scenario = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the classic sheet without throwing', () => {
    const fixture = TestBed.createComponent(CharacterSheetComponent);
    fixture.componentRef.setInput('character', buildCharacter());
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.componentInstance.sheet).toEqual('gh');
    expect(fixture.nativeElement.querySelector('ghs-character-sheet-gh')).not.toBeNull();
  });

  it('renders the frosthaven sheet with frosthaven rules', () => {
    vi.spyOn(gameManager, 'fhRules').mockReturnValue(true);
    const fixture = TestBed.createComponent(CharacterSheetComponent);
    fixture.componentRef.setInput('character', buildCharacter());
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.nativeElement.querySelector('ghs-character-sheet-fh')).not.toBeNull();
  });

  it('renders the rpg sheet for rpg characters', () => {
    vi.spyOn(gameManager.attackModifierManager, 'isRpgCharacter').mockReturnValue(true);
    const fixture = TestBed.createComponent(CharacterSheetComponent);
    fixture.componentRef.setInput('character', buildCharacter());
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.componentInstance.sheet).toEqual('rpg');
    expect(fixture.nativeElement.querySelector('ghs-character-sheet-rpg')).not.toBeNull();
  });

  describe('toggleFhSheet', () => {
    it('switches between the classic and the frosthaven layout', () => {
      const fixture = TestBed.createComponent(CharacterSheetComponent);
      fixture.componentRef.setInput('character', buildCharacter());
      fixture.detectChanges();
      fixture.componentInstance.toggleFhSheet();
      expect(fixture.componentInstance.sheet).toEqual('fh');
      fixture.componentInstance.toggleFhSheet();
      expect(fixture.componentInstance.sheet).toEqual('gh');
    });
  });
});
