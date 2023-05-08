import { DIALOG_DATA, Dialog } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { CampaignData } from "src/app/game/model/data/EditionData";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { ScenarioConclusionComponent } from "../../../footer/scenario/scenario-conclusion/scenario-conclusion";
import { Scenario } from "src/app/game/model/Scenario";

@Component({
    selector: 'ghs-party-week-dialog',
    templateUrl: 'week-dialog.html',
    styleUrls: ['./week-dialog.scss']
})
export class PartyWeekDialogComponent {

    gameManager: GameManager = gameManager;

    constructor(@Inject(DIALOG_DATA) public week: number, private dialog: Dialog) { }

    campaignData(): CampaignData | undefined {
        const editionData = gameManager.editionData.find((editionData) => editionData.edition == gameManager.currentEdition());

        if (editionData && editionData.campaign) {
            return editionData.campaign;
        }

        return undefined;
    }

    sectionsFixed(): string[] {
        const campaign = this.campaignData();
        if (campaign && campaign.weeks && campaign.weeks[this.week]) {
            return campaign.weeks[this.week] || [];
        }
        return [];
    }

    sections(): string[] {
        return gameManager.game.party.weekSections[this.week] || [];
    }

    isConclusion(section: string): boolean {
        return gameManager.game.party.conclusions.find((model) => model.edition == gameManager.game.edition && model.index == section) != undefined;
    }

    hasConclusions(section: string): boolean {
        const conclusions = gameManager.sectionData(gameManager.game.edition).filter((sectionData) => sectionData.conclusion && !sectionData.parent && sectionData.parentSections && sectionData.parentSections.length == 1 && sectionData.parentSections.find((parentSections) => parentSections.length == 1 && parentSections.indexOf(section) != -1));
        return conclusions.length > 0 && conclusions.every((conclusion) => !gameManager.game.party.conclusions.find((model) => model.edition == conclusion.edition && model.index == conclusion.index && model.group == conclusion.group));
    }

    openConclusions(section: string) {
        let conclusions: ScenarioData[] = gameManager.sectionData(gameManager.game.edition).filter((sectionData) => sectionData.conclusion && !sectionData.parent && sectionData.parentSections && sectionData.parentSections.length == 1 && sectionData.parentSections.find((parentSections) => parentSections.length == 1 && parentSections.indexOf(section) != -1)).map((conclusion) => {
            conclusion.name = "";
            return conclusion;
        });

        if (conclusions.length > 0) {
            this.dialog.open(ScenarioConclusionComponent, {
                panelClass: ['dialog'],
                data: { conclusions: conclusions, parent: gameManager.sectionData(gameManager.game.edition).find((sectionData) => sectionData.index == section && !sectionData.group) }
            }).closed.subscribe({
                next: (conclusion) => {
                    if (conclusion) {
                        const scenario = new Scenario(conclusion as ScenarioData);
                        gameManager.stateManager.before("finishConclusion", ...gameManager.scenarioManager.scenarioUndoArgs(scenario));
                        gameManager.scenarioManager.finishScenario(scenario, true, undefined, false, undefined, false, true);
                        gameManager.game.party.weekSections[this.week] = gameManager.game.party.weekSections[this.week] || [];
                        gameManager.game.party.weekSections[this.week]?.push(scenario.index);
                        gameManager.stateManager.after();
                    }
                }
            });
        }
    }

    addSection(sectionElement: HTMLInputElement) {
        if (!gameManager.game.party.weekSections[this.week]) {
            gameManager.game.party.weekSections[this.week] = [];
        }
        sectionElement.classList.add('error');
        if (gameManager.game.party.weekSections[this.week]?.indexOf(sectionElement.value) == -1) {
            gameManager.stateManager.before("addPartyWeekSection", gameManager.game.party.name, this.week + '', sectionElement.value + '');
            gameManager.game.party.weekSections[this.week]?.push(sectionElement.value);
            sectionElement.classList.remove('error');
            sectionElement.value = "";
            gameManager.stateManager.after();
        }
    }

    removeSection(section: string) {
        if (gameManager.game.party.weekSections[this.week]?.indexOf(section) != -1) {
            gameManager.stateManager.before("removePartyWeekSection", gameManager.game.party.name, this.week + '', section + '');
            gameManager.game.party.weekSections[this.week]?.splice(gameManager.game.party.weekSections[this.week]?.indexOf(section) || -1, 1);
            if (gameManager.game.party.weekSections[this.week]?.length == 0) {
                delete gameManager.game.party.weekSections[this.week];
            }
            if (this.isConclusion(section)) {
                gameManager.game.party.conclusions = gameManager.game.party.conclusions.filter((conclusion) => conclusion.edition != gameManager.game.edition || conclusion.index != section);
            }
            gameManager.stateManager.after();
        }
    }

}
