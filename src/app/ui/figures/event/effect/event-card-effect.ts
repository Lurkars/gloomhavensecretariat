import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { EventCardApplyEffects } from "src/app/game/businesslogic/EventCardManager";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { EventCardEffect, EventCardEffectType } from "src/app/game/model/data/EventCard";

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
    @Input() concatenated: boolean = false;
    @Input() inline: boolean = false;
    @Input() selected: boolean = false;
    @Input() checks: number = 0;

    @Input() debug: boolean = false;

    @Output() onCheck: EventEmitter<number> = new EventEmitter<number>();

    effectString: string | undefined;
    effectObject: EventCardEffect | undefined;
    labelArgs: (string | number)[] = [];
    effects: (string | EventCardEffect)[] = [];
    disabled: boolean = false;

    settingsManager: SettingsManager = settingsManager;
    EventCardApplyEffects = EventCardApplyEffects;

    special: EventCardEffectType[] = [EventCardEffectType.and, EventCardEffectType.checkbox, EventCardEffectType.choose];

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

    check(index: number) {
        if (this.selected) {
            if (this.checks == index + 1) {
                this.checks = index;
            } else {
                this.checks = index + 1;
            }
            this.onCheck.emit(this.checks);
        }
    }

}