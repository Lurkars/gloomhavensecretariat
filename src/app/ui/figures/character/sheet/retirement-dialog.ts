import { DialogRef, DIALOG_DATA, Dialog } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";
import { CharacterMoveResourcesDialog } from "./move-resources";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { ScenarioSummaryComponent } from "src/app/ui/footer/scenario/summary/scenario-summary";
import { PersonalQuest } from "src/app/game/model/data/PersonalQuest";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";

@Component({
    selector: 'ghs-character-retirement-dialog',
    templateUrl: 'retirement-dialog.html',
    styleUrls: ['./retirement-dialog.scss']
})
export class CharacterRetirementDialog {

    gameManager: GameManager = gameManager;

    conclusion: ScenarioData | undefined;
    personalQuest: PersonalQuest | undefined;

    constructor(@Inject(DIALOG_DATA) public character: Character, private dialogRef: DialogRef, private dialog: Dialog) {
        this.conclusion = gameManager.sectionData(this.character.edition).find((sectionData) => sectionData.retirement == this.character.name && sectionData.conclusion);
        if (this.character.progress.personalQuest) {
            this.personalQuest = gameManager.characterManager.personalQuestByCard(gameManager.currentEdition(), this.character.progress.personalQuest);
        }
    }

    openConclusion() {
        if (this.conclusion) {
            this.dialog.open(ScenarioSummaryComponent, {
                panelClass: 'dialog',
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
            panelClass: 'dialog',
            data: { character: this.character, all: true }
        });
    }

    apply() {
        this.dialogRef.close(true);
        if (this.personalQuest && this.personalQuest.unlockCharacter && settingsManager.settings.automaticUnlocking && gameManager.game.unlockedCharacters.indexOf(this.personalQuest.unlockCharacter) == -1) {
            gameManager.game.unlockedCharacters.push(this.personalQuest.unlockCharacter);
        }

        if (this.conclusion && !gameManager.game.party.conclusions.find((value) => this.conclusion && value.edition == this.conclusion.edition && value.group == this.conclusion.group && value.index == this.conclusion.index)) {
            this.openConclusion();
        }
    }

    close() {
        this.dialogRef.close();
    }

}