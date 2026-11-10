import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Directive, effect, inject, input, OnInit, untracked } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Party } from 'src/app/game/model/Party';
import { Scenario } from 'src/app/game/model/Scenario';
import { ScenarioChartDialogComponent } from 'src/app/ui/figures/party/scenario-chart/scenario-chart';
import { openSection } from 'src/app/ui/figures/party/week-sections/week-sections';
import { WorldMapComponent } from 'src/app/ui/figures/party/world-map/world-map';
import { ScenarioConclusionComponent } from 'src/app/ui/footer/scenario/scenario-conclusion/scenario-conclusion';
import { ScenarioSummaryComponent } from 'src/app/ui/footer/scenario/summary/scenario-summary';

export type PartySheetType = 'gh' | 'fh' | 'gh2e';

@Directive()
export abstract class PartySheetSection implements OnInit {
  protected dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  readonly edition = input<string>('');
  readonly sheet = input<PartySheetType>('gh');
  readonly dialogRef = input<DialogRef>();

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
    effect(() => {
      this.edition();
      this.sheet();
      untracked(() => this.update());
    });
  }

  ngOnInit(): void {
    this.update();
  }

  update(): void {}

  get party(): Party {
    return gameManager.game.party;
  }

  get fhSheet(): boolean {
    return this.sheet() === 'fh';
  }

  get gh2eSheet(): boolean {
    return this.sheet() === 'gh2e';
  }

  hasWorldMap(): boolean {
    const editionData = gameManager.editionData.find((editionData) => this.edition() && editionData.edition === this.edition());
    return !!editionData && (!!editionData.worldMap || !!editionData.extendWorldMap);
  }

  openMap() {
    if (this.hasWorldMap()) {
      this.dialogRef()?.close();
      this.dialog.open(WorldMapComponent, {
        panelClass: ['fullscreen-panel', 'no-dialog-animations'],
        backdropClass: ['fullscreen-backdrop'],
        data: { edition: this.edition() }
      });
    }
  }

  openFlowChart() {
    this.dialogRef()?.close();
    this.dialog.open(ScenarioChartDialogComponent, {
      panelClass: ['fullscreen-panel'],
      backdropClass: ['fullscreen-backdrop'],
      data: { edition: this.edition() }
    });
  }

  setDonations(value: number) {
    if (this.party.donations === value) {
      value--;
    }
    if (value < 0) {
      value = 0;
    }

    gameManager.stateManager.before('setPartyDonations', value);
    this.party.donations = value;
    if (value < 10) {
      this.party.envelopeB = false;
    }
    gameManager.stateManager.after();
  }

  isConclusion(section: string, edition: string | undefined = undefined): boolean {
    if (!section) {
      return false;
    }
    return (
      this.party.conclusions.find(
        (model) =>
          ((!edition && model.edition === gameManager.game.edition) || (edition && model.edition === edition)) && model.index === section
      ) !== undefined
    );
  }

  hasConclusions(section: string): boolean {
    const conclusions = gameManager
      .sectionData(gameManager.game.edition)
      .filter(
        (sectionData) =>
          sectionData.conclusion &&
          !sectionData.parent &&
          sectionData.parentSections &&
          sectionData.parentSections.find((parentSections) => parentSections.length === 1 && parentSections.includes(section))
      );
    return (
      conclusions.length > 0 &&
      conclusions.every(
        (conclusion) =>
          !gameManager.game.party.conclusions.find(
            (model) => model.edition === conclusion.edition && model.index === conclusion.index && model.group === conclusion.group
          )
      )
    );
  }

  openConclusions(section: string, week: number = -1) {
    const conclusions: ScenarioData[] = gameManager
      .sectionData(gameManager.game.edition)
      .filter(
        (sectionData) =>
          sectionData.conclusion &&
          !sectionData.parent &&
          sectionData.parentSections &&
          sectionData.parentSections.find((parentSections) => parentSections.length === 1 && parentSections.includes(section)) &&
          gameManager.scenarioManager.getRequirements(sectionData).length === 0
      );

    if (conclusions.length > 0) {
      this.dialog
        .open(ScenarioConclusionComponent, {
          panelClass: ['dialog'],
          data: {
            conclusions: conclusions,
            parent: gameManager
              .sectionData(gameManager.game.edition)
              .find((sectionData) => sectionData.index === section && !sectionData.group)
          }
        })
        .closed.subscribe({
          next: (conclusion) => {
            if (conclusion) {
              const scenario = new Scenario(conclusion as ScenarioData);
              if (week !== -1) {
                gameManager.stateManager.before('finishConclusion', ...gameManager.scenarioManager.scenarioUndoArgs(scenario));
                gameManager.scenarioManager.finishScenario(
                  scenario,
                  true,
                  scenario,
                  false,
                  false,
                  false,
                  gameManager.game.party.campaignMode,
                  true
                );
                if (!scenario.repeatable) {
                  this.party.weekSections[week] = [...(this.party.weekSections[week] || []), scenario.index];
                }
                gameManager.stateManager.after();

                this.dialog.open(ScenarioSummaryComponent, {
                  panelClass: ['dialog'],
                  data: {
                    scenario: scenario,
                    conclusionOnly: true
                  }
                });
              } else {
                this.finishConclusion(scenario.index);
              }
            }
          }
        });
    }
  }

  finishConclusion(index: string, force: boolean = false) {
    const conclusion = gameManager
      .sectionData(this.edition() || gameManager.currentEdition())
      .find((sectionData) => sectionData.index === index);
    if (
      conclusion &&
      (force ||
        !this.party.conclusions.find(
          (value) => value.edition === conclusion.edition && value.group === conclusion.group && value.index === conclusion.index
        ))
    ) {
      // conclusion followed by continuing sections, if any
      openSection(this.dialog, conclusion.index, conclusion.edition, conclusion.group, () => this.update());
    }
  }

  unlockConclusion(section: string, unlocked: boolean, force: boolean = false) {
    if (this.party.conclusions.find((value) => value.edition === gameManager.game.edition && value.index === section)) {
      if (gameManager.game.edition && force) {
        this.removeConclusion(section, gameManager.game.edition);
      } else {
        this.finishConclusion(section, true);
      }
    } else if (unlocked || force) {
      this.finishConclusion(section, force);
    }
  }

  removeConclusion(section: string, edition: string) {
    if (this.isConclusion(section, edition)) {
      gameManager.stateManager.before('removeConclusion', gameManager.game.party.name, section);
      gameManager.game.party.conclusions = gameManager.game.party.conclusions.filter(
        (conclusion) => conclusion.edition !== edition || conclusion.index !== section
      );
      gameManager.stateManager.after();
      this.update();
    }
  }

  conclusionRewards(index: string) {
    const conclusion = gameManager
      .sectionData(this.edition() || gameManager.currentEdition())
      .find((sectionData) => sectionData.index === index);
    if (conclusion) {
      this.dialog.open(ScenarioSummaryComponent, {
        panelClass: ['dialog'],
        data: {
          scenario: new Scenario(conclusion),
          conclusion: conclusion,
          success: true,
          rewardsOnly: true,
          conclusionOnly: true
        }
      });
    }
  }
}
