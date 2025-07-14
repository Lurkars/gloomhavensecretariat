import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { EventCard, EventCardIdentifier } from "src/app/game/model/data/EventCard";


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

    label: string = "";
    selected: number = -1;
    subSelections: number[] = [];
    light: boolean = false;

    ngOnInit(): void {
        if (this.event) {
            this.label = 'data.events.' + this.event.edition + '.' + this.event.type + '.' + this.event.cardId;
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
            this.onSelect.emit(this.selected);
        }
    }

    selectSub(index: number) {
        if (this.event && !this.disabled) {
            if (this.subSelections.indexOf(index) != -1) {
                this.subSelections.splice(this.subSelections.indexOf(index), 1);
            } else {
                this.subSelections.push(index);
            }
            this.onSubSelections.emit(this.subSelections);
        }
    }

}