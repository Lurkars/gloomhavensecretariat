import { Component, Input, OnInit } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { CharacterClass } from "src/app/game/model/data/CharacterData";
import { EventCardCondition, EventCardConditionType } from "src/app/game/model/data/EventCard";

@Component({
    standalone: false,
    selector: 'ghs-event-card-condition',
    templateUrl: './event-card-condition.html',
    styleUrls: ['./event-card-condition.scss']
})
export class EventCardConditionComponent implements OnInit {

    @Input() condition: string | EventCardCondition | undefined;
    @Input() edition!: string;
    @Input() eventType!: string;
    @Input() disabled: boolean = false;
    @Input() narrative: boolean = false;
    @Input() light: boolean = true;
    @Input() inline: boolean = false;
    @Input() lowercase: boolean = false;
    @Input() selected: boolean = false;

    @Input() debug: boolean = false;

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
            this.labelArgs = this.conditionObject.values ? this.conditionObject.values.filter((v) => typeof v === 'number' || typeof v === 'string') : [];
            this.conditions = this.conditionObject.values ? this.conditionObject.values.filter((v) => typeof v !== 'number') : [];

            this.conditions.forEach((c, i) => {
                this.disabledConditions[i] = !gameManager.eventCardManager.resolvableCondition(c);
            })

            if (this.conditionObject.type === EventCardConditionType.character) {
                this.labelArgs = [this.labelArgs.map((c) => '%game.characterIcon.' + c + '%').join('')];
            }

            if (this.conditionObject.type == EventCardConditionType.building) {
                let concat = "";
                this.conditionObject.values.filter((v) => typeof v === 'string').map((building) => {
                    return '%game.fhIcon:' + building + '%';
                }).forEach((building, index, values) => {
                    concat += building;
                    if (values.length > 1) {
                        if (index < values.length - 2) {
                            concat += ', ';
                        } else if (index < values.length - 1) {
                            concat += ' %and% ';
                        }
                    }
                })
                this.labelArgs = [concat];
            }


            if (this.conditionObject.type == EventCardConditionType.traits) {
                let concat = "";
                this.conditionObject.values.filter((v) => typeof v === 'string').map((trait) => {
                    if (trait in CharacterClass) {
                        return "%character.class." + trait + '%';
                    }

                    return '%data.character.traits.' + trait + '%';
                }).forEach((building, index, values) => {
                    concat += building;
                    if (values.length > 1) {
                        if (index < values.length - 2) {
                            concat += ', ';
                        } else if (index < values.length - 1) {
                            concat += ' %or% ';
                        }
                    }
                })
                this.labelArgs = [concat];
            }

            this.labelArgs.push(this.edition);
        }
    }

}