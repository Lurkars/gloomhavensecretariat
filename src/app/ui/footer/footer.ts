import { Dialog } from '@angular/cdk/dialog';
import { ConnectionPositionPair, Overlay } from '@angular/cdk/overlay';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { AttackModiferDeckChange, AttackModifierDeckComponent } from '../figures/attackmodifier/attackmodifierdeck';
import { ChallengeDeckChange } from '../figures/challenges/challenge-deck';
import { LootDeckChange, LootDeckComponent } from '../figures/loot/loot-deck';
import { HintDialogComponent } from './hint-dialog/hint-dialog';
import { LevelComponent } from './level/level';
import { ScenarioComponent } from './scenario/scenario';
import { ScenarioConclusionComponent } from './scenario/scenario-conclusion/scenario-conclusion';
import { ScenarioSummaryComponent } from './scenario/summary/scenario-summary';

@Component({
  standalone: false,
  selector: 'ghs-footer',
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss']
})
export class FooterComponent implements OnInit, OnDestroy {

  @ViewChild('nextButton', { static: false }) nextButton!: ElementRef;
  @ViewChild('footer', { static: false }) footer!: ElementRef;
  @ViewChild('monsterDeck', { static: false }) monsterDeck!: ElementRef;
  @ViewChild('ghsLevel', { static: false }) ghsLevel!: LevelComponent;
  @ViewChild('ghsScenario', { static: false }) ghsScenario!: ScenarioComponent;
  @ViewChild('monsterAttackModifierDeck', { static: false }) monsterAttackModifierDeck!: AttackModifierDeckComponent;
  @ViewChild('allyAttackModifierDeck', { static: false }) allyAttackModifierDeck!: AttackModifierDeckComponent;
  @ViewChild('lootDeck', { static: false }) lootDeck!: LootDeckComponent;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  currentTime: string = "";
  hasAllyAttackModifierDeck: boolean = false;
  lootDeckEnabeld: boolean = false;

  compact: boolean = false;

  nextHint: boolean = false;

  constructor(private dialog: Dialog, private overlay: Overlay) { }

  ngOnInit(): void {
    this.hasAllyAttackModifierDeck = settingsManager.settings.allyAttackModifierDeck && (settingsManager.settings.alwaysAllyAttackModifierDeck || gameManager.fhRules() && gameManager.game.figures.some((figure) => figure instanceof Monster && (figure.isAlly || figure.isAllied) || figure instanceof ObjectiveContainer && figure.objectiveId && gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(figure.objectiveId)?.allyDeck) || gameManager.game.scenario && gameManager.game.scenario.allyDeck) || false;

    this.lootDeckEnabeld = settingsManager.settings.lootDeck && Object.keys(gameManager.game.lootDeck.cards).length > 0;

    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => {
        this.hasAllyAttackModifierDeck = settingsManager.settings.allyAttackModifierDeck && (settingsManager.settings.alwaysAllyAttackModifierDeck || gameManager.fhRules() && gameManager.game.figures.some((figure) => figure instanceof Monster && (figure.isAlly || figure.isAllied) || figure instanceof ObjectiveContainer && figure.objectiveId && gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(figure.objectiveId)?.allyDeck) || gameManager.game.scenario && gameManager.game.scenario.allyDeck) || false;
        this.lootDeckEnabeld = settingsManager.settings.lootDeck && Object.keys(gameManager.game.lootDeck.cards).length > 0;
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
      this.compact = this.monsterDeck && this.monsterDeck.nativeElement.clientWidth > this.footer.nativeElement.clientWidth * 0.3;
    }, 100)

