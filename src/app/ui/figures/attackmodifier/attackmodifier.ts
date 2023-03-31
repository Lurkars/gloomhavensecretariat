import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation } from "@angular/core";
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
  @Input() ally: boolean = false;
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
  wildElement: boolean = false;
  csOak: boolean = false;
  mixedElement: AttackModifierEffect | undefined;
  orTypeEffect: AttackModifierEffect | undefined;

  settingsManager: SettingsManager = settingsManager;

  ngOnInit(): void {
    this.animate = !this.disableFlip;
    if (this.attackModifier) {
      this.csOak = this.attackModifier.id.startsWith('cs-oak');
      this.multipe = false;
      this.wildElement = false;
      this.mixedElement = undefined;
      this.orTypeEffect = undefined;
      if (this.attackModifier.effects) {
        if (this.attackModifier.effects.find((effect) => effect.type == AttackModifierEffectType.element) && this.attackModifier.effects.some((effect) => effect.type != AttackModifierEffectType.element)) {
          this.mixedElement = this.attackModifier.effects.find((effect) => effect.type == AttackModifierEffectType.element);
        }

        this.multipe = this.effects().length > 1 && this.effects().every((effect) => effect.type == AttackModifierEffectType.element) || this.effects().length > 1 && this.effects().every((effect) => effect.type == AttackModifierEffectType.condition || effect.type == AttackModifierEffectType.pierce || effect.type == AttackModifierEffectType.pull || effect.type == AttackModifierEffectType.push) || this.effects().length == 1 && this.effects().every((effect) => effect.type == AttackModifierEffectType.elementHalf) || false;

        this.wildElement = this.effects().length == 1 && this.effects().every((effect) => (effect.type == AttackModifierEffectType.element || effect.type == AttackModifierEffectType.elementConsume) && effect.value == 'wild');

        this.orTypeEffect = this.effects().find((effect) => effect.type == AttackModifierEffectType.or);

        this.effects().forEach((effect) => {
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

  effects(): AttackModifierEffect[] {
    return this.mixedElement ? this.attackModifier.effects.filter((effect) => effect != this.mixedElement) : this.attackModifier.effects;
  }

  filter(effect: AttackModifierEffect): boolean {
    return [AttackModifierEffectType.element, AttackModifierEffectType.elementConsume, AttackModifierEffectType.elementHalf, AttackModifierEffectType.condition, AttackModifierEffectType.custom, AttackModifierEffectType.pull, , AttackModifierEffectType.push, AttackModifierEffectType.pierce].indexOf(effect.type) != -1;
  }
} 