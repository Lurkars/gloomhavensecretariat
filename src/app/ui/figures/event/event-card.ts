import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { EventCard, EventCardConditionType, EventCardIdentifier } from "src/app/game/model/data/EventCard";


@Component({
    standalone: false,
    selector: 'ghs-event-card',
    templateUrl: './event-card.html',
    styleUrls: ['./event-card.scss']
})
export class EventCardComponent implements OnInit, OnChanges {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;

    @Input() event: EventCard | undefined;
    @Input() identifier: EventCardIdentifier | undefined | false;
    @Input() select: number = -1;
    @Input() flipped: boolean = false;
    @Input() disabled: boolean = false;

    @Output() onSelect: EventEmitter<number> = new EventEmitter<number>();
    @Output() onSubSelections: EventEmitter<number[]> = new EventEmitter<number[]>();

    selected: number = -1;
    subSelections: number[] = [];
    light: boolean = false;

    resolvable: boolean[][] = [];

    ngOnInit(): void {
        if (this.event) {
            this.event.options.forEach((option, optionIndex) => {
                this.resolvable[optionIndex] = this.resolvable[optionIndex] || [];
                option.outcomes.forEach((outcome, outcomeIndex) => {
                    this.resolvable[optionIndex][outcomeIndex] = outcome.condition && gameManager.eventCardManager.resolvableCondition(outcome.condition) || false;
                })
            })
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['identifier'] && changes['identifier'].previousValue != changes['identifier'].currentValue) {
            if (!this.event && this.identifier) {
                this.event = gameManager.eventCardManager.getEventCardForEdition(this.identifier.edition, this.identifier.type, this.identifier.cardId);
                if (this.event) {
                    this.selected = this.identifier.selected;
                    this.subSelections = this.identifier.subSelections;
                }
            }
        } else if (changes['select'] && changes['select'].previousValue != changes['select'].currentValue) {
            this.selectOption(this.select - 1);
        }
        this.light = this.event && ['city'].indexOf(this.event.type) != -1 || false;
    }

    selectOption(index: number) {
        if (this.event && !this.disabled && this.selected != index) {
            this.selected = index;
            this.subSelections = [];
            if (this.selected < -1) {
                this.selected = -1;
            }

            this.subSelections = [];
            if (index > -1) {
                this.event.options[index].outcomes.forEach((outcome, i) => {
                    if (this.resolvable[index][i]) {
                        if (typeof outcome.condition !== 'string' && outcome.condition && outcome.condition.type === EventCardConditionType.otherwise) {
                            if (!this.resolvable[index].some((value, vi) => value && vi != i)) {
                                this.subSelections.push(i);
                            }
                        } else {
                            this.subSelections.push(i);
                        }
                    }
                })
            }

            this.onSelect.emit(this.selected);
            if (this.subSelections.length) {
                this.onSubSelections.emit(this.subSelections);
            }
        }
    }

    selectSub(optionIndex: number, index: number, force: boolean = false) {
        if (this.event && !this.disabled && this.selected == optionIndex) {
            if (this.subSelections.indexOf(index) != -1) {
                this.subSelections.splice(this.subSelections.indexOf(index), 1);
            } else if (this.resolvable[this.selected] && this.resolvable[this.selected][index] || force) {
                this.subSelections.push(index);
                if (!force) {
                    const condition = this.event.options[this.selected].outcomes[index].condition;
                    if (condition && typeof condition !== 'string' && condition.type == EventCardConditionType.otherwise) {
                        this.subSelections = [index];
                    } else {
                        const otherwise = this.event.options[this.selected].outcomes.find((outcome) => outcome.condition && typeof outcome.condition !== 'string' && outcome.condition.type == EventCardConditionType.otherwise);
                        if (otherwise) {
                            this.subSelections = this.subSelections.splice(this.event.options[this.selected].outcomes.indexOf(otherwise), 1);
                        }
                    }
                }
            }
            this.onSubSelections.emit(this.subSelections);
        } else if (force) {
            this.selectOption(optionIndex);
        }
    }

}