import { DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { CampaignData } from "src/app/game/model/data/EditionData";

@Component({
    selector: 'ghs-party-week-dialog',
    templateUrl: 'week-dialog.html',
    styleUrls: ['./week-dialog.scss']
})
export class PartyWeekDialogComponent {

    gameManager: GameManager = gameManager;

    constructor(@Inject(DIALOG_DATA) public week: number) { }

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
            gameManager.stateManager.after();
        }
    }

}
