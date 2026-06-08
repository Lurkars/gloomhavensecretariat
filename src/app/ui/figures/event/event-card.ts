import { NgClass } from '@angular/common';
import { Component, input, OnChanges, OnInit, output, SimpleChanges } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EventCard, EventCardConditionType, EventCardEffectType, EventCardIdentifier } from 'src/app/game/model/data/EventCard';
import { EventCardAttackComponent } from 'src/app/ui/figures/event/attack/event-card-attack';
import { EventCardConditionComponent } from 'src/app/ui/figures/event/condition/event-card-condition';
import { EventCardEffectComponent } from 'src/app/ui/figures/event/effect/event-card-effect';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [
    EventCardAttackComponent,
    EventCardConditionComponent,
    EventCardEffectComponent,
    GhsLabelDirective,
    NgClass,
    PointerInputDirective,
    TrackUUIDPipe
  ],
  selector: 'ghs-event-card',
  templateUrl: './event-card.html',
  styleUrls: ['./event-card.scss']
})
export class EventCardComponent implements OnInit, OnChanges {
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  readonly inputEventCard = input<EventCard>(undefined, { alias: 'event' });

  readonly inputIdentifier = input<EventCardIdentifier | undefined | false>(undefined, { alias: 'identifier' });
  get identifier(): EventCardIdentifier | undefined | false {
    return this.inputIdentifier();
  }

  readonly select = input<number>(-1);
  readonly subSelect = input<number[]>([]);
  readonly inputChecks = input<number[]>([], { alias: 'checks' });
  readonly inputFlipped = input<boolean>(false, { alias: 'flipped' });
  readonly disabled = input<boolean>(false);
  readonly spoiler = input<boolean>(false);

  readonly debug = input<boolean>(false);

  readonly selectCard = output<EventCardIdentifier>();

  event: EventCard | undefined;
  selected: number = -1;
  subSelections: number[] = [];
  checks: number[] = [];
  attackIndex: number = -1;
  flipped: boolean = false;
  attack: boolean = false;
  light: boolean = false;
  spoilerFree: boolean = false;
  noLabel: boolean = false;

  resolvable: boolean[][] = [];
  showDebug: boolean = false;

  ngOnInit(): void {
    this.event = this.inputEventCard();
    this.checks = this.inputChecks();
    this.flipped = this.inputFlipped();
    if (this.event) {
      this.event.options.forEach((option, optionIndex) => {
        if (option.outcomes) {
          this.resolvable[optionIndex] = this.resolvable[optionIndex] || [];
          option.outcomes.forEach((outcome, outcomeIndex) => {
            this.resolvable[optionIndex][outcomeIndex] =
              !outcome.condition || (!!outcome.condition && gameManager.eventCardManager.resolvableCondition(outcome.condition));
            if (outcome.attack) {
              this.attackIndex = optionIndex;
              this.attack = true;
            }
          });
        }
      });
      this.noLabel = this.event.options.every((o) => !o.label);
      const model =
        this.identifier ||
        gameManager.game.party.eventCards.find(
          (id) => this.event && id.cardId === this.event.cardId && id.type === this.event.type && id.edition === this.event.edition
        );
      if (model && model.checks) {
        this.checks = [...model.checks];
      }
    }
    this.spoilerFree = this.spoiler();
    this.selected = this.select();
    this.subSelections = this.subSelect();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.event = this.inputEventCard();
    this.checks = this.inputChecks();
    this.flipped = this.inputFlipped();
    const select = this.select();
    if (changes['identifier'] && changes['identifier'].previousValue !== changes['identifier'].currentValue) {
      if (!this.event && this.identifier) {
        this.event = gameManager.eventCardManager.getEventCardForEdition(
          this.identifier.edition,
          this.identifier.type,
          this.identifier.cardId
        );
        if (this.event) {
          this.selected = this.identifier.selected;
          this.subSelections = this.identifier.subSelections;
        }
        if (this.identifier.checks) {
          this.checks = [...this.identifier.checks];
        }
      }
    } else if (changes['select'] && changes['select'].previousValue !== changes['select'].currentValue && this.selected !== select) {
      this.selectOption(select, true);
    } else if (changes['spoiler'] && changes['spoiler'].previousValue !== changes['spoiler'].currentValue) {
      this.spoilerFree = this.spoiler();
    }
    this.light = (this.event && ['city'].includes(this.event.type)) || false;
  }

