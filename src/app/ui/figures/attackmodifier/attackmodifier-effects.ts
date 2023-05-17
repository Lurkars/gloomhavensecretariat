import { Component, Input } from "@angular/core";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { AttackModifier, AttackModifierEffect, AttackModifierEffectType, AttackModifierType } from "src/app/game/model/data/AttackModifier";

@Component({
  selector: 'ghs-attackmodifier-effects',
  templateUrl: './attackmodifier-effects.html',
  styleUrls: ['./attackmodifier-effects.scss']
})
export class AttackModifierEffectsComponent {

  @Input() offsetWidth!: number;
  @Input() attackModifier!: AttackModifier;
  @Input() effects!: AttackModifierEffect[];
  @Input() newStyle: boolean = false;
  @Input() townGuard: boolean = false;

  settingsManager: SettingsManager = settingsManager;

  AttackModifierType = AttackModifierType;
  AttackModifierEffectType = AttackModifierEffectType;
  invertIcons: AttackModifierEffectType[] = [AttackModifierEffectType.attack, AttackModifierEffectType.heal, AttackModifierEffectType.range, AttackModifierEffectType.retaliate, AttackModifierEffectType.shield, AttackModifierEffectType.target];

  getTarget(effect: AttackModifierEffect): string {
    if (effect.effects) {
      const specialTarget = effect.effects.find((subEffect) => subEffect.type == AttackModifierEffectType.specialTarget);
      if (specialTarget) {
        return 'game.specialTarget.' + specialTarget.value;
      }
      const customValue = effect.effects.find((subEffect) => subEffect.type == AttackModifierEffectType.custom)
      if (customValue) {
        return customValue.value;
      }
    }
    return "";
  }

  getRange(effect: AttackModifierEffect): string {
    if (effect.effects) {
      const rangeEffect = effect.effects.find((subEffect) => subEffect.type == AttackModifierEffectType.range);
      if (rangeEffect) {
        return "%game.action.range:" + rangeEffect.value + '%';
      }
    }
    return "";
  }

  subEffects(effect: AttackModifierEffect): AttackModifierEffect[] {
    return effect.effects && effect.effects.filter((subEffect) => subEffect.type != AttackModifierEffectType.specialTarget && subEffect.type != AttackModifierEffectType.target && subEffect.type != AttackModifierEffectType.range && subEffect.type != AttackModifierEffectType.custom) || [];
  }

  isGhsSvg(type: AttackModifierEffectType) {
    return this.invertIcons.indexOf(type) != -1;
  }
}