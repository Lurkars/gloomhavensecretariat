import { Dialog, DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { BuildingModel } from "src/app/game/model/Building";
import { Character } from "src/app/game/model/Character";
import { BuildingData } from "src/app/game/model/data/BuildingData";
import { PersonalQuest } from "src/app/game/model/data/PersonalQuest";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { ScenarioSummaryComponent } from "src/app/ui/footer/scenario/summary/scenario-summary";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";
import { CharacterMoveResourcesDialog } from "./move-resources";

@Component({
    selector: 'ghs-character-retirement-dialog',
    templateUrl: 'retirement-dialog.html',
    styleUrls: ['./retirement-dialog.scss']
})
export class CharacterRetirementDialog {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;

    conclusion: ScenarioData | undefined;
    personalQuest: PersonalQuest | undefined;
    personalQuestBuilding: BuildingData | undefined;
    additional: boolean = false;
    additionalPQ: PersonalQuest | undefined;
    additionalPQBuilding: BuildingData | undefined;

    constructor(@Inject(DIALOG_DATA) public character: Character, private dialogRef: DialogRef, private dialog: Dialog) {
        this.conclusion = gameManager.sectionData(this.character.edition).find((sectionData) => sectionData.retirement == this.character.name && sectionData.conclusion);
        if (this.character.progress.personalQuest) {
            this.personalQuest = gameManager.characterManager.personalQuestByCard(gameManager.currentEdition(), this.character.progress.personalQuest);

            if (settingsManager.settings.unlockEnvelopeBuildings && this.personalQuest && this.personalQuest.openEnvelope) {
                this.personalQuestBuilding = this.buildingsEnvelopeHelper(this.personalQuest.openEnvelope);
            }
        }
    }

    openConclusion() {
        if (this.conclusion) {
            this.dialog.open(ScenarioSummaryComponent, {
                panelClass: ['dialog'],
                data: {
                    scenario: this.conclusion,
                    conclusionOnly: true,
                    rewardsOnly: gameManager.game.party.conclusions.find((value) => this.conclusion && value.edition == this.conclusion.edition && value.group == this.conclusion.group && value.index == this.conclusion.index) != undefined
                }
            })
        }
    }

    moveResources() {
        this.dialog.open(CharacterMoveResourcesDialog, {
            panelClass: ['dialog'],
            data: { character: this.character, all: true }
        });
    }

    apply() {
        ghsDialogClosingHelper(this.dialogRef, true);

        gameManager.stateManager.before("setRetired", gameManager.characterManager.characterName(this.character));
        this.character.progress.retired = true;
        gameManager.game.party.retirements.push(this.character.toModel());
        gameManager.characterManager.removeCharacter(this.character, true);

        if (this.personalQuest && this.personalQuest.unlockCharacter && settingsManager.settings.automaticUnlocking && gameManager.game.unlockedCharacters.indexOf(this.personalQuest.unlockCharacter) == -1) {
            gameManager.game.unlockedCharacters.push(this.personalQuest.unlockCharacter);
        }

        if (this.additional) {
            gameManager.game.party.inspiration -= 15;
            gameManager.game.party.prosperity += 2;
            if (this.additionalPQ && this.additionalPQ.unlockCharacter && settingsManager.settings.automaticUnlocking && gameManager.game.unlockedCharacters.indexOf(this.additionalPQ.unlockCharacter) == -1) {
                gameManager.game.unlockedCharacters.push(this.additionalPQ.unlockCharacter);
            }
        }

        if (settingsManager.settings.unlockEnvelopeBuildings) {
            if (this.personalQuestBuilding) {
                gameManager.game.party.buildings.push(new BuildingModel(this.personalQuestBuilding.name, 0));
            }
            if (this.additionalPQBuilding) {
                gameManager.game.party.buildings.push(new BuildingModel(this.additionalPQBuilding.name, 0));
            }
        }

        gameManager.stateManager.after();

        if (this.conclusion && !gameManager.game.party.conclusions.find((value) => this.conclusion && value.edition == this.conclusion.edition && value.group == this.conclusion.group && value.index == this.conclusion.index)) {
            this.openConclusion();
        }
    }

    buildingsEnvelopeHelper(envelope: string): BuildingData | undefined {
        const buildingData = gameManager.campaignData().buildings;
        const buildings = envelope.split(':').map((id) => buildingData.find((buildingData) => buildingData.id === id)).filter((buildingData) => buildingData).map((buildingData) => buildingData as BuildingData);
        if (buildings.length > 0) {
            if (!gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == buildings[0].name) && (!this.personalQuestBuilding || this.personalQuestBuilding != buildings[0])) {
                return buildings[0];
            } else if (buildings.length > 1 && !gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == buildings[1].name)) {
                return buildings[1];
            }
        }

        return undefined;
    }

    changeAdditionalPQ(event: any) {
        this.additionalPQ = gameManager.characterManager.personalQuestByCard(gameManager.currentEdition(), event.target.value);

        if (settingsManager.settings.unlockEnvelopeBuildings && this.additionalPQ && this.additionalPQ.openEnvelope) {
            this.additionalPQBuilding = this.buildingsEnvelopeHelper(this.additionalPQ.openEnvelope);
        }
    }

    close() {
        ghsDialogClosingHelper(this.dialogRef);
    }

}