    window.addEventListener('resize', (event) => {
      this.compact = this.monsterDeck && this.monsterDeck.nativeElement.clientWidth > this.footer.nativeElement.clientWidth * 0.3;
    });
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  next(force: boolean = false): void {
    if (!force && this.disabled()) {
      this.nextHint = true;
      const dialogRef = this.dialog.open(HintDialogComponent, {
        panelClass: ['dialog'],
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
    if (gameManager.game.state == GameState.next) {
      if (settingsManager.settings.turnConfirmation) {
        const activeFigure = gameManager.game.figures.find((figure) => figure.active && !figure.off);
        if (!this.activeHint() && activeFigure) {
          gameManager.roundManager.afterTurn(activeFigure);
        }
      } else {
        let lastActive = gameManager.game.figures.find((figure) => gameManager.gameplayFigure(figure) && !figure.off);
        while (lastActive) {
          gameManager.roundManager.toggleFigure(lastActive);
          lastActive = gameManager.game.figures.find((figure) => gameManager.gameplayFigure(figure) && !figure.off);
        }
      }
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

  beforeChallengeDeck(change: ChallengeDeckChange) {
    gameManager.stateManager.before(change.type, ...change.values)
  }

  afterChallengeDeck(change: ChallengeDeckChange) {
    gameManager.game.challengeDeck = change.deck;
    gameManager.stateManager.after();
  }

  confirmTurns() {
    gameManager.game.figures.forEach((figure) => gameManager.roundManager.afterTurn(figure));
    this.next(true);
  }

  finishScenario(success: boolean) {
    if (gameManager.game.scenario) {
      const conclusions = gameManager.sectionData(gameManager.game.scenario.edition).filter((sectionData) => {
        if (gameManager.game.scenario) {
          return sectionData.edition == gameManager.game.scenario.edition && sectionData.parent == gameManager.game.scenario.index && sectionData.group == gameManager.game.scenario.group && sectionData.conclusion && gameManager.scenarioManager.getRequirements(sectionData).length == 0;
        }
        return false;
      });

      if (conclusions.length == 0 || !success) {
        this.dialog.open(ScenarioSummaryComponent, {
          panelClass: ['dialog'],
          data: {
            scenario: gameManager.game.scenario,
            success: success
          }
        })
      } else {
        this.dialog.open(ScenarioConclusionComponent, {
          panelClass: ['dialog'],
          data: { conclusions: conclusions, parent: gameManager.game.scenario }
        }).closed.subscribe({
          next: (conclusion) => {
            if (conclusion) {
              this.dialog.open(ScenarioSummaryComponent, {
                panelClass: ['dialog'],
                data: {
                  scenario: gameManager.game.scenario,
                  conclusion: conclusion,
                  success: success
                }
              })
            }
          }
        });
      }
    }
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
    const offset = (gameManager.game.round > 0 || gameManager.game.roundResets.length > 0 || gameManager.game.roundResetsHidden.length > 0) && gameManager.game.state == GameState.draw ? 1 : 0;
    if (gameManager.game.roundResetsHidden.length == 0) {
      return gameManager.game.round + offset;
    }
    return gameManager.game.round + offset + gameManager.game.roundResetsHidden.reduce((a, b) => (a ? a : 0) + (b ? b : 0));
  }

  totalRounds() {
    if (gameManager.game.roundResets.length == 0) {
      return 0;
    }
    return gameManager.game.roundResets.reduce((a, b) => (a ? a : 0) + (b ? b : 0)) + this.round();
  }

  missingInitiative(): boolean {
    return gameManager.game.figures.some((figure) => settingsManager.settings.initiativeRequired && (figure instanceof Character && gameManager.entityManager.isAlive(figure) && !figure.absent || figure instanceof ObjectiveContainer) && figure.getInitiative() < 1);
  }

  active(): boolean {
    return gameManager.game.figures.find((figure) => figure.active && !figure.off && (!(figure instanceof Character) || !figure.absent)) != undefined;
  }

  battleGoals(): boolean {
    return !this.missingInitiative() && settingsManager.settings.battleGoals && settingsManager.settings.battleGoalsReminder && gameManager.game.scenario != undefined && gameManager.roundManager.firstRound && !gameManager.game.figures.every((figure) => !(figure instanceof Character) || figure.battleGoal || figure.absent) && !gameManager.bbRules();
  }

  activeHint(): boolean {
    return (this.active() && settingsManager.settings.turnConfirmation && (settingsManager.settings.expireConditions || settingsManager.settings.applyConditions));
  }

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
    return this.empty() || this.missingInitiative() || this.battleGoals() || this.finish() || this.failed();
  }

  nextDisabled(): boolean {
    return this.activeHint() || this.finish() || this.failed();
  }

  toggleActiveAllyAttackModifierDeck() {
    this.beforeAllyAttackModifierDeck(new AttackModiferDeckChange(gameManager.game.allyAttackModifierDeck, gameManager.game.allyAttackModifierDeck.active && (!this.compact || !gameManager.game.lootDeck.active) ? 'amDeckHide' : 'amDeckShow'));
    if (this.compact && gameManager.game.lootDeck.active) {
      gameManager.game.lootDeck.active = false;
      gameManager.game.allyAttackModifierDeck.active = true;
    } else {
      gameManager.game.allyAttackModifierDeck.active = !gameManager.game.allyAttackModifierDeck.active;
    }
    this.afterAllyAttackModifierDeck(new AttackModiferDeckChange(gameManager.game.allyAttackModifierDeck, !gameManager.game.allyAttackModifierDeck.active ? 'amDeckHide' : 'amDeckShow'));
  }

  toggleActiveMonsterAttackModifierDeck() {
    this.beforeMonsterAttackModifierDeck(new AttackModiferDeckChange(gameManager.game.monsterAttackModifierDeck, gameManager.game.monsterAttackModifierDeck.active && (!this.compact || !gameManager.game.lootDeck.active) ? 'amDeckHide' : 'amDeckShow'));
    if (this.compact && (gameManager.game.lootDeck.active || gameManager.game.challengeDeck.active)) {
      gameManager.game.lootDeck.active = false;
      gameManager.game.challengeDeck.active = false;
      gameManager.game.monsterAttackModifierDeck.active = true;
    } else {
      gameManager.game.monsterAttackModifierDeck.active = !gameManager.game.monsterAttackModifierDeck.active;
    }
    this.afterMonsterAttackModifierDeck(new AttackModiferDeckChange(gameManager.game.monsterAttackModifierDeck, !gameManager.game.monsterAttackModifierDeck.active ? 'amDeckHide' : 'amDeckShow'));
  }

  toggleLootDeck() {
    this.beforeLootDeck(new LootDeckChange(gameManager.game.lootDeck, gameManager.game.lootDeck.active ? 'lootDeckHide' : 'lootDeckShow'));
    gameManager.game.lootDeck.active = !gameManager.game.lootDeck.active;
    this.afterLootDeck(new LootDeckChange(gameManager.game.lootDeck, !gameManager.game.lootDeck.active ? 'lootDeckHide' : 'lootDeckShow'));
  }

  toggleChallengeDeck() {
    this.beforeChallengeDeck(new ChallengeDeckChange(gameManager.game.challengeDeck, gameManager.game.challengeDeck.active ? 'challengeDeck.hide' : 'challengeDeck.show'));
    gameManager.game.challengeDeck.active = !gameManager.game.challengeDeck.active;
    this.afterChallengeDeck(new ChallengeDeckChange(gameManager.game.challengeDeck, !gameManager.game.challengeDeck.active ? 'challengeDeck.hide' : 'challengeDeck.show'));
  }
}