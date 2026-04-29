import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, input, OnInit } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CharacterClass } from 'src/app/game/model/data/CharacterData';
import { EventCardCondition, EventCardConditionType } from 'src/app/game/model/data/EventCard';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [NgClass, GhsLabelDirective, forwardRef(() => EventCardConditionComponent)],
  selector: 'ghs-event-card-condition',
  templateUrl: './event-card-condition.html',
  styleUrls: ['./event-card-condition.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventCardConditionComponent implements OnInit {
  readonly inputCondition = input<string | EventCardCondition | undefined>(undefined, { alias: 'condition' });
  get condition(): string | EventCardCondition | undefined {
    return this.inputCondition();
  }

  readonly inputEdition = input<string>('', { alias: 'edition' });
  get edition(): string {
    return this.inputEdition();
  }

  readonly inputEventType = input<string>('', { alias: 'eventType' });
  get eventType(): string {
    return this.inputEventType();
  }

  readonly disabled = input<boolean>(false);
  readonly narrative = input<boolean>(false);
  readonly light = input<boolean>(true);
  readonly inline = input<boolean>(false);
  readonly lowercase = input<boolean>(false);
  readonly selected = input<boolean>(false);

  readonly debug = input<boolean>(false);

  conditionString: string | undefined;
  conditionObject: EventCardCondition | undefined;
  labelArgs: (string | number)[] = [];
  conditions: (string | EventCardCondition)[] = [];
  disabledConditions: boolean[] = [];

  special: EventCardConditionType[] = [EventCardConditionType.and, EventCardConditionType.payCollectiveGoldConditional];

  ngOnInit(): void {
    if (typeof this.condition === 'string') {
      this.conditionString = this.condition;
    } else if (this.condition) {
      this.conditionObject = this.condition;
      this.labelArgs = this.conditionObject.values
        ? this.conditionObject.values.filter((v) => typeof v === 'number' || typeof v === 'string')
        : [];
      this.conditions = this.conditionObject.values ? this.conditionObject.values.filter((v) => typeof v !== 'number') : [];

      this.conditions.forEach((c, i) => {
        this.disabledConditions[i] = !gameManager.eventCardManager.resolvableCondition(c);
      });

      const type = this.conditionObject.type;

      if (type === EventCardConditionType.character) {
        this.labelArgs = [this.labelArgs.map((c) => '%game.characterIcon.' + c + '%').join('')];
      }

      if (type === EventCardConditionType.building) {
        let concat = '';
        this.conditionObject.values
          .filter((v) => typeof v === 'string')
          .map((building) => {
            return '%game.fhIcon:' + building + '%';
          })
          .forEach((building, index, values) => {
            concat += building;
            if (values.length > 1) {
              if (index < values.length - 2) {
                concat += ', ';
              } else if (index < values.length - 1) {
                concat += ' %and% ';
              }
            }
          });
        this.labelArgs = [concat];
      }

      if (type === EventCardConditionType.traits || type === EventCardConditionType.traitsAll) {
        let concat = '';
        this.conditionObject.values
          .filter((v) => typeof v === 'string')
          .map((trait) => {
            if (trait in CharacterClass) {
              return '%character.class.' + trait + '%';
            }

            return '%data.character.traits.' + trait + '%';
          })
          .forEach((trait, index, values) => {
            concat += trait;
            if (values.length > 1) {
              if (index < values.length - 2) {
                concat += ', ';
              } else if (index < values.length - 1) {
                if (type === EventCardConditionType.traits) {
                  concat += ' %or% ';
                } else {
                  concat += ' %and% ';
                }
              }
            }
          });
        this.labelArgs = [concat];
      }

      this.labelArgs.push(this.edition);
    }
  }
}
