import { Dialog } from "@angular/cdk/dialog";
import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { EventReward, EventRewardType } from "src/app/game/model/data/EventCard";
import { ItemData } from "src/app/game/model/data/ItemData";
import { ItemDialogComponent } from "src/app/ui/figures/items/dialog/item-dialog";

@Component({
    standalone: false,
    selector: 'ghs-event-reward-label',
    templateUrl: './reward-label.html',
    styleUrls: ['./reward-label.scss'],
    encapsulation: ViewEncapsulation.None
})
export class EventRewardLabelComponent implements OnInit {

    gameManager: GameManager = gameManager;

    @Input() reward!: EventReward;
    @Input() edition!: string;
    @Input() itemCards: boolean = false;

    rewardLabel: string[] = [];
    items: ItemData[] = [];

    rewardPrefix = 'game.events.rewards.';

    constructor(private dialog: Dialog) { }

    ngOnInit() {
        this.rewardLabel = this.calcRewardLabel();
        if (this.itemCards && [EventRewardType.collectiveItem, EventRewardType.itemDesign].indexOf(this.reward.type) != -1) {
            const itemString = ('' + this.reward.value).split(':')[0];
            let itemEdition = this.edition;
            let itemId = -1
            if (isNaN(+itemString)) {
                itemId = +itemString.split('-')[0];
                itemEdition = itemString.split('-')[1];
            } else {
                itemId = +itemString;
            }
            const itemData = gameManager.itemManager.getItem(itemId, itemEdition, true);
            if (itemData) {
                this.items.push(itemData);
            }
        }
    }

    calcRewardLabel(): string[] {
        if (this.reward.type == EventRewardType.custom) {
            return ['' + this.reward.value];
        }

        const value = '' + (this.reward.value || '');

        switch (this.reward.type) {
            case EventRewardType.additionalGold:
            case EventRewardType.collectiveGold:
            case EventRewardType.discard:
            case EventRewardType.experience:
            case EventRewardType.globalAchievement:
            case EventRewardType.gold:
            case EventRewardType.loseBattleGoal:
            case EventRewardType.loseCollectiveGold:
            case EventRewardType.loseGold:
            case EventRewardType.loseReputation:
            case EventRewardType.noEffect:
            case EventRewardType.outcome:
            case EventRewardType.randomItemDesign:
            case EventRewardType.reputation:
            case EventRewardType.partyAchievement:
            case EventRewardType.prosperity:
            case EventRewardType.scenarioCondition:
            case EventRewardType.scenarioDamage:
            case EventRewardType.scenarioSingleMinus1:
                return [this.rewardPrefix + this.reward.type, value];
            case EventRewardType.collectiveItem:
            case EventRewardType.itemDesign:
                const itemString = ('' + this.reward.value).split(':')[0];
                const itemCount = ('' + this.reward.value).split(':')[1];
                let itemEdition = this.edition;
                let itemId = -1
                if (isNaN(+itemString)) {
                    itemId = +itemString.split('-')[0];
                    itemEdition = itemString.split('-')[1];
                } else {
                    itemId = +itemString;
                }
                return [this.rewardPrefix + this.reward.type, '' + itemId, itemEdition, itemCount];
            case EventRewardType.scenario:
                const scenarioData = gameManager.scenarioManager.getScenario(value, this.edition, undefined);
                if (scenarioData) {
                    return [this.rewardPrefix + this.reward.type, scenarioData.index, gameManager.scenarioManager.scenarioTitle(scenarioData)];
                } else {
                    console.warn("Invalid Scenario '" + value + "' on event reward " + this.reward + "' for Edition " + this.edition);
                    return [this.rewardPrefix + this.reward.type, value, '<img class="icon ghs-svg" src="./assets/images/warning.svg"> %scenario%'];
                }
            case EventRewardType.consumeItem:
            case EventRewardType.consumeCollectiveItem:
            case EventRewardType.event:
            case EventRewardType.event:
                const eventType = value.split('-')[0];
                const eventValue = value.split('-')[1]
                return [this.rewardPrefix + this.reward.type, eventType, eventValue]
        }


        return [];
    }

    openItemDialog(itemData: ItemData) {
        this.dialog.open(ItemDialogComponent, {
            panelClass: ['fullscreen-panel'],
            disableClose: true,
            data: { item: itemData }
        })
    }

}