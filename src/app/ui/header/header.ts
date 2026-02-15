import { Dialog } from '@angular/cdk/dialog';
import { ConnectionPositionPair, Overlay } from '@angular/cdk/overlay';
import { ChangeDetectorRef, Component, ElementRef, inject, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { settingsManager, SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Element } from 'src/app/game/model/data/Element';
import { GameClockTimestamp, GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { EventEffectsDialog } from '../figures/event-effects/event-effects';
import { StablesComponent } from '../figures/party/buildings/stables/stables';
import { GameClockDialogComponent } from './game-clock/game-clock';
import { MainMenuComponent, SubMenu } from './menu/menu';
import { PartySheetComponent } from './party/party-sheet';

@Component({
  standalone: false,
  selector: 'ghs-header',
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);

  @Input() standalone: boolean = false;
  @Input() connection: boolean = false;
  @ViewChild('mainMenuButton') mainMenuButton!: ElementRef;
  @ViewChild('partySheet') partySheet!: PartySheetComponent;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  WebSocket = WebSocket;

  SubMenu = SubMenu;
  menuState: SubMenu = SubMenu.main;

  elements: Element[] = [Element.fire, Element.ice, Element.air, Element.earth, Element.light, Element.dark];

  init: boolean = false;
  hintState: string = "";
  characterCount: number = 0;

  lastGameClockTimestamp: GameClockTimestamp | undefined;
  overallGameClock: number = 0;
  currentGameClock: number = 0;
  gameClockInterval: any;

  constructor(private dialog: Dialog, private overlay: Overlay, private ghsManager: GhsManager) {
    this.ghsManager.uiChangeEffect(() => {
      this.characterCount = gameManager.characterManager.characterCount(true);
      if (this.hintStateValue() != this.hintState) {
        this.init = false;
        setTimeout(() => {
          this.hintState = this.hintStateValue();
          this.init = true;
          this.cdr.markForCheck();
        }, settingsManager.settings.animations ? 500 * settingsManager.settings.animationSpeed : 0);
      }
      this.updateClock();
    });
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.init = true;
      this.cdr.markForCheck();
    }, settingsManager.settings.animations ? 1500 * settingsManager.settings.animationSpeed : 0);

  }

  ngOnDestroy(): void {
    if (this.gameClockInterval) {
      clearInterval(this.gameClockInterval);
    }
  }

  syncing(): boolean {
    return window.document.body.classList.contains('server-sync');
  }

  hintStateValue(): string {
    if (gameManager.game.playerCount < 1 && gameManager.game.figures.every((figure) => !(figure instanceof Character) && !(figure instanceof Monster))) {
      return 'characters';
    } else if (!gameManager.game.scenario && gameManager.game.figures.every((figure) => !(figure instanceof Monster))) {
      return 'scenario';
    } else if (gameManager.game.figures.every((figure) => !(figure instanceof Monster))) {
      return 'monsters';
    } else if (gameManager.game.figures.every((figure) => !(figure instanceof Monster) || figure.entities.length == 0)) {
      return 'addMonsterEntities';
    } else if (gameManager.game.figures.some((figure) => figure.active)) {
      return gameManager.game.round < 3 ? 'active-full' : 'active';
    } else if (gameManager.game.state == GameState.draw) {
      if (gameManager.game.figures.some((figure) => figure instanceof Character && !figure.absent && gameManager.entityManager.isAlive(figure) && settingsManager.settings.initiativeRequired && figure.initiative <= 0)) {
        return gameManager.game.round < 3 ? 'draw-full' : 'draw-short';
      }
      return 'draw';
    } else if (gameManager.game.state == GameState.next) {
      return 'next';
    }

    return "";
  }

  openMenu(menu: SubMenu | undefined = undefined) {
    this.dialog.open(MainMenuComponent, {
      panelClass: ['dialog'],
      data: { subMenu: menu != undefined ? menu : SubMenu.main, standalone: this.standalone },
      maxWidth: '90vw',
      positionStrategy: this.overlay.position().flexibleConnectedTo(this.mainMenuButton).withPositions([
        new ConnectionPositionPair(
          { originX: 'end', originY: 'top' },
          { overlayX: 'start', overlayY: 'top' })]).withDefaultOffsetX(10)
    });
  }

  openEventEffects() {
    this.dialog.open(EventEffectsDialog, {
      panelClass: ['dialog'],
      data: { menu: gameManager.game.round > 0 || gameManager.game.state == GameState.next }
    });
  }

  openPets() {
    this.dialog.open(StablesComponent, {
      panelClass: ['dialog']
    })
  }

  updateClock() {
    this.lastGameClockTimestamp = gameManager.game.gameClock.length ? gameManager.game.gameClock[0] : undefined;
    this.overallGameClock = gameManager.game.gameClock.length ? gameManager.game.gameClock.map((value) => ((value.clockOut || new Date().getTime()) - value.clockIn) / 1000).reduce((a, b) => a + b, 0) : 0;
    this.currentGameClock = this.lastGameClockTimestamp && !this.lastGameClockTimestamp.clockOut ? ((new Date().getTime()) - this.lastGameClockTimestamp.clockIn) / 1000 : 0;

    if (!this.gameClockInterval) {
      this.gameClockInterval = setInterval(() => {
        this.updateClock();
        this.cdr.markForCheck();
      }, 1000);
    }
  }

  openGameClockDialog() {
    this.dialog.open(GameClockDialogComponent, {
      panelClass: ['dialog']
    });
  }

  toggleGameClock() {
    gameManager.stateManager.before('gameClock.' + (this.lastGameClockTimestamp && !this.lastGameClockTimestamp.clockOut ? 'clockOut' : 'clockIn'));
    gameManager.toggleGameClock();
    gameManager.stateManager.after();
  }
}

