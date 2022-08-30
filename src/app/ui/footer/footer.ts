import { Component } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { AttackModifierDeck } from 'src/app/game/model/AttackModifier';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { DialogComponent } from '../dialog/dialog';
import { AttackModiferDeckChange } from '../figures/attackmodifier/attackmodifierdeck';

@Component({
  selector: 'ghs-footer',
  templateUrl: './footer.html',
  styleUrls: [ './footer.scss', '../dialog/dialog.scss' ]
})
export class FooterComponent extends DialogComponent {

  gameManager: GameManager = gameManager;
  GameState = GameState;
  currentTime: string = "";
  hasAllyAttackModifierDeck: boolean = false;

  override ngOnInit(): void {
    super.ngOnInit();
    this.hasAllyAttackModifierDeck = settingsManager.settings.allyAttackModifierDeck && gameManager.game.figures.some((figure) => figure instanceof Monster && figure.isAlly);

    gameManager.uiChange.subscribe({
      next: () => {
        this.hasAllyAttackModifierDeck = settingsManager.settings.allyAttackModifierDeck && gameManager.game.figures.some((figure) => figure instanceof Monster && figure.isAlly);
      }
    })

    setInterval(() => {
      gameManager.game.playSeconds++;
      let seconds = gameManager.game.playSeconds;
      this.currentTime = "";
      if (seconds / 3600 >= 1) {
        this.currentTime += Math.floor(seconds / 3600) + "h ";
        seconds = seconds % 3600;
      }

      if (seconds / 60 >= 1) {
        this.currentTime += (this.currentTime && this.currentTime && Math.floor(seconds / 60) < 10 ? '0' : '') + Math.floor(seconds / 60) + "m ";
        seconds = seconds % 60;
      }
      this.currentTime += (this.currentTime && seconds < 10 ? '0' : '') + Math.floor(seconds) + "s";

      // store every 30 seconds
      if ((new Date().getTime() / 1000 - gameManager.stateManager.lastSaveTimestamp / 1000) > 30) {
        gameManager.stateManager.saveLocal();
      }

    }, 1000)
  }

  next(force: boolean = false): void {
    if (!force && this.disabled()) {
      this.open();
    } else {
      this.close();
      gameManager.stateManager.before(gameManager.game.state == GameState.next ? "nextRound" : "draw");
      const activeFigure = gameManager.game.figures.find((figure) => figure.active && !figure.off);
      if (!this.active() && activeFigure) {
        gameManager.roundManager.afterTurn(activeFigure);
      }
      gameManager.roundManager.nextGameState();
      gameManager.stateManager.after(1000);
    }
  }

  beforeMonsterAttackModifierDeck(change: AttackModiferDeckChange) {
    gameManager.stateManager.before("updateAttackModifierDeck." + change.type, "monster", ...change.values);
  }

  afterMonsterAttackModifierDeck(change: AttackModiferDeckChange) {
    gameManager.game.monsterAttackModifierDeck = change.deck;
    gameManager.stateManager.after();
  }

  beforeAllyAttackModifierDeck(change: AttackModiferDeckChange) {
    gameManager.stateManager.before("updateAttackModifierDeck." + change.type, "ally", ...change.values);
  }

  afterAllyAttackModifierDeck(change: AttackModiferDeckChange) {
    gameManager.game.allyAttackModifierDeck = change.deck;
    gameManager.stateManager.after();
  }

  confirmTurns() {
    gameManager.game.figures.forEach((figure) => gameManager.roundManager.afterTurn(figure));
    this.next(true);
  }

  finishScenario(success: boolean) {
    gameManager.stateManager.before("finishScenario." + (success ? "sucess" : "failure"));
    gameManager.scenarioManager.finishScenario(success);
    gameManager.stateManager.after(1000);
  }

  resetScenario() {
    gameManager.stateManager.before("resetScenario");
    gameManager.roundManager.resetScenario();
    gameManager.stateManager.after(1000);
  }

  empty(): boolean {
    return gameManager.game.figures.length == 0;
  }

  missingInitative(): boolean {
    return gameManager.game.figures.some((figure) => figure instanceof Character && settingsManager.settings.initiativeRequired && figure.initiative < 1 && !figure.exhausted);
  }

  active(): boolean {
    return gameManager.game.figures.find((figure) => figure.active && !figure.off) != undefined;
  };

  finish(): boolean {
    return gameManager.game.round > 1 && !this.missingInitative() && !this.active() && !this.empty() && gameManager.game.figures.some((figure) => figure instanceof Character) && gameManager.game.figures.every((figure) => !(figure instanceof Monster) || figure instanceof Monster && figure.entities.every((entity) => entity.dead || entity.health <= 0)) && gameManager.game.figures.some((figure) => figure instanceof Character && !figure.exhausted && figure.health > 0);
  }

  failed(): boolean {
    return !this.active() && !this.empty() && gameManager.game.figures.some((figure) => figure instanceof Character) && gameManager.game.figures.every((figure) => !(figure instanceof Character) || figure instanceof Character && (figure.exhausted || figure.health <= 0));
  }

  disabled(): boolean {
    return (gameManager.game.state == GameState.draw && this.drawDisabled() || gameManager.game.state == GameState.next && this.nextDisabled());
  }

  drawDisabled(): boolean {
    return this.empty() || this.missingInitative() || this.finish() || this.failed();
  }

  nextDisabled(): boolean {
    return this.active() || this.finish() || this.failed();
  }

}

