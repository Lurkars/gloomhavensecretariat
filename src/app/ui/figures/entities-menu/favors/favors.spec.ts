import { DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { gameManager, labelManager, storageManager } from 'src/app/game/businesslogic/Managers';
import { createTestEdition, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { Favor } from 'src/app/game/model/data/Trials';
import { FavorsComponent } from 'src/app/ui/figures/entities-menu/favors/favors';

// FavorsComponent is created via TestBed without rendering the template, the favor selection is driven
// through its public methods (forced, so the first round check does not apply).

describe('FavorsComponent', () => {
  const knowledge = Object.assign(new Favor(), { name: 'knowledge', edition: 'test', points: 1 });

  beforeEach(async () => {
    resetTestGame();
    vi.spyOn(storageManager, 'writeGameModel').mockResolvedValue(undefined);
    vi.spyOn(storageManager, 'writeArray').mockResolvedValue(undefined);
    vi.spyOn(storageManager, 'append').mockResolvedValue(undefined as any);
    vi.spyOn(gameManager, 'triggerUiChange').mockImplementation(() => undefined);
    vi.spyOn(gameManager.stateManager, 'autoBackup').mockResolvedValue(undefined);
    createTestEdition({ favors: [knowledge] });
    vi.spyOn(gameManager.editionManager, 'currentEdition').mockReturnValue('test');
    await TestBed.configureTestingModule({
      imports: [FavorsComponent],
      providers: [{ provide: DialogRef, useValue: { close: vi.fn() } }]
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    labelManager.label = {};
    document.body.className = '';
  });

  function createComponent(): FavorsComponent {
    const component = TestBed.createComponent(FavorsComponent).componentInstance;
    component.ngOnInit();
    return component;
  }

  it('keeps enough removed cards to pay for the selected favors', () => {
    const component = createComponent();
    component.addSpentPoints(1, true);
    component.addSpentPoints(2, true);
    component.selectFavor(knowledge, true);

    component.apply();

    expect(gameManager.game.favors.map((favor) => favor.name)).toEqual(['knowledge']);
    expect(gameManager.game.favorPoints).toEqual([1]);
  });

  it('keeps the -2 card removed when it pays for a 1-point favor', () => {
    const component = createComponent();
    component.addSpentPoints(2, true);
    component.selectFavor(knowledge, true);

    component.apply();

    expect(gameManager.game.favorPoints).toEqual([2]);
  });
});
