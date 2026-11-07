import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { EventCardEffect, EventCardEffectType } from 'src/app/game/model/data/EventCard';
import { EventDistributionDialogComponent } from 'src/app/ui/figures/event/distribution/event-distribution-dialog';

// Only the constructor (buildEntries) is exercised; fixture.detectChanges() is never called.
function create(effects: EventCardEffect[]): EventDistributionDialogComponent {
  TestBed.configureTestingModule({
    imports: [EventDistributionDialogComponent],
    providers: [
      { provide: DialogRef, useValue: { close: () => {} } },
      { provide: Dialog, useValue: {} },
      { provide: DIALOG_DATA, useValue: { effects } }
    ]
  });
  return TestBed.createComponent(EventDistributionDialogComponent).componentInstance;
}

describe('EventDistributionDialogComponent', () => {
  it('adds up collective resources of the same type', () => {
    const dialog = create([
      new EventCardEffect(EventCardEffectType.collectiveResource, [1, 'hide']),
      new EventCardEffect(EventCardEffectType.collectiveResource, [1, 'hide'])
    ]);
    expect(dialog.receiveEntries).toEqual([{ type: 'hide', total: 2 }]);
    expect(dialog.receiveGlobalTotal).toBeUndefined();
  });

  it('merges specific resources into any material resources', () => {
    const dialog = create([
      new EventCardEffect(EventCardEffectType.collectiveResource, [1, 'hide']),
      new EventCardEffect(EventCardEffectType.collectiveResourceType, [2, 'material_resources'])
    ]);
    expect(dialog.receiveEntries).toEqual([
      { type: 'hide', total: 3 },
      { type: 'lumber', total: 2 },
      { type: 'metal', total: 2 }
    ]);
    expect(dialog.receiveGlobalTotal).toBe(3);
  });

  it('adds up shown effects per effect and category', () => {
    const dialog = create([
      new EventCardEffect(EventCardEffectType.collectiveResource, [1, 'hide']),
      new EventCardEffect(EventCardEffectType.collectiveResourceType, [2, 'material_resources']),
      new EventCardEffect(EventCardEffectType.collectiveResource, [1, 'hide']),
      new EventCardEffect(EventCardEffectType.collectiveResource, [1, 'lumber']),
      new EventCardEffect(EventCardEffectType.collectiveResourceType, [2, 'material_resources'])
    ]);
    expect(dialog.summedEffects).toEqual([
      new EventCardEffect(EventCardEffectType.collectiveResource, [2, 'hide']),
      new EventCardEffect(EventCardEffectType.collectiveResource, [1, 'lumber']),
      new EventCardEffect(EventCardEffectType.collectiveResourceType, [4, 'material_resources'])
    ]);
    expect(dialog.effects[0].values[0]).toBe(1);
  });
});
