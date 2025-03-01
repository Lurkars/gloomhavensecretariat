import { DIALOG_DATA, Dialog, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { AttackModifier, additionalTownGuardAttackModifier } from "src/app/game/model/data/AttackModifier";
import { BattleGoal } from "src/app/game/model/data/BattleGoal";
import { CountIdentifier, Identifier } from "src/app/game/model/data/Identifier";
import { ItemData } from "src/app/game/model/data/ItemData";
import { LootType } from "src/app/game/model/data/Loot";
import { ScenarioData, ScenarioFinish, ScenarioRewards } from "src/app/game/model/data/ScenarioData";
import { EntityValueFunction } from "src/app/game/model/Entity";
import { GameScenarioModel, Scenario } from "src/app/game/model/Scenario";
import { CharacterBattleGoalsDialog } from "src/app/ui/figures/battlegoal/dialog/battlegoal-dialog";
import { ChallengeDialogComponent } from "src/app/ui/figures/challenges/dialog/challenge-dialog";
import { CharacterSheetDialog } from "src/app/ui/figures/character/dialogs/character-sheet-dialog";
import { ItemDialogComponent } from "src/app/ui/figures/items/dialog/item-dialog";
import { TrialDialogComponent } from "src/app/ui/figures/trials/dialog/trial-dialog";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";

@Component({
    standalone: false,
    selector: 'ghs-scenario-summary',
    templateUrl: './scenario-summary.html',
    styleUrls: ['./scenario-summary.scss']
})
export class ScenarioSummaryComponent implements OnDestroy {

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
    collectiveResources: Partial<Record<LootType, number>>[] = [];
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
    trials: boolean[] = [];
    trial349: Character | undefined;
    trial356: Character | undefined;
    townGuardAMs: AttackModifier[] = [];
    levelUp: boolean[] = [];
    perksUp: boolean[] = [];
    stats: boolean = false;

    EntityValueFunction = EntityValueFunction;

    waitForClose: boolean = false;

    constructor(@Inject(DIALOG_DATA) data: { scenario: Scenario, success: boolean, conclusion: ScenarioData | undefined, conclusionOnly: boolean, rewardsOnly: boolean }, private dialogRef: DialogRef, private dialog: Dialog) {

        this.scenario = data.scenario;
        this.success = data.success;
        this.conclusion = data.conclusion;
        this.conclusionOnly = data.conclusionOnly;
        this.rewardsOnly = data.rewardsOnly;
        if (this.conclusionOnly) {
            this.conclusion = this.scenario;
            this.success = true;
            if (this.conclusion.repeatable || gameManager.game.party.conclusions.find((conclusion) => conclusion.index == this.scenario.index && conclusion.edition == this.scenario.edition && conclusion.group == this.scenario.group)) {
                this.rewardsOnly = true;
            }
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
            const aName = gameManager.characterManager.characterName(a).toLowerCase();
            const bName = gameManager.characterManager.characterName(b).toLowerCase();
            if (aName > bName) {
                return 1;
            }
            if (aName < bName) {
                return -1;
            }
            return 0;
        });

        this.trial349 = this.characters.find((character) => character.progress.trial && character.progress.trial.edition == 'fh' && character.progress.trial.name == '349');

        this.trial356 = this.characters.find((character) => character.progress.trial && character.progress.trial.edition == 'fh' && character.progress.trial.name == '356');

        for (let value in LootType) {
            const lootType: LootType = value as LootType;
            if (lootType != LootType.money && lootType != LootType.special1 && lootType != LootType.special2 && this.lootColumns.indexOf(lootType) == -1 && this.characters.some((character) => character.lootCards && character.lootCards.some((index) => gameManager.game.lootDeck.cards[index].type == lootType))) {
                this.lootColumns.push(lootType);
                this.lootColumnsLooted.push(this.characters.map((character) => this.lootValue(character, lootType)).reduce((a, b) => a + b));
                this.lootColumnsTotal.push(gameManager.lootManager.getTotal(gameManager.game.lootDeck, lootType));
            }
        }

        if (gameManager.game.lootDeck && gameManager.game.lootDeck.cards.length > 0) {
            if (this.characters.length > 0) {
                this.lootedGold = this.characters.map((character) => this.lootValue(character, LootType.money) + this.lootValue(character, LootType.special1) + this.lootValue(character, LootType.special2)).reduce((a, b) => a + b);
            }
            this.totalGold = gameManager.lootManager.getTotal(gameManager.game.lootDeck, LootType.money);
            this.totalGold += gameManager.lootManager.getTotal(gameManager.game.lootDeck, LootType.special1);
            this.totalGold += gameManager.lootManager.getTotal(gameManager.game.lootDeck, LootType.special2);
        }

        this.alreadyWarning = !this.rewardsOnly && gameManager.game.party.campaignMode && this.success && (gameManager.scenarioManager.isSuccess(this.scenario) || this.conclusion && gameManager.game.party.conclusions.find((scenarioModel) => this.conclusion && scenarioModel.index == this.conclusion.index && scenarioModel.edition == this.conclusion.edition && scenarioModel.group == this.conclusion.group) != undefined) || false;

        this.characterProgress = !this.rewardsOnly && !this.conclusionOnly && (gameManager.game.party.campaignMode || !gameManager.fhRules());
        this.gainRewards = gameManager.game.party.campaignMode;

        this.updateState()


        gameManager.stateManager.scenarioSummary = true;

        if (!gameManager.game.finish && !this.conclusionOnly && !this.rewardsOnly) {
            gameManager.stateManager.before("finishScenario.dialog", ...gameManager.scenarioManager.scenarioUndoArgs());
            this.updateFinish();
            gameManager.stateManager.after();
        } else if (!this.rewardsOnly) {
            this.loadFinish();
        }

        this.dialogRef.closed.subscribe({
            next: () => {
                if (gameManager.stateManager.scenarioSummary && !this.conclusionOnly && !this.rewardsOnly && !this.waitForClose) {
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
                        this.close();
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
        finish.collectiveResources = this.collectiveResources || [];
        finish.items = this.items;
        finish.calendarSectionManual = this.calendarSectionManual;
        finish.randomItem = this.randomItem ? new Identifier('' + this.randomItem.id, this.randomItem.edition) : undefined;
        finish.randomItemIndex = this.randomItemIndex;
        finish.randomItems = this.randomItems ? this.randomItems.map((itemData) => itemData ? new Identifier('' + itemData.id, itemData.edition) : undefined) : [];
        finish.randomItemBlueprints = this.randomItemBlueprints;
        finish.trials = this.trials;
        gameManager.game.finish = finish;
        this.updateState();
    }

    loadFinish() {
        if (gameManager.game.finish) {
            const finish = gameManager.game.finish;
            this.conclusion = finish.conclusion ? gameManager.sectionData(finish.conclusion.edition).find((sectionData) => finish.conclusion && sectionData.index == finish.conclusion.index && sectionData.group == finish.conclusion.group && sectionData.conclusion) : undefined;
            this.success = finish.success;
            this.battleGoals = finish.battleGoals || [];
            this.challenges = finish.challenges;
            this.chooseLocation = finish.chooseLocation;
            this.chooseUnlockCharacter = finish.chooseUnlockCharacter;
            this.collectiveGold = finish.collectiveGold || [];
            this.collectiveResources = finish.collectiveResources || [];
            this.items = finish.items;
            this.calendarSectionManual = finish.calendarSectionManual || finish.calenderSectionManual;
            this.randomItem = finish.randomItem ? gameManager.itemManager.getItem(finish.randomItem.name, finish.randomItem.edition, true) : undefined;
            this.randomItemIndex = finish.randomItemIndex;
            this.randomItems = finish.randomItems ? finish.randomItems.map((item) => item ? gameManager.itemManager.getItem(item.name, item.edition, true) : undefined) : [];
            this.randomItemBlueprints = finish.randomItemBlueprints || [];
            this.trials = finish.trials || [];
            this.updateState();
        }
    }

    updateState(forceCampaign: boolean = false): void {
        this.forceCampaign = forceCampaign;
        this.numberChallenges = 0;
        this.rewards = undefined;
        this.townGuardAMs = [];
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

            if (settingsManager.settings.scenarioRewards && this.rewards) {
                if (this.rewards.collectiveGold) {
                    this.characters.forEach((char, index) => {
                        if (!this.collectiveGold[index]) {
                            this.collectiveGold[index] = 0
                        }
                    });
                }
                if (this.rewards.collectiveResources) {
                    this.collectiveResources = this.collectiveResources || [];
                    this.characters.forEach((char, index) => {
                        if (!this.collectiveResources[index]) {
                            this.collectiveResources[index] = {};
                        }
                    });
                }
                if (this.rewards.items) {
                    this.rewards.items.forEach((item, index) => {
                        const itemData = gameManager.itemManager.getItem(item.split(':')[0].split('-')[0], item.split(':')[0].split('-').slice(1).join('-') || this.scenario.edition, true);
                        if (itemData) {
                            this.rewardItems[index] = itemData;
                            this.rewardItemCount[index] = item.indexOf(':') == -1 ? 1 : +item.split(':')[1];

                            // add automatically on (potential) solo scenario
                            if (this.characters.filter((char) => !char.absent).length == 1) {
                                const char = this.characters.find((char) => !char.absent);
                                if (char) {
                                    if (this.items[this.characters.indexOf(char)] === undefined) {
                                        this.items[this.characters.indexOf(char)] = [];
                                    }
                                    if (this.items[this.characters.indexOf(char)].indexOf(index) == -1) {
                                        this.items[this.characters.indexOf(char)].push(index);
                                    }
                                }
                            }
                        } else {
                            console.error("Unknown Item '" + item + "' for scenario '" + this.scenario.index + " (" + this.scenario.edition + ")")
                        }

                    })
                }
                if (this.rewards.chooseItem) {
                    let index = 0;
                    this.rewards.chooseItem.forEach((itemList) => {
                        itemList.forEach((item) => {
                            const itemData = gameManager.itemManager.getItem(item.split(':')[0].split('-')[0], item.split(':')[0].split('-').slice(1).join('-') || this.scenario.edition, true);
                            if (itemData) {
                                this.rewardItems[index] = itemData;
                                this.rewardItemCount[index] = item.indexOf(':') == -1 ? 1 : +item.split(':')[1];
                                index++;
                            } else {
                                console.error("Unknown Item '" + item + "' for scenario '" + this.scenario.index + " (" + this.scenario.edition + ")")
                            }

                        })
                    })
                }
                if (this.rewards.chooseLocation && this.rewards.chooseLocation.length > 0 && !this.chooseLocation) {
                    this.chooseLocation = this.rewards.chooseLocation[0];
                }
                if (this.rewards.chooseUnlockCharacter && this.rewards.chooseUnlockCharacter.length > 0 && !this.chooseUnlockCharacter) {
                    let index = 0;
                    while (index < this.rewards.chooseUnlockCharacter.length && gameManager.game.unlockedCharacters.indexOf(this.rewards.chooseUnlockCharacter[index]) != -1) {
                        index++;
                    }
                    if (index < this.rewards.chooseUnlockCharacter.length) {
                        this.chooseUnlockCharacter = this.rewards.chooseUnlockCharacter[index];
                    }
                }
                if (this.rewards.calendarSectionManual) {
                    this.rewards.calendarSectionManual.forEach((section, index) => {
                        if (!this.calendarSectionManual[index]) {
                            this.calendarSectionManual[index] = 0;
                        }
                    });
                }

                if (settingsManager.settings.scenarioRewardsItems && this.rewards.randomItemBlueprint && this.randomItemBlueprints.length < this.rewards.randomItemBlueprint) {
                    for (let i = this.randomItemBlueprints.length; i < this.rewards.randomItemBlueprint; i++) {
                        let itemData = gameManager.itemManager.drawRandomItem(this.scenario.edition, true);
                        let item: Identifier | undefined = itemData ? new Identifier('' + itemData.id, itemData.edition) : undefined;
                        this.randomItemBlueprints[i] = item ? (+item.name) : -1;
                    }
                }

                if (settingsManager.settings.scenarioRewardsItems && this.rewards.randomItem) {
                    if (!this.randomItem) {
                        const from = +this.rewards.randomItem.split('-')[0];
                        const to = +this.rewards.randomItem.split('-')[1];
                        const itemEdition = this.rewards.randomItem.split('-').length > 2 ? this.rewards.randomItem.split('-')[2] : this.scenario.edition;
                        let itemData = gameManager.itemManager.drawRandomItem(itemEdition, false, from, to);
                        if (itemData) {
                            this.randomItem = itemData;
                        }
                    }
                }

                if (settingsManager.settings.scenarioRewardsItems && this.rewards.randomItems) {
                    if (this.randomItems.length < this.characters.length && this.rewards.randomItems.split('-').length > 1) {
                        const from = +this.rewards.randomItems.split('-')[0];
                        const to = +this.rewards.randomItems.split('-')[1];
                        const itemEdition = this.rewards.randomItems.split('-').length > 2 ? this.rewards.randomItems.split('-')[2] : this.scenario.edition;
                        for (let i = this.randomItems.length; i < this.characters.length; i++) {
                            const character = this.characters[i];
                            if (character.absent) {
                                this.randomItems[i] = undefined;
                            } else {
                                let itemData = gameManager.itemManager.drawRandomItem(itemEdition, false, from, to);
                                if (character.progress.items.find((owned) => itemData && owned.name == itemData.id + '' && owned.edition == itemData.edition)) {
                                    itemData = undefined;
                                }
                                this.randomItems[i] = itemData ? itemData : undefined;
                            }
                        }
                    }
                }

                if (this.rewards.townGuardAm) {
                    this.townGuardAMs = this.rewards.townGuardAm.map((id) => additionalTownGuardAttackModifier.find((am) => am.id == id) as AttackModifier);
                }
            }

            if (gameManager.challengesManager.enabled) {
                this.numberChallenges = gameManager.game.challengeDeck.keep.length;
            } else if (gameManager.fhRules()) {
                const townHall = gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == 'town-hall' && buildingModel.level && buildingModel.state != 'wrecked');
                if (townHall) {
                    if (townHall.level == 1 || townHall.level == 2) {
                        this.numberChallenges = 1;
                    } else if (townHall.level == 3) {
                        this.numberChallenges = 2;
                    }
                }
            }

        }

        this.characters.forEach((character, index) => {
            const newXP = character.progress.experience + this.challenges * 2 + character.experience + (this.success && this.rewards &&
                this.rewards.experience ?
                this.rewards.experience : 0) + ((this.success && (!this.rewards || !this.rewards.ignoredBonus ||
                    this.rewards.ignoredBonus.indexOf('experience') == -1) ? gameManager.levelManager.experience() : 0));
            this.levelUp[index] = gameManager.characterManager.levelForXp(newXP) > gameManager.characterManager.levelForXp(character.progress.experience);

            const currentPerks = Math.floor(character.progress.battleGoals / 3);
            const newPerks = Math.floor((character.progress.battleGoals
                + this.battleGoals[index]) / 3);
            this.perksUp[index] = newPerks > currentPerks;

            if (settingsManager.settings.scenarioStats && !character.absent) {
                gameManager.scenarioStatsManager.applyScenarioStats(character, this.scenario, this.success);
            }
        })
    }

    hasRewards(): boolean {
        const rewards = this.rewards;
        if (rewards && (rewards.envelopes || rewards.gold || rewards.experience || rewards.collectiveGold || rewards.resources || rewards.collectiveResources || rewards.reputation || rewards.prosperity || rewards.inspiration || rewards.morale || rewards.perks || rewards.battleGoals || rewards.items || rewards.chooseItem || rewards.itemDesigns || rewards.itemBlueprints || rewards.randomItemBlueprint || rewards.randomItemBlueprints || rewards.events || rewards.chooseUnlockCharacter || rewards.unlockCharacter || rewards.custom || rewards.lootDeckCards || rewards.removeLootDeckCards || rewards.townGuardAm || rewards.overlayCampaignSticker || rewards.overlaySticker || rewards.pet)) {
            return true;
        }
        return false;
    }

    hasBonus(): boolean {
        return ((gameManager.game.party.campaignMode || this.forceCampaign) && this.success && !this.conclusionOnly && !this.scenario.solo) && (gameManager.fhRules() && (gameManager.characterManager.characterCount() < 4 && (!this.rewards || !this.rewards.ignoredBonus || this.rewards.ignoredBonus.indexOf('inspiration') == -1)) || this.numberChallenges > 0);
    }

    addWeek(): boolean {
        return gameManager.fhRules() && ((gameManager.game.party.campaignMode || this.forceCampaign) && this.success && !this.conclusionOnly && !this.scenario.solo) && !this.scenario.conclusion && (!this.rewards || !this.rewards.calendarIgnore) && (!this.scenario.forcedLinks || !this.scenario.forcedLinks.length) && (!this.conclusion || !this.conclusion.forcedLinks || !this.conclusion.forcedLinks.length) && settingsManager.settings.automaticPassTime && settingsManager.settings.partySheet;
    }

    weekSections(): ScenarioData[] {
        let result: ScenarioData[] = [];
        const editionData = gameManager.editionData.find((editionData) => editionData.edition == this.scenario.edition);
        let weekSections: string[] = [];
        if (editionData && editionData.campaign) {
            weekSections.push(...editionData.campaign.weeks && editionData.campaign.weeks[gameManager.game.party.weeks + 1] || []);
        }

        weekSections.push(...gameManager.game.party.weekSections[gameManager.game.party.weeks + 1] || []);

        weekSections.forEach((section) => {
            const sectionData = gameManager.sectionData(this.scenario.edition).find((sectionData) => sectionData.index == section && sectionData.group == this.scenario.group && sectionData.conclusion);
            if (sectionData) {
                result.push(sectionData);
            }
        })

        return result;
    }

    showWeekConclusion(sectionData: ScenarioData) {
        const scenario = new Scenario(sectionData);
        this.dialog.open(ScenarioSummaryComponent, {
            panelClass: ['dialog'],
            data: {
                scenario: scenario,
                conclusionOnly: true,
                rewardsOnly: true
            }
        })
    }

    availableCollectiveGold(): number {
        return this.rewards && this.rewards.collectiveGold && this.collectiveGold.length > 0 && (this.rewards.collectiveGold - this.collectiveGold.reduce((a, b) => a + b)) || 0;
    }

    availableCollectiveResource(type: LootType): number {
        const resource: { type: LootType, value: number | string } = this.rewards && this.rewards.collectiveResources && this.rewards.collectiveResources.find((value) => value.type == type) || { type: type, value: 0 };

        const value = EntityValueFunction(resource.value);

        return value > 0 && (value - (this.collectiveResources && this.collectiveResources.length > 0 ? this.collectiveResources.map((value) => value[type] || 0).reduce((a, b) => a + b) : 0)) || 0;
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

    toggleBattleGoal(event: any, index: number, value: number) {
        const character = this.characters[index];
        gameManager.stateManager.before("finishScenario.battleGoal", character.name, value);
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

    openTrial(character: Character): void {
        if (character.progress.trial) {
            this.dialog.open(TrialDialogComponent, {
                panelClass: ['fullscreen-panel'],
                data: {
                    edition: character.progress.trial.edition,
                    trial: +character.progress.trial.name
                }
            });
        }
    }

    openChallenge(index: number): void {
        if (gameManager.game.challengeDeck.cards[index]) {
            this.dialog.open(ChallengeDialogComponent, {
                panelClass: ['fullscreen-panel'],
                data: gameManager.game.challengeDeck.cards[index]
            });
        }
    }

    toggleTrial(event: any, index: number) {
        const character = this.characters[index];
        gameManager.stateManager.before("finishScenario.trial", character.name, this.trials[index]);
        this.trials[index] = event.target.checked;
        this.updateFinish();
        gameManager.stateManager.after();
    }

    toggleChallenges(event: any, second: boolean = false) {
        gameManager.stateManager.before("finishScenario.dialog.challenge" + (second ? 's' : ''));
        if (this.challenges < 1 && second && gameManager.challengesManager.enabled) {
            const card = gameManager.game.challengeDeck.cards.splice(gameManager.game.challengeDeck.keep[0], 1)[0];
            gameManager.game.challengeDeck.cards.splice(gameManager.game.challengeDeck.keep[1], 0, card);
            this.challenges = 1;
            event.target.checked = false;
        } else if (this.challenges > (second ? 1 : 0)) {
            this.challenges = (second ? 1 : 0);
        } else {
            this.challenges = (second ? 2 : 1);
        }
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
        gameManager.stateManager.before("finishScenario.dialog.item", index, this.rewardItems[itemIndex].id);
        if (this.items[index].indexOf(itemIndex) == -1) {
            this.items[index].push(itemIndex);
        } else {
            this.items[index].splice(this.items[index].indexOf(itemIndex), 1);
        }
        this.updateFinish();
        gameManager.stateManager.after();
    }

    toggleRandomItem(event: any, index: number) {
        gameManager.stateManager.before("finishScenario.dialog.item", index);
        this.randomItemIndex = this.randomItemIndex == index ? -1 : index;
        this.updateFinish();
        gameManager.stateManager.after();
    }

    openItemDialog(itemData: ItemData | undefined) {
        if (itemData) {
            this.dialog.open(ItemDialogComponent, {
                panelClass: ['fullscreen-panel'],
                disableClose: true,
                data: { item: itemData }
            })
        }
    }

    changeCollectiveGold(event: any, index: number) {
        let value = +event.target.value;
        const old = this.collectiveGold[index] || 0;
        this.collectiveGold[index] = 0;
        if (value < 0) {
            value = 0;
        } else if (value > this.availableCollectiveGold()) {
            value = this.availableCollectiveGold();
        }
        this.collectiveGold[index] = old;
        if (value != (this.collectiveGold[index] || 0)) {
            gameManager.stateManager.before("finishScenario.dialog.collectiveGold", index, event.target.value);
            this.collectiveGold[index] = +event.target.value;
            this.updateFinish();
            gameManager.stateManager.after();
        }
        event.target.value = value;
    }

    changeCollectiveResource(event: any, index: number, type: LootType) {
        let value = +event.target.value;
        if (!this.collectiveResources[index]) {
            this.collectiveResources[index] = {};
        }
        const old = this.collectiveResources[index][type] || 0;
        this.collectiveResources[index][type] = 0;
        if (value < 0) {
            value = 0;
        } else if (value > this.availableCollectiveResource(type)) {
            value = this.availableCollectiveResource(type);
        }
        this.collectiveResources[index][type] = old;
        if (value != (this.collectiveResources[index][type] || 0)) {
            gameManager.stateManager.before("finishScenario.dialog.collectiveResource", type, index, event.target.value);
            this.collectiveResources[index] = this.collectiveResources[index] || {};
            this.collectiveResources[index][type] = value;
            this.updateFinish();
            gameManager.stateManager.after();
        }
        event.target.value = value;
    }

    changeCalendarSectionManual(event: any, index: number) {
        gameManager.stateManager.before("finishScenario.dialog.calendarSectionManual", index, event.target.value);
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
            data: { character: character }
        });
    }

    toggleAbsent(character: Character): void {
        gameManager.stateManager.before(character.absent ? "unsetAbsent" : "setAbsent", gameManager.characterManager.characterName(character));
        character.absent = !character.absent;
        gameManager.stateManager.after();
    }

    async finish(linkedIndex: string | undefined = undefined) {
        this.waitForClose = true;
        const linked = gameManager.scenarioData(this.scenario.edition).find((scenarioData) => scenarioData.group == this.scenario.group && scenarioData.index == linkedIndex);
        if (this.conclusionOnly) {
            gameManager.stateManager.before("finishConclusion", ...gameManager.scenarioManager.scenarioUndoArgs(this.scenario));
        } else {
            gameManager.stateManager.before(this.success && linked ? "finishScenario.linked" : ("finishScenario." + (this.success ? "success" : "failure")), ...gameManager.scenarioManager.scenarioUndoArgs(), linkedIndex ? linkedIndex : '');
        }

        if (settingsManager.settings.scenarioRewards && this.success && !gameManager.bbRules()) {
            this.characters.forEach((character, index) => {
                if (!character.absent) {
                    if (this.battleGoals[index] > 0) {
                        character.progress.battleGoals += this.battleGoals[index];
                    }

                    if (this.trials[index]) {
                        character.progress.trial = undefined;
                    }

                    if (this.collectiveGold[index] > 0) {
                        character.progress.gold += this.collectiveGold[index];
                    }

                    if (this.collectiveResources[index]) {
                        Object.keys(this.collectiveResources[index]).forEach((value) => {
                            const lootType: LootType = value as LootType;
                            character.progress.loot[lootType] = (character.progress.loot[lootType] || 0) + (this.collectiveResources[index][lootType] || 0);
                        })
                    }

                    this.rewardItems.forEach((item, itemIndex) => {
                        if (this.items.every((items) => items.indexOf(itemIndex) == -1)) {
                            this.items[index] = this.items[index] || [];
                            this.items[index].push(itemIndex);
                        }
                    })

                    if (this.items[index] && this.items[index].length > 0) {
                        this.items[index].forEach((itemIndex) => {
                            const item = this.rewardItems[itemIndex];
                            if (settingsManager.settings.characterItems) {
                                character.progress.items.push(new Identifier('' + item.id, item.edition));
                            }
                            gameManager.itemManager.addItemCount(item);
                        })
                    }

                    if (this.challenges) {
                        for (let i = 0; i < this.challenges; i++) {
                            character.progress.experience += 2;
                        }
                    }

                    // Favors
                    if (gameManager.trialsManager.favorsEnabled && gameManager.trialsManager.apply) {
                        // FH Wealth
                        character.progress.gold += character.loot * gameManager.trialsManager.activeFavor('fh', 'wealth');

                        // FH Knowledge
                        if (this.battleGoals[index]) {
                            character.progress.experience += 3 * gameManager.trialsManager.activeFavor('fh', 'knowledge');
                        }
                    }
                }
            })

            if (this.rewards && this.rewards.collectiveResources) {
                this.rewards.collectiveResources.forEach((value) => {
                    const available = this.availableCollectiveResource(value.type);
                    if (available) {
                        gameManager.game.party.loot[value.type] = (gameManager.game.party.loot[value.type] || 0) + available;
                    }
                })
            }

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
                    if (this.calendarSectionManual[index] >= 0) {
                        const week = gameManager.game.party.weeks + this.calendarSectionManual[index];
                        gameManager.game.party.weekSections[week] = [...(gameManager.game.party.weekSections[week] || []), sectionManual.section];
                    }
                })
            }

            if (gameManager.challengesManager.enabled && this.challenges) {
                gameManager.game.challengeDeck.finished += this.challenges;
            }

            gameManager.trialsManager.applyTrialCards();
        }
        if (this.conclusionOnly) {
            gameManager.scenarioManager.finishScenario(this.scenario, true, this.conclusion, false, undefined, settingsManager.settings.scenarioRewards && (this.characterProgress || this.forceCampaign), this.gainRewards || this.forceCampaign, true);
        } else {
            gameManager.scenarioManager.finishScenario(gameManager.game.scenario, this.success, this.conclusion, false, linked ? new Scenario(linked) : undefined, settingsManager.settings.scenarioRewards && !gameManager.bbRules() && (this.characterProgress || this.forceCampaign), this.gainRewards || this.forceCampaign);
        }
        await gameManager.stateManager.after(0, settingsManager.settings.autoBackup > -1 && settingsManager.settings.autoBackupFinish && (settingsManager.settings.autoBackup == 0 || (gameManager.game.revision + gameManager.game.revisionOffset) % settingsManager.settings.autoBackup != 0));

        this.close();
    }

    restart() {
        this.waitForClose = true;
        gameManager.stateManager.before("finishScenario.restart", ...gameManager.scenarioManager.scenarioUndoArgs());
        gameManager.scenarioManager.finishScenario(this.gameManager.game.scenario, this.success, this.conclusion, true, undefined, settingsManager.settings.scenarioRewards && (this.characterProgress || this.forceCampaign), this.gainRewards || this.forceCampaign, false);
        gameManager.stateManager.after(1000);
        this.close();
    }

    close() {
        ghsDialogClosingHelper(this.dialogRef);
    }

    unlocked(character: string) {
        return gameManager.game.unlockedCharacters.indexOf(character) != -1;
    }

    scenarioLinkAvailable(index: string): boolean {
        const linkScenarioData = gameManager.scenarioData(this.scenario.edition).find((scenarioData) => scenarioData.index == index && scenarioData.group == this.scenario.group);
        if (linkScenarioData) {
            return !gameManager.scenarioManager.isBlocked(linkScenarioData) && !gameManager.scenarioManager.isLocked(linkScenarioData);
        }
        return true;
    }
}
