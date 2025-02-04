import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewEncapsulation } from "@angular/core";
import { Subscription } from "rxjs";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { AttackModifier, AttackModifierEffect, AttackModifierEffectType, AttackModifierType, AttackModifierValueType } from "src/app/game/model/data/AttackModifier";

@Component({
  standalone: false,
  selector: 'ghs-attackmodifier',
  templateUrl: './attackmodifier.html',
  styleUrls: ['./attackmodifier.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AttackModifierComponent implements OnInit, OnChanges, OnDestroy {

  @Input() attackModifier!: AttackModifier;
  @Input() characterIcon!: string;
  @Input() ally: boolean = false;
  @Input() numeration: string = "";
  @Input() number: number = 0;
  @Input() reveal: boolean = false;
  @Input() disableFlip: boolean = false;
  @Input() flipped: boolean = false;
  @Input() newStyle: boolean = false;
  @Input() townGuard: boolean = false;
  @Input() bbIndex: number = -1;
  effectClasses: string = "";
  AttackModifierType = AttackModifierType;
  AttackModifierValueType = AttackModifierValueType;
  AttackModifierEffectType = AttackModifierEffectType;
  effects: AttackModifierEffect[] = [];
  defaultType: boolean = true;
  animate: boolean = true;
  multipe: boolean = false;
  wildElement: boolean = false;
  csOak: boolean = false;
  mixedElement: AttackModifierEffect | undefined;
  orTypeEffect: AttackModifierEffect | undefined;
  townGuardEffectIcon: AttackModifierEffect | undefined;

  settingsManager: SettingsManager = settingsManager;

  constructor(public elementRef: ElementRef) { }

  ngOnInit(): void {
    this.animate = !this.disableFlip;
    this.init();
  }

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
    this.elementRef.nativeElement.style.fontSize = (this.elementRef.nativeElement.offsetWidth * 0.08) + 'px';
  }

  init() {
    if (this.attackModifier) {
      this.csOak = this.attackModifier.id && this.attackModifier.id.startsWith('cs-oak') || false;
      this.newStyle = this.newStyle || this.attackModifier.type == AttackModifierType.empower || this.attackModifier.type == AttackModifierType.enfeeble;
      this.multipe = false;
      this.wildElement = false;
      this.mixedElement = undefined;
      this.orTypeEffect = undefined;

      if (!this.characterIcon && this.attackModifier.character && this.attackModifier.id.startsWith('challenge-fh-1503-')) {
        this.characterIcon = gameManager.characterManager.characterIcon(this.attackModifier.id.replace('challenge-fh-1503-', '').split('-')[0]);
      }

      if (this.attackModifier.effects) {
        if (this.attackModifier.effects.find((effect) => effect.type == AttackModifierEffectType.element) && this.attackModifier.effects.some((effect) => effect.type != AttackModifierEffectType.element)) {
          this.mixedElement = this.attackModifier.effects.find((effect) => effect.type == AttackModifierEffectType.element);
        }

        if (this.townGuard) {
          this.townGuardEffectIcon = this.attackModifier.effects.find((effect) => effect.type == AttackModifierEffectType.custom && effect.icon);
        }

        this.effects = (this.mixedElement ? this.attackModifier.effects.filter((effect) => effect != this.mixedElement) : this.attackModifier.effects).filter((effect) => !this.townGuard || effect.type != AttackModifierEffectType.custom || !effect.icon);

        this.multipe = this.effects.length > 1 && this.effects.every((effect) => effect.type == AttackModifierEffectType.element) || this.effects.length > 1 && this.effects.every((effect) => effect.type == AttackModifierEffectType.condition || effect.type == AttackModifierEffectType.pierce || effect.type == AttackModifierEffectType.pull || effect.type == AttackModifierEffectType.push) || this.effects.length == 1 && this.effects.every((effect) => effect.type == AttackModifierEffectType.elementHalf) || false;

        this.wildElement = this.effects.length == 1 && this.effects.every((effect) => (effect.type == AttackModifierEffectType.element || effect.type == AttackModifierEffectType.elementConsume) && effect.value == 'wild');

        this.orTypeEffect = this.effects.find((effect) => effect.type == AttackModifierEffectType.or);

        this.effects.forEach((effect) => {
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
    const amChange = changes['attackModifier'];
    if (amChange && amChange.currentValue && amChange.currentValue != amChange.previousValue) {
      this.init();
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

  filter(effect: AttackModifierEffect): boolean {
    return [AttackModifierEffectType.element, AttackModifierEffectType.elementConsume, AttackModifierEffectType.elementHalf, AttackModifierEffectType.condition, AttackModifierEffectType.custom, AttackModifierEffectType.pull, , AttackModifierEffectType.push, AttackModifierEffectType.pierce].indexOf(effect.type) != -1;
  }
} 