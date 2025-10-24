import { Component, EventEmitter, Input, Output } from "@angular/core";
import { EventCardAttack } from "src/app/game/model/data/EventCard";

@Component({
    standalone: false,
    selector: 'ghs-event-card-attack',
    templateUrl: './event-card-attack.html',
    styleUrls: ['./event-card-attack.scss']
})
export class EventCardAttackComponent {

    @Input() attack!: EventCardAttack;
    @Input() edition!: string;
    @Input() eventType!: string;
    @Input() selected: boolean = false;
    @Input() targetDescription: boolean = true;
    @Input() narrative: boolean = true;
    @Input() effects: boolean = true;
    @Input() disabled: boolean = false;
    @Input() light: boolean = false;

    @Output() onToggle: EventEmitter<boolean> = new EventEmitter<boolean>();

    @Input() debug: boolean = false;

    toggleSelected() {
        if (!this.disabled) {
            this.selected = !this.selected;
            this.onToggle.emit(this.selected);
        }
    }
}