import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { EventCard, EventCardConditionType, EventCardEffectType, EventCardIdentifier } from "src/app/game/model/data/EventCard";


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
    @Input() subSelect: number[] = [];
    @Input() checks: number[] = [];
    @Input() flipped: boolean = false;
    @Input() disabled: boolean = false;
    @Input() spoiler: boolean = false;

    @Input() debug: boolean = false;

    @Output() onSelect: EventEmitter<EventCardIdentifier> = new EventEmitter<EventCardIdentifier>();

    selected: number = -1;
    subSelections: number[] = [];
    attackIndex: number = -1;
    attack: boolean = false;
    light: boolean = false;
    spoilerFree: boolean = false;
    noLabel: boolean = false;

    resolvable: boolean[][] = [];

    ngOnInit(): void {
        if (this.event) {
            this.event.options.forEach((option, optionIndex) => {
                if (option.outcomes) {
                    this.resolvable[optionIndex] = this.resolvable[optionIndex] || [];
                    option.outcomes.forEach((outcome, outcomeIndex) => {
                        this.resolvable[optionIndex][outcomeIndex] = !outcome.condition || !!outcome.condition && gameManager.eventCardManager.resolvableCondition(outcome.condition);
                        if (outcome.attack) {
                            this.attackIndex = optionIndex;
                            this.attack = true;
                        }
                    })
                }
            })
            this.noLabel = this.event.options.every((o) => !o.label);

        }
        this.spoilerFree = this.spoiler;
        this.selected = this.select;
        this.subSelections = this.subSelect;
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
        } else if (changes['select'] && changes['select'].previousValue != changes['select'].currentValue && this.selected != this.select) {
            this.selectOption(this.select, true);
        } else if (changes['spoiler'] && changes['spoiler'].previousValue != changes['spoiler'].currentValue) {
            this.spoilerFree = this.spoiler;
        }
        this.light = this.event && ['city'].indexOf(this.event.type) != -1 || false;
    }

    selectOption(index: number, quiet: boolean, event: MouseEvent | TouchEvent | undefined = undefined) {
        if (this.attackIndex != -1 && this.attackIndex == index) {
            return;
        }
        if (this.event && !this.disabled && this.selected != index) {
            this.attack = this.attackIndex != -1;
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
                            if (!this.resolvable[index].some((value, vi) => this.event && value && vi < i && !!this.event.options[index].outcomes[vi].condition)) {
                                this.subSelections.push(i);
                            }
                        } else {
                            this.subSelections.push(i);
                        }
                        if (this.subSelections.indexOf(i) != -1 && outcome.effects && outcome.effects.some((effect) => typeof effect === 'object' && effect.type == EventCardEffectType.skipThreat)) {
                            this.attack = false;
                        }
                    }
                })
            }
            if (!quiet) {
                this.onSelect.emit(new EventCardIdentifier(this.event.cardId, this.event.edition, this.event.type, this.selected, this.subSelections, this.checks, this.attack, false));
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

    selectSub(optionIndex: number, index: number, force: boolean = false, event: MouseEvent | TouchEvent | undefined = undefined) {
        if (this.attackIndex != -1 && this.attackIndex == index) {
            return;
        }
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

            this.onSelect.emit(new EventCardIdentifier(this.event.cardId, this.event.edition, this.event.type, this.selected, this.subSelections, this.checks, this.attack, false));
        } else if (force) {
            this.selectOption(optionIndex, false);
        }
        if (event) {
            event.preventDefault();
        }
    }

    toggleAttack(value: boolean) {
        this.attack = value;
        if (this.event) {
            this.onSelect.emit(new EventCardIdentifier(this.event.cardId, this.event.edition, this.event.type, this.selected, this.subSelections, this.checks, this.attack, false));
        }
    }

    setSpoilerFree(value: boolean, event: MouseEvent | TouchEvent | undefined = undefined) {
        this.spoilerFree = value;
        if (event) {
            event.preventDefault();
        }
    }
}