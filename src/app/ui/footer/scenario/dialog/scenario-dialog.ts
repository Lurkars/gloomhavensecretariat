import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { RoomData } from 'src/app/game/model/data/RoomData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Scenario } from 'src/app/game/model/Scenario';
import { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';
import { FavorsComponent } from 'src/app/ui/figures/entities-menu/favors/favors';
import { ScenarioRecapDialogComponent } from 'src/app/ui/figures/scenario-recap/scenario-recap';
import { ScenarioRulesDialogComponent } from 'src/app/ui/footer/scenario-rules/dialog/scenario-rules-dialog';
import { RandomMonsterCardDialogComponent } from 'src/app/ui/footer/scenario/dialog/random-monster-card/random-monster-card-dialog';
import { ScenarioConclusionComponent } from 'src/app/ui/footer/scenario/scenario-conclusion/scenario-conclusion';
import { ScenarioSetupComponent } from 'src/app/ui/footer/scenario/scenario-setup/scenario-setup';
import { SectionDialogComponent } from 'src/app/ui/footer/scenario/section/section-dialog';
import { ScenarioSummaryComponent } from 'src/app/ui/footer/scenario/summary/scenario-summary';
import { ScenarioTreasuresDialogComponent } from 'src/app/ui/footer/scenario/treasures/treasures-dialog';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { TabClickDirective } from 'src/app/ui/helper/tabclick';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, FormsModule, GhsLabelDirective, TabClickDirective, TrackUUIDPipe, ScenarioSetupComponent],
  selector: 'ghs-scenario-dialog',
  templateUrl: './scenario-dialog.html',
  styleUrls: ['./scenario-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScenarioDialogComponent {
  dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  @ViewChild('setupComponent') setupComponent!: ScenarioSetupComponent;

  setup: boolean = false;
  openRooms: RoomData[] = [];
  closedRooms: RoomData[] = [];
  availableSections: ScenarioData[] = [];
  characterCount: number = 0;

  scenario: Scenario = inject(DIALOG_DATA);

  constructor() {
    this.openRooms = gameManager.scenarioManager.openRooms();
    this.closedRooms = gameManager.scenarioManager.closedRooms();
    this.availableSections = gameManager.scenarioManager.availableSections();
    this.characterCount = gameManager.characterManager.characterCount(true);
  }

  finishScenario(success: boolean) {
    this.close();
    const conclusions = gameManager.scenarioManager
      .availableSections(true)
      .filter(
        (sectionData) =>
          sectionData.edition == this.scenario.edition &&
          sectionData.parent == this.scenario.index &&
          sectionData.group == this.scenario.group &&
          sectionData.conclusion &&
          gameManager.scenarioManager.getRequirements(sectionData).length == 0
      );
    if (conclusions.length < 2 || !success) {
      this.dialog.open(ScenarioSummaryComponent, {
        panelClass: ['dialog'],
        data: {
          scenario: this.scenario,
          conclusion: conclusions.length == 1 ? conclusions[0] : undefined,
          success: success
        }
      });
    } else {
      this.dialog
        .open(ScenarioConclusionComponent, {
          panelClass: ['dialog'],
          data: { conclusions: conclusions, parent: this.scenario }
        })
        .closed.subscribe({
          next: (conclusion: unknown) => {
            if (conclusion) {
              this.dialog.open(ScenarioSummaryComponent, {
                panelClass: ['dialog'],
                data: {
                  scenario: this.scenario,
                  conclusion: conclusion,
                  success: success
                }
              });
            }
          }
        });
    }
  }

  resetScenario() {
    this.close();
    gameManager.stateManager.before('resetScenario', ...gameManager.scenarioManager.scenarioUndoArgs());
    gameManager.roundManager.resetScenario();
    gameManager.scenarioManager.setScenario(this.scenario, true);
    gameManager.stateManager.after();
  }

  cancelScenario() {
    this.close();
    gameManager.stateManager.before('cancelScenario', ...gameManager.scenarioManager.scenarioUndoArgs());
    gameManager.scenarioManager.setScenario(undefined);
    gameManager.stateManager.after(1000);
  }

  showScenarioRules() {
    this.dialog.open(ScenarioRulesDialogComponent, { panelClass: ['dialog'] });
    this.close();
  }

  openTreasures() {
    this.dialog.open(ScenarioTreasuresDialogComponent, {
      panelClass: ['dialog']
    });
  }

  openEventEffects(eventMenu: boolean = true) {
    this.dialog.open(EntitiesMenuDialogComponent, {
      panelClass: ['dialog'],
      data: { eventMenu: eventMenu }
    });
    this.close();
  }

  openRoom(roomData: RoomData) {
    const editionData: EditionData | undefined = gameManager.editionData.find((value) => value.edition == this.scenario.edition);

    if (!editionData) {
      console.error('Could not find edition data!');
      return;
    }
    gameManager.stateManager.before(
      roomData.marker ? 'openRoomMarker' : 'openRoom',
      this.scenario.index,
      gameManager.scenarioManager.scenarioTitle(this.scenario),
      roomData.ref,
      roomData.marker || ''
    );
    gameManager.scenarioManager.openRoom(roomData, this.scenario, false);
    gameManager.stateManager.after();
    if (!!this.setupComponent) {
      this.setupComponent.updateMonster();
    }
  }

  addSection(sectionData: ScenarioData) {
    this.dialog
      .open(SectionDialogComponent, {
        panelClass: ['dialog'],
        data: sectionData
      })
      .closed.subscribe({
        next: (added: unknown) => {
          if (added) {
            this.close();
          }
        }
      });
  }

  openFavors() {
    this.dialog.open(FavorsComponent, {
      panelClass: ['dialog']
    });
  }

  openRecapDialog() {
    this.dialog.open(ScenarioRecapDialogComponent, {
      panelClass: ['dialog'],
      data: { scenario: this.scenario }
    });
  }

  openRandomMonsterCard(sectionData: ScenarioData) {
    if (sectionData.group == 'randomMonsterCard') {
      this.dialog.open(RandomMonsterCardDialogComponent, {
        panelClass: ['fullscreen-panel'],
        disableClose: true,
        data: sectionData
      });
    }
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }
}
