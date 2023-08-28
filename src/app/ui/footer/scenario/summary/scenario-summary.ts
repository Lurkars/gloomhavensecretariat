import { DialogRef, DIALOG_DATA, Dialog } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";
import { ItemData } from "src/app/game/model/data/ItemData";
import { ScenarioData, ScenarioFinish } from "src/app/game/model/data/ScenarioData";
import { ScenarioRewards } from "src/app/game/model/data/ScenarioRule";
import { CountIdentifier, Identifier } from "src/app/game/model/data/Identifier";
import { LootType } from "src/app/game/model/data/Loot";
import { GameScenarioModel, Scenario } from "src/app/game/model/Scenario";
import { CharacterSheetDialog } from "src/app/ui/figures/character/dialogs/character-sheet-dialog";
import { EntityValueFunction } from "src/app/game/model/Entity";
import { Subscription } from "rxjs";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { CharacterBattleGoalsDialog } from "src/app/ui/figures/battlegoal/dialog/battlegoal-dialog";
import { BattleGoal } from "src/app/game/model/data/BattleGoal";
import { ItemDialogComponent } from "src/app/ui/figures/items/dialog/item-dialog";


@Component({
    selector: 'ghs-scenario-summary',
    templateUrl: './scenario-summary.html',
    styleUrls: ['./scenario-summary.scss']
})
export class ScenarioSummaryComponent {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    LootType = LootType;

    scenario: Scenario;
    conclusion: ScenarioData | undefined;
    success: boolean;
    conclusionWarning: boolean;
    alreadyWarning: boolean = false;
    characterProgress: boolean = true;
    gainRewards: boolean = true;
    forceCampaign: boolean = false;
    conclusionOnly: boolean;
    rewardsOnly: boolean;

    characters: Character[];
    battleGoals: number[] = [];
    collectiveGold: number[] = [];
    lootColumns: LootType[] = [];
    lootColumnsLooted: number[] = [];
    lootColumnsTotal: number[] = [];
    lootedGold: number = 0;
    totalGold: number = 0;
    rewardItems: ItemData[] = [];
    rewardItemCount: number[] = [];
    items: number[][] = [];
    chooseLocation: string | undefined;
    chooseUnlockCharacter: string | undefined;
    rewards: ScenarioRewards | undefined = undefined;
    challenges: number = 0;
    numberChallenges: number = 0;
    calendarSectionManual: number[] = [];
    randomItem: ItemData | undefined;
    randomItemIndex: number = -1;
    randomItems: (ItemData | undefined)[] = [];
    randomItemBlueprints: number[] = [];

    EntityValueFunction = EntityValueFunction;

