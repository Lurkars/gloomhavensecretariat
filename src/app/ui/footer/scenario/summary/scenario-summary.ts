import { DialogRef, DIALOG_DATA, Dialog } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";
import { ItemData } from "src/app/game/model/data/ItemData";
import { ScenarioData, ScenarioFinish } from "src/app/game/model/data/ScenarioData";
import { ScenarioRewards } from "src/app/game/model/data/ScenarioRule";
import { Identifier } from "src/app/game/model/data/Identifier";
import { LootType } from "src/app/game/model/data/Loot";
import { GameScenarioModel, Scenario } from "src/app/game/model/Scenario";
import { CharacterSheetDialog } from "src/app/ui/figures/character/dialogs/character-sheet";
import { EntityValueFunction } from "src/app/game/model/Entity";
import { Subscription } from "rxjs";


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
    forceCampaign: boolean = false;

    characters: Character[];
    battleGoals: number[] = [];
    collectiveGold: number[] = [];
    lootColumns: LootType[] = [];
    rewardItems: ItemData[] = [];
    rewardItemCount: number[] = [];
    items: number[][] = [];
    chooseLocation: string | undefined;
    chooseUnlockCharacter: string | undefined;
    rewards: ScenarioRewards | undefined = undefined;
    challenges: number = 0;
    numberChallenges: number = 0;
    calenderSectionManual: number[] = [];

    EntityValueFunction = EntityValueFunction;

    constructor(@Inject(DIALOG_DATA) data: { scenario: Scenario, success: boolean, conclusion: ScenarioData | undefined }, private dialogRef: DialogRef, private dialog: Dialog) {

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
        this.updateState()


        gameManager.stateManager.scenarioSummary = true;

        if (!gameManager.game.finish) {
            gameManager.stateManager.before("finishScenario.dialog", ...gameManager.scenarioManager.scenarioUndoArgs());
            this.updateFinish();
            gameManager.stateManager.after();
        }

        this.dialogRef.closed.subscribe({
            next: () => {
                if (gameManager.stateManager.scenarioSummary) {
                    gameManager.stateManager.before("finishScenario.close", ...gameManager.scenarioManager.scenarioUndoArgs());
                    gameManager.stateManager.scenarioSummary = false;
                    gameManager.game.finish = undefined;
                    gameManager.stateManager.after();
                }
            }
        })

        this.uiChangeSubscription = gameManager.uiChange.subscribe({
            next: () => {
                if (!gameManager.game.finish) {
                    gameManager.stateManager.scenarioSummary = false;
                    this.dialogRef.close();
                } else {
                    const finish = gameManager.game.finish;
                    this.conclusion = finish.conclusion ? gameManager.sectionData(finish.conclusion.edition).find((sectionData) => finish.conclusion && sectionData.index == finish.conclusion.index && sectionData.group == finish.conclusion.group && sectionData.conclusion) : undefined;
                    this.success = finish.success;
                    this.battleGoals = finish.battleGoals;
                    this.challenges = finish.challenges;
                    this.chooseLocation = finish.chooseLocation;
                    this.chooseUnlockCharacter = finish.chooseUnlockCharacter;
                    this.collectiveGold = finish.collectiveGold;
                    this.items = finish.items;
                    this.calenderSectionManual = finish.calenderSectionManual;
                }
            }
        })
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    updateFinish() {
        const finish = new ScenarioFinish();
        finish.conclusion = this.conclusion ? new GameScenarioModel(this.conclusion.index, this.conclusion.edition, this.conclusion.group) : undefined;
        finish.success = this.success;
        finish.battleGoals = this.battleGoals;
        finish.challenges = this.challenges;
        finish.chooseLocation = this.chooseLocation;
        finish.chooseUnlockCharacter = this.chooseUnlockCharacter;
        finish.collectiveGold = this.collectiveGold;
        finish.items = this.items;
        finish.calenderSectionManual = this.calenderSectionManual;
        gameManager.game.finish = finish;
    }

    updateState(forceCampaign: boolean = false): void {
        this.forceCampaign = forceCampaign;
        this.challenges = 0;
        this.numberChallenges = 0;
        this.rewards = undefined;
        if ((gameManager.game.party.campaignMode || forceCampaign) && this.success) {
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
                        const itemData = gameManager.item(+item.split(':')[0].split('-')[0], item.split(':')[0].split('-')[1] || this.scenario.edition, true);
                        if (itemData) {
                            this.rewardItems.push(itemData);
                            this.rewardItemCount.push(item.indexOf(':') == -1 ? 1 : +item.split(':')[1]);
                        } else {
                            console.error("Unknown Item '" + item + "' for scenario '" + this.scenario.index + " (" + this.scenario.edition + ")")
                        }

                    })
                }
                if (this.rewards.chooseLocation && this.rewards.chooseLocation.length > 0) {
                    this.chooseLocation = this.rewards.chooseLocation[0];
                }
                if (this.rewards.chooseUnlockCharacter && this.rewards.chooseUnlockCharacter.length > 0) {
                    let index = 0;
                    while (index < this.rewards.chooseUnlockCharacter.length && gameManager.game.unlockedCharacters.indexOf(this.rewards.chooseUnlockCharacter[index]) != -1) {
                        index++;
                    }
                    if (index < this.rewards.chooseUnlockCharacter.length) {
                        this.chooseUnlockCharacter = this.rewards.chooseUnlockCharacter[index];
                    }
                }
                if (this.rewards.calenderSectionManual) {
                    this.rewards.calenderSectionManual.forEach((section, index) => this.calenderSectionManual[index] = 0);
                }
            }
            if (gameManager.fhRules()) {
                const townHall = gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == 'town-hall' && buildingModel.state == 'normal');
                if (townHall) {
                    if (townHall.level == 1 || townHall.level == 2) {
                        this.numberChallenges = 1;
                    } else if (townHall.level == 3) {
                        this.numberChallenges = 2;
                    }
                }
            }
        }
    }

    hasRewards(): boolean {
        const rewards = this.rewards;
        if (rewards && (rewards.battleGoals || rewards.collectiveGold || rewards.custom || rewards.envelopes || rewards.events || rewards.experience || rewards.gold || rewards.items || rewards.chooseItem || rewards.itemDesigns || rewards.itemBlueprints || rewards.perks || rewards.prosperity || rewards.reputation || rewards.resources || rewards.collectiveResources || rewards.morale || rewards.inspiration || rewards.chooseUnlockCharacter || rewards.unlockCharacter || rewards.calenderSection || rewards.calenderSectionManual)) {
            return true;
        }
        return false;
    }

    hasBonus(): boolean {
        return ((gameManager.game.party.campaignMode || this.forceCampaign) && this.success) && (gameManager.characterManager.characterCount() < 4 || this.numberChallenges > 0);
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
        gameManager.stateManager.before("finishScenario.dialog.battleGoal", '' + index, '' + value);
        if (event.target.checked && this.battleGoals[index] < value) {
            this.battleGoals[index] = value;
        } else if (this.battleGoals[index] >= value) {
            this.battleGoals[index] = value - 1;
        }
        this.updateFinish();
        gameManager.stateManager.after();
    }

    toggleChallenges(second: boolean = false) {
        gameManager.stateManager.before("finishScenario.dialog.challenge" + (second ? 's' : ''));
        if (this.challenges > (second ? 1 : 0)) {
            this.challenges = (second ? 1 : 0);
        } else {
            this.challenges = (second ? 2 : 1);
        };
        this.updateFinish();
        gameManager.stateManager.after();
    }

    itemDistributed(index: number, itemIndex: number, choose: boolean = true): boolean {
        if (choose && this.rewards && this.rewards.chooseItem && this.rewardItems.some((rewardItem, rewardIndex) => rewardIndex != itemIndex && this.characters.some((char, charIndex) => this.itemDistributed(charIndex, rewardIndex, false)))) {
            return true;
        }

        const item = this.rewardItems[itemIndex];
        if (this.characters[index].progress.items.find((identifier) => identifier.name == '' + item.id && identifier.edition == item.edition)) {
            return true;
        }

        const itemData = this.rewardItems[itemIndex];
        const availableItems = choose ? itemData.count - this.characters.filter((character) => character.progress.items.find((identifier) => identifier.name == '' + itemData.id && identifier.edition == itemData.edition)).length : 1;

        return this.items[index].indexOf(itemIndex) == -1 && this.items.filter((list) => list.indexOf(itemIndex) != -1).length >= Math.min(this.rewardItemCount[itemIndex], availableItems);
    }

    toggleItem(event: any, index: number, itemIndex: number) {
        gameManager.stateManager.before("finishScenario.dialog.item", '' + index, '' + this.rewardItems[itemIndex].id);
        if (this.items[index].indexOf(itemIndex) == -1) {
            this.items[index].push(itemIndex);
        } else {
            this.items[index].splice(this.items[index].indexOf(itemIndex), 1);
        }
        this.updateFinish();
        gameManager.stateManager.after();
    }

    changeCollectiveGold(event: any, index: number) {
        gameManager.stateManager.before("finishScenario.dialog.collectiveGold", '' + index, event.target.value);
        this.collectiveGold[index] = +event.target.value;
        this.updateFinish();
        gameManager.stateManager.after();
    }

    changeCalenderSectionManual(event: any, index: number) {
        gameManager.stateManager.before("finishScenario.dialog.calenderSectionManual", '' + index, event.target.value);
        this.calenderSectionManual[index] = +event.target.value;
        this.updateFinish();
        gameManager.stateManager.after();
    }

    selectLocation(location: string) {
        gameManager.stateManager.before("finishScenario.dialog.chooseLocation", location);
        this.chooseLocation = location;
        this.updateFinish();
        gameManager.stateManager.after();
    }

    selectCharacter(character: string) {
        gameManager.stateManager.before("finishScenario.dialog.chooseUnlockCharacter", character);
        this.chooseUnlockCharacter = character;
        this.updateFinish();
        gameManager.stateManager.after();
    }

    openCharacterSheet(character: Character): void {
        this.dialog.open(CharacterSheetDialog, {
            panelClass: ['dialog-invert'],
            data: character
        });
    }

    finish(linkedIndex: string | undefined = undefined) {
        const linked = gameManager.scenarioData(this.scenario.edition).find((scenarioData) => scenarioData.group == this.scenario.group && scenarioData.index == linkedIndex);
        gameManager.stateManager.before(this.success && linked ? "finishScenario.linked" : ("finishScenario." + (this.success ? "success" : "failure")), ...gameManager.scenarioManager.scenarioUndoArgs(), linkedIndex ? linkedIndex : '');
        gameManager.game.figures.filter((figure) => figure instanceof Character).forEach((figure, index) => {
            (figure as Character).fromModel(this.characters[index].toModel());
        });

        if (this.success) {
            gameManager.game.figures.filter((figure) => figure instanceof Character).forEach((figure, index) => {
                const character = (figure as Character);
                if (!character.absent) {
                    if (this.battleGoals[index] > 0) {
                        character.progress.battleGoals += this.battleGoals[index];
                    }

                    if (this.collectiveGold[index] > 0) {
                        character.progress.gold += this.collectiveGold[index];
                    }

                    if (this.items[index] && this.items[index].length > 0) {
                        this.items[index].forEach((itemIndex) => {
                            const item = this.rewardItems[itemIndex]
                            character.progress.items.push(new Identifier('' + item.id, item.edition));
                        })
                    }

                    if (this.challenges) {
                        for (let i = 0; i < this.challenges; i++) {
                            character.progress.experience += 2;
                        }
                    }
                }
            })

            if (this.chooseLocation) {
                gameManager.game.party.manualScenarios.push(new GameScenarioModel(this.chooseLocation, this.scenario.edition, this.scenario.group));
            }

            if (this.chooseUnlockCharacter && gameManager.game.unlockedCharacters.indexOf(this.chooseUnlockCharacter) == -1) {
                gameManager.game.unlockedCharacters.push(this.chooseUnlockCharacter);
            }

            if (this.challenges) {
                for (let i = 0; i < this.challenges; i++) {
                    gameManager.game.party.townGuardPerks += 1;
                }
            }

            if (this.rewards && this.rewards.calenderSectionManual) {
                this.rewards.calenderSectionManual.forEach((sectionManual, index) => {
                    const week = gameManager.game.party.weeks + this.calenderSectionManual[index];
                    if (!gameManager.game.party.weekSections[week]) {
                        gameManager.game.party.weekSections[week] = [];
                    }
                    gameManager.game.party.weekSections[week]?.push(sectionManual.section);
                })
            }
        }
        gameManager.scenarioManager.finishScenario(this.gameManager.game.scenario, this.success, this.conclusion, false, linked ? new Scenario(linked) : undefined, this.casual && !this.forceCampaign);
        gameManager.stateManager.after(1000);
        this.dialogRef.close();
    }

    restart() {
        gameManager.stateManager.before("finishScenario.restart", ...gameManager.scenarioManager.scenarioUndoArgs());
        gameManager.scenarioManager.finishScenario(this.gameManager.game.scenario, this.success, this.conclusion, true);
        gameManager.stateManager.after(1000);
        this.dialogRef.close();
    }

    close() {
        this.dialogRef.close();
    }

    unlocked(character: string) {
        return gameManager.game.unlockedCharacters.indexOf(character) != -1;
    }
}
