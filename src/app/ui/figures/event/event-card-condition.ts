import { Component, Input, OnInit } from "@angular/core";
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
    @Input() narrative: boolean = false;
    @Input() light: boolean = true;

    conditionString: string | undefined;
    conditionObject: EventCardCondition | undefined;
    labelArgs: (string | number)[] = [];
    conditions: EventCardCondition[] = [];

    ngOnInit(): void {
        if (typeof this.condition === 'string') {
            this.conditionString = this.condition;
        } else if (this.condition) {
            this.conditionObject = this.condition;
            this.labelArgs = this.conditionObject.values ? this.conditionObject.values.filter((v) => typeof v === 'number' || typeof v === 'string') : [];
            this.conditions = this.conditionObject.values ? this.conditionObject.values.filter((v) => typeof v !== 'number' && typeof v !== 'string') : [];

            if (this.conditionObject.type === EventCardConditionType.character) {
                this.labelArgs = [this.labelArgs.map((c) => '%game.characterIcon.' + c + '%').join('')];
            }

            this.labelArgs.push(this.edition);
        }
    }

}