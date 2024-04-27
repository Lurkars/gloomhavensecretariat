import { Component } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { storageManager } from "src/app/game/businesslogic/StorageManager";
import { ObjectiveData } from "src/app/game/model/data/ObjectiveData";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { Monster } from "src/app/game/model/Monster";
import { ObjectiveContainer } from "src/app/game/model/ObjectiveContainer";
import packageJson from '../../../../../package.json';

@Component({
    selector: 'ghs-feedback-dialog',
    templateUrl: './feedback-dialog.html',
    styleUrls: ['./feedback-dialog.scss']
})
export class FeedbackDialogComponent {

    gameManager: GameManager = gameManager;
    form: string = "issue";

    scenarioMail(scenarioName: string, index: string, notes: string): string {
        let mailto = 'mailto:scenario@gloomhaven-secretariat.de';

        let scenario = new ScenarioData();

        scenario.name = scenarioName;
        scenario.index = index;
        scenario.monsters = gameManager.game.figures.filter((figure) => figure instanceof Monster).map((figure) => (figure as Monster).name);
        scenario.allies = gameManager.game.figures.filter((figure) => figure instanceof Monster && figure.isAlly).map((figure) => (figure as Monster).name);
        scenario.allied = gameManager.game.figures.filter((figure) => figure instanceof Monster && figure.isAllied).map((figure) => (figure as Monster).name);
        scenario.drawExtra = gameManager.game.figures.filter((figure) => figure instanceof Monster && figure.drawExtra).map((figure) => (figure as Monster).name);
        scenario.objectives = gameManager.game.figures.filter((figure) => figure instanceof ObjectiveContainer).map((figure) => {
            if (figure instanceof ObjectiveContainer) {
                if (figure.objectiveId) {
                    const objectiveData = gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(figure.objectiveId);
                    if (objectiveData) {
                        return objectiveData;
                    }
                }
                const objective = figure as ObjectiveContainer;
                return new ObjectiveData(objective.name, objective.health, objective.escort, -1, objective.marker, [], objective.initiative);
            }
            return new ObjectiveData(figure.name, 0, false);
        });
        scenario.rooms = gameManager.game.scenario?.rooms || [];
        scenario.marker = gameManager.game.scenario?.marker || "";
        scenario.rules = gameManager.game.scenario?.rules || [];
        scenario.edition = gameManager.game.scenario?.edition || gameManager.currentEdition();

        mailto += '?subject=Submit Scenario #' + scenario.index + ' ' + scenario.name + ' (' + settingsManager.getLabel('data.edition.' + scenario.edition) + ')';

        mailto += '&body=' + notes + '%0D%0A%0D%0AJSON:%0D%0A' + JSON.stringify(scenario, undefined, 2);

        return mailto;
    }

    issueMail(type: string, text: string): string {
        let mailto = 'mailto:issue@gloomhaven-secretariat.de';

        if (type == 'feedback') {
            mailto = 'mailto:feedback@gloomhaven-secretariat.de';
        }

        mailto += '?subject=[GHS v' + packageJson.version + '] ' + settingsManager.getLabel('tools.feedback.reportIssue.type.' + type + '.subject');

        mailto += '&body=' + settingsManager.getLabel('tools.feedback.reportIssue.type.' + type + '.hint') + '%0D%0A%0D%0A' + text;

        return mailto;
    }

    async downloadDataDump() {
        try {
            let datadump: any = await storageManager.datadump();
            let downloadButton = document.createElement('a');
            downloadButton.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(datadump)));
            downloadButton.setAttribute('download', "ghs-data-dump.json");
            document.body.appendChild(downloadButton);
            downloadButton.click();
            document.body.removeChild(downloadButton);
        } catch {
            console.warn("Could not read datadump");
        }
    }
}