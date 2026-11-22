import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { storageManager } from 'src/app/game/businesslogic/StorageManager';
import { resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { ScenarioTreasuresDialogComponent } from 'src/app/ui/footer/scenario/treasures/treasures-dialog';

// ScenarioTreasuresDialogComponent is created via TestBed with fixed dialog data, without rendering the template.

describe('ScenarioTreasuresDialogComponent', () => {
  let character: Character;

  beforeEach(async () => {
    resetTestGame();
    vi.spyOn(storageManager, 'writeGameModel').mockResolvedValue(undefined);
    vi.spyOn(storageManager, 'writeArray').mockResolvedValue(undefined);
    vi.spyOn(storageManager, 'append').mockResolvedValue(undefined as any);
    vi.spyOn(gameManager, 'triggerUiChange').mockImplementation(() => undefined);
    vi.spyOn(gameManager.stateManager, 'autoBackup').mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      imports: [ScenarioTreasuresDialogComponent],
      providers: [
        { provide: DialogRef, useValue: { close: vi.fn() } },
        { provide: DIALOG_DATA, useValue: { treasures: [12, 'G'], edition: 'fh' } }
      ]
    }).compileComponents();
    character = new Character(Object.assign(new CharacterData(), { name: 'brute', edition: 'fh', stats: [new CharacterStat(1, 10)] }), 1);
    gameManager.game.figures = [character];
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.className = '';
  });

  function createComponent(): ScenarioTreasuresDialogComponent {
    return TestBed.createComponent(ScenarioTreasuresDialogComponent).componentInstance;
  }

  it('removing a treasure with applied rewards un-loots it for the party', () => {
    character.treasures = ['12:15'];
    gameManager.game.party.treasures = [new Identifier('12', 'fh')];
    const before = vi.spyOn(gameManager.stateManager, 'before');

    createComponent().removeTreasure(character, '12:15');

    expect(character.treasures).toEqual([]);
    expect(gameManager.game.party.treasures).toEqual([]);
    expect(before.mock.calls[0][1]).toBe('12');
  });

  it('removing a plain numbered treasure un-loots it for the party', () => {
    character.treasures = [12];
    gameManager.game.party.treasures = [new Identifier('12', 'fh')];

    createComponent().removeTreasure(character, 12);

    expect(character.treasures).toEqual([]);
    expect(gameManager.game.party.treasures).toEqual([]);
  });

  it('removing a goal treasure keeps the numbered party treasures', () => {
    character.treasures = ['G-1', 12];
    gameManager.game.party.treasures = [new Identifier('12', 'fh')];

    createComponent().removeTreasure(character, 'G-1');

    expect(character.treasures).toEqual([12]);
    expect(gameManager.game.party.treasures.length).toBe(1);
  });
});
