import { Component } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ObjectiveData } from "src/app/game/model/data/ObjectiveData";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { Monster } from "src/app/game/model/Monster";
import { Objective } from "src/app/game/model/Objective";

@Component({
    selector: 'ghs-feedback-dialog',
    templateUrl: './feedback-dialog.html',
    styleUrls: ['./feedback-dialog.scss']
})
export class FeedbackDialogComponent {

    gameManager: GameManager = gameManager;
    form: string = "";


    scenarioMail(scenarioName: string, index: string, notes: string): string {
        let mailto = 'mailto:scenario@gloomhaven-secretary.de';

        let scenario = new ScenarioData(scenarioName, index, [], [], [], [], gameManager.game.figures.filter((figure) => figure instanceof Monster).map((figure) => (figure as Monster).name), gameManager.game.figures.filter((figure) => figure instanceof Monster && figure.isAlly).map((figure) => (figure as Monster).name), gameManager.game.figures.filter((figure) => figure instanceof Objective).map((figure) => {
            const objective = figure as Objective;
            return new ObjectiveData(objective.name, objective.maxHealth, objective.escort, objective.initiative);
        }), gameManager.game.scenario?.rooms || [], gameManager.game.scenario?.marker || "", gameManager.game.scenario?.rules || [], gameManager.game.scenario?.edition || gameManager.game.edition || '');

        mailto += '?subject=Submit Scenario #' + scenario.index + ' ' + scenario.name + ' (' + settingsManager.getLabel('data.edition.' + scenario.edition) + ')';

        mailto += '&body=' + notes + '%0D%0A%0D%0AJSON:%0D%0A' + JSON.stringify(scenario, undefined, 2);

        return mailto;
    }

    issueMail(type: string, text: string): string {
        let mailto = 'mailto:issue@gloomhaven-secretary.de';

        mailto += '?subject=Found issue with ' + settingsManager.getLabel('tools.feedback.reportIssue.type.' + type);

        mailto += '&body=' + settingsManager.getLabel('tools.feedback.reportIssue.type.' + type) + ' Issue%0D%0A%0D%0A' + text;

        return mailto;
    }
}