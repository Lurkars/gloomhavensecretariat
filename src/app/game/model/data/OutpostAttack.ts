import { EventCardAttack, EventCardAttackTarget, EventCardEffect } from 'src/app/game/model/data/EventCard';

export class OutpostAttackResource {
  effect: EventCardEffect;
  enabled: boolean = true;

  constructor(effect: EventCardEffect) {
    this.effect = effect;
  }
}

export class OutpostAttackModel {
  attack: EventCardAttack | undefined;
  effects: EventCardEffect[] = [];
  manualAttackValue: number = 50;
  manualTargetNumber: number = 4;
  target: EventCardAttackTarget = new EventCardAttackTarget();
  // building names in attack order
  buildings: string[] = [];
  others: string[] = [];
  attacks: number = 0;
  soldiers: number = 0;
  drawnBefore: number = -1;
  // index of the town guard card used as result, -1 without result
  attackResult: number = -1;
  resources: OutpostAttackResource[] = [];
}
