import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Component, HostListener, inject } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { GameState } from 'src/app/game/model/Game';
import { openScenarioFinish } from 'src/app/ui/footer/scenario/summary/scenario-finish';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

@Component({
  imports: [GhsLabelDirective],
  selector: 'ghs-hint-dialog',
  templateUrl: './hint-dialog.html',
  styleUrls: ['./hint-dialog.scss']
})
export class HintDialogComponent {
  private dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  gameManager: GameManager = gameManager;
  GameState = GameState;

  isEmpty: boolean = false;
  isMissingInitiative: boolean = false;
  isActive: boolean = false;
  isBattleGoals: boolean = false;
  isEventDraw: boolean = false;
  isFinish: boolean = false;
  isFailed: boolean = false;

  constructor() {
    this.ghsManager.uiChangeEffect(() => {
      this.isEmpty = this.empty();
      this.isMissingInitiative = this.missingInitiative();
      this.isActive = this.active();
      this.isBattleGoals = this.battleGoals();
      this.isEventDraw = this.eventDraw();
      this.isFinish = this.finish();
      this.isFailed = this.failed();
    });
  }

  confirm() {
    const active = gameManager.game.figures.find((figure) => figure.active);
    if (active) {
      gameManager.stateManager.before('endAllTurns');
      gameManager.roundManager.endAllTurns();
      gameManager.stateManager.after();
    }
    this.next();
  }

  next() {
    ghsDialogClosingHelper(this.dialogRef, true);
  }

  finishScenario(success: boolean) {
    if (gameManager.game.scenario) {
      openScenarioFinish(this.dialog, gameManager.game.scenario, success);
      ghsDialogClosingHelper(this.dialogRef, false);
    }
  }

  resetScenario() {
    gameManager.stateManager.before('resetScenario', ...gameManager.scenarioManager.scenarioUndoArgs());
    gameManager.scenarioManager.resetScenario();
    gameManager.stateManager.after();
    ghsDialogClosingHelper(this.dialogRef);
  }

  empty(): boolean {
    return gameManager.game.figures.length === 0;
  }

  missingInitiative(): boolean {
    return gameManager.roundManager.missingInitiative();
  }

  active(): boolean {
    return gameManager.roundManager.hasActiveFigure();
  }

  battleGoals(): boolean {
    return gameManager.roundManager.battleGoalsPending();
  }

  eventDraw(): boolean {
    return gameManager.roundManager.eventDrawPending();
  }

  finish(): boolean {
    return false;
  }

  failed(): boolean {
    return gameManager.roundManager.scenarioFailed();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyEnter(event: KeyboardEvent) {
    if (settingsManager.settings.keyboardShortcuts && event.key === 'Enter') {
      if (this.isActive) {
        this.confirm();
      } else if (this.isFinish) {
        this.finishScenario(true);
      } else if (this.isFailed) {
        this.finishScenario(false);
      } else if (this.isBattleGoals) {
        this.confirm();
      } else if (this.isEventDraw) {
        this.confirm();
      }
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
