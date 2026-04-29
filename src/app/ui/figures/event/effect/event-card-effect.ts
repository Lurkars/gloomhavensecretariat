import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, input, model, OnInit } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EventCardEffect, EventCardEffectType } from 'src/app/game/model/data/EventCard';
import { EventCardConditionComponent } from 'src/app/ui/figures/event/condition/event-card-condition';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    GhsLabelDirective,
    PointerInputDirective,
    GhsTooltipDirective,
    EventCardConditionComponent,
    forwardRef(() => EventCardEffectComponent)
  ],
  selector: 'ghs-event-card-effect',
  templateUrl: './event-card-effect.html',
  styleUrls: ['./event-card-effect.scss']
})
export class EventCardEffectComponent implements OnInit {
  readonly inputEffect = input<string | EventCardEffect | undefined>(undefined, { alias: 'effect' });
  get effect(): string | EventCardEffect | undefined {
    return this.inputEffect();
  }

  readonly inputEdition = input<string>('', { alias: 'edition' });
  get edition(): string {
    return this.inputEdition();
  }

  readonly inputEventType = input<string>('', { alias: 'eventType' });
  get eventType(): string {
    return this.inputEventType();
  }

  readonly light = input<boolean>(true);
  readonly concatenated = input<boolean>(false);
  readonly inline = input<boolean>(false);
  readonly selected = input<boolean>(false);
  readonly checks = model<number>(0);

  readonly debug = input<boolean>(false);

  effectString: string | undefined;
  effectObject: EventCardEffect | undefined;
  labelArgs: (string | number)[] = [];
  effects: (string | EventCardEffect)[] = [];
  disabled: boolean = false;
  applicable: boolean = false;

  settingsManager: SettingsManager = settingsManager;

  special: EventCardEffectType[] = [
    EventCardEffectType.additionally,
    EventCardEffectType.and,
    EventCardEffectType.checkbox,
    EventCardEffectType.choose
  ];

  ngOnInit(): void {
    if (typeof this.effect === 'string') {
      this.effectString = this.effect;
    } else if (this.effect) {
      this.effectObject = this.effect;
      this.labelArgs = this.effectObject.values
        ? this.effectObject.values.filter((v) => typeof v === 'number' || typeof v === 'string')
        : [];
      this.effects = this.effectObject.values ? this.effectObject.values.filter((v) => typeof v !== 'number') : [];
      this.applicable = gameManager.eventCardManager.applicableEffect(this.effectObject);

      if (
        this.effectObject.type === EventCardEffectType.and ||
        this.effectObject.type === EventCardEffectType.additionally ||
        this.effectObject.type === EventCardEffectType.checkbox
      ) {
        this.applicable = this.effects.some((e) => typeof e === 'object' && gameManager.eventCardManager.applicableEffect(e));
      }

      this.disabled =
        (this.effectObject.condition && !gameManager.eventCardManager.resolvableCondition(this.effectObject.condition)) || false;

      if (
        this.effectObject.type === EventCardEffectType.scenarioCondition ||
        this.effectObject.type === EventCardEffectType.traitScenarioCondition
      ) {
        let concat = '';
        let values = this.effectObject.values || [];
        if (this.effectObject.type === EventCardEffectType.traitScenarioCondition) {
          values = values.slice(1);
        }
        values
          .filter((v) => typeof v === 'string')
          .map((condition) => {
            const values = condition.split(':');
            if (values.length === 2) {
              return '%game.condition.' + values[0] + '% x' + values[1];
            }
            return '%game.condition.' + values[0] + '%';
          })
          .forEach((condition, index, values) => {
            concat += condition;
            if (values.length > 1) {
              if (index < values.length - 2) {
                concat += ', ';
              } else if (index < values.length - 1) {
                concat += ' %and% ';
              }
            }
          });
        this.labelArgs = [concat];
        if (this.effectObject.type === EventCardEffectType.traitScenarioCondition && typeof this.effectObject.values[0] === 'string') {
          this.labelArgs.unshift(this.effectObject.values[0]);
        }
      }

      this.labelArgs.push(this.edition);
    }
  }

  check(index: number) {
    if (this.selected()) {
      if (this.checks() === index + 1) {
        this.checks.set(index);
      } else {
        this.checks.set(index + 1);
      }
    }
  }
}
