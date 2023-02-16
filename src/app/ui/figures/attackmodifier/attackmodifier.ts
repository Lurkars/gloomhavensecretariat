import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation } from "@angular/core";
import { elementAt } from "rxjs";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { AttackModifier, AttackModifierEffect, AttackModifierEffectType, AttackModifierType, AttackModifierValueType } from "src/app/game/model/AttackModifier";

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
  @Input() disableFlip: boolean = false;
  @Input() flipped: boolean = false;
  @Input() newStyle: boolean = false;
  effectClasses: string = "";
  AttackModifierType = AttackModifierType;
  AttackModifierValueType = AttackModifierValueType;
  AttackModifierEffectType = AttackModifierEffectType;
  defaultType: boolean = true;
  animate: boolean = true;
  multipe: boolean = false;
  anyElement: boolean = false;

  settingsManager: SettingsManager = settingsManager;

  ngOnInit(): void {
    this.animate = !this.disableFlip;
    if (this.attackModifier) {
      this.multipe = false;
      this.anyElement = false;
      if (this.attackModifier.effects) {
        this.multipe = this.attackModifier.effects.length > 1 && this.attackModifier.effects.every((effect) => effect.type == AttackModifierEffectType.element) || this.attackModifier.effects.length > 1 && this.attackModifier.effects.every((effect) => effect.type == AttackModifierEffectType.condition) || this.attackModifier.effects.length == 1 && this.attackModifier.effects.every((effect) => effect.type == AttackModifierEffectType.elementHalf) || false;
        this.anyElement = this.attackModifier.effects.length == 1 && this.attackModifier.effects.every((effect) => (effect.type == AttackModifierEffectType.element || effect.type == AttackModifierEffectType.elementConsume) && effect.value == 'any');

        this.attackModifier.effects.forEach((effect) => {
          if (effect.type != AttackModifierEffectType.heal && effect.type != AttackModifierEffectType.shield) {
            this.defaultType = false;
          }
          if (effect.type == AttackModifierEffectType.condition || effect.type == AttackModifierEffectType.element || effect.type == AttackModifierEffectType.elementHalf) {
            this.effectClasses += " " + effect.value.replaceAll('|', '-').replaceAll(':', '-');
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
    if (flipped && !this.disableFlip && flipped.currentValue && flipped.currentValue != flipped.previousValue) {
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