  selectOption(index: number, quiet: boolean, event: PointerEvent | undefined = undefined) {
    if (this.attackIndex !== -1 && this.attackIndex === index) {
      return;
    }
    if (this.event && !this.disabled() && this.selected !== index) {
      this.attack = this.attackIndex !== -1;
      this.selected = index;
      this.subSelections = [];
      if (this.selected < -1) {
        this.selected = -1;
      }

      this.subSelections = [];
      if (index > -1 && this.event.options[index]) {
        this.event.options[index].outcomes.forEach((outcome, i) => {
          if (this.resolvable[index] && this.resolvable[index][i]) {
            if (typeof outcome.condition !== 'string' && outcome.condition && outcome.condition.type === EventCardConditionType.otherwise) {
              if (
                !this.resolvable[index].some(
                  (value, vi) => this.event && value && vi < i && !!this.event.options[index].outcomes[vi].condition
                )
              ) {
                this.subSelections.push(i);
              }
            } else {
              this.subSelections.push(i);
            }
            if (
              this.subSelections.includes(i) &&
              outcome.effects &&
              outcome.effects.some((effect) => typeof effect === 'object' && effect.type === EventCardEffectType.skipThreat)
            ) {
              this.attack = false;
            }
          }
        });
      }
      if (!quiet) {
        this.selectCard.emit(
          new EventCardIdentifier(
            this.event.cardId,
            this.event.edition,
            this.event.type,
            this.selected,
            this.subSelections,
            this.checks,
            this.attack,
            false
          )
        );
      }

      if (this.event.options[index] && !this.event.options[index].label) {
        this.flipped = true;
        this.selected = -1;
      }
    }
    if (event) {
      event.preventDefault();
    }
  }

  selectSub(optionIndex: number, index: number, force: boolean = false, event: PointerEvent | undefined = undefined) {
    if (this.attackIndex !== -1 && this.attackIndex === index) {
      return;
    }
    if (this.event && !this.disabled() && this.selected === optionIndex) {
      if (this.subSelections.includes(index)) {
        this.subSelections.splice(this.subSelections.indexOf(index), 1);
      } else if ((this.resolvable[this.selected] && this.resolvable[this.selected][index]) || force) {
        this.subSelections.push(index);
        if (!force) {
          const condition = this.event.options[this.selected].outcomes[index].condition;
          if (condition && typeof condition !== 'string' && condition.type === EventCardConditionType.otherwise) {
            this.subSelections = [index];
          } else {
            const otherwise = this.event.options[this.selected].outcomes.find(
              (outcome) =>
                outcome.condition && typeof outcome.condition !== 'string' && outcome.condition.type === EventCardConditionType.otherwise
            );
            if (otherwise) {
              this.subSelections = this.subSelections.splice(this.event.options[this.selected].outcomes.indexOf(otherwise), 1);
            }
          }
        }
      }

      this.selectCard.emit(
        new EventCardIdentifier(
          this.event.cardId,
          this.event.edition,
          this.event.type,
          this.selected,
          this.subSelections,
          this.checks,
          this.attack,
          false
        )
      );
    } else if (force) {
      this.selectOption(optionIndex, false);
    }
    if (event) {
      event.preventDefault();
    }
  }

  onCheck(index: number, checks: number) {
    this.checks = this.checks || [];
    this.checks[index] = checks;
    if (this.event) {
      this.selectCard.emit(
        new EventCardIdentifier(
          this.event.cardId,
          this.event.edition,
          this.event.type,
          this.selected,
          this.subSelections,
          this.checks,
          this.attack,
          false
        )
      );
    }
  }

  toggleAttack(value: boolean) {
    this.attack = value;
    if (this.event) {
      this.selectCard.emit(
        new EventCardIdentifier(
          this.event.cardId,
          this.event.edition,
          this.event.type,
          this.selected,
          this.subSelections,
          this.checks,
          this.attack,
          false
        )
      );
    }
  }

  setSpoilerFree(value: boolean, event: PointerEvent | undefined = undefined) {
    this.spoilerFree = value;
    if (event) {
      event.preventDefault();
    }
  }

  toggleShowDebug(event: PointerEvent | undefined = undefined) {
    this.showDebug = !this.showDebug;
    if (event) {
      event.preventDefault();
    }
  }
}
