import { Component, Input, OnInit } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { EventCardApplyEffects, EventCardEffect, EventCardEffectType } from "src/app/game/model/data/EventCard";

@Component({
    standalone: false,
    selector: 'ghs-event-card-effect',
    templateUrl: './event-card-effect.html',
    styleUrls: ['./event-card-effect.scss']
})
export class EventCardEffectComponent implements OnInit {

    @Input() effect: string | EventCardEffect | undefined;
    @Input() edition!: string;
    @Input() eventType!: string;
    @Input() light: boolean = true;
    @Input() inline: boolean = false;

    effectString: string | undefined;
    effectObject: EventCardEffect | undefined;
    labelArgs: (string | number)[] = [];
    effects: (string | EventCardEffect)[] = [];
    disabled: boolean = false;

    settingsManager: SettingsManager = settingsManager;
    EventCardApplyEffects = EventCardApplyEffects;

    ngOnInit(): void {
        if (typeof this.effect === 'string') {
            this.effectString = this.effect;
        } else if (this.effect) {
            this.effectObject = this.effect;
            this.labelArgs = this.effectObject.values ? this.effectObject.values.filter((v) => typeof v === 'number' || typeof v === 'string') : [];
            this.effects = this.effectObject.values ? this.effectObject.values.filter((v) => typeof v !== 'number') : [];

            this.disabled = this.effectObject.condition && !gameManager.eventCardManager.resolvableCondition(this.effectObject.condition) || false;

            if (this.effectObject.type == EventCardEffectType.scenarioCondition) {
                let concat = "";
                this.effectObject.values.filter((v) => typeof v === 'string').map((condition) => {
                    const values = condition.split(':');
                    if (values.length == 2) {
                        return '%game.condition.' + values[0] + '% x' + values[1];
                    }
                    return '%game.condition.' + values[0] + '%';
                }).forEach((condition, index, values) => {
                    concat += condition;
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

            this.labelArgs.push(this.edition);
        }
    }

}