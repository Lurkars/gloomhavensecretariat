import {
  AttackModifier,
  AttackModifierDeck,
  AttackModifierEffect,
  AttackModifierEffectType,
  AttackModifierType
} from 'src/app/game/model/data/AttackModifier';
import { EventCardEffect, EventCardEffectType } from 'src/app/game/model/data/EventCard';
import { OutpostAttackComponent } from 'src/app/ui/figures/entities-menu/outpost-attack/outpost-attack';

// addResources() only uses instance fields, so the dialog dependencies are skipped.
function component(): OutpostAttackComponent {
  const instance = Object.create(OutpostAttackComponent.prototype) as OutpostAttackComponent;
  instance.resources = [];
  return instance;
}

function card(value: string, rolling: boolean = false): AttackModifier {
  const am = new AttackModifier(AttackModifierType.townguard);
  am.effects = [new AttackModifierEffect(AttackModifierEffectType.custom, value)];
  am.rolling = rolling;
  return am;
}

function draw(instance: OutpostAttackComponent, deck: AttackModifierDeck, count: number, state?: 'advantage' | 'disadvantage') {
  instance['drawnBefore'] = deck.current;
  deck.current += count;
  deck.state = state;
  instance.addResources(deck);
}

const effects = (instance: OutpostAttackComponent) => instance.resources.map((resource) => resource.effect);

describe('OutpostAttackComponent resources', () => {
  const hide = card('+1%game.resource.hide%', true);
  const material = card('%game.custom.materialResource:2%');
  const other = card('fh-soldier');

  it('adds resources of every drawn card', () => {
    const instance = component();
    const deck = new AttackModifierDeck([hide, material, other, hide, other]);
    draw(instance, deck, 1);
    draw(instance, deck, 1);
    draw(instance, deck, 2);
    expect(effects(instance)).toEqual([
      new EventCardEffect(EventCardEffectType.collectiveResource, [1, 'hide']),
      new EventCardEffect(EventCardEffectType.collectiveResourceType, [2, 'material_resources']),
      new EventCardEffect(EventCardEffectType.collectiveResource, [1, 'hide'])
    ]);
    expect(instance.resources.every((resource) => resource.enabled)).toBe(true);
  });

  it('ignores rolling cards on disadvantage', () => {
    const instance = component();
    const deck = new AttackModifierDeck([hide, material]);
    draw(instance, deck, 2, 'disadvantage');
    expect(effects(instance)).toEqual([new EventCardEffect(EventCardEffectType.collectiveResourceType, [2, 'material_resources'])]);
  });
});
