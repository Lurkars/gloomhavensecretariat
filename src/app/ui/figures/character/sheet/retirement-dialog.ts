import { Dialog, DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { BuildingModel } from "src/app/game/model/Building";
import { Character } from "src/app/game/model/Character";
import { BuildingData } from "src/app/game/model/data/BuildingData";
import { CountIdentifier } from "src/app/game/model/data/Identifier";
import { ItemData } from "src/app/game/model/data/ItemData";
import { LootType, resourceLootTypes } from "src/app/game/model/data/Loot";
import { PersonalQuest } from "src/app/game/model/data/PersonalQuest";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { GameScenarioModel } from "src/app/game/model/Scenario";
import { ScenarioSummaryComponent } from "src/app/ui/footer/scenario/summary/scenario-summary";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";
import { CharacterMoveResourcesDialog } from "./move-resources";
import { ItemDialogComponent } from "../../items/dialog/item-dialog";

@Component({
    standalone: false,
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
    unlockEvent: string = '';
    alreadyRetired: boolean = false;
    characterAlreadyUnlocked: boolean = false;
    characterScenario: ScenarioData | undefined;
    characterItemDesign: ItemData | undefined;
    envelopeAlreadyUnlocked: boolean = false;
    envelopeSection: ScenarioData | undefined;
    envelopeItemBlueprint: ItemData | undefined;

    additional: boolean = false;
    additionalPQ: PersonalQuest | undefined;
    additionalPQBuilding: BuildingData | undefined;
    additionalUnlockEvent: string = '';
    additionalCharacterAlreadyUnlocked: boolean = false;
    additionalCharacterScenario: ScenarioData | undefined;
    additionalCharacterItemDesign: ItemData | undefined;
    additionalEnvelopeAlreadyUnlocked: boolean = false;
    additionalEnvelopeSection: ScenarioData | undefined;
    additionalEnvelopeItemBlueprint: ItemData | undefined;

    hasResources: boolean = false;

    constructor(@Inject(DIALOG_DATA) public character: Character, private dialogRef: DialogRef, private dialog: Dialog) {
        this.conclusion = gameManager.sectionData(this.character.edition).find((sectionData) => sectionData.retirement == this.character.name && sectionData.conclusion);
        if (this.character.progress.personalQuest) {
            this.personalQuest = gameManager.characterManager.personalQuestByCard(gameManager.currentEdition(), this.character.progress.personalQuest);

            if (settingsManager.settings.unlockEnvelopeBuildings && this.personalQuest && this.personalQuest.openEnvelope) {
                this.personalQuestBuilding = this.buildingsEnvelopeHelper(this.personalQuest.openEnvelope);
            }
        }

        for (let key of Object.keys(this.character.progress.loot)) {
            const loot: LootType = key as LootType;
            if (resourceLootTypes.indexOf(loot) != -1 && this.character.progress.loot[loot]) {
                this.hasResources = true;
            }
        }

        if (this.personalQuest) {
            if (this.personalQuest.unlockCharacter) {
                this.characterAlreadyUnlocked = gameManager.game.unlockedCharacters.indexOf(this.personalQuest.unlockCharacter) != -1;
                if (!this.characterAlreadyUnlocked) {
                    const unlockCharacter = gameManager.charactersData(this.personalQuest.edition).find((characterData) => this.personalQuest && characterData.edition == this.personalQuest.edition && characterData.name == this.personalQuest.unlockCharacter);
                    this.unlockEvent = unlockCharacter && unlockCharacter.unlockEvent || '';
                } else {
                    this.characterScenario = gameManager.scenarioManager.drawRandomScenario(gameManager.currentEdition());
                    this.characterItemDesign = gameManager.itemManager.drawRandomItem(gameManager.currentEdition());
                }
            }

            if (this.personalQuest.openEnvelope && gameManager.fhRules()) {
                this.envelopeAlreadyUnlocked = !this.buildingsEnvelopeHelper(this.personalQuest.openEnvelope, false) && !this.buildingsEnvelopeHelper(this.personalQuest.openEnvelope);
                if (this.envelopeAlreadyUnlocked) {
                    this.envelopeSection = gameManager.scenarioManager.drawRandomScenarioSection(gameManager.currentEdition());
                    this.envelopeItemBlueprint = gameManager.itemManager.drawRandomItem(gameManager.currentEdition(), true);
                }
            }
        }

        this.alreadyRetired = gameManager.game.party.retirements.find((retired) => retired.edition == this.character.edition && retired.name == this.character.name) != undefined;
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

        if (this.characterAlreadyUnlocked) {
            if (this.characterScenario) {
                gameManager.game.party.manualScenarios.push(new GameScenarioModel(this.characterScenario.index, this.characterScenario.edition, this.characterScenario.group));
            }

            if (this.characterItemDesign) {
                gameManager.game.party.unlockedItems.push(new CountIdentifier('' + this.characterItemDesign.id, this.characterItemDesign.edition));

            }
        }

        if (this.additionalCharacterAlreadyUnlocked) {
            if (this.additionalCharacterScenario) {
                gameManager.game.party.manualScenarios.push(new GameScenarioModel(this.additionalCharacterScenario.index, this.additionalCharacterScenario.edition, this.additionalCharacterScenario.group));
            }

            if (this.additionalCharacterItemDesign) {
                gameManager.game.party.unlockedItems.push(new CountIdentifier('' + this.additionalCharacterItemDesign.id, this.additionalCharacterItemDesign.edition));

            }
        }

        if (this.envelopeAlreadyUnlocked) {
            if (this.envelopeSection) {
                gameManager.game.party.conclusions.push(new GameScenarioModel('' + this.envelopeSection.index, this.envelopeSection.edition, this.envelopeSection.group));
                if (this.envelopeSection.unlocks) {
                    this.envelopeSection.unlocks.forEach((unlock) => {
                        if (this.envelopeSection) {
                            gameManager.game.party.manualScenarios.push(new GameScenarioModel(unlock, this.envelopeSection.edition));
                        }
                    })
                }
            } else {
                gameManager.game.party.inspiration += 1;
            }

            if (this.envelopeItemBlueprint) {
                gameManager.game.party.unlockedItems.push(new CountIdentifier('' + this.envelopeItemBlueprint.id, this.envelopeItemBlueprint.edition));
            } else {
                gameManager.game.party.inspiration += 1;
            }
        }

        if (this.additionalEnvelopeAlreadyUnlocked) {
            if (this.additionalEnvelopeSection) {
                gameManager.game.party.conclusions.push(new GameScenarioModel('' + this.additionalEnvelopeSection.index, this.additionalEnvelopeSection.edition, this.additionalEnvelopeSection.group));
                if (this.additionalEnvelopeSection.unlocks) {
                    this.additionalEnvelopeSection.unlocks.forEach((unlock) => {
                        if (this.envelopeSection) {
                            gameManager.game.party.manualScenarios.push(new GameScenarioModel(unlock, this.envelopeSection.edition));
                        }
                    })
                }
            } else {
                gameManager.game.party.inspiration += 1;
            }

            if (this.additionalEnvelopeItemBlueprint) {
                gameManager.game.party.unlockedItems.push(new CountIdentifier('' + this.additionalEnvelopeItemBlueprint.id, this.additionalEnvelopeItemBlueprint.edition));
            } else {
                gameManager.game.party.inspiration += 1;
            }
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

    buildingsEnvelopeHelper(envelope: string, both: boolean = true): BuildingData | undefined {
        const buildingData = gameManager.campaignData().buildings;
        const buildings = envelope.split(':').map((id) => buildingData.find((buildingData) => buildingData.id === id)).filter((buildingData) => buildingData).map((buildingData) => buildingData as BuildingData);
        if (buildings.length > 0) {
            if (!gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == buildings[0].name) && (!this.personalQuestBuilding || this.personalQuestBuilding != buildings[0])) {
                return buildings[0];
            } else if (both && buildings.length > 1 && !gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == buildings[1].name)) {
                return buildings[1];
            }
        }

        return undefined;
    }

    changeAdditionalPQ(event: any) {
        this.additionalPQ = gameManager.characterManager.personalQuestByCard(gameManager.currentEdition(), event.target.value);

        if (this.additionalPQ) {
            if (settingsManager.settings.unlockEnvelopeBuildings && this.additionalPQ.openEnvelope) {
                this.additionalPQBuilding = this.buildingsEnvelopeHelper(this.additionalPQ.openEnvelope);
            }

            if (this.additionalPQ.unlockCharacter) {
                this.additionalCharacterAlreadyUnlocked = gameManager.game.unlockedCharacters.indexOf(this.additionalPQ.unlockCharacter) != -1;
                if (!this.characterAlreadyUnlocked) {
                    const unlockCharacter = gameManager.charactersData(this.additionalPQ.edition).find((characterData) => this.additionalPQ && characterData.edition == this.additionalPQ.edition && characterData.name == this.additionalPQ.unlockCharacter);
                    this.additionalUnlockEvent = unlockCharacter && unlockCharacter.unlockEvent || '';
                } else {
                    this.additionalCharacterScenario = gameManager.scenarioManager.drawRandomScenario(gameManager.currentEdition());
                    this.additionalCharacterItemDesign = gameManager.itemManager.drawRandomItem(gameManager.currentEdition());
                }
            }

            if (this.additionalPQ.openEnvelope && gameManager.fhRules()) {
                this.additionalEnvelopeAlreadyUnlocked = !this.buildingsEnvelopeHelper(this.additionalPQ.openEnvelope, false) && !this.buildingsEnvelopeHelper(this.additionalPQ.openEnvelope);

                if (this.additionalEnvelopeAlreadyUnlocked) {
                    this.additionalEnvelopeSection = gameManager.scenarioManager.drawRandomScenarioSection(gameManager.currentEdition());
                    this.additionalEnvelopeItemBlueprint = gameManager.itemManager.drawRandomItem(gameManager.currentEdition(), true);
                }
            }
        }
    }

    itemDialog(item: ItemData) {
        this.dialog.open(ItemDialogComponent, {
            panelClass: ['fullscreen-panel'],
            disableClose: true,
            data: { item: item }
        });
    }

    close() {
        ghsDialogClosingHelper(this.dialogRef);
    }

}