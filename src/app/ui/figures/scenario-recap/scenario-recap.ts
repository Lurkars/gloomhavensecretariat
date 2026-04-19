import { DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, forwardRef, inject, Input, OnInit } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ScenarioData, ScenarioRecap } from 'src/app/game/model/data/ScenarioData';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [GhsLabelDirective, forwardRef(() => ScenarioRecapComponent)],
  selector: 'ghs-scenario-recap-dialog',
  templateUrl: 'scenario-recap-dialog.html',
  styleUrls: ['./scenario-recap-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScenarioRecapDialogComponent {
  scenario: ScenarioData;
  forceAll: boolean;
  gameManager: GameManager = gameManager;

  private data: { scenario: ScenarioData; forceAll: boolean } = inject(DIALOG_DATA);

  constructor() {
    this.scenario = this.data.scenario;
    this.forceAll = this.data.forceAll || false;
  }
}

@Component({
  imports: [GhsLabelDirective, TrackUUIDPipe, forwardRef(() => ScenarioRecapComponent)],
  selector: 'ghs-scenario-recap',
  templateUrl: 'scenario-recap.html',
  styleUrls: ['./scenario-recap.scss']
})
export class ScenarioRecapComponent implements OnInit {
  @Input() scenario: ScenarioData | undefined;
  @Input() forceAll: boolean = false;

  gameManager: GameManager = gameManager;

  label: string | false = false;
  recaps: ScenarioRecap[] = [];
  scenarios: (ScenarioData | undefined)[] = [];
  sections: (ScenarioData | undefined)[] = [];
  selected: number = -1;

  ngOnInit(): void {
    if (this.scenario) {
      const prefix = 'data.scenario.recap.' + this.scenario.edition + '.';

      this.recaps = this.scenario.recaps.filter((recap) => {
        if (this.scenario) {
          if (recap.type === 'scenario' && recap.value) {
            const scenarioData =
              gameManager.scenarioManager.getScenario(recap.value, this.scenario.edition, this.scenario.group) || undefined;
            if (scenarioData && (gameManager.scenarioManager.isSuccess(scenarioData) || this.forceAll)) {
              return true;
            }
          } else if (recap.type === 'section' && recap.value) {
            const sectionData =
              gameManager.scenarioManager.getSection(recap.value, this.scenario.edition, this.scenario.group) || undefined;
            if (sectionData) {
              if (sectionData.parent) {
                const scenarioData =
                  gameManager.scenarioManager.getScenario(sectionData.parent, this.scenario.edition, this.scenario.group) || undefined;
                if (scenarioData && (gameManager.scenarioManager.isSuccess(scenarioData) || this.forceAll)) {
                  return true;
                }
              }
              if (
                sectionData &&
                (gameManager.game.party.conclusions.some(
                  (conclusion) =>
                    conclusion.edition === sectionData.edition &&
                    conclusion.index === sectionData.index &&
                    conclusion.group === sectionData.group
                ) ||
                  this.forceAll)
              ) {
                return true;
              }
            } else {
              return true;
            }
          } else {
            return true;
          }
        }
        return false;
      });

      this.recaps.forEach((recap, i) => {
        if (this.scenario) {
          if (recap.type === 'scenario' && recap.value) {
            this.label = settingsManager.labelExists(prefix + this.scenario.index + '.' + recap.value.replaceAll(/[A-Z]+/g, ''))
              ? prefix + this.scenario.index + '.' + recap.value.replaceAll(/[A-Z]+/g, '')
              : false;
            this.scenarios[i] = gameManager.scenarioManager.getScenario(recap.value, this.scenario.edition, this.scenario.group);
          } else if (recap.type === 'section' && recap.value) {
            const sectionData = gameManager.scenarioManager.getSection(recap.value, this.scenario.edition, this.scenario.group);
            if (sectionData) {
              this.sections[i] = sectionData;
              if (sectionData.parent) {
                const scenarioData =
                  gameManager.scenarioManager.getScenario(sectionData.parent, this.scenario.edition, this.scenario.group) || undefined;
                if (scenarioData) {
                  this.scenarios[i] = scenarioData;
                  this.label = settingsManager.labelExists(
                    prefix + this.scenario.index + '.' + scenarioData.index.replaceAll(/[A-Z]+/g, '')
                  )
                    ? prefix + this.scenario.index + '.' + scenarioData.index.replaceAll(/[A-Z]+/g, '')
                    : false;
                }
              }
            }

            if (this.label) {
              this.label = settingsManager.labelExists(prefix + this.scenario.index) ? prefix + this.scenario.index : false;
            }
          } else {
            this.label = settingsManager.labelExists(prefix + this.scenario.index) ? prefix + this.scenario.index : false;
          }
        }
      });

      if (this.recaps.length === 1) {
        this.selected = 0;
      }
    }
  }
}
