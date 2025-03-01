import { DialogRef } from "@angular/cdk/dialog";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { ScenarioRule, ScenarioRuleIdentifier } from "src/app/game/model/data/ScenarioRule";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";

@Component({
	standalone: false,
    selector: 'ghs-scenario-rules-dialog',
    templateUrl: './scenario-rules-dialog.html',
    styleUrls: ['./scenario-rules-dialog.scss']
})
export class ScenarioRulesDialogComponent implements OnInit, OnDestroy {

    gameManager: GameManager = gameManager;

    appliedScenarioRules: { identifier: ScenarioRuleIdentifier, rule: ScenarioRule }[] = [];
    discardedScenarioRules: { identifier: ScenarioRuleIdentifier, rule: ScenarioRule }[] = [];

    constructor(private dialogRef: DialogRef) { }

    ngOnInit(): void {
        this.uiChangeSubscription = gameManager.uiChange.subscribe({
            next: () => { this.update(); }
        });
        this.update();
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    update() {
        this.appliedScenarioRules = [];
        gameManager.game.appliedScenarioRules.forEach((identifier) => {
            const scenario = gameManager.scenarioRulesManager.getScenarioForRule((identifier)).scenario;
            if (scenario) {
                if (scenario.rules && scenario.rules.length > identifier.index && identifier.index >= 0) {
                    if (scenario.rules[identifier.index].spawns) {
                        scenario.rules[identifier.index].spawns.forEach((spawn) => { if (spawn.manual && !spawn.count) { spawn.count = "1"; } });
                    }
                    this.appliedScenarioRules.push({ identifier: identifier, rule: scenario.rules[identifier.index] });
                }
            }
        })
        this.discardedScenarioRules = [];
        gameManager.game.discardedScenarioRules.forEach((identifier) => {
            const scenario = gameManager.scenarioRulesManager.getScenarioForRule((identifier)).scenario;
            if (scenario) {
                if (scenario.rules && scenario.rules.length > identifier.index && identifier.index >= 0) {
                    if (scenario.rules[identifier.index].spawns) {
                        scenario.rules[identifier.index].spawns.forEach((spawn) => { if (spawn.manual && !spawn.count) { spawn.count = "1"; } });
                    }
                    this.discardedScenarioRules.push({ identifier: identifier, rule: scenario.rules[identifier.index] });
                }
            }
        })
        if (!this.appliedScenarioRules.length && !this.discardedScenarioRules.length) {
            ghsDialogClosingHelper(this.dialogRef);
        }
    }


    clearDiscardedScenarioRules() {
        gameManager.stateManager.before("clearDiscardedScenarioRules");
        gameManager.game.discardedScenarioRules = [];
        gameManager.stateManager.after();
    }

    discardScenarioRule(ruleModel: { identifier: ScenarioRuleIdentifier, rule: ScenarioRule }) {
        gameManager.stateManager.before("removeScenarioRule");
        gameManager.game.appliedScenarioRules.splice(gameManager.game.appliedScenarioRules.indexOf(ruleModel.identifier), 1);
        if (ruleModel.rule.once || ruleModel.rule.alwaysApplyTurn) {
            gameManager.game.discardedScenarioRules.push(ruleModel.identifier);
        }
        gameManager.stateManager.after();
    }
}