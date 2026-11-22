import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { EventCard, EventCardIdentifier, EventCardResult } from 'src/app/game/model/data/EventCard';
import { EventCardDeckComponent } from 'src/app/ui/figures/event/deck/event-card-deck';

// Covers the resolved list handling of stored event results (selection, checked boxes, show dialog),
// the template is not rendered.

describe('EventCardDeckComponent', () => {
  const dialog = { open: vi.fn() };

  function createComponent(): EventCardDeckComponent {
    return TestBed.createComponent(EventCardDeckComponent).componentInstance;
  }

  beforeEach(async () => {
    dialog.open.mockReset();
    await TestBed.configureTestingModule({
      imports: [EventCardDeckComponent],
      providers: [
        { provide: DialogRef, useValue: { close: vi.fn() } },
        { provide: Dialog, useValue: dialog },
        { provide: DIALOG_DATA, useValue: { edition: 'fh', type: 'summer-outpost' } }
      ]
    }).compileComponents();
    gameManager.game.party.eventCards = [];
    vi.spyOn(gameManager.stateManager, 'before').mockImplementation(() => {});
    vi.spyOn(gameManager.stateManager, 'after').mockImplementation(async () => {});
  });

  afterEach(() => vi.restoreAllMocks());

  function identifier(): EventCardIdentifier {
    return new EventCardIdentifier('SO-26', 'fh', 'summer-outpost', 0, [], [0, 1], true, false);
  }

  it('checking a box of a resolved event keeps its selection and stores the checks', () => {
    const component = createComponent();
    const id = identifier();

    component.updateDrawnSelect(id, new EventCardResult(0, [], [0, 2], true));

    expect(id.selected).toEqual(0);
    expect(id.checks).toEqual([0, 2]);
    expect(gameManager.stateManager.after).toHaveBeenCalled();
  });

  it('resetting the selection keeps the checked boxes', () => {
    const component = createComponent();
    const id = identifier();

    component.updateDrawnSelect(id);

    expect(id.selected).toEqual(-1);
    expect(id.checks).toEqual([0, 1]);
  });

  it('applies changes made in the show dialog of a resolved event', () => {
    dialog.open.mockReturnValue({ closed: of(new EventCardResult(0, [], [0, 3], true)) });
    const component = createComponent();
    const id = identifier();

    component.showEventCard(new EventCard('SO-26', 'fh', 'summer-outpost', '', '', []), id);

    expect(id.checks).toEqual([0, 3]);
  });
});
