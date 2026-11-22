import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { ConnectionPositionPair, Overlay } from '@angular/cdk/overlay';
import { NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, viewChild } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager, soundboardManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { AttackModifierDeck } from 'src/app/game/model/data/AttackModifier';
import { AttackModiferDeckChange, AttackModifierDeckComponent } from 'src/app/ui/figures/attackmodifier/attackmodifierdeck';
import { ChallengeDeckChange, ChallengeDeckComponent } from 'src/app/ui/figures/challenges/challenge-deck';
import { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';
import { LootDeckChange, LootDeckComponent } from 'src/app/ui/figures/loot/loot-deck';
import { openPendingWeekSections } from 'src/app/ui/figures/party/week-sections/week-sections';
import { HintDialogComponent } from 'src/app/ui/footer/hint-dialog/hint-dialog';
import { LevelComponent } from 'src/app/ui/footer/level/level';
import { ScenarioRulesComponent } from 'src/app/ui/footer/scenario-rules/scenario-rules';
import { ScenarioComponent } from 'src/app/ui/footer/scenario/scenario';
import { openScenarioFinish } from 'src/app/ui/footer/scenario/summary/scenario-finish';
import { ConfirmDialogComponent } from 'src/app/ui/helper/confirm/confirm';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { TabClickDirective } from 'src/app/ui/helper/tabclick';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';

@Component({
  imports: [
    NgClass,
    GhsLabelDirective,
    GhsTooltipDirective,
    TabClickDirective,
    LevelComponent,
    ScenarioComponent,
    ScenarioRulesComponent,
    AttackModifierDeckComponent,
    LootDeckComponent,
    ChallengeDeckComponent,
    PointerInputDirective
  ],
  selector: 'ghs-footer',
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss']
})
export class FooterComponent implements OnInit {
  private elementRef = inject(ElementRef);
  private dialog = inject(Dialog);
  private overlay = inject(Overlay);
  private ghsManager = inject(GhsManager);

  private cdr = inject(ChangeDetectorRef);

  readonly nextButton = viewChild.required<ElementRef>('nextButton');
  readonly monsterDeck = viewChild<ElementRef>('monsterDeck');
  readonly ghsLevel = viewChild<LevelComponent>('ghsLevel');
  readonly ghsScenario = viewChild<ScenarioComponent>('ghsScenario');
  readonly monsterAttackModifierDeck = viewChild<AttackModifierDeckComponent>('monsterAttackModifierDeck');
  readonly allyAttackModifierDeck = viewChild<AttackModifierDeckComponent>('allyAttackModifierDeck');
  readonly lootDeck = viewChild<LootDeckComponent>('lootDeck');

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  currentTime: string = '';
  hasAllyAttackModifierDeck: boolean = false;
  lootDeckEnabeld: boolean = false;
  activeCharacter: Character | undefined;
  activeCharacterFade: boolean = false;
  activeCharacterActiveAMs: number = 0;
  fhRules: boolean = false;

  initiativeSetDialog: DialogRef<unknown, ConfirmDialogComponent> | 'discard' | false = false;

  compact: boolean = false;

  nextHint: boolean = false;

  isDisabled: boolean = false;

  constructor() {
    this.ghsManager.uiChangeEffect(() => {
      this.update();
      // open dialogs for calendar sections of passed weeks
      openPendingWeekSections(this.dialog);
    });
  }

  ngOnInit(): void {
    this.hasAllyAttackModifierDeck =
      (settingsManager.settings.allyAttackModifierDeck &&
        (settingsManager.settings.alwaysAllyAttackModifierDeck ||
          (gameManager.fhRules(true) &&
            gameManager.game.figures.some(
              (figure) =>
                (figure instanceof Monster && (figure.isAlly || figure.isAllied)) ||
                (figure instanceof ObjectiveContainer &&
                  ((figure.objectiveId && gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(figure.objectiveId)?.allyDeck) ||
                    figure.amDeck === 'A'))
            )) ||
          (gameManager.game.scenario && gameManager.game.scenario.allyDeck))) ||
      false;

    this.lootDeckEnabeld = settingsManager.settings.lootDeck && Object.keys(gameManager.game.lootDeck.cards).length > 0;

    this.isDisabled = this.disabled();

    setInterval(() => {
      gameManager.game.playSeconds++;
      let seconds = gameManager.game.playSeconds;
      this.currentTime = '';
      if (seconds / 3600 >= 1) {
        this.currentTime += Math.floor(seconds / 3600) + 'h ';
        seconds = seconds % 3600;
      }

      if (seconds / 60 >= 1) {
        this.currentTime +=
          (this.currentTime && this.currentTime && Math.floor(seconds / 60) < 10 ? '0' : '') + Math.floor(seconds / 60) + 'm ';
        seconds = seconds % 60;
      }
      this.currentTime += (this.currentTime && seconds < 10 ? '0' : '') + Math.floor(seconds) + 's';

      // store every 30 seconds
      if (new Date().getTime() / 1000 - gameManager.stateManager.lastSaveTimestamp / 1000 > 30) {
        gameManager.stateManager.saveLocal();
      }

      if (
        gameManager.lootManager.easter &&
        !!gameManager.game.scenario &&
        gameManager.game.state === GameState.draw &&
        !gameManager.roundManager.firstRound &&
        gameManager.game.playSeconds >= 300
      ) {
        const waitingSteps = [300, 600, 840, 1020, 1140, 1200];
        if (
          waitingSteps.includes(gameManager.game.playSeconds) ||
          (gameManager.game.playSeconds > waitingSteps[waitingSteps.length - 1] && gameManager.game.playSeconds % 60 === 0)
        ) {
          soundboardManager.play('waiting');
        }
      }

      this.cdr.detectChanges();
    }, 1000);

    setTimeout(() => {
      const monsterDeck = this.monsterDeck();
      this.compact = !!monsterDeck && monsterDeck.nativeElement.clientWidth > this.elementRef.nativeElement.clientWidth * 0.3;
      this.cdr.markForCheck();
    }, 100);

    window.addEventListener('resize', () => {
      const monsterDeck = this.monsterDeck();
      this.compact = !!monsterDeck && monsterDeck.nativeElement.clientWidth > this.elementRef.nativeElement.clientWidth * 0.3;
    });
  }

  update() {
    this.hasAllyAttackModifierDeck =
      (settingsManager.settings.allyAttackModifierDeck &&
        (settingsManager.settings.alwaysAllyAttackModifierDeck ||
          (gameManager.fhRules(true) &&
            gameManager.game.figures.some(
              (figure) =>
                (figure instanceof Monster && (figure.isAlly || figure.isAllied)) ||
                (figure instanceof ObjectiveContainer &&
                  ((figure.objectiveId && gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(figure.objectiveId)?.allyDeck) ||
                    figure.amDeck === 'A'))
            )) ||
          (gameManager.game.scenario && gameManager.game.scenario.allyDeck))) ||
      false;
    this.lootDeckEnabeld = settingsManager.settings.lootDeck && Object.keys(gameManager.game.lootDeck.cards).length > 0;
    const activeCharacter = settingsManager.settings.characterAttackModifierDeckActiveBottom
      ? (gameManager.game.figures.find(
          (figure) => figure instanceof Character && (figure.attackModifierDeckVisible || gameManager.bbRules())
        ) as Character)
      : undefined;
    if (settingsManager.settings.animations && ((this.activeCharacter && !activeCharacter) || (!this.activeCharacter && activeCharacter))) {
      this.activeCharacterFade = true;
      if (activeCharacter) {
        this.activeCharacter = activeCharacter;
      }
      setTimeout(
        () => {
          if (activeCharacter) {
            this.activeCharacterFade = false;
          } else {
            this.activeCharacter = activeCharacter;
          }
          this.cdr.markForCheck();
        },
        activeCharacter ? 1 : 500 * settingsManager.settings.animationSpeed
      );
    } else {
      this.activeCharacter = activeCharacter;
      this.activeCharacterFade = !activeCharacter && settingsManager.settings.animations;
    }

    if (this.activeCharacter) {
      this.activeCharacterActiveAMs = this.activeCharacter.attackModifierDeck.cards.filter(
        (am, i) =>
          this.activeCharacter &&
          am.active &&
          i < this.activeCharacter.attackModifierDeck.lastVisible &&
          !this.activeCharacter.attackModifierDeck.discarded.includes(i)
      ).length;
    }

    this.isDisabled = this.disabled();

    this.fhRules = gameManager.fhRules();

    if (
      settingsManager.settings.initiativeRequired &&
      settingsManager.settings.initiativeRoundConfirm &&
      gameManager.game.state === GameState.draw &&
      gameManager.game.scenario &&
      !this.nextHint
    ) {
      if (
        gameManager.game.figures.find(
          (figure) => figure instanceof Character && gameManager.entityManager.isAlive(figure) && !figure.absent
        ) !== undefined &&
        gameManager.game.figures.every(
          (figure) =>
            !(figure instanceof Character) || !gameManager.entityManager.isAlive(figure) || figure.absent || figure.getInitiative() > 0
        )
      ) {
        if (!this.initiativeSetDialog) {
          this.initiativeSetDialog = this.dialog.open(ConfirmDialogComponent, {
            panelClass: ['dialog'],
            data: {
              label: 'round.hint.initiativeRoundConfirm'
            }
          });
          this.initiativeSetDialog.closed.subscribe({
            next: (result) => {
              this.initiativeSetDialog = 'discard';
              if (result) {
                this.initiativeSetDialog = false;
                this.next();
              }
            }
          });
        }
      } else {
        if (this.initiativeSetDialog instanceof DialogRef) {
          this.initiativeSetDialog.close();
        }
        this.initiativeSetDialog = false;
      }
    } else if (gameManager.game.state === GameState.next) {
      this.initiativeSetDialog = false;
    }
  }

  next(force: boolean = false): void {
    if (!force && this.disabled()) {
      this.nextHint = true;
      const dialogRef = this.dialog.open(HintDialogComponent, {
        panelClass: ['dialog'],
        positionStrategy: this.overlay
          .position()
          .flexibleConnectedTo(this.nextButton())
          .withPositions([new ConnectionPositionPair({ originX: 'end', originY: 'bottom' }, { overlayX: 'start', overlayY: 'bottom' })])
          .withDefaultOffsetX(10)
          .withDefaultOffsetY(-10)
      });

      dialogRef.closed.subscribe({
        next: (result) => {
          this.nextHint = false;
          this.initiativeSetDialog = 'discard';
          if (result) {
            this.nextState();
          }
        }
      });
    } else {
      this.nextState();
    }
  }

  async nextState() {
    gameManager.stateManager.before(
      ...(gameManager.game.state === GameState.next ? ['roundNext', gameManager.game.round] : ['roundDraw', gameManager.game.round + 1])
    );
    gameManager.roundManager.nextRound();
    gameManager.stateManager.after(1000);
  }

  beforeMonsterAttackModifierDeck(change: AttackModiferDeckChange) {
    gameManager.stateManager.before('updateAttackModifierDeck.' + change.type, 'monster', ...change.values);
  }

  afterMonsterAttackModifierDeck(change: AttackModiferDeckChange) {
    gameManager.game.monsterAttackModifierDeck = change.deck;
    gameManager.stateManager.after();
  }

  beforeAllyAttackModifierDeck(change: AttackModiferDeckChange) {
    gameManager.stateManager.before('updateAttackModifierDeck.' + change.type, 'ally', ...change.values);
  }

  afterAllyAttackModifierDeck(change: AttackModiferDeckChange) {
    gameManager.game.allyAttackModifierDeck = change.deck;
    gameManager.stateManager.after();
  }

  beforeCharacterAttackModifierDeck(character: Character, change: AttackModiferDeckChange) {
    gameManager.stateManager.before(
      'updateAttackModifierDeck.' + change.type,
      gameManager.characterManager.characterName(character, true, true),
      ...change.values
    );
  }

  afterCharacterAttackModifierDeck(character: Character, change: AttackModiferDeckChange) {
    character.attackModifierDeck = change.deck;
    gameManager.stateManager.after();
  }

  beforeLootDeck(change: LootDeckChange) {
    gameManager.stateManager.before(change.type, ...change.values);
  }

  afterLootDeck(change: LootDeckChange) {
    gameManager.game.lootDeck = change.deck;
    gameManager.stateManager.after();
  }

  beforeChallengeDeck(change: ChallengeDeckChange) {
    gameManager.stateManager.before(change.type, ...change.values);
  }

  afterChallengeDeck(change: ChallengeDeckChange) {
    gameManager.game.challengeDeck = change.deck;
    gameManager.stateManager.after();
  }

  confirmTurns() {
    gameManager.roundManager.endAllTurns();
    this.next(true);
  }

  finishScenario(success: boolean) {
    if (gameManager.game.scenario) {
      openScenarioFinish(this.dialog, gameManager.game.scenario, success);
    }
  }

  resetScenario() {
    gameManager.stateManager.before('resetScenario', ...gameManager.scenarioManager.scenarioUndoArgs());
    gameManager.roundManager.resetScenario();
    gameManager.stateManager.after(1000);
  }

  empty(): boolean {
    return gameManager.game.figures.length === 0;
  }

  round(): number {
    const offset =
      (gameManager.game.round > 0 || gameManager.game.roundResets.length > 0 || gameManager.game.roundResetsHidden.length > 0) &&
      gameManager.game.state === GameState.draw
        ? 1
        : 0;
    if (gameManager.game.roundResetsHidden.length === 0) {
      return gameManager.game.round + offset;
    }
    return gameManager.game.round + offset + gameManager.game.roundResetsHidden.reduce((a, b) => (a ? a : 0) + (b ? b : 0));
  }

  totalRounds() {
    if (gameManager.game.roundResets.length === 0) {
      return 0;
    }
    return gameManager.game.roundResets.reduce((a, b) => (a ? a : 0) + (b ? b : 0)) + this.round();
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

  activeHint(): boolean {
    return gameManager.roundManager.turnConfirmationPending();
  }

  finish(): boolean {
    return false;
  }

  failed(): boolean {
    return gameManager.roundManager.scenarioFailed();
  }

  disabled(): boolean {
    return (
      (gameManager.game.state === GameState.draw && this.drawDisabled()) ||
      (gameManager.game.state === GameState.next && this.nextDisabled())
    );
  }

  drawDisabled(): boolean {
    return gameManager.roundManager.drawBlocked();
  }

  nextDisabled(): boolean {
    return gameManager.roundManager.nextBlocked();
  }

  toggleActiveCharacterAttackModifierDeck() {
    if (this.activeCharacter) {
      this.toggleAttackModifierDeck(
        this.activeCharacter.attackModifierDeck,
        gameManager.characterManager.characterName(this.activeCharacter, true, true)
      );
    }
  }

  toggleActiveAllyAttackModifierDeck() {
    this.toggleAttackModifierDeck(gameManager.game.allyAttackModifierDeck, 'ally');
  }

  toggleActiveMonsterAttackModifierDeck() {
    this.toggleAttackModifierDeck(gameManager.game.monsterAttackModifierDeck, 'monster');
  }

  private toggleAttackModifierDeck(deck: AttackModifierDeck, name: string) {
    gameManager.stateManager.before(
      'updateAttackModifierDeck.' + (deck.active && (!this.compact || !gameManager.game.lootDeck.active) ? 'amDeckHide' : 'amDeckShow'),
      name
    );
    gameManager.attackModifierManager.toggleDeckActive(deck, this.compact);
    gameManager.stateManager.after();
  }

  toggleLootDeck() {
    this.beforeLootDeck(new LootDeckChange(gameManager.game.lootDeck, gameManager.game.lootDeck.active ? 'lootDeckHide' : 'lootDeckShow'));
    gameManager.game.lootDeck.active = !gameManager.game.lootDeck.active;
    this.afterLootDeck(new LootDeckChange(gameManager.game.lootDeck, !gameManager.game.lootDeck.active ? 'lootDeckHide' : 'lootDeckShow'));
  }

  toggleChallengeDeck() {
    this.beforeChallengeDeck(
      new ChallengeDeckChange(
        gameManager.game.challengeDeck,
        gameManager.game.challengeDeck.active ? 'challengeDeck.hide' : 'challengeDeck.show'
      )
    );
    gameManager.game.challengeDeck.active = !gameManager.game.challengeDeck.active;
    this.afterChallengeDeck(
      new ChallengeDeckChange(
        gameManager.game.challengeDeck,
        !gameManager.game.challengeDeck.active ? 'challengeDeck.hide' : 'challengeDeck.show'
      )
    );
  }

  openEntitiesMenu(eventMenu: boolean = false) {
    this.dialog.open(EntitiesMenuDialogComponent, {
      panelClass: ['dialog'],
      data: { eventMenu: eventMenu }
    });
  }
}
