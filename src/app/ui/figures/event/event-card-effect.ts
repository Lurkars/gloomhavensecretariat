import { Component, Input, OnInit } from "@angular/core";
import { EventCardEffect } from "src/app/game/model/data/EventCard";

@Component({
    standalone: false,
    selector: 'ghs-event-card-effect',
    templateUrl: './event-card-effect.html',
    styleUrls: ['./event-card-effect.scss']
})
export class EventCardEffectComponent implements OnInit {

    @Input() effect: string | EventCardEffect | undefined;
    @Input() edition!: string;
    @Input() light: boolean = true;
    @Input() inline: boolean = false;

    effectString: string | undefined;
    effectObject: EventCardEffect | undefined;
    labelArgs: (string | number)[] = [];
    effects: (string | EventCardEffect)[] = [];

    ngOnInit(): void {
        if (typeof this.effect === 'string') {
            this.effectString = this.effect;
        } else if (this.effect) {
            this.effectObject = this.effect;
            this.labelArgs = this.effectObject.values ? this.effectObject.values.filter((v) => typeof v === 'number' || typeof v === 'string') : [];
            this.effects = this.effectObject.values ? this.effectObject.values.filter((v) => typeof v !== 'number') : [];
            this.labelArgs.push(this.edition);
        }
    }

}