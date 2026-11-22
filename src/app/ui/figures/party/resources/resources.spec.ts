import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { LootType } from 'src/app/game/model/data/Loot';
import { PartyResourcesDialogComponent } from 'src/app/ui/figures/party/resources/resources';

// PartyResourcesDialogComponent edits copies of the party and characters, created via TestBed without rendering the template.

describe('PartyResourcesDialogComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartyResourcesDialogComponent],
      providers: [
        { provide: DialogRef, useValue: { disableClose: true, close: vi.fn() } },
        { provide: Dialog, useValue: { open: vi.fn() } }
      ]
    }).compileComponents();
    gameManager.game.figures = [];
    gameManager.game.party.loot = { [LootType.hide]: 2 };
  });

  afterEach(() => {
    gameManager.game.party.loot = {};
  });

  it('the total follows edited party resources before applying', () => {
    const component = TestBed.createComponent(PartyResourcesDialogComponent).componentInstance;
    component.ngOnInit();
    expect(component.total[LootType.hide]).toBe(2);

    component.changeLoot(undefined, LootType.hide, { target: { value: '5' } });

    expect(component.total[LootType.hide]).toBe(5);
    expect(gameManager.game.party.loot[LootType.hide]).toBe(2);
  });
});
