import { AfterViewInit, Component, ElementRef, Input, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { AttackModifier, AttackModifierEffect, AttackModifierEffectType, AttackModifierType } from "src/app/game/model/data/AttackModifier";

@Component({
  standalone: false,
  selector: 'ghs-attackmodifier-effect',
  templateUrl: './attackmodifier-effect.html',
  styleUrls: ['./attackmodifier-effect.scss']
})
export class AttackModifierEffectComponent implements AfterViewInit, OnDestroy {

  @Input() offsetWidth!: number;
  @Input() attackModifier!: AttackModifier;
  @Input() effect!: AttackModifierEffect;
  @Input() newStyle: boolean = false;
  @Input() townGuard: boolean = false;
  @Input() length: number = 1;

  settingsManager: SettingsManager = settingsManager;

  AttackModifierType = AttackModifierType;
  AttackModifierEffectType = AttackModifierEffectType;
  invertIcons: AttackModifierEffectType[] = [AttackModifierEffectType.attack, AttackModifierEffectType.heal, AttackModifierEffectType.range, AttackModifierEffectType.retaliate, AttackModifierEffectType.shield, AttackModifierEffectType.target];

  constructor(public elementRef: ElementRef) { }

  ngAfterViewInit(): void {
    this.adjustFontSize();
    this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.adjustFontSize() });
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  adjustFontSize() {
    this.elementRef.nativeElement.style.fontSize = (this.elementRef.nativeElement.offsetWidth * 0.2) + 'px';
  }

  getTarget(): string {
    if (this.effect.effects) {
      const specialTarget = this.effect.effects.find((subEffect) => subEffect.type == AttackModifierEffectType.specialTarget);
      if (specialTarget) {
        return 'game.specialTarget.' + specialTarget.value;
      }
      const customValue = this.effect.effects.find((subEffect) => subEffect.type == AttackModifierEffectType.custom)
      if (customValue) {
        return customValue.value;
      }
    }
    return "";
  }

  getRange(): string {
    if (this.effect.effects) {
      const rangeEffect = this.effect.effects.find((subEffect) => subEffect.type == AttackModifierEffectType.range);
      if (rangeEffect) {
        return "%game.action.range:" + rangeEffect.value + '%';
      }
    }
    return "";
  }

  subEffects(): AttackModifierEffect[] {
    return this.effect.effects && this.effect.effects.filter((subEffect) => subEffect.type != AttackModifierEffectType.specialTarget && subEffect.type != AttackModifierEffectType.target && subEffect.type != AttackModifierEffectType.range && subEffect.type != AttackModifierEffectType.custom) || [];
  }

  isGhsSvg(type: AttackModifierEffectType) {
    return this.invertIcons.indexOf(type) != -1;
  }
}