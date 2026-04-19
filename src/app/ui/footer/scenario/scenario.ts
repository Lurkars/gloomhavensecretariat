import { Dialog } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { RoomData } from 'src/app/game/model/data/RoomData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Scenario } from 'src/app/game/model/Scenario';
import { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';
import { EventCardDrawComponent } from 'src/app/ui/figures/event/draw/event-card-draw';
import { ScenarioRecapDialogComponent } from 'src/app/ui/figures/scenario-recap/scenario-recap';
import { RandomMonsterCardDialogComponent } from 'src/app/ui/footer/scenario/dialog/random-monster-card/random-monster-card-dialog';
import { ScenarioDialogComponent } from 'src/app/ui/footer/scenario/dialog/scenario-dialog';
import { SectionDialogComponent } from 'src/app/ui/footer/scenario/section/section-dialog';
import { ScenarioSummaryComponent } from 'src/app/ui/footer/scenario/summary/scenario-summary';
import { ScenarioTreasuresDialogComponent } from 'src/app/ui/footer/scenario/treasures/treasures-dialog';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsTooltipDirective, PointerInputDirective, TrackUUIDPipe],
  selector: 'ghs-scenario',
  templateUrl: './scenario.html',
  styleUrls: ['./scenario.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScenarioComponent {
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  characterCount: number = 0;
  openRooms: RoomData[] = [];
  closedRooms: RoomData[] = [];
  sections: Scenario[] = [];
  availableSections: ScenarioData[] = [];
  treasures: ('G' | number)[] = [];
  unlootedTreasures: ('G' | number)[] = [];

  constructor() {
    this.ghsManager.uiChangeEffect(() => {
      this.update();
    });
  }

  update() {
    this.characterCount = gameManager.characterManager.characterCount(true);
    if (gameManager.game.scenario && gameManager.game.finish && !gameManager.stateManager.scenarioSummary) {
      const conclusion = gameManager.game.finish.conclusion
        ? gameManager
            .sectionData(gameManager.game.finish.conclusion.edition)
            .find(
              (sectionData) =>
                gameManager.game.finish &&
                gameManager.game.finish.conclusion &&
                sectionData.index === gameManager.game.finish.conclusion.index &&
                sectionData.group === gameManager.game.finish.conclusion.group &&
                sectionData.conclusion
            )
        : undefined;
      this.dialog.open(ScenarioSummaryComponent, {
        panelClass: ['dialog'],
        disableClose: true,
        data: {
          scenario: gameManager.game.scenario,
          conclusion: conclusion,
          success: gameManager.game.finish.success
        }
      });
    } else if (
      gameManager.game.eventDraw &&
      settingsManager.settings.eventsDraw &&
      !this.dialog.openDialogs.find(
        (dialogRef) => dialogRef.componentInstance && dialogRef.componentInstance instanceof EventCardDrawComponent
      )
    ) {
      this.dialog
        .open(EventCardDrawComponent, {
          panelClass: ['dialog'],
          disableClose: true,
          data: {
            edition: gameManager.game.edition || gameManager.currentEdition(),
            type: gameManager.game.eventDraw
          }
        })
        .closed.subscribe({
          next: (results: any) => {
            if (settingsManager.settings.eventsApply && results && results.length) {
              this.dialog.open(EntitiesMenuDialogComponent, {
                panelClass: ['dialog'],
                data: { eventResults: results }
              });
            }
          }
        });
    }

    this.sections = [...gameManager.game.sections];
    this.treasures = !!gameManager.game.scenario
      ? gameManager.scenarioManager.getTreasures(gameManager.game.scenario, gameManager.game.sections)
      : [];
    this.unlootedTreasures = !!gameManager.game.scenario
      ? gameManager.scenarioManager.getTreasures(gameManager.game.scenario, gameManager.game.sections, true)
      : [];
    this.openRooms = gameManager.scenarioManager.openRooms();
    this.closedRooms = gameManager.scenarioManager.closedRooms();
    this.availableSections = gameManager.scenarioManager.availableSections().sort((a, b) => {
      if (a.marker && b.marker && !a.marker.startsWith('element') && !b.marker.startsWith('element')) {
        return a.marker < b.marker ? -1 : 1;
      }
      return 0;
    });
  }

  open() {
    if (gameManager.game.scenario) {
      this.dialog.open(ScenarioDialogComponent, { data: gameManager.game.scenario, panelClass: ['dialog'] });
    } else {
      this.dialog.open(EntitiesMenuDialogComponent, {
        panelClass: ['dialog'],
        data: { eventMenu: true }
      });
    }
  }

  openRecapDialog() {
    if (gameManager.game.scenario && gameManager.game.scenario.recaps && gameManager.game.scenario.recaps.length) {
      this.dialog.open(ScenarioRecapDialogComponent, {
        panelClass: ['dialog'],
        data: { scenario: this.gameManager.game.scenario }
      });
    } else {
      this.dialog.open(EntitiesMenuDialogComponent, {
        panelClass: ['dialog'],
        data: { eventMenu: true }
      });
    }
  }

  openTreasures(event: any) {
    event.preventDefault();
    event.stopPropagation();
    if (gameManager.game.scenario) {
      this.dialog.open(ScenarioTreasuresDialogComponent, {
        panelClass: ['dialog']
      });
    }
  }

  openRandomMonsterCard(sectionData: ScenarioData) {
    if (sectionData.group === 'randomMonsterCard') {
      this.dialog.open(RandomMonsterCardDialogComponent, {
        panelClass: ['fullscreen-panel'],
        disableClose: true,
        data: sectionData
      });
    } else {
      this.open();
    }
  }

  openRoom(roomData: RoomData, event: any) {
    event.preventDefault();
    event.stopPropagation();

    const scenario = gameManager.game.scenario;
    if (scenario) {
      if (gameManager.roundManager.firstRound) {
        this.open();
      } else {
        const editionData: EditionData | undefined = gameManager.editionData.find(
          (value) => gameManager.game.scenario && value.edition === gameManager.game.scenario.edition
        );

        if (!editionData) {
          console.error('Could not find edition data!');
          return;
        }
        gameManager.stateManager.before(
          roomData.marker ? 'openRoomMarker' : 'openRoom',
          scenario.index,
          gameManager.scenarioManager.scenarioTitle(scenario),
          roomData.ref,
          roomData.marker || ''
        );
        gameManager.scenarioManager.openRoom(roomData, scenario, false);
        gameManager.stateManager.after();
      }
    }
  }

  addSection(sectionData: ScenarioData, event: any) {
    event.preventDefault();
    event.stopPropagation();
    if (gameManager.roundManager.firstRound) {
      this.open();
    } else {
      this.dialog.open(SectionDialogComponent, {
        panelClass: ['dialog'],
        data: sectionData
      });
    }
  }
}
