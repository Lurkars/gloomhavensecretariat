import { Component, Input } from "@angular/core";
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
    @Input() light: boolean = true;

    @Input() debug: boolean = false;

}