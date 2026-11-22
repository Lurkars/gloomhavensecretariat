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
import { ScenarioConclusionComponent } from 'src/app/ui/footer/scenario/scenario-conclusion/scenario-conclusion';
import { ScenarioSummaryComponent } from 'src/app/ui/footer/scenario/summary/scenario-summary';
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

  randomDungeonsMonsterLabel(rule: ScenarioRule): string[] {
    if (!rule.randomDungeon || !rule.randomDungeon.monsterCards || !rule.randomDungeon.monsterCards.length) {
      return [];
    }

    return rule.randomDungeon.monsterCards
      .filter(
        (cardId) =>
          !gameManager.game.scenario ||
          !gameManager.game.scenario.additionalSections ||
          !gameManager.game.scenario.additionalSections.includes(cardId)
      )
      .map((cardId) => {
        if (gameManager.game.scenario) {
          const section = gameManager
            .sectionData(gameManager.game.scenario.edition, true)
            .find((sectionData) => sectionData.index === cardId && sectionData.group === 'randomMonsterCard');
          if (section) {
            return '&nbsp%' + gameManager.scenarioManager.scenarioTitle(section, true) + '% (#' + section.index + ')';
          }
        }

        return '&nbsp' + cardId;
      });
  }

  randomDungeonsDungeonLabel(rule: ScenarioRule): string[] {
    if (!rule.randomDungeon || !rule.randomDungeon.dungeonCards || !rule.randomDungeon.dungeonCards.length) {
      return [];
    }

    return rule.randomDungeon.dungeonCards
      .filter(
        (cardId) =>
          !gameManager.game.scenario ||
          !gameManager.game.scenario.additionalSections ||
          !gameManager.game.scenario.additionalSections.includes(cardId)
      )
      .map((cardId) => {
        if (gameManager.game.scenario) {
          const section = gameManager
            .sectionData(gameManager.game.scenario.edition, true)
            .find((sectionData) => sectionData.index === cardId && sectionData.group === 'randomDungeonCard');
          if (section) {
            return '&nbsp%' + gameManager.scenarioManager.scenarioTitle(section, true) + '% (#' + section.index + ')';
          }
        }

        return '&nbsp' + cardId;
      });
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
              this.dialog.open(ScenarioSummaryComponent, {
                panelClass: ['dialog'],
                data: {
                  scenario: gameManager.game.scenario,
                  success: true,
                  conclusion: conclusion
                }
              });
            });

            if (result.finish) {
              this.openFinish(result.finish.success, result.finish.conclusions, gameManager.game.scenario || scenario);
            }
          },
          settingsManager.settings.animations ? 100 * settingsManager.settings.animationSpeed : 0
        );
      }
    }
  }

  openFinish(success: boolean, conclusions: ScenarioData[], scenario: ScenarioData) {
    if (success && conclusions.length > 1) {
      this.dialog
        .open(ScenarioConclusionComponent, {
          panelClass: ['dialog'],
          data: { conclusions: conclusions, parent: scenario }
        })
        .closed.subscribe({
          next: (conclusion: unknown) => {
            if (conclusion) {
              this.dialog.open(ScenarioSummaryComponent, {
                panelClass: ['dialog'],
                data: {
                  scenario: scenario,
                  conclusion: conclusion,
                  success: success
                }
              });
            }
          }
        });
    } else {
      this.dialog.open(ScenarioSummaryComponent, {
        panelClass: ['dialog'],
        data: {
          scenario: scenario,
          conclusion: conclusions.length === 1 ? conclusions[0] : undefined,
          success: success
        }
      });
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
