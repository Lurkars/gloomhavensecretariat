import { Dialog } from '@angular/cdk/dialog';
import { ConnectionPositionPair, Overlay } from '@angular/cdk/overlay';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { AttackModiferDeckChange } from '../figures/attackmodifier/attackmodifierdeck';
import { HintDialogComponent } from './hint-dialog/hint-dialog';
import { LootDeckChange } from '../figures/loot/loot-deck';
import { Objective } from 'src/app/game/model/Objective';

@Component({
  selector: 'ghs-footer',
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss']
})
export class FooterComponent implements OnInit {

  @ViewChild('nextButton', { static: false }) nextButton!: ElementRef;
  @ViewChild('footer', { static: false }) footer!: ElementRef;
  @ViewChild('monsterDeck', { static: false }) monsterDeck!: ElementRef;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  currentTime: string = "";
  hasAllyAttackModifierDeck: boolean = false;
  lootDeck: boolean = false;

  compact: boolean = false;

  nextHint: boolean = false;

  constructor(private dialog: Dialog, private overlay: Overlay) { }

  ngOnInit(): void {
    this.hasAllyAttackModifierDeck = (settingsManager.settings.alwaysAllyAttackModifierDeck || gameManager.fhRules()) && gameManager.game.figures.some((figure) => figure instanceof Monster && figure.isAlly || figure instanceof Objective && figure.objectiveId && gameManager.objectiveDataByScenarioObjectiveIdentifier(figure.objectiveId)?.allyDeck) || gameManager.game.scenario && gameManager.game.scenario.allyDeck || false;

    this.lootDeck = Object.keys(gameManager.game.lootDeck.cards).length > 0;

    gameManager.uiChange.subscribe({
      next: () => {
        this.hasAllyAttackModifierDeck = (settingsManager.settings.alwaysAllyAttackModifierDeck || gameManager.fhRules()) && gameManager.game.figures.some((figure) => figure instanceof Monster && figure.isAlly || figure instanceof Objective && figure.objectiveId && gameManager.objectiveDataByScenarioObjectiveIdentifier(figure.objectiveId)?.allyDeck) || gameManager.game.scenario && gameManager.game.scenario.allyDeck || false;
        this.lootDeck = Object.keys(gameManager.game.lootDeck.cards).length > 0;
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

    setTimeout(() => {
      this.compact = this.monsterDeck.nativeElement.clientWidth > this.footer.nativeElement.clientWidth * 0.3;
    })

    window.addEventListener('resize', (event) => {
      this.compact = this.monsterDeck.nativeElement.clientWidth > this.footer.nativeElement.clientWidth * 0.3;
    });

    window.addEventListener('keydown', (event: KeyboardEvent) => {
      if (!event.shiftKey && !event.ctrlKey && !event.altKey && !this.nextHint && (event.key === 'r' || event.key === 'n')) {
        this.next();
      }
    })
  }

  next(force: boolean = false): void {
    if (!force && this.disabled()) {
      this.nextHint = true;
      const dialogRef = this.dialog.open(HintDialogComponent, {
        panelClass: 'dialog',
        positionStrategy: this.overlay.position().flexibleConnectedTo(this.nextButton).withPositions([new ConnectionPositionPair(
          { originX: 'end', originY: 'bottom' },
          { overlayX: 'start', overlayY: 'bottom' })]).withDefaultOffsetX(10).withDefaultOffsetY(-10)
      })

      dialogRef.closed.subscribe({
        next: (result) => {
          this.nextHint = false;
          if (result) {
            this.nextState();
          }
        }
      })
    } else {
      this.nextState();
    }
  }

  async nextState() {
    gameManager.stateManager.before(gameManager.game.state == GameState.next ? "nextRound" : "draw");
    const activeFigure = gameManager.game.figures.find((figure) => figure.active && !figure.off);
    if (!this.active() && activeFigure) {
      gameManager.roundManager.afterTurn(activeFigure);
    }
    gameManager.roundManager.nextGameState();
    gameManager.stateManager.after(1000);
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

  beforeLootDeck(change: LootDeckChange) {
    gameManager.stateManager.before(change.type, ...change.values)
  }

  afterLootDeck(change: LootDeckChange) {
    gameManager.game.lootDeck = change.deck;
    gameManager.stateManager.after();
  }

  toggleLootDeck() {
    gameManager.stateManager.before(gameManager.game.lootDeck.active ? 'lootDeckHide' : 'lootDeckShow');
    gameManager.game.lootDeck.active = !gameManager.game.lootDeck.active;
    gameManager.stateManager.after();
  }

  confirmTurns() {
    gameManager.game.figures.forEach((figure) => gameManager.roundManager.afterTurn(figure));
    this.next(true);
  }

  finishScenario(success: boolean) {
    gameManager.stateManager.before("finishScenario." + (success ? "success" : "failure"), ...gameManager.scenarioManager.scenarioUndoArgs());
    gameManager.scenarioManager.finishScenario(success);
    gameManager.stateManager.after(1000);
  }

  resetScenario() {
    gameManager.stateManager.before("resetScenario", ...gameManager.scenarioManager.scenarioUndoArgs());
    gameManager.roundManager.resetScenario();
    gameManager.stateManager.after(1000);
  }

  empty(): boolean {
    return gameManager.game.figures.length == 0;
  }

  round(): number {
    const offset = gameManager.game.round > 0 && gameManager.game.state == GameState.draw ? 1 : 0;
    if (gameManager.game.roundResets.length == 0) {
      return gameManager.game.round + offset;
    }
    return gameManager.game.round + offset + gameManager.game.roundResets.reduce((a, b) => (a ? a - 1 : 0) + (b ? b - 1 : 0));
  }

  missingInitiative(): boolean {
    return gameManager.game.figures.some((figure) => figure instanceof Character && settingsManager.settings.initiativeRequired && figure.initiative < 1 && !figure.exhausted && !figure.absent);
  }

  active(): boolean {
    return gameManager.game.figures.find((figure) => figure.active && !figure.off && (!(figure instanceof Character) || !figure.absent)) != undefined;
  };

  finish(): boolean {
    return false;
  }

  failed(): boolean {
    return !this.active() && !this.empty() && gameManager.game.figures.some((figure) => figure instanceof Character) && gameManager.game.figures.every((figure) => !(figure instanceof Character) || figure instanceof Character && (figure.exhausted || figure.health <= 0 || figure.absent));
  }

  disabled(): boolean {
    return (gameManager.game.state == GameState.draw && this.drawDisabled() || gameManager.game.state == GameState.next && this.nextDisabled());
  }

  drawDisabled(): boolean {
    return this.empty() || this.missingInitiative() || this.finish() || this.failed();
  }

  nextDisabled(): boolean {
    return this.active() || this.finish() || this.failed();
  }

}