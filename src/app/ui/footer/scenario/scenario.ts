import { Dialog } from '@angular/cdk/dialog';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager, SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { RoomData } from 'src/app/game/model/data/RoomData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { ScenarioDialogComponent } from './dialog/scenario-dialog';
import { SectionDialogComponent } from './section/section-dialog';
import { ScenarioTreasuresDialogComponent } from './treasures/treasures-dialog';
import { EventEffectsDialog } from '../../figures/character/event-effects/event-effects';
import { Subscription } from 'rxjs';
import { ScenarioSummaryComponent } from './summary/scenario-summary';

@Component({
  standalone: false,
  selector: 'ghs-scenario',
  templateUrl: './scenario.html',
  styleUrls: ['./scenario.scss']
})
export class ScenarioComponent implements OnInit, OnDestroy {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  constructor(private dialog: Dialog) { }

  ngOnInit(): void {
    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => {
        if (gameManager.game.scenario && gameManager.game.finish && !gameManager.stateManager.scenarioSummary) {
          const conclusion = gameManager.game.finish.conclusion ? gameManager.sectionData(gameManager.game.finish.conclusion.edition).find((sectionData) => gameManager.game.finish && gameManager.game.finish.conclusion && sectionData.index == gameManager.game.finish.conclusion.index && sectionData.group == gameManager.game.finish.conclusion.group && sectionData.conclusion) : undefined;
          this.dialog.open(ScenarioSummaryComponent, {
            panelClass: ['dialog'],
            disableClose: true,
            data: {
              scenario: gameManager.game.scenario,
              conclusion: conclusion,
              success: gameManager.game.finish.success
            }
          })
        }
      }
    })
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  open(event: any) {
    if (gameManager.game.scenario) {
      this.dialog.open(ScenarioDialogComponent, { data: gameManager.game.scenario, panelClass: ['dialog'] });
    } else {
      this.dialog.open(EventEffectsDialog, { panelClass: ['dialog'] });
    }
  }

  openTreasures(event: any) {
    event.preventDefault();
    event.stopPropagation();
    if (gameManager.game.scenario) {
      this.dialog.open(ScenarioTreasuresDialogComponent,
        {
          panelClass: ['dialog']
        });
    }
  }

  availableSections() {
    return gameManager.scenarioManager.availableSections().sort((a, b) => {
      if (a.marker && b.marker && !a.marker.startsWith('element') && !b.marker.startsWith('element')) {
        return a.marker < b.marker ? -1 : 1;
      }
      return 0;
    })
  }

  openRoom(roomData: RoomData, event: any) {
    event.preventDefault();
    event.stopPropagation();

    const scenario = gameManager.game.scenario;
    if (scenario) {

      if (gameManager.roundManager.firstRound) {
        this.open(event);
      } else {
        const editionData: EditionData | undefined = gameManager.editionData.find((value) => gameManager.game.scenario && value.edition == gameManager.game.scenario.edition);

        if (!editionData) {
          console.error("Could not find edition data!");
          return;
        }
        gameManager.stateManager.before(roomData.marker ? "openRoomMarker" : "openRoom", scenario.index, gameManager.scenarioManager.scenarioTitle(scenario), roomData.ref, roomData.marker || '');
        gameManager.scenarioManager.openRoom(roomData, scenario, false);
        gameManager.stateManager.after();
      }
    }
  }

  addSection(sectionData: ScenarioData, event: any) {
    event.preventDefault();
    event.stopPropagation();
    if (gameManager.roundManager.firstRound) {
      this.open(event);
    } else {
      this.dialog.open(SectionDialogComponent,
        {
          panelClass: ['dialog'],
          data: sectionData
        });
    }
  }
}
