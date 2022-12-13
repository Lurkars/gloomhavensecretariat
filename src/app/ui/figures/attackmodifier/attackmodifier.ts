import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation } from "@angular/core";

import { Action, ActionType } from "src/app/game/model/Action";
import { AttackModifier, AttackModifierEffect, AttackModifierEffectType, AttackModifierType } from "src/app/game/model/AttackModifier";

@Component({
  selector: 'ghs-attackmodifier',
  templateUrl: './attackmodifier.html',
  styleUrls: ['./attackmodifier.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AttackModifierComponent implements OnInit, OnChanges {

  @Input() attackModifier!: AttackModifier;
  @Input() characterIcon!: string;
  @Input() numeration: string = "";
  @Input() number: number = 0;
  @Input() reveal: boolean = false;
  @Input() flipped: boolean = false;
  effectClasses: string = "";
  AttackModifierType = AttackModifierType;
  AttackModifierEffectType = AttackModifierEffectType;
  defaultType: boolean = true;
  animate: boolean = false;

  ngOnInit(): void {
    if (this.attackModifier) {
      if (this.attackModifier.effects) {
        this.attackModifier.effects.forEach((effect) => {
          if (effect.type != AttackModifierEffectType.heal && effect.type != AttackModifierEffectType.shield) {
            this.defaultType = false;
          }

          if (effect.type == AttackModifierEffectType.condition || effect.type == AttackModifierEffectType.element) {
            this.effectClasses += " " + effect.value;
          } else {
            this.effectClasses += " " + effect.type;
          }
        })
      }
    }
  }

  onChange(revealed: boolean) {
    this.attackModifier.revealed = revealed;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const flipped = changes['flipped'];
    if (flipped && !flipped.firstChange && flipped.currentValue != flipped.previousValue) {
      this.animate = true;
    }
  }

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