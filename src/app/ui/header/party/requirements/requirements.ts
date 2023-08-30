import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";
import { Scenario } from "src/app/game/model/Scenario";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";


export class ScenarioMissingRequirements {

    globalAchievements: string[] = [];
    globalAchievementsCount: { name: string, count: number, required: number }[] = [];
    globalAchievementsMissing: string[] = [];
    partyAchievements: string[] = [];
    partyAchievementsCount: { name: string, count: number, required: number }[] = [];
    partyAchievementsMissing: string[] = [];
    campaignStickers: string[] = [];
    campaignStickersCount: { name: string, count: number, required: number }[] = [];
    campaignStickersMissing: string[] = [];
    buildings: string[] = [];
    buildingsLevel: { name: string, level: number }[] = [];
    buildingsMissing: string[] = [];
}

@Component({
    selector: 'ghs-requirements-dialog',
    templateUrl: 'requirements.html',
    styleUrls: ['./requirements.scss']
})
export class ScenarioRequirementsComponent {

    gameManager: GameManager = gameManager;

    solo: string = "";
    missingRequirements: ScenarioMissingRequirements[] = [];
    all: boolean = false;
    scenarioData: ScenarioData;
    hideMenu: boolean = false;
    hideAll: boolean = false;

    constructor(@Inject(DIALOG_DATA) public data: { scenarioData: ScenarioData, hideMenu: boolean }, private dialogRef: DialogRef) {
        this.scenarioData = data.scenarioData;
        this.hideMenu = data.hideMenu || false;
        this.update();
    }

    update() {
        this.missingRequirements = this.getRequirements(this.all);
        this.solo = "";
        this.hideAll = !this.all && JSON.stringify(this.getRequirements(true)) == JSON.stringify(this.missingRequirements);
    }

