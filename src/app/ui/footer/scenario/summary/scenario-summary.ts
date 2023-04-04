import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";
import { ItemData } from "src/app/game/model/data/ItemData";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { ScenarioRewards } from "src/app/game/model/data/ScenarioRule";
import { Identifier } from "src/app/game/model/data/Identifier";
import { LootType } from "src/app/game/model/data/Loot";
import { Scenario } from "src/app/game/model/Scenario";


@Component({
    selector: 'ghs-scenario-summary',
    templateUrl: './scenario-summary.html',
    styleUrls: ['./scenario-summary.scss']
})
export class ScenarioSummaryComponent {

    gameManager: GameManager = gameManager;

    scenario: Scenario;
    conclusion: ScenarioData | undefined;
    success: boolean;
    conclusionWarning: boolean;
    alreadyWarning: boolean = false;
    casual: boolean = false;

    characters: Character[];
    battleGoals: number[] = [];
    collectiveGold: number[] = [];
    lootColumns: LootType[] = [];
    rewardItems: ItemData[] = [];
    rewardItemCount: number[] = [];
    items: number[][] = [];
    rewards: ScenarioRewards | undefined = undefined;

    constructor(@Inject(DIALOG_DATA) data: { scenario: Scenario, success: boolean, conclusion: ScenarioData | undefined }, private dialogRef: DialogRef) {
        this.scenario = data.scenario;
        this.success = data.success;
        this.conclusion = data.conclusion;
        this.conclusionWarning = !this.conclusion && gameManager.sectionData(this.scenario.edition).find((sectionData) => sectionData.parent == this.scenario.index && sectionData.group == this.scenario.group && sectionData.edition == this.scenario.edition && sectionData.conclusion) != undefined;

        this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure, index) => {
            let char = new Character((figure as Character), figure.level);
            char.fromModel((figure as Character).toModel());
            this.battleGoals[index] = 0;
            return char;
        })

        for (let value in LootType) {
            const lootType: LootType = value as LootType;
            if (lootType != LootType.money && lootType != LootType.special1 && lootType != LootType.special2 && this.lootColumns.indexOf(lootType) == -1 && this.characters.some((character) => character.lootCards && character.lootCards.some((index) => gameManager.game.lootDeck.cards[index].type == lootType))) {
                this.lootColumns.push(lootType);
            }
        }

        this.alreadyWarning = gameManager.game.party.campaignMode && this.success && gameManager.game.party.scenarios.find((scenarioModel) => scenarioModel.index == this.scenario.index && scenarioModel.edition == this.scenario.edition && scenarioModel.group == this.scenario.group) != undefined;

        this.casual = this.alreadyWarning || !gameManager.game.party.campaignMode && gameManager.fhRules();

        if (gameManager.game.party.campaignMode && this.success) {
            if (this.conclusion) {
                this.rewards = this.conclusion.rewards;
            }

            if (!this.rewards) {
                this.rewards = this.scenario.rewards;
            }

            if (this.rewards) {
                if (this.rewards.collectiveGold) {
                    this.characters.forEach((char, index) => this.collectiveGold[index] = 0);
                }
                const rewardItems = this.rewards.items || this.rewards.chooseItem;
                if (rewardItems) {
                    this.characters.forEach((char, index) => this.items[index] = []);
                    rewardItems.forEach((item) => {
                        const itemData = gameManager.item(+item.split(':')[0], this.scenario.edition, true);
                        if (itemData) {
                            this.rewardItems.push(itemData);
                            this.rewardItemCount.push(item.indexOf(':') == -1 ? 1 : +item.split(':')[1]);
                        } else {
                            console.error("Unknown Item '" + item + "' for scenario '" + this.scenario.index + " (" + this.scenario.edition + ")")
                        }

                    })
                }
            }
        }
    }

    hasRewards(): ScenarioRewards | undefined {
        const rewards = this.rewards;
        if (rewards && (rewards.battleGoals || rewards.collectiveGold || rewards.custom || rewards.envelopes || rewards.events || rewards.experience || rewards.gold || rewards.items || rewards.chooseItem || rewards.itemDesigns || rewards.perks || rewards.prosperity || rewards.reputation)) {
            return rewards;
        }
        return undefined;
    }

    availableCollectiveGold(): number {
        return this.rewards && this.rewards.collectiveGold && this.collectiveGold.length > 0 && (this.rewards.collectiveGold - this.collectiveGold.reduce((a, b) => a + b)) || 0;
    }

    lootValue(character: Character, lootType: LootType): number {
        let value = 0;

        if (character.lootCards) {
            character.lootCards.forEach((index) => {
                const loot = gameManager.game.lootDeck.cards[index];
                if (loot && loot.type == lootType) {
                    value += gameManager.lootManager.getValue(loot);
                }
            })
        }

        return value;
    }

    treasureRewardsFromString(treasure: string): string[][] {
        if (treasure.split(':').length < 2) {
            return [];
        } else {
            return treasure.split(':')[1].split('|').map((value) => value.split('+'));
        }
    }

    toggleBattleGoal(event: any, index: number, value: number) {
        if (event.target.checked && this.battleGoals[index] < value) {
            this.battleGoals[index] = value;
        } else if (this.battleGoals[index] >= value) {
            this.battleGoals[index] = value - 1;
        }
    }

    itemDistributed(index: number, itemId: number, itemIndex: number, choose: boolean = true): boolean {
        if (choose && this.rewards && this.rewards.chooseItem && this.rewardItems.some((rewardItem, rewardIndex) => rewardIndex != itemIndex && this.characters.some((char, charIndex) => this.itemDistributed(charIndex, rewardItem.id, rewardIndex, false)))) {
            return true;
        }

        if (this.characters[index].progress.items.find((identifier) => identifier.name == '' + itemId && identifier.edition == this.scenario.edition)) {
            return true;
        }

        const itemData = this.rewardItems[itemIndex];
        const availableItems = choose ? itemData.count - this.characters.filter((character) => character.progress.items.find((identifier) => identifier.name == '' + itemData.id && identifier.edition == itemData.edition)).length : 1;

        return this.items[index].indexOf(itemId) == -1 && this.items.filter((list) => list.indexOf(itemId) != -1).length >= Math.min(this.rewardItemCount[itemIndex], availableItems);
    }

    toggleItem(event: any, index: number, itemId: number) {
        if (this.items[index].indexOf(itemId) == -1) {
            this.items[index].push(itemId);
        } else {
            this.items[index].splice(this.items[index].indexOf(itemId), 1);
        }
    }

    apply() {
        gameManager.stateManager.before("finishScenario." + (this.success ? "success" : "failure"), ...gameManager.scenarioManager.scenarioUndoArgs());
        if (this.success) {
            gameManager.game.figures.filter((figure) => figure instanceof Character).forEach((figure, index) => {
                const character = (figure as Character);
                if (this.battleGoals[index] > 0) {
                    character.progress.battleGoals += this.battleGoals[index];
                }

                if (this.collectiveGold[index] > 0) {
                    character.progress.gold += this.collectiveGold[index];
                }

                if (this.items[index] && this.items[index].length > 0) {
                    this.items[index].forEach((itemId) => {
                        character.progress.items.push(new Identifier('' + itemId, this.scenario.edition));
                    })
                }
            })
        }
        gameManager.scenarioManager.finishScenario(this.success, this.conclusion, false, undefined, this.casual);
        gameManager.stateManager.after(1000);
        this.dialogRef.close();
    }

    restart() {
        gameManager.stateManager.before("finishScenario.restart", ...gameManager.scenarioManager.scenarioUndoArgs());
        gameManager.scenarioManager.finishScenario(this.success, this.conclusion, true);
        gameManager.stateManager.after(1000);
        this.dialogRef.close();
    }

    linkedScenario(index: string) {
        const scenario = gameManager.scenarioData(this.scenario.edition).find((scenarioData) => scenarioData.group == this.scenario.group && scenarioData.index == index);
        if (scenario) {
            gameManager.stateManager.before("finishScenario.linked", ...gameManager.scenarioManager.scenarioUndoArgs(), index);
            gameManager.scenarioManager.finishScenario(this.success, this.conclusion, false, new Scenario(scenario));
            gameManager.stateManager.after(1000);
            this.dialogRef.close();
        }
    }

    close() {
        this.dialogRef.close();
    }
}
