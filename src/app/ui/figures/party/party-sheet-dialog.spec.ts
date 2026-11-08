import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { PartySheetDialogComponent } from 'src/app/ui/figures/party/party-sheet-dialog';

function createComponent(data: any = {}): PartySheetDialogComponent {
  TestBed.overrideProvider(DIALOG_DATA, { useValue: data });
  const fixture = TestBed.createComponent(PartySheetDialogComponent);
  return fixture.componentInstance;
}

describe('PartySheetDialogComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartySheetDialogComponent],
      providers: [
        { provide: DIALOG_DATA, useValue: {} },
        { provide: DialogRef, useValue: { closed: { subscribe: () => {} }, close: () => {} } }
      ]
    }).compileComponents();

    gameManager.game.figures = [];
    gameManager.game.edition = 'gh';
    gameManager.game.party.edition = undefined;
    gameManager.game.party.conclusions = [];
    gameManager.game.party.scenarios = [];
    gameManager.game.party.retirements = [];
    gameManager.editionData = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('constructs successfully from a minimal DIALOG_DATA payload', () => {
    expect(createComponent()).toBeTruthy();
  });

  it('renders the classic party sheet layout', () => {
    const fixture = TestBed.createComponent(PartySheetDialogComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.componentInstance.sheet).toEqual('gh');
    expect(fixture.nativeElement.querySelector('ghs-party-sheet-gh')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('ghs-party-sheet-menu')).not.toBeNull();
  });

  it('renders the frosthaven layout with frosthaven rules', () => {
    vi.spyOn(gameManager, 'fhRules').mockReturnValue(true);
    const fixture = TestBed.createComponent(PartySheetDialogComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.nativeElement.querySelector('ghs-party-sheet-fh')).not.toBeNull();
  });

  it('renders the gh2e layout with gh2e rules', () => {
    vi.spyOn(gameManager, 'gh2eRules').mockReturnValue(true);
    const fixture = TestBed.createComponent(PartySheetDialogComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.nativeElement.querySelector('ghs-party-sheet-gh2e')).not.toBeNull();
  });

  it('renders the campaign layout when opened for the campaign', () => {
    TestBed.overrideProvider(DIALOG_DATA, { useValue: { campaign: true } });
    const fixture = TestBed.createComponent(PartySheetDialogComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.nativeElement.querySelector('ghs-party-sheet-campaign')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('ghs-party-sheet-menu')).toBeNull();
  });

  it('opens the campaign for jotl unless the party sheet was requested', () => {
    gameManager.game.edition = 'jotl';
    expect(createComponent().campaign).toBe(true);
  });

  describe('toggleFhSheet', () => {
    it('switches between the classic and the frosthaven sheet', () => {
      const fixture = TestBed.createComponent(PartySheetDialogComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      component.toggleFhSheet();
      expect(component.sheet).toEqual('fh');
      component.toggleFhSheet();
      expect(component.sheet).toEqual('gh');
    });
  });
});