    constructor(@Inject(DIALOG_DATA) data: { scenario: Scenario, success: boolean, conclusion: ScenarioData | undefined, conclusionOnly: boolean, rewardsOnly: boolean }, private dialogRef: DialogRef, private dialog: Dialog) {

        this.scenario = data.scenario;
        this.success = data.success;
        this.conclusion = data.conclusion;
        this.conclusionOnly = data.conclusionOnly;
        this.rewardsOnly = data.rewardsOnly;
        if (this.conclusionOnly) {
            this.conclusion = this.scenario;
            this.success = true;
        }
        this.conclusionWarning = this.success && !this.conclusion && gameManager.sectionData(this.scenario.edition).find((sectionData) => sectionData.parent == this.scenario.index && sectionData.group == this.scenario.group && sectionData.edition == this.scenario.edition && sectionData.conclusion) != undefined;

        this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure, index) => {
            this.battleGoals[index] = 0;
            return figure as Character;
        }).sort((a, b) => {
            if (!a.absent && b.absent) {
                return -1;
            } else if (a.absent && !b.absent) {
                return 1;
            }
            const aName = a.title.toLowerCase() || settingsManager.getLabel('data.character.' + a.name).toLowerCase();
            const bName = b.title.toLowerCase() || settingsManager.getLabel('data.character.' + b.name).toLowerCase();
            if (aName > bName) {
                return 1;
            }
            if (aName < bName) {
                return -1;
            }
            return 0;
        });

        for (let value in LootType) {
            const lootType: LootType = value as LootType;
            if (lootType != LootType.money && lootType != LootType.special1 && lootType != LootType.special2 && this.lootColumns.indexOf(lootType) == -1 && this.characters.some((character) => character.lootCards && character.lootCards.some((index) => gameManager.game.lootDeck.cards[index].type == lootType))) {
                this.lootColumns.push(lootType);
                this.lootColumnsLooted.push(this.characters.map((character) => this.lootValue(character, lootType)).reduce((a, b) => a + b));
                this.lootColumnsTotal.push(gameManager.lootManager.getTotal(gameManager.game.lootDeck, lootType));
            }
        }

        if (gameManager.game.lootDeck && gameManager.game.lootDeck.cards.length > 0) {
            this.lootedGold = this.characters.map((character) => this.lootValue(character, LootType.money) + this.lootValue(character, LootType.special1) + this.lootValue(character, LootType.special2)).reduce((a, b) => a + b);
            this.totalGold = gameManager.lootManager.getTotal(gameManager.game.lootDeck, LootType.money);
            this.totalGold += gameManager.lootManager.getTotal(gameManager.game.lootDeck, LootType.special1);
            this.totalGold += gameManager.lootManager.getTotal(gameManager.game.lootDeck, LootType.special2);
        }

        this.alreadyWarning = !this.rewardsOnly && gameManager.game.party.campaignMode && this.success && (gameManager.game.party.scenarios.find((scenarioModel) => scenarioModel.index == this.scenario.index && scenarioModel.edition == this.scenario.edition && scenarioModel.group == this.scenario.group) != undefined || this.conclusion && gameManager.game.party.conclusions.find((scenarioModel) => this.conclusion && scenarioModel.index == this.conclusion.index && scenarioModel.edition == this.conclusion.edition && scenarioModel.group == this.conclusion.group) != undefined) || false;

        this.characterProgress = !this.rewardsOnly && !this.conclusionOnly && (gameManager.game.party.campaignMode || !gameManager.fhRules());
        this.gainRewards = gameManager.game.party.campaignMode;

        this.updateState()


        gameManager.stateManager.scenarioSummary = true;

        if (!gameManager.game.finish && !this.conclusionOnly) {
            gameManager.stateManager.before("finishScenario.dialog", ...gameManager.scenarioManager.scenarioUndoArgs());
            this.updateFinish();
            gameManager.stateManager.after();
        } else {
            this.loadFinish();
        }

        this.dialogRef.closed.subscribe({
            next: () => {
                if (gameManager.stateManager.scenarioSummary && !this.conclusionOnly) {
                    gameManager.stateManager.before("finishScenario.close", ...gameManager.scenarioManager.scenarioUndoArgs());
                    gameManager.stateManager.scenarioSummary = false;
                    gameManager.game.finish = undefined;
                    gameManager.stateManager.after();
                }
            }
        })

        this.uiChangeSubscription = gameManager.uiChange.subscribe({
            next: () => {
                if (!this.conclusionOnly) {
                    if (!gameManager.game.finish) {
                        gameManager.stateManager.scenarioSummary = false;
                        this.dialogRef.close();
                    } else {
                        this.loadFinish();
                    }
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
        finish.calendarSectionManual = this.calendarSectionManual;
        finish.randomItem = this.randomItem ? new Identifier('' + this.randomItem.id, this.randomItem.edition) : undefined;
        finish.randomItemIndex = this.randomItemIndex;
        finish.randomItems = this.randomItems ? this.randomItems.map((itemData) => itemData ? new Identifier('' + itemData.id, itemData.edition) : undefined) : [];
        finish.randomItemBlueprints = this.randomItemBlueprints;
        gameManager.game.finish = finish;
    }

    loadFinish() {
        if (gameManager.game.finish) {
            const finish = gameManager.game.finish;
            this.conclusion = finish.conclusion ? gameManager.sectionData(finish.conclusion.edition).find((sectionData) => finish.conclusion && sectionData.index == finish.conclusion.index && sectionData.group == finish.conclusion.group && sectionData.conclusion) : undefined;
            this.success = finish.success;
            this.battleGoals = finish.battleGoals;
            this.challenges = finish.challenges;
            this.chooseLocation = finish.chooseLocation;
            this.chooseUnlockCharacter = finish.chooseUnlockCharacter;
            this.collectiveGold = finish.collectiveGold;
            this.items = finish.items;
            this.calendarSectionManual = finish.calendarSectionManual;
            this.randomItem = finish.randomItem ? gameManager.itemManager.getItem(+finish.randomItem.name, finish.randomItem.edition, true) : undefined;
            this.randomItemIndex = finish.randomItemIndex;
            this.randomItems = finish.randomItems ? finish.randomItems.map((item) => item ? gameManager.itemManager.getItem(+item.name, item.edition, true) : undefined) : [];
            this.randomItemBlueprints = finish.randomItemBlueprints;
        }
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

            this.rewards = this.scenario.rewards;
            if (this.conclusion && this.conclusion.rewards) {
                if (!this.rewards) {
                    this.rewards = this.conclusion.rewards;
                } else {
                    Object.assign(this.rewards, this.conclusion.rewards)
                }
            }

            if (this.rewards) {
                if (this.rewards.collectiveGold) {
                    this.characters.forEach((char, index) => this.collectiveGold[index] = 0);
                }
                if (this.rewards.items) {
                    this.characters.forEach((char, index) => this.items[index] = []);
                    this.rewards.items.forEach((item, index) => {
                        const itemData = gameManager.itemManager.getItem(+item.split(':')[0].split('-')[0], item.split(':')[0].split('-').slice(1).join('-') || this.scenario.edition, true);
                        if (itemData) {
                            this.rewardItems.push(itemData);
                            this.rewardItemCount.push(item.indexOf(':') == -1 ? 1 : +item.split(':')[1]);

                            // add automatically on (potential) solo scenario
                            if (this.characters.filter((char) => !char.absent).length == 1) {
                                const char = this.characters.find((char) => !char.absent);
                                if (char) {
                                    this.items[this.characters.indexOf(char)].push(index);
                                }
                            }
                        } else {
                            console.error("Unknown Item '" + item + "' for scenario '" + this.scenario.index + " (" + this.scenario.edition + ")")
                        }

                    })
                }
                if (this.rewards.chooseItem) {
                    this.characters.forEach((char, index) => this.items[index] = []);
                    this.rewards.chooseItem.forEach((itemList) => {
                        itemList.forEach((item, index) => {
                            const itemData = gameManager.itemManager.getItem(+item.split(':')[0].split('-')[0], item.split(':')[0].split('-').slice(1).join('-') || this.scenario.edition, true);
                            if (itemData) {
                                this.rewardItems.push(itemData);
                                this.rewardItemCount.push(item.indexOf(':') == -1 ? 1 : +item.split(':')[1]);
                            } else {
                                console.error("Unknown Item '" + item + "' for scenario '" + this.scenario.index + " (" + this.scenario.edition + ")")
                            }

                        })
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
                if (this.rewards.calendarSectionManual) {
                    this.rewards.calendarSectionManual.forEach((section, index) => this.calendarSectionManual[index] = 0);
                }

                if (this.rewards.randomItemBlueprint && this.randomItemBlueprints.length < this.rewards.randomItemBlueprint) {

                    let availableItems = gameManager.itemManager.getItems(this.scenario.edition, true).filter((itemData) => itemData.blueprint && !gameManager.game.party.unlockedItems.find((identifier) => identifier.name == '' + itemData.id && identifier.edition == itemData.edition) && (!itemData.requiredBuilding || gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == itemData.requiredBuilding && buildingModel.level >= itemData.requiredBuildingLevel)));

                    for (let i = this.randomItemBlueprints.length; i < this.rewards.randomItemBlueprint; i++) {
                        let itemData = availableItems[Math.floor(Math.random() * availableItems.length)];
                        let item: Identifier | undefined = itemData ? new Identifier('' + itemData.id, itemData.edition) : undefined;
                        while (availableItems.length > 0 && gameManager.game.party.unlockedItems.find((unlocked) => item && unlocked.name == item.name && unlocked.edition == item.edition)) {
                            availableItems = availableItems.filter((available) => item && (available.id + '' != item.name || available.edition != item.edition));
                            if (availableItems.length > 0) {
                                itemData = availableItems[Math.floor(Math.random() * availableItems.length)];
                                item = new Identifier('' + itemData.id, itemData.edition);
                            } else {
                                item = undefined;
                            }
                        }
                        this.randomItemBlueprints.push(item ? (+item.name) : -1);
                    }
                }

                if (this.rewards.randomItem) {
                    if (!this.randomItem) {
                        const from = +this.rewards.randomItem.split('-')[0];
                        const to = +this.rewards.randomItem.split('-')[1];
                        const itemEdition = this.rewards.randomItem.split('-').length > 2 ? this.rewards.randomItem.split('-')[2] : this.scenario.edition;

                        let availableItems = gameManager.itemManager.getItems(this.scenario.edition, true).filter((itemData) => itemData.id >= from && itemData.id <= to && itemData.edition == itemEdition);


                        let itemData = availableItems[Math.floor(Math.random() * availableItems.length)];
                        let item: Identifier | undefined = itemData ? new Identifier('' + itemData.id, itemData.edition) : undefined;
                        while (availableItems.length > 0 && this.characters.flatMap((character) => character.progress.items).filter((owned) => item && owned.name == item.name && owned.edition == item.edition).length >= itemData.count) {
                            availableItems = availableItems.filter((available) => item && (available.id + '' != item.name || available.edition != item.edition));
                            if (availableItems.length > 0) {
                                itemData = availableItems[Math.floor(Math.random() * availableItems.length)];
                                item = new Identifier('' + itemData.id, itemData.edition);
                            } else {
                                item = undefined;
                            }
                        }

                        if (item && itemData) {
                            this.randomItem = itemData;
                        }
                    }
                }

                if (this.rewards.randomItems) {
                    if (this.randomItems.length < this.characters.length && this.rewards.randomItems.split('-').length > 1) {
                        const from = +this.rewards.randomItems.split('-')[0];
                        const to = +this.rewards.randomItems.split('-')[1];
                        const itemEdition = this.rewards.randomItems.split('-').length > 2 ? this.rewards.randomItems.split('-')[2] : this.scenario.edition;

                        let availableItems = gameManager.itemManager.getItems(this.scenario.edition, true).filter((itemData) => itemData.id >= from && itemData.id <= to && itemData.edition == itemEdition);

                        for (let i = this.randomItems.length; i < this.characters.length; i++) {
                            const character = this.characters[i];
                            if (character.absent) {
                                this.randomItems.push(undefined);
                            } else {
                                let itemData = availableItems[Math.floor(Math.random() * availableItems.length)];
                                let item: Identifier | undefined = itemData ? new Identifier('' + itemData.id, itemData.edition) : undefined;
                                while (availableItems.length > 0 && this.characters.flatMap((character) => character.progress.items).filter((owned) => item && owned.name == item.name && owned.edition == item.edition).length >= itemData.count) {
                                    availableItems = availableItems.filter((available) => item && (available.id + '' != item.name || available.edition != item.edition));
                                    if (availableItems.length > 0) {
                                        itemData = availableItems[Math.floor(Math.random() * availableItems.length)];
                                        item = new Identifier('' + itemData.id, itemData.edition);
                                    } else {
                                        item = undefined;
                                    }
                                }

                                while (availableItems.find((available) => !character.progress.items.find((owned) => owned.name == available.id + '' && owned.edition == available.edition)) && character.progress.items.find((owned) => item && owned.name == item.name + '' && owned.edition == item.edition)) {
                                    itemData = availableItems[Math.floor(Math.random() * availableItems.length)];
                                    item = new Identifier('' + itemData.id, itemData.edition);
                                }

                                if (character.progress.items.find((owned) => item && owned.name == item.name + '' && owned.edition == item.edition)) {
                                    item = undefined;
                                }

                                this.randomItems.push(item && itemData ? itemData : undefined);
                            }
                        }
                    }
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
        if (rewards && (rewards.envelopes || rewards.gold || rewards.experience || rewards.collectiveGold || rewards.resources || rewards.collectiveResources || rewards.reputation || rewards.prosperity || rewards.inspiration || rewards.morale || rewards.perks || rewards.battleGoals || rewards.items || rewards.chooseItem || rewards.itemDesigns || rewards.itemBlueprints || rewards.randomItemBlueprint || rewards.events || rewards.chooseUnlockCharacter || rewards.unlockCharacter || rewards.custom || rewards.townGuardAm)) {
            return true;
        }
        return false;
    }

    hasBonus(): boolean {
        return ((gameManager.game.party.campaignMode || this.forceCampaign) && this.success && !this.conclusionOnly && !this.scenario.solo) && (gameManager.fhRules() && gameManager.characterManager.characterCount() < 4 || this.numberChallenges > 0);
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
        const character = this.characters[index];
        gameManager.stateManager.before("finishScenario.battleGoal", character.name, '' + value);
        let battleGoal: BattleGoal | undefined;

        if (settingsManager.settings.battleGoals) {
            if (character.battleGoal && character.battleGoals.length > 0) {
                battleGoal = gameManager.battleGoalManager.getBattleGoal(character.battleGoals[0]);
            }
        }
        if (event.target.checked && this.battleGoals[index] < value) {
            this.battleGoals[index] = value;
            if (battleGoal && battleGoal.checks > value) {
                this.battleGoals[index] = battleGoal.checks;
            }
        } else if (this.battleGoals[index] >= value) {
            this.battleGoals[index] = value - 1;
            if (battleGoal && battleGoal.checks > value - 1) {
                this.battleGoals[index] = 0;
            }
        }

        this.updateFinish();
        gameManager.stateManager.after();
    }

    openBattleGoals(character: Character): void {
        this.dialog.open(CharacterBattleGoalsDialog, {
            panelClass: ['dialog'],
            data: { character: character, cardOnly: character.battleGoal }
        });
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
        if (!this.items[index]) {
            this.items[index] = [];
        }
        if (choose && this.rewards && this.rewards.chooseItem) {
            let startIndex = 0;
            let endIndex = 0;
            let count = 0;
            let found = false;
            this.rewards.chooseItem.forEach((itemList) => {
                if (!found && itemIndex < (itemList.length + count)) {
                    endIndex = itemList.length + count - 1;
                    found = true;
                }
                count += itemList.length;
                if (!found) {
                    startIndex = count;
                }
            });
            if (this.rewardItems.some((rewardItem, rewardIndex) => rewardIndex != itemIndex && (rewardIndex < startIndex || rewardIndex > endIndex) && this.characters.some((char, charIndex) => this.itemDistributed(charIndex, rewardIndex, false)))) {
                return true;
            }
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

    toggleRandomItem(event: any, index: number) {
        gameManager.stateManager.before("finishScenario.dialog.item", '' + index);
        this.randomItemIndex = this.randomItemIndex == index ? -1 : index;
        this.updateFinish();
        gameManager.stateManager.after();
    }

    openItemDialog(itemData: ItemData | undefined) {
        if (itemData) {
            this.dialog.open(ItemDialogComponent, {
                data: itemData
            })
        }
    }

    changeCollectiveGold(event: any, index: number) {
        gameManager.stateManager.before("finishScenario.dialog.collectiveGold", '' + index, event.target.value);
        this.collectiveGold[index] = +event.target.value;
        this.updateFinish();
        gameManager.stateManager.after();
    }

    changeCalendarSectionManual(event: any, index: number) {
        gameManager.stateManager.before("finishScenario.dialog.calendarSectionManual", '' + index, event.target.value);
        this.calendarSectionManual[index] = +event.target.value;
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

    toggleAbsent(character: Character): void {
        gameManager.stateManager.before(character.absent ? "unsetAbsent" : "setAbsent", "data.character." + character.name);
        character.absent = !character.absent;
        gameManager.stateManager.after();
    }

    finish(linkedIndex: string | undefined = undefined) {
        const linked = gameManager.scenarioData(this.scenario.edition).find((scenarioData) => scenarioData.group == this.scenario.group && scenarioData.index == linkedIndex);
        if (this.conclusionOnly) {
            gameManager.stateManager.before("finishConclusion", ...gameManager.scenarioManager.scenarioUndoArgs(this.scenario));
        } else {
            gameManager.stateManager.before(this.success && linked ? "finishScenario.linked" : ("finishScenario." + (this.success ? "success" : "failure")), ...gameManager.scenarioManager.scenarioUndoArgs(), linkedIndex ? linkedIndex : '');
        }

        if (this.success) {
            gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure as Character).sort((a, b) => {
                const aName = a.title.toLowerCase() || settingsManager.getLabel('data.character.' + a.name).toLowerCase();
                const bName = b.title.toLowerCase() || settingsManager.getLabel('data.character.' + b.name).toLowerCase();
                if (aName > bName) {
                    return 1;
                }
                if (aName < bName) {
                    return -1;
                }
                return 0;
            }).forEach((character, index) => {
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
                            gameManager.itemManager.addItemCount(item);
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

            if (settingsManager.settings.automaticUnlocking && this.chooseUnlockCharacter && gameManager.game.unlockedCharacters.indexOf(this.chooseUnlockCharacter) == -1) {
                gameManager.game.unlockedCharacters.push(this.chooseUnlockCharacter);
            }

            if (this.challenges) {
                for (let i = 0; i < this.challenges; i++) {
                    gameManager.game.party.townGuardPerks += 1;
                }
            }

            if ((this.gainRewards || this.forceCampaign) && this.randomItemBlueprints.length > 0) {
                this.randomItemBlueprints.forEach((itemId) => {
                    if (itemId == -1) {
                        gameManager.game.party.inspiration += 1;
                    } else {
                        gameManager.game.party.unlockedItems.push(new CountIdentifier('' + itemId, this.scenario.edition));
                    }
                })
            }

            if ((this.gainRewards || this.forceCampaign) && this.rewards && this.rewards.calendarSectionManual) {
                this.rewards.calendarSectionManual.forEach((sectionManual, index) => {
                    const week = gameManager.game.party.weeks + this.calendarSectionManual[index];
                    if (!gameManager.game.party.weekSections[week]) {
                        gameManager.game.party.weekSections[week] = [];
                    }
                    gameManager.game.party.weekSections[week]?.push(sectionManual.section);
                })
            }
        }
        if (this.conclusionOnly) {
            gameManager.scenarioManager.finishScenario(this.scenario, true, this.conclusion, false, undefined, this.characterProgress || this.forceCampaign, this.gainRewards || this.forceCampaign, true);
        } else {
            gameManager.scenarioManager.finishScenario(gameManager.game.scenario, this.success, this.conclusion, false, linked ? new Scenario(linked) : undefined, this.characterProgress || this.forceCampaign, this.gainRewards || this.forceCampaign);
        }
        gameManager.stateManager.after(1000);
        this.dialogRef.close();

        if (settingsManager.settings.autoBackup > -1 && settingsManager.settings.autoBackupFinish && (settingsManager.settings.autoBackup == 0 || (gameManager.game.revision + gameManager.game.revisionOffset) % settingsManager.settings.autoBackup != 0)) {
            gameManager.stateManager.autoBackup();
        }
    }

    restart() {
        gameManager.stateManager.before("finishScenario.restart", ...gameManager.scenarioManager.scenarioUndoArgs());
        gameManager.scenarioManager.finishScenario(this.gameManager.game.scenario, this.success, this.conclusion, true, undefined, this.characterProgress || this.forceCampaign, this.gainRewards || this.forceCampaign, true);
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
