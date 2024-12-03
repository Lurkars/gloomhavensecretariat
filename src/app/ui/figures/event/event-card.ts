import { Component, Input, OnChanges, OnInit, SimpleChanges } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { EventCard } from "src/app/game/model/data/EventCard";
import { Identifier } from "src/app/game/model/data/Identifier";


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
    @Input() identifier: Identifier | undefined | false;
    @Input() select: number = -1;
    @Input() disabled: boolean = false;

    label: string = "";
    selected: number = -1;
    selectedEffect: number = -1;
    rewardSelection: { effectIndex: number, rewardIndex: number, index: number }[] = [];

    ngOnInit(): void {
        if (this.event) {
            this.label = 'data.events.' + this.event.edition + '.' + this.event.type + '.' + this.event.cardId;
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['identifier'] && changes['identifier'].previousValue != changes['identifier'].currentValue) {
            if (!this.event && this.identifier) {
                this.event = undefined; // TODO
            }
        } else if (changes['select'] && changes['select'].previousValue != changes['select'].currentValue) {
            this.selectOption(this.select);
        }
    }

    selectOption(index: number) {
        if (this.event && !this.disabled && this.selected != index) {
            this.selected = index;
            this.rewardSelection = [];
            if (this.selected != -1) {
                if (this.event.options[index].effects.length) {
                    this.selectedEffect = 0;
                }
                this.event.options[index].effects.forEach((effect, effectIndex) => {
                    if (effect.rewards) {
                        effect.rewards.forEach((rewards, rewardIndex) => {
                            if (rewards.length) {
                                this.rewardSelection.push({ effectIndex: effectIndex, rewardIndex: rewardIndex, index: 0 });
                            } else {
                                this.rewardSelection.push({ effectIndex: effectIndex, rewardIndex: rewardIndex, index: -1 });
                            }
                        })
                    }
                })
            }
        }
    }

    selectEffect(effectIndex: number) {
        if (this.selectedEffect == effectIndex) {
            this.selectedEffect = -1;
        } else {
            this.selectedEffect = effectIndex;
        }
    }

    selectReward(effectIndex: number, rewardIndex: number, index: number) {
        if (this.event && !this.disabled) {
            let selection = this.rewardSelection.find((item) => item.effectIndex == effectIndex && item.rewardIndex == rewardIndex);
            if (!selection) {
                selection = { effectIndex: effectIndex, rewardIndex: rewardIndex, index: index };
                this.rewardSelection.push(selection);
            } else {
                selection.index = index;
            }
        }
    }

    getRewardSelection(effectIndex: number, rewardIndex: number): { effectIndex: number, rewardIndex: number, index: number } {
        let selection = this.rewardSelection.find((item) => item.effectIndex == effectIndex && item.rewardIndex == rewardIndex);

        if (selection) {
            return selection;
        }

        return { effectIndex: effectIndex, rewardIndex: rewardIndex, index: -1 };
    }

}