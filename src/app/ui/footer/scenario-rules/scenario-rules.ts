import { Dialog } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { RoomData } from 'src/app/game/model/data/RoomData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { ScenarioFigureRule, ScenarioRule, ScenarioRuleIdentifier } from 'src/app/game/model/data/ScenarioRule';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { ScenarioRuleComponent } from 'src/app/ui/footer/scenario-rules/scenario-rule';
import { openScenarioFinish, openScenarioSummary } from 'src/app/ui/footer/scenario/summary/scenario-finish';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, TrackUUIDPipe, ScenarioRuleComponent],
  selector: 'ghs-scenario-rules',
  templateUrl: './scenario-rules.html',
  styleUrls: ['./scenario-rules.scss']
})
export class ScenarioRulesComponent {
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  EntityValueFunction = EntityValueFunction;

  scenarioRules: { identifier: ScenarioRuleIdentifier; rule: ScenarioRule }[] = [];

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  update(): void {
    this.scenarioRules = [...gameManager.game.scenarioRules];
  }

  prevent(event: any) {
    event.preventDefault();
    event.stopPropagation();
  }

  sections(index: number): ScenarioData[] {
    const model = gameManager.game.scenarioRules[index];
    return model ? gameManager.scenarioRulesManager.ruleSections(model.rule, model.identifier) : [];
  }

  rooms(index: number): RoomData[] {
    const model = gameManager.game.scenarioRules[index];
    return model ? gameManager.scenarioRulesManager.ruleRooms(model.rule, model.identifier) : [];
  }

  figureRules(rule: ScenarioRule): ScenarioFigureRule[] {
    return gameManager.scenarioRulesManager.pendingFigureRules(rule);
  }

  visible(index: number): boolean {
    return gameManager.scenarioRulesManager.ruleVisible(index);
  }

  apply(rule: ScenarioRule): boolean {
    return gameManager.scenarioRulesManager.ruleApplicable(rule);
  }

  applyRule(element: HTMLElement, index: number) {
    const model = gameManager.game.scenarioRules[index];
    if (model) {
      const scenario = gameManager.scenarioRulesManager.getScenarioForRule(model.identifier).scenario;
      if (scenario) {
        element.classList.add('closed');
        setTimeout(
          () => {
            gameManager.stateManager.before('applyScenarioRule');
            const result = gameManager.scenarioRulesManager.applyScenarioRule(model);
            gameManager.scenarioRulesManager.resolveScenarioRule(model);
            gameManager.stateManager.after();

            result.conclusions.forEach((conclusion) => {
              openScenarioSummary(this.dialog, gameManager.game.scenario || scenario, true, conclusion);
            });

            if (result.finish) {
              openScenarioFinish(this.dialog, gameManager.game.scenario || scenario, result.finish.success, result.finish.conclusions);
            }
          },
          settingsManager.settings.animations ? 100 * settingsManager.settings.animationSpeed : 0
        );
      }
    }
  }

  hideRule(element: HTMLElement, index: number) {
    const model = gameManager.game.scenarioRules[index];
    element.classList.add('closed');
    setTimeout(
      () => {
        gameManager.stateManager.before('hideScenarioRule');
        gameManager.scenarioRulesManager.hideScenarioRule(model);
        gameManager.stateManager.after();
      },
      settingsManager.settings.animations ? 100 * settingsManager.settings.animationSpeed : 0
    );
  }

  close(element: HTMLElement, index: number) {
    const model = gameManager.game.scenarioRules[index];
    element.classList.add('closed');
    setTimeout(
      () => {
        gameManager.stateManager.before('removeScenarioRule');
        gameManager.scenarioRulesManager.removeScenarioRule(model);
        gameManager.stateManager.after();
      },
      settingsManager.settings.animations ? 100 * settingsManager.settings.animationSpeed : 0
    );
  }
}
