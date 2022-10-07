import { Component, Input } from "@angular/core";
import { AttackModifier, AttackModifierEffect, AttackModifierEffectType, AttackModifierType } from "src/app/game/model/AttackModifier";

@Component({
  selector: 'ghs-attackmodifier-effects',
  templateUrl: './attackmodifier-effects.html',
  styleUrls: ['./attackmodifier-effects.scss']
})
export class AttackModifierEffectsComponent {

  @Input() offsetWidth!: number;
  @Input() attackModifier!: AttackModifier;
  @Input() effects!: AttackModifierEffect[];

  AttackModifierType = AttackModifierType;
  AttackModifierEffectType = AttackModifierEffectType;

  getTarget(effect: AttackModifierEffect): string {
    if (effect.effects) {
      const specialTarget = effect.effects.find((subEffect) => subEffect.type == AttackModifierEffectType.specialTarget);
      if (specialTarget) {
        return "" + specialTarget.value;
      }
    }
    return "";
  }
}