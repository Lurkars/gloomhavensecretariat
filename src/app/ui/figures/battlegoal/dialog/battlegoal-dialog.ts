import { DIALOG_DATA, Dialog, DialogRef } from "@angular/cdk/dialog";
import { moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, Inject, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { BattleGoal } from "src/app/game/model/data/BattleGoal";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";
import { BattleGoalSetupDialog } from "../setup/battlegoal-setup";

@Component({
  standalone: false,
  selector: 'ghs-character-battlegoals',
  templateUrl: './battlegoal-dialog.html',
  styleUrls: ['./battlegoal-dialog.scss']
})
export class CharacterBattleGoalsDialog implements OnDestroy {

  gameManager: GameManager = gameManager;
  battleGoals: BattleGoal[] = [];
  revealed: number[] = [];
  character: Character;
  selected: number;
  available: number = 0;
  redrawAvailable: number = 0;
  cardOnly: boolean = false;
  trial349: boolean = false;
  trial356: boolean = false;

  constructor(@Inject(DIALOG_DATA) data: { character: Character, draw: boolean, cardOnly: boolean }, private dialogRef: DialogRef, private dialog: Dialog) {
    this.character = data.character;
    this.selected = this.character.battleGoal ? 0 : -1;
    this.cardOnly = data.cardOnly;
    if (gameManager.battleGoalManager.getBattleGoals().length == 0) {
      this.dialog.open(BattleGoalSetupDialog, {
        panelClass: ['dialog']
      }).closed.subscribe({
        next: () => {
          this.available = gameManager.battleGoalManager.getUnrevealedBattleGoals().length;
          this.redrawAvailable = gameManager.battleGoalManager.getUnrevealedBattleGoals(this.character).length;
          if (this.redrawAvailable > (gameManager.fhRules() || settingsManager.settings.battleGoalsFh ? 2 : 1) && data.draw) {
            this.drawCards();
          }
          else {
            this.close();
          }
        }
      })
    } else if (data.draw) {
      this.available = gameManager.battleGoalManager.getUnrevealedBattleGoals().length;
      this.redrawAvailable = gameManager.battleGoalManager.getUnrevealedBattleGoals(this.character).length;
      this.drawCards();
    } else {
      this.update();
    }


    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => {
        this.character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.edition == this.character.edition && figure.name == this.character.name) as Character || this.character;
        if (this.character.battleGoal) {
          this.selected = 0;
        } else {
          this.selected = -1;
        }
        this.update();
      }
    })
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  drawCards() {
    if (this.redrawAvailable) {
      gameManager.stateManager.before("battleGoals.drawCards", gameManager.characterManager.characterName(this.character));
      this.character.battleGoals = [];
      this.character.battleGoal = false;
      gameManager.battleGoalManager.drawBattleGoal(this.character);
      if (!gameManager.trialsManager.apply || !gameManager.trialsManager.activeTrial('fh', 360)) {
        gameManager.battleGoalManager.drawBattleGoal(this.character);
        if (gameManager.fhRules() || settingsManager.settings.battleGoalsFh) {
          gameManager.battleGoalManager.drawBattleGoal(this.character);
        }
      }
      gameManager.stateManager.after();
    }
    this.update();
  }

  update() {
    this.available = gameManager.battleGoalManager.getUnrevealedBattleGoals().length;
    this.redrawAvailable = gameManager.battleGoalManager.getUnrevealedBattleGoals(this.character).length;
    this.battleGoals = this.character.battleGoals.map((identifier) => gameManager.battleGoalManager.getBattleGoal(identifier)).filter((battleGoal) => battleGoal).map((battleGoal) => battleGoal as BattleGoal);

    if (this.character.battleGoal && this.revealed.indexOf(0) == -1) {
      this.revealed.push(0);
    }
    this.trial349 = gameManager.trialsManager.apply && gameManager.trialsManager.trialsEnabled && this.character.progress.trial && this.character.progress.trial.edition == 'fh' && this.character.progress.trial.name == '349' || false;
    this.trial356 = gameManager.trialsManager.apply && gameManager.trialsManager.trialsEnabled && this.character.progress.trial && this.character.progress.trial.edition == 'fh' && this.character.progress.trial.name == '356' || false;
  }

  drawCard() {
    if (this.available) {
      gameManager.stateManager.before("battleGoals.drawCard", gameManager.characterManager.characterName(this.character));
      gameManager.battleGoalManager.drawBattleGoal(this.character, this.trial356);
      gameManager.stateManager.after();
    }
    this.update();
  }

  select(index: number, force: boolean = false) {
    if (!this.cardOnly && (force || !this.character.battleGoal || gameManager.roundManager.firstRound) && !this.trial349) {
      if (this.revealed.indexOf(index) == -1) {
        this.revealed.push(index);
      }
      if (this.selected != -1 && this.revealed.indexOf(this.selected) == -1) {
        this.revealed.push(this.selected);
      }
      if (this.selected == index) {
        this.selected = -1;
      } else {
        this.selected = index;
      }
    }
  }

  setup() {
    this.dialog.open(BattleGoalSetupDialog, {
      panelClass: ['dialog']
    }).closed.subscribe({
      next: () => {
        if (gameManager.battleGoalManager.getBattleGoals().length < (gameManager.fhRules() || settingsManager.settings.battleGoalsFh ? 3 : 2)) {
          this.close();
        } else {
          this.update();
        }
      }
    })
  }

  accept() {
    if ((this.selected != -1 || this.trial349) && !this.character.battleGoal || this.selected != 0 && this.character.battleGoal) {
      gameManager.stateManager.before("battleGoals." + (this.selected != -1 || this.trial349 ? 'select' : 'deselect'), gameManager.characterManager.characterName(this.character));
      if (this.trial349) {
        this.character.battleGoal = true;
      } else if (this.selected != -1) {
        this.character.battleGoal = true;
        moveItemInArray(this.character.battleGoals, this.selected, 0);
      } else {
        this.character.battleGoal = false;
      }
      gameManager.stateManager.after();
    }
    this.close();
  }

  cancel() {
    if (this.character.battleGoal) {
      this.selected = 0;
    } else {
      this.selected = -1;
    }
    this.close();
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }
}