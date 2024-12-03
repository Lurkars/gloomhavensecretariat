import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { EventCondition, EventConditionType, } from "src/app/game/model/data/EventCard";

@Component({
	standalone: false,
    selector: 'ghs-event-condition-label',
    templateUrl: './condition-label.html',
    styleUrls: ['./condition-label.scss'],
    encapsulation: ViewEncapsulation.None
})
export class EventConditionLabelComponent implements OnInit {

    gameManager: GameManager = gameManager;

    @Input() condition!: EventCondition;

    conditionLabel: string[] = [];

    conditionPrefix = 'game.events.conditions.';

    constructor() { }

    ngOnInit() {
        this.conditionLabel = this.calcConditionLabel(this.condition);
    }

    calcConditionLabel(condition: EventCondition | undefined): string[] {
        if (condition) {
            const value = '' + (condition.value || '');
            switch (condition.type) {
                case EventConditionType.otherwise:
                case EventConditionType.payCollectiveGold:
                case EventConditionType.reputationGT:
                case EventConditionType.reputationLT:
                    return [this.conditionPrefix + condition.type, value];
                case EventConditionType.payCollectiveGoldConditional:
                    let label: string[] = [this.conditionPrefix + condition.type];
                    let conditions: string[] = value.split('|');
                    conditions.forEach((conditionString) => {
                        const subValue = conditionString.split('-')[0];
                        let subLabel = "";
                        if (conditionString.split('-').length == 2) {
                            const subCondition = conditionString.split('-')[1];
                            subLabel = settingsManager.getLabel(this.conditionPrefix + subCondition.split(':')[0], subCondition.split(':').slice(1));
                        }

                        label.push(subValue, subLabel);
                    })
                    return label;
            }
        }

        return [];
    }
}