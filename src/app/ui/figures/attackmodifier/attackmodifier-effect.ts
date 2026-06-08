import { NgClass } from '@angular/common';
import { Component, forwardRef, inject, input, OnInit } from '@angular/core';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { AttackModifier, AttackModifierEffect, AttackModifierEffectType, AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { ActionHexComponent } from 'src/app/ui/figures/actions/area/action-hex';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsValueSignPipe } from 'src/app/ui/helper/Pipes';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [
    NgClass,
    GhsLabelDirective,
    GhsValueSignPipe,
    TrackUUIDPipe,
    ActionHexComponent,
    forwardRef(() => AttackModifierEffectComponent)
  ],
  selector: 'ghs-attackmodifier-effect',
  templateUrl: './attackmodifier-effect.html',
  styleUrls: ['./attackmodifier-effect.scss']
})
export class AttackModifierEffectComponent implements OnInit {
  private ghsManager = inject(GhsManager);

  readonly inputAttackModifier = input.required<AttackModifier>({ alias: 'attackModifier' });
  get attackModifier(): AttackModifier {
    return this.inputAttackModifier();
  }

  readonly inputAttackModifierEffect = input.required<AttackModifierEffect>({ alias: 'effect' });
  get effect(): AttackModifierEffect {
    return this.inputAttackModifierEffect();
  }

  readonly newStyle = input<boolean>(false);
  readonly townGuard = input<boolean>(false);
  readonly length = input<number>(1);

  targetValue: number = 0;
  targetString: string = '';
  rangeValue: string | number = '';
  targetClass: boolean = false;

  settingsManager: SettingsManager = settingsManager;

  AttackModifierType = AttackModifierType;
  AttackModifierEffectType = AttackModifierEffectType;
  invertIcons: AttackModifierEffectType[] = [
    AttackModifierEffectType.attack,
    AttackModifierEffectType.heal,
    AttackModifierEffectType.range,
    AttackModifierEffectType.retaliate,
    AttackModifierEffectType.shield,
    AttackModifierEffectType.target
  ];

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    this.targetValue = 0;
    this.targetString = '';
    const target = this.getTarget();
    if (typeof target === 'string') {
      this.targetString = target;
    } else {
      this.targetValue = target;
    }
    this.rangeValue = this.getRange();
    this.targetClass = !!this.targetString || !!this.targetValue || !!this.rangeValue;
  }

  getTarget(): string | number {
    if (this.effect.effects) {
      const specialTarget = this.effect.effects.find((subEffect) => subEffect.type === AttackModifierEffectType.specialTarget);
      if (specialTarget) {
        return 'game.specialTarget.' + specialTarget.value;
      }
      const targetValue = this.effect.effects.find((subEffect) => subEffect.type === AttackModifierEffectType.target);
      if (targetValue) {
        return targetValue.value;
      }
      const customValue = this.effect.effects.find((subEffect) => subEffect.type === AttackModifierEffectType.custom);
      if (customValue) {
        return customValue.value;
      }
    }
    return '';
  }

  getRange(): string {
    if (this.effect.effects) {
      const rangeEffect = this.effect.effects.find((subEffect) => subEffect.type === AttackModifierEffectType.range);
      if (rangeEffect) {
        return '%game.action.range:' + rangeEffect.value + '%';
      }
    }
    return '';
  }

  subEffects(): AttackModifierEffect[] {
    return (
      (this.effect.effects &&
        this.effect.effects.filter(
          (subEffect) =>
            subEffect.type !== AttackModifierEffectType.specialTarget &&
            subEffect.type !== AttackModifierEffectType.target &&
            subEffect.type !== AttackModifierEffectType.range &&
            subEffect.type !== AttackModifierEffectType.custom
        )) ||
      []
    );
  }

  isGhsSvg(type: AttackModifierEffectType) {
    return this.invertIcons.includes(type);
  }
}