    getRequirements(all: boolean = false): ScenarioMissingRequirements[] {
        let missingRequirements: ScenarioMissingRequirements[] = [];
        if (this.scenarioData.solo && (all || !gameManager.game.figures.find((figure) => figure instanceof Character && figure.name == this.scenarioData.solo && figure.level >= 5))) {
            this.solo = this.scenarioData.solo;
        }

        if (this.scenarioData.requirements) {
            this.scenarioData.requirements.forEach((requirement) => {
                let add: boolean = false;
                let missingRequirement = new ScenarioMissingRequirements();
                if (requirement.global) {
                    requirement.global.forEach((achievement) => {
                        if (achievement.startsWith('!')) {
                            if (all || gameManager.game.party.globalAchievementsList.find((globalAchievement) => globalAchievement.toLowerCase().trim() == achievement.substring(1, achievement.length).toLowerCase().trim())) {
                                missingRequirement.globalAchievementsMissing.push(achievement.substring(1, achievement.length));
                                add = true;
                            }
                        } else if (achievement.indexOf(':') != -1 && (!isNaN(+achievement.split(':')[1]))) {
                            let count = +achievement.split(':')[1];
                            gameManager.game.party.globalAchievementsList.forEach((partyAchievement) => {
                                if (partyAchievement.toLowerCase().trim() == achievement.split(':')[0].toLowerCase().trim()) {
                                    count--;
                                }
                            })
                            if (all || count > 0) {
                                missingRequirement.globalAchievementsCount.push({ name: achievement.split(':')[0], count: count, required: +achievement.split(':')[1] });
                                add = true;
                            }
                        } else if (all || !gameManager.game.party.globalAchievementsList.find((globalAchievement) => globalAchievement.toLowerCase().trim() == achievement.toLowerCase().trim())) {
                            missingRequirement.globalAchievements.push(achievement);
                            add = true;
                        }
                    })
                }

                if (requirement.party) {
                    requirement.party.forEach((achievement) => {
                        if (achievement.startsWith('!')) {
                            if (all || gameManager.game.party.achievementsList.find((partyAchievement) => partyAchievement.toLowerCase().trim() == achievement.substring(1, achievement.length).toLowerCase().trim())) {
                                missingRequirement.partyAchievementsMissing.push(achievement.substring(1, achievement.length));
                                add = true;
                            }
                        } else if (achievement.indexOf(':') != -1 && (!isNaN(+achievement.split(':')[1]))) {
                            let count = +achievement.split(':')[1];
                            gameManager.game.party.achievementsList.forEach((partyAchievement) => {
                                if (partyAchievement.toLowerCase().trim() == achievement.split(':')[0].toLowerCase().trim()) {
                                    count--;
                                }
                            })
                            if (count > 0) {
                                missingRequirement.partyAchievementsCount.push({ name: achievement.split(':')[0], count: count, required: +achievement.split(':')[1] });
                                add = true;
                            }
                        } else if (all || !gameManager.game.party.achievementsList.find((partyAchievement) => partyAchievement.toLowerCase().trim() == achievement.toLowerCase().trim())) {
                            missingRequirement.partyAchievements.push(achievement);
                            add = true;
                        }
                    })
                }

                if (requirement.campaignSticker) {
                    requirement.campaignSticker.forEach((achievement) => {
                        if (achievement.startsWith('!')) {
                            if (all || gameManager.game.party.campaignStickers.find((campaignSticker) => campaignSticker.toLowerCase().trim() == achievement.substring(1, achievement.length).toLowerCase().trim())) {
                                missingRequirement.campaignStickersMissing.push(achievement.substring(1, achievement.length));
                                add = true;
                            }
                        } else if (achievement.indexOf(':') != -1 && (!isNaN(+achievement.split(':')[1]))) {
                            let count = +achievement.split(':')[1];
                            gameManager.game.party.campaignStickers.forEach((campaignSticker) => {
                                if (campaignSticker.toLowerCase().trim() == achievement.split(':')[0].toLowerCase().trim()) {
                                    count--;
                                }
                            })
                            if (count > 0) {
                                missingRequirement.campaignStickersCount.push({ name: achievement.split(':')[0], count: count, required: +achievement.split(':')[1] });
                                add = true;
                            }
                        } else if (all || !gameManager.game.party.campaignStickers.find((campaignSticker) => campaignSticker.toLowerCase().trim() == achievement.toLowerCase().trim())) {
                            missingRequirement.campaignStickers.push(achievement);
                            add = true;
                        }
                    })
                }

                if (requirement.buildings) {
                    requirement.buildings.forEach((achievement) => {
                        if (achievement.startsWith('!')) {
                            if (all || gameManager.game.party.buildings.find((buildingModel) => buildingModel.name.toLowerCase().trim() == achievement.substring(1, achievement.length).toLowerCase().trim() && buildingModel.level > 0)) {
                                missingRequirement.buildingsMissing.push(achievement.substring(1, achievement.length));
                                add = true;
                            }
                        } else if (achievement.indexOf(':') != -1) {
                            let level = +achievement.split(':')[1];
                            if (all || !gameManager.game.party.buildings.find((buildingModel) => buildingModel.name.toLowerCase().trim() == achievement.split(':')[0].toLowerCase().trim() && buildingModel.level >= level)) {
                                missingRequirement.buildingsLevel.push({ name: achievement.split(':')[0], level: level });
                                add = true;
                            }
                        } else if (all || !gameManager.game.party.buildings.find((buildingModel) => buildingModel.name.toLowerCase().trim() == achievement.toLowerCase().trim() && buildingModel.level > 0)) {
                            missingRequirement.buildings.push(achievement);
                            add = true;
                        }
                    })
                }

                if (add) {
                    missingRequirements.push(missingRequirement);
                }
            });
        }

        return missingRequirements;
    }

    startScenario() {
        gameManager.stateManager.before("setScenario", ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(this.scenarioData)));
        gameManager.scenarioManager.setScenario(new Scenario(this.scenarioData));
        gameManager.stateManager.after();
        this.close();
    }

    close() {
        this.dialogRef.close();
    }
}
