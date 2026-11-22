import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Directive, effect, inject, input, OnInit, untracked } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Party } from 'src/app/game/model/Party';
import { Scenario } from 'src/app/game/model/Scenario';

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

  async openMap() {
    if (this.hasWorldMap()) {
      this.dialogRef()?.close();
      const { WorldMapComponent } = await import('src/app/ui/figures/party/world-map/world-map');
      this.dialog.open(WorldMapComponent, {
        panelClass: ['fullscreen-panel', 'no-dialog-animations'],
        backdropClass: ['fullscreen-backdrop'],
        data: { edition: this.edition() }
      });
    }
  }

  async openFlowChart() {
    this.dialogRef()?.close();
    const { ScenarioChartDialogComponent } = await import('src/app/ui/figures/party/scenario-chart/scenario-chart');
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
    return gameManager.scenarioManager.hasOpenConclusions(section);
  }

  async openConclusions(section: string, week: number = -1) {
    const conclusions: ScenarioData[] = gameManager.scenarioManager.sectionConclusions(section, gameManager.game.edition, true);

    if (conclusions.length > 0) {
      const { ScenarioConclusionComponent } = await import('src/app/ui/footer/scenario/scenario-conclusion/scenario-conclusion');
      const { ScenarioSummaryComponent } = await import('src/app/ui/footer/scenario/summary/scenario-summary');
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
                gameManager.scenarioManager.finishWeekConclusion(scenario, week);
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

  async finishConclusion(index: string, force: boolean = false) {
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
      const { openSection } = await import('src/app/ui/figures/party/week-sections/week-sections');
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

  async conclusionRewards(index: string) {
    const conclusion = gameManager
      .sectionData(this.edition() || gameManager.currentEdition())
      .find((sectionData) => sectionData.index === index);
    if (conclusion) {
      const { ScenarioSummaryComponent } = await import('src/app/ui/footer/scenario/summary/scenario-summary');
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
