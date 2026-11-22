import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { AttackModifier, AttackModifierDeck, AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { EventCardAttack, EventCardAttackTarget, EventCardEffect, EventCardEffectType } from 'src/app/game/model/data/EventCard';
import { OutpostAttackModel, OutpostAttackResource } from 'src/app/game/model/data/OutpostAttack';
import { OutpostAttackComponent } from 'src/app/ui/figures/entities-menu/outpost-attack/outpost-attack';

function createComponent(data: unknown, close: (result?: unknown) => void = () => {}): OutpostAttackComponent {
  TestBed.configureTestingModule({
    imports: [OutpostAttackComponent],
    providers: [
      { provide: DIALOG_DATA, useValue: data },
      { provide: DialogRef, useValue: { close: close, overlayRef: {} } },
      { provide: Dialog, useValue: {} }
    ]
  });
  return TestBed.createComponent(OutpostAttackComponent).componentInstance;
}

describe('OutpostAttackComponent', () => {
  beforeEach(() => {
    gameManager.game.party.outpostAttack = undefined;
    vi.spyOn(gameManager.outpostAttackManager, 'townGuardDeck').mockReturnValue(
      new AttackModifierDeck([new AttackModifier(AttackModifierType.success)])
    );
    vi.spyOn(gameManager.outpostAttackManager, 'buildings').mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    gameManager.game.party.outpostAttack = undefined;
  });

  it('closes without a running outpost attack', () => {
    const close = vi.fn();
    const component = createComponent(undefined, close);
    component.update();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('applies the event effects to the attack values', () => {
    const model = new OutpostAttackModel();
    model.attack = new EventCardAttack(30, 2, new EventCardAttackTarget(false), '', '', []);
    model.effects = [new EventCardEffect(EventCardEffectType.outpostAttack, [5])];
    gameManager.game.party.outpostAttack = model;
    const component = createComponent(undefined);
    component.update();
    expect(component.attack.attackValue).toBe(35);
    expect(model.attack.attackValue).toBe(30);
  });

  it('joins a running outpost attack', () => {
    gameManager.game.party.outpostAttack = Object.assign(new OutpostAttackModel(), { attacks: 1, soldiers: 2 });
    const start = vi.spyOn(gameManager.outpostAttackManager, 'start');
    const component = createComponent(undefined);
    component.update();
    expect(start).not.toHaveBeenCalled();
    expect(component.attacks).toBe(1);
    expect(component.soldiers).toBe(2);
  });

  it('closes once the attack is finished elsewhere', () => {
    gameManager.game.party.outpostAttack = new OutpostAttackModel();
    const close = vi.fn();
    const component = createComponent(undefined, close);
    gameManager.game.party.outpostAttack = undefined;
    component.update();
    component.update();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('finishes the attack with the enabled resources', () => {
    const model = new OutpostAttackModel();
    const resource = new OutpostAttackResource(new EventCardEffect(EventCardEffectType.collectiveResource, [1, 'hide']));
    const disabled = Object.assign(new OutpostAttackResource(new EventCardEffect(EventCardEffectType.collectiveResource, [2, 'metal'])), {
      enabled: false
    });
    model.resources = [resource, disabled];
    gameManager.game.party.outpostAttack = model;
    const close = vi.fn();
    const component = createComponent(undefined, close);
    component.close(true);
    expect(gameManager.game.party.outpostAttack).toBeUndefined();
    expect(close).toHaveBeenCalledWith([resource.effect]);
  });

  it('keeps the attack running on close', () => {
    gameManager.game.party.outpostAttack = new OutpostAttackModel();
    const close = vi.fn();
    const component = createComponent(undefined, close);
    component.close();
    expect(gameManager.game.party.outpostAttack).toBeDefined();
    expect(close).toHaveBeenCalledWith(undefined);
  });
});
