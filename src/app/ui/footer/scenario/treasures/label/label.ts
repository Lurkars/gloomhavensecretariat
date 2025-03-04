import { Dialog } from "@angular/cdk/dialog";
import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ItemData } from "src/app/game/model/data/ItemData";
import { TreasureData, TreasureReward, TreasureRewardType } from "src/app/game/model/data/RoomData";
import { ItemDialogComponent } from "src/app/ui/figures/items/dialog/item-dialog";

@Component({
    standalone: false,
    selector: 'ghs-treasure-label',
    templateUrl: './label.html',
    styleUrls: ['./label.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TreasureLabelComponent implements OnInit {

    gameManager: GameManager = gameManager;

    @Input() treasure: TreasureData | undefined;
    @Input() index!: number;
    @Input() edition!: string;
    @Input() rewardResults!: string[][];
    @Input() itemCards: boolean = false;

    items: ItemData[] = [];
    rewardLabel: string[][] = [];

    labelPrefix = 'game.loot.treasures.rewards.';

    constructor(private dialog: Dialog) { }

    ngOnInit() {
        if (!this.treasure) {
            const editionData = gameManager.editionData.find((editionData) => editionData.edition == this.edition);
            if (editionData && editionData.treasures) {
                const index = this.index < 0 ? this.index : this.index - (editionData.treasureOffset || 0);
                if (index >= 0 && index < editionData.treasures.length) {
                    const tresureString = editionData.treasures[index];
                    this.treasure = new TreasureData(tresureString, this.index);
                } else if (index < 0 && editionData.treasures.length + index + 1 > 0) {
                    const tresureString = editionData.treasures[index + 1 + editionData.treasures.length];
                    this.treasure = new TreasureData(tresureString, this.index);
                } else {
                    console.warn("Invalid treasure index: '" + this.index + "' for Edition " + this.edition, editionData.treasures.length);
                }
            }
        } else {
            this.index = this.treasure.index;
        }


        if (this.treasure) {
            this.treasure.rewards.forEach((reward, index) => {
                this.rewardLabel[index] = this.calcRewardLabel(reward);
            })

            if (this.itemCards) {
                this.treasure.rewards.forEach((reward, index) => {
                    if ([TreasureRewardType.item, TreasureRewardType.itemBlueprint, TreasureRewardType.itemDesign, TreasureRewardType.itemFh,].indexOf(reward.type) != -1) {
                        const itemString = '' + reward.value;
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
                    } else if ([TreasureRewardType.randomItem, TreasureRewardType.randomItemBlueprint, TreasureRewardType.randomItemDesign].indexOf(reward.type) != -1 && this.rewardResults && this.rewardResults[index] && this.rewardResults[index][0] && !isNaN(+this.rewardResults[index][0])) {
                        const itemData = gameManager.itemManager.getItem(this.rewardResults[index][0], this.rewardResults[index][2], true);
                        if (itemData) {
                            this.items.push(itemData);
                        }
                    }
                })
            }
        }
    }

    calcRewardLabel(reward: TreasureReward): string[] {
        if (reward.type == "custom") {
            return ['' + reward.value];
        }

        const value = '' + (reward.value || '');

        switch (reward.type) {
            case TreasureRewardType.gold:
            case TreasureRewardType.goldFh:
            case TreasureRewardType.experience:
            case TreasureRewardType.experienceFh:
            case TreasureRewardType.battleGoal:
            case TreasureRewardType.randomScenario:
            case TreasureRewardType.randomScenarioFh:
            case TreasureRewardType.randomItem:
            case TreasureRewardType.randomItemDesign:
            case TreasureRewardType.randomItemBlueprint:
            case TreasureRewardType.partyAchievement:
            case TreasureRewardType.campaignSticker:
            case TreasureRewardType.heal:
            case TreasureRewardType.loot:
            case TreasureRewardType.lootCards:
                return [this.labelPrefix + reward.type, value];
            case TreasureRewardType.damage:
                if (value == "terrain") {
                    return [this.labelPrefix + reward.type, "%game.level.hazardousTerrain%"];
                }
                return [this.labelPrefix + reward.type, "%game.damage:" + value + "%"];
            case TreasureRewardType.condition:
                const conditions = value.split('+').map((condition) => "%game.condition." + condition + "%");
                let conditionValue = conditions[0];
                if (conditions.length > 1) {
                    conditionValue = conditions.slice(0, - 1).join(',');
                    conditionValue += ' %and% ' + (conditions[conditions.length - 1]);
                }
                return [this.labelPrefix + reward.type, conditionValue];
            case TreasureRewardType.item:
            case TreasureRewardType.itemDesign:
            case TreasureRewardType.itemFh:
            case TreasureRewardType.itemBlueprint:
                const itemIdValues: string[] = [];
                const itemNameValues: string[] = [];
                value.split('+').forEach((itemString) => {
                    let itemEdition = this.edition;
                    let itemId = -1
                    if (isNaN(+itemString)) {
                        itemId = +itemString.split('-')[0];
                        itemEdition = itemString.split('-')[1];
                    } else {
                        itemId = +itemString;
                    }

                    const item = gameManager.itemManager.getItem(itemId, itemEdition, true);

                    if (item) {
                        if (reward.type == TreasureRewardType.itemFh || reward.type == TreasureRewardType.itemBlueprint) {
                            itemIdValues.push(item.id + '');
                        } else {
                            itemIdValues.push('%game.item% ' + (itemEdition == this.edition ? item.id : item.id + ' [%data.edition.' + item.edition + '%]'));
                        }
                        itemNameValues.push('"' + settingsManager.getLabel('data.items.' + item.edition + '-' + item.id) + '"');
                    } else {
                        console.warn("Invalid Item '" + itemId + "' (Edition " + itemEdition + ") on treasure" + this.index + "' for Edition " + this.edition);
                        itemNameValues.push('<img class="icon ghs-svg" src="./assets/images/warning.svg"> %item%')
                    }
                })

                let itemIdValue = itemIdValues[0];
                if (itemIdValues.length > 1) {
                    itemIdValue = itemIdValues.slice(0, - 1).join(',');
                    itemIdValue += ' %and% ' + (itemIdValues[itemIdValues.length - 1]);
                }

                let itemNameValue = itemNameValues[0];
                if (itemNameValues.length > 1) {
                    itemNameValue = itemNameValues.slice(0, - 1).join(',');
                    itemNameValue += ' %and% ' + (itemNameValues[itemNameValues.length - 1]);
                }

                return [this.labelPrefix + reward.type, itemIdValue, itemNameValue];
            case TreasureRewardType.scenario:
                const scenarioData = gameManager.scenarioManager.getScenario(value, this.edition, undefined);
                if (scenarioData) {
                    return [this.labelPrefix + reward.type, scenarioData.index, gameManager.scenarioManager.scenarioTitle(scenarioData)];
                } else {
                    console.warn("Invalid Scenario '" + value + "' on treasure " + this.index + "' for Edition " + this.edition);
                    return [this.labelPrefix + reward.type, value, '<img class="icon ghs-svg" src="./assets/images/warning.svg"> %scenario%'];
                }
            case TreasureRewardType.event:
                const eventType = value.split('-')[0];
                const eventValue = value.split('-')[1]
                return [this.labelPrefix + reward.type + '.' + eventType, '' + eventValue]
            case TreasureRewardType.resource:
                const resources = value.split('+').map((resource) =>
                    resource.split("-")[1] + '<img class="icon ghs-svg" src="./assets/images/fh/loot/' + resource.split("-")[0] + '.svg">'
                );
                let resourceValue = resources[0];
                if (resources.length > 1) {
                    resourceValue = resources.slice(0, - 1).join(',');
                    resourceValue += ' %and% ' + (resources[resources.length - 1]);
                }
                return [this.labelPrefix + reward.type, resourceValue];
            case TreasureRewardType.calendarSection:
                if (value.split('-').length > 1) {
                    return [this.labelPrefix + reward.type, value.split('-')[0], value.split('-')[1]];
                }
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