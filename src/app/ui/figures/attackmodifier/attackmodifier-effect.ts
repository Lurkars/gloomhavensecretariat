import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, forwardRef, inject, Input, OnInit } from '@angular/core';
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
  styleUrls: ['./attackmodifier-effect.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttackModifierEffectComponent implements OnInit {
  elementRef = inject(ElementRef);
  private ghsManager = inject(GhsManager);

  @Input() offsetWidth!: number;
  @Input() attackModifier!: AttackModifier;
  @Input() effect!: AttackModifierEffect;
  @Input() newStyle: boolean = false;
  @Input() townGuard: boolean = false;
  @Input() length: number = 1;

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
    this.elementRef.nativeElement.style.fontSize = this.elementRef.nativeElement.offsetWidth * 0.2 + 'px';
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
