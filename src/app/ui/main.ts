import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { CdkDragDrop, CdkDragEnter, CdkDragExit, CdkDragRelease, CdkDragStart, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { Subscription } from 'rxjs';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GameState } from 'src/app/game/model/Game';
import { environment } from 'src/environments/environment';
import { SettingsManager, settingsManager } from '../game/businesslogic/SettingsManager';
import { storageManager } from '../game/businesslogic/StorageManager';
import { Character } from '../game/model/Character';
import { Figure } from '../game/model/Figure';
import { Monster } from '../game/model/Monster';
import { MonsterType } from '../game/model/data/MonsterType';
import { MonsterNumberPickerDialog } from './figures/monster/dialogs/numberpicker-dialog';
import { FooterComponent } from './footer/footer';
import { SubMenu } from './header/menu/menu';
import { ghsDialogClosingHelper } from './helper/Static';
import { ConfirmDialogComponent } from './helper/confirm/confirm';
import { PointerInputService } from './helper/pointer-input';

@Component({
  standalone: false,
  selector: 'ghs-main',
  templateUrl: './main.html',
  styleUrls: ['./main.scss'],
})
export class MainComponent implements OnInit {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;

  figures: Figure[] = [];
  grid: number[] = [];

  SubMenu = SubMenu;

  initialized: boolean = false;
  loading: boolean = true;
  cancelLoading: boolean = false;
  welcome: boolean = false;
  welcomeOtherEditions: boolean = false;
  fullviewChar: Character | undefined;
  showBackupHint: boolean = false;

  draggingEnabled: boolean = false;
  draggingeTimeout: any = null;
  isTouch: boolean = false;

  lastScroll: number = -1;
  lastScrollColumn: number = -1;

  currentZoom: number = 0;
  zoomDiff: number = -1;

  standeeDialog: DialogRef<unknown, MonsterNumberPickerDialog> | undefined;
  standeeDialogSubscription: Subscription | undefined;

  serverPing: number = 0;
  serverPingInterval: any;

  initiativeSetDialog: DialogRef<unknown, ConfirmDialogComponent> | "discard" | false = false;

  @ViewChild('footer') footer!: FooterComponent;

  constructor(private element: ElementRef, private swUpdate: SwUpdate, private dialog: Dialog, private pointerInputService: PointerInputService) {
    gameManager.uiChange.subscribe({
      next: () => {

        this.figures = gameManager.game.figures.filter((figure) => (settingsManager.settings.monsters || !(figure instanceof Monster)) && (!(figure instanceof Character) || !figure.absent || !settingsManager.settings.hideAbsent));

        if (this.initialized) {
          const figure = gameManager.game.figures.find((figure) => figure instanceof Character && figure.fullview);
          if (figure) {
            this.fullviewChar = figure as Character;
            this.welcome = false;
          } else if (gameManager.game.figures.length == 0) {
            this.welcome = true;
            this.welcomeOtherEditions = settingsManager.settings.editions.length < gameManager.editionData.length;
          } else {
            this.fullviewChar = undefined;
            this.welcome = false;
            this.calcColumns();
            if (settingsManager.settings.automaticStandeesDialog && settingsManager.settings.automaticStandees && settingsManager.settings.standees && !settingsManager.settings.randomStandees && settingsManager.settings.scenarioRooms) {
              if (this.standeeDialog && gameManager.stateManager.lastAction == 'undo') {
                this.standeeDialog.close();
              }

              if (this.dialog.openDialogs.length == 0) {
                this.automaticStandeeDialogs();
              }
              else if (!this.standeeDialogSubscription) {
                this.standeeDialogSubscription = this.dialog.afterAllClosed.subscribe({
                  next: () => {
                    this.automaticStandeeDialogs();
                  }
                })
              }
            }
            this.showBackupHint = settingsManager.settings.backupHint && !this.loading && !gameManager.game.scenario && (gameManager.game.party.scenarios.length > 0 || gameManager.game.party.casualScenarios.length > 0 || gameManager.game.parties.some((party) => party.casualScenarios.length > 0));

            if (settingsManager.settings.initiativeRequired && settingsManager.settings.initiativeRoundConfirm && gameManager.game.state == GameState.draw && gameManager.game.scenario) {
              if (gameManager.game.figures.every((figure) => !(figure instanceof Character) || gameManager.entityManager.isAlive(figure) && !figure.absent && figure.getInitiative() > 0)) {
                if (!this.initiativeSetDialog) {
                  this.initiativeSetDialog = this.dialog.open(ConfirmDialogComponent, {
                    panelClass: ['dialog'],
                    data: {
                      label: 'round.hint.initiativeRoundConfirm'
                    }
                  });

                  this.initiativeSetDialog.closed.subscribe({
                    next: (result) => {
                      this.initiativeSetDialog = "discard";
                      if (result) {
                        this.initiativeSetDialog = false;
                        this.footer.next();
                      }
                    }
                  })
                }
              } else {
                if (this.initiativeSetDialog instanceof DialogRef) {
                  this.initiativeSetDialog.close();
                }
                this.initiativeSetDialog = false;
              }
            } else if (gameManager.game.state == GameState.next) {
              this.initiativeSetDialog = false;
            }
          }
        }

        if (this.serverPing != settingsManager.settings.serverPing) {
          if (this.serverPingInterval) {
            clearInterval(this.serverPingInterval);
            this.serverPingInterval = null;
          }

          this.serverPing = settingsManager.settings.serverPing;
          if (this.serverPing > 0) {
            this.serverPingInterval = setInterval(() => {
              gameManager.stateManager.sendPing();
            }, 1000 * this.serverPing);
          }
        }
      }
    })

    this.swUpdate.versionUpdates.subscribe(evt => {
      this.loading = false;
      if (evt.type == 'VERSION_READY') {
        gameManager.stateManager.hasUpdate = true;
      } else if (evt.type == 'VERSION_INSTALLATION_FAILED') {
        console.error(`Failed to install version '${evt.version.hash}': ${evt.error}`);
      }
    })

    this.swUpdate.unrecoverable.subscribe(evt => {
      this.loading = false;
    })

    if (this.swUpdate.isEnabled) {
      this.swUpdate.checkForUpdate();
      // check for PWA update every 30s
      setInterval(() => {
        this.swUpdate.checkForUpdate();
      }, 30000);
    } else {
      this.loading = false;
    }

    setInterval(() => {
      this.cancelLoading = true;
    }, 10000);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      gameManager.stateManager.installPrompt = e;
    });

    window.addEventListener('appinstalled', () => {
      gameManager.stateManager.installPrompt = null;
    });

    window.addEventListener('beforeunload', async () => {
      if (settingsManager.settings.gameClock && settingsManager.settings.automaticGameClock && !gameManager.stateManager.storageBlocked) {
        await this.automaticClockOut();
      }
    });

    window.addEventListener('blur', async () => {
      if (settingsManager.settings.gameClock && settingsManager.settings.automaticGameClock && settingsManager.settings.automaticGameClockFocus && !gameManager.stateManager.storageBlocked) {
        await this.automaticClockOut();
      }
    });

    dialog.afterOpened.subscribe({
      next: (dialogRef: DialogRef) => {
        if (dialogRef.overlayRef.backdropElement && dialog.openDialogs.length > 1 && !dialogRef.overlayRef.backdropElement.classList.contains('fullscreen-backdrop')) {
          dialogRef.overlayRef.backdropElement.style.opacity = '0';
        }

        if (!dialogRef.disableClose) {
          let closeIcon = document.createElement('img');
          closeIcon.src = './assets/images/close_dialog.svg';
          let closeElement = document.createElement('a');
          closeElement.classList.add('dialog-close-button');
          closeElement.appendChild(closeIcon);
          closeElement.addEventListener('click', () => {
            ghsDialogClosingHelper(dialogRef);
          });
          closeElement.title = settingsManager.getLabel('close');
          dialogRef.overlayRef.hostElement.appendChild(closeElement);

          if (dialogRef.overlayRef.backdropElement) {
            dialogRef.disableClose = true;
            dialogRef.overlayRef.backdropElement.addEventListener('click', () => {
              ghsDialogClosingHelper(dialogRef);
            });
          }

          dialogRef.keydownEvents.subscribe(event => {
            if (settingsManager.settings.keyboardShortcuts && !event.ctrlKey && !event.shiftKey && !event.altKey && event.key === "Escape") {
              ghsDialogClosingHelper(dialogRef);
            }
          });
        }
      }
    })
  }

  onFigureScroll(event: any) {
    this.pointerInputService.cancel();
  }

  async ngOnInit() {
    this.isTouch = window.matchMedia("(pointer: coarse)").matches;
    document.body.classList.add('no-select');
    try {
      await storageManager.init();
    } catch (e) {
      // continue
    }
    await settingsManager.init(!environment.production);
    this.initialized = true;
    await gameManager.stateManager.init();
    this.currentZoom = settingsManager.settings.zoom;
    document.body.style.setProperty('--ghs-factor', settingsManager.settings.zoom + '');
    document.body.style.setProperty('--ghs-barsize', settingsManager.settings.barsize + '');
    document.body.style.setProperty('--ghs-fontsize', settingsManager.settings.fontsize + '');
    document.body.style.setProperty('--ghs-global-fontsize', settingsManager.settings.globalFontsize + '');


    if (settingsManager.settings.gameClock && settingsManager.settings.automaticGameClock) {
      this.automaticClockIn();
    }

    const figure = this.figures.find((figure) => figure instanceof Character && figure.fullview);
    if (figure) {
      this.fullviewChar = figure as Character;
    } else {
      this.fullviewChar = undefined;
      this.calcColumns();
    }

    if (this.swUpdate.isEnabled) {
      document.body.addEventListener("click", (event) => {
        if (settingsManager.settings.fullscreen && this.swUpdate.isEnabled) {
          document.body.requestFullscreen && document.body.requestFullscreen();
        }
      });
    }

    window.addEventListener('resize', (event) => {
      if (!this.fullviewChar) {
        this.calcColumns();
      }
    });

    window.addEventListener('fullscreenchange', (event) => {
      if (!this.fullviewChar) {
        this.calcColumns();
      }
    });

    window.addEventListener('focus', (event) => {
      if (settingsManager.settings.serverAutoconnect && gameManager.stateManager.wsState() != WebSocket.OPEN) {
        gameManager.stateManager.connect();
      }

      if (settingsManager.settings.gameClock && settingsManager.settings.automaticGameClock && settingsManager.settings.automaticGameClockFocus) {
        this.automaticClockIn();
      }
    });

    if (settingsManager.settings.wakeLock && "wakeLock" in navigator) {
      try {
        gameManager.stateManager.wakeLock = await navigator.wakeLock.request("screen");
      } catch (e) {
        console.error(e);
      }

      document.addEventListener("visibilitychange", async () => {
        if (gameManager.stateManager.wakeLock !== null && document.visibilityState === "visible") {
          gameManager.stateManager.wakeLock = await navigator.wakeLock.request("screen");
        }
      });
    }
  }

  automaticClockIn() {
    const lastGameClockTimestamp = gameManager.game.gameClock.length ? gameManager.game.gameClock[0] : undefined;
    if (!lastGameClockTimestamp || lastGameClockTimestamp.clockOut) {
      // 7 seconds refresh timeout
      if (lastGameClockTimestamp && lastGameClockTimestamp.clockOut && (new Date().getTime() - lastGameClockTimestamp.clockOut) < 7000) {
        lastGameClockTimestamp.clockOut = undefined;
      } else {
        gameManager.toggleGameClock();
      }
    }
  }

  async automaticClockOut() {
    const lastGameClockTimestamp = gameManager.game.gameClock.length ? gameManager.game.gameClock[0] : undefined;
    if (lastGameClockTimestamp && !lastGameClockTimestamp.clockOut) {
      gameManager.stateManager.before('gameClock.automaticGameClockOut');
      gameManager.toggleGameClock();
      await gameManager.stateManager.after();
    }
  }

  zoom(value: number) {
    this.currentZoom += value;
    document.body.style.setProperty('--ghs-factor', this.currentZoom + '');
  }

  touchmove(event: TouchEvent) {
    if (settingsManager.settings.pinchZoom) {
      if (event.touches.length === 2) {
        const curDiff = Math.abs(event.touches[0].clientX - event.touches[1].clientX);
        if (this.zoomDiff > 0) {
          if (curDiff > this.zoomDiff) {
            this.zoom(-1);
          }
          if (curDiff < this.zoomDiff) {
            this.zoom(1);
          }
        }
        this.zoomDiff = curDiff;
      }
    }
  }

  touchend(event: TouchEvent) {
    if (settingsManager.settings.pinchZoom) {
      if (event.touches.length < 2 && this.zoomDiff > -1) {
        this.zoomDiff = -1;
        settingsManager.setZoom(this.currentZoom);
      }
    }
  }


  startCampaign(edition: string) {
    gameManager.stateManager.before("startCampaign", 'data.edition.' + edition);
    gameManager.game.edition = edition;
    if (settingsManager.settings.automaticTheme && settingsManager.settings.theme != 'modern') {
      if (edition == 'fh' || edition == 'bb') {
        settingsManager.set('theme', edition);
      } else {
        settingsManager.set('theme', 'default');
      }
    }
    gameManager.game.party.campaignMode = true;
    gameManager.stateManager.after();
  }

  cancelCampaign(edition: string) {
    gameManager.stateManager.before("cancelCampaign", 'data.edition.' + edition);
    gameManager.game.edition = undefined;
    gameManager.game.party.campaignMode = false;
    gameManager.stateManager.after();
  }

  calcColumns(scrollTo: HTMLElement | undefined = undefined, skipAnimation: boolean = false): void {
    this.grid = [999];
    if (!settingsManager.settings.columns) {
      setTimeout(() => {
        const containerElement = this.element.nativeElement.getElementsByClassName('figures')[0];
        if (containerElement) {
          this.translate(scrollTo, skipAnimation);
        }
      }, 1)
    } else {
      setTimeout(() => {
        const containerElement = this.element.nativeElement.getElementsByClassName('figures')[0];
        if (containerElement) {
          this.lastScroll = this.lastActive();
          const figureElements: any[] = Array.from(containerElement.getElementsByClassName('figure'));
          if (figureElements.length > 0) {
            const figureWidth = figureElements[0].firstChild.clientWidth;
            const maxColumns = Math.floor(containerElement.clientWidth / (figureWidth * 1.025));
            if (maxColumns > 1) {
              const activeFigureElementHeights = figureElements.slice(0, this.lastScroll + 1).map((element) => element.clientHeight);
              const columns = this.calcColumnsHelper(activeFigureElementHeights, containerElement.clientHeight, containerElement.clientWidth, figureWidth * 1.025).filter((column) => column.length);
              this.grid = columns.map((column, index, self) => self.map((value) => value.length).slice(0, index + 1).reduce((a, b) => a + b), 0);
            }
          }
          this.lastScrollColumn = this.grid.length > 1 ? this.grid.length - 1 : -1;

          this.translate(scrollTo, skipAnimation);
        }
      }, 1);
    }
  }

  calcColumnsHelper(elementHeights: number[], containerHeight: number, containerWidth: number, columnWidth: number): number[][] {
    const totalHeight = elementHeights.reduce((a, b) => a + b, 0);
    const numColumns = Math.floor(containerWidth / columnWidth);
    const targetHeight = Math.max(totalHeight / numColumns, settingsManager.settings.columnsForce ? 0 : containerHeight);
    let columns: number[][] = Array.from({ length: numColumns }, () => []);
    let columnHeights: number[] = Array(numColumns).fill(0);

    let distributionColumn = 0;
    elementHeights.forEach((elementHeight) => {
      if (columnHeights[distributionColumn] + elementHeight > targetHeight && distributionColumn < numColumns - 1) {
        distributionColumn++;
      }
      columns[distributionColumn].push(elementHeight);
      columnHeights[distributionColumn] += elementHeight;
    })

    columns = columns.filter((column) => column.length);
    columnHeights = columnHeights.filter((height) => height);

    let iterate = true;
    let oldDiff = 0;
    while (iterate) {
      let maxIndex = -1;
      let minIndex = -1;
      let diff = 0;

      for (let i = 0; i < columnHeights.length; i++) {
        if (Math.abs(columnHeights[i] - columnHeights[i + 1]) > diff) {
          diff = Math.abs(columnHeights[i] - columnHeights[i + 1]);
          if (columnHeights[i] < columnHeights[i + 1]) {
            minIndex = i;
            maxIndex = i + 1;
          } else {
            minIndex = i + 1;
            maxIndex = i;
          }
        }
      }

      if (diff <= oldDiff) {
        iterate = false;
        break;
      }

      if (minIndex != -1 && maxIndex != -1) {
        const elementHeight = columns[maxIndex].splice(maxIndex > minIndex ? 0 : columns[maxIndex].length - 1, 1)[0];
        columns[minIndex].push(elementHeight);
        columnHeights[minIndex] += elementHeight;
        columnHeights[maxIndex] -= elementHeight;
        oldDiff = diff;
      } else {
        iterate = false;
        break;
      }
    }

    return columns;
  }

  lastActive(): number {
    let lastActive = 0;
    this.figures.forEach((figure, index) => {
      if (index > lastActive && gameManager.gameplayFigure(figure)) {
        lastActive = index;
      }
    })
    return lastActive;
  }

  translate(scrollTo: HTMLElement | undefined = undefined, skipAnimation: boolean = false) {
    setTimeout(() => {
      const containerElement = this.element.nativeElement.getElementsByClassName('figures')[0];
      if (containerElement) {
        if (skipAnimation) {
          containerElement.classList.add('no-animations');
        }

        const figures = containerElement.getElementsByClassName('figure');
        const columnMiddle = Math.ceil(this.grid.length / 2);
        for (let index = 0; index < figures.length; index++) {
          let start = 0;
          let left = "0";
          let column = this.grid.length - 1;
          let factor = 0;
          for (let c = this.grid.length; c > 0; c--) {
            if (index < this.grid[c - 1]) {
              column = c - 1;
            }
          }

          factor = column - columnMiddle;
          if (this.grid.length % 2 == 1) {
            factor += 0.5;
          }

          left = "calc(100% * " + factor + ")";

          start = column == 0 ? 0 : this.grid[column - 1];

          let height = 0;
          for (let i = start; i < index; i++) {
            height += figures[i].clientHeight;
          }

          figures[index].style.transform = "scale(1) translate(" + left + "," + height + "px)";

          if (scrollTo) {
            setTimeout(() => {
              scrollTo.scrollIntoView({
                behavior: !settingsManager.settings.animations ? 'auto' : 'smooth',
                block: (index == this.lastScroll || index == this.lastScrollColumn) ? 'end' : 'center',
                inline: 'center'
              });

              if (skipAnimation) {
                containerElement.classList.remove('no-animations');
              }
            }, !settingsManager.settings.animations || skipAnimation ? 0 : 250);
          } else if (skipAnimation) {
            setTimeout(() => {
              containerElement.classList.remove('no-animations');
            }, !settingsManager.settings.animations ? 0 : 250)
          }
        }
      }
    }, 1);
  }

  startedDrag(event: CdkDragStart, element: HTMLElement) {
    this.pointerInputService.cancel();
    this.draggingEnabled = true;
    element.classList.add('dragging');
    event.source.getPlaceholderElement().classList.add('dragging');
    window.document.body.classList.add('dragging');
    if (this.draggingeTimeout) {
      clearTimeout(this.draggingeTimeout);
    }
  }

  releasedDrag(event: CdkDragRelease, element: HTMLElement) {
    this.draggingEnabled = false;
    element.classList.remove('dragging');
    window.document.body.classList.remove('dragging');
    event.source.getPlaceholderElement().classList.remove('dragging');
    if (this.draggingeTimeout) {
      clearTimeout(this.draggingeTimeout);
    }
  }

  drop(event: CdkDragDrop<number>) {
    if (event.previousContainer != event.container && (event.currentIndex == 0 && event.container.data != event.previousContainer.data + 1 || event.currentIndex != 0 && event.container.data != event.previousContainer.data - event.currentIndex)) {
      let prev = event.previousContainer.data;
      let next = event.container.data;
      if (event.currentIndex > 0 && event.previousContainer.data > event.container.data) {
        next++;
      } else if (event.currentIndex == 0 && event.previousContainer.data < event.container.data) {
        next--;
      }
      gameManager.stateManager.before("reorder");
      moveItemInArray(gameManager.game.figures, prev, next);
      gameManager.stateManager.after();
      this.calcColumns(event.item.element.nativeElement, true);
    } else {
      this.translate(undefined, true);
    }
    this.draggingEnabled = false;
  }

  entered(event: CdkDragEnter<number>) {
    this.translate();
  }

  exited(event: CdkDragExit<number>) {
    this.translate();
  }

  automaticStandeeDialogs() {
    if (!gameManager.stateManager.standeeDialogCanceled && this.dialog.openDialogs.length == 0 && gameManager.game.scenarioRules.length == 0) {
      const figure = gameManager.game.figures.find((figure) => figure instanceof Monster && figure.entities.find((entity) => entity.number < 1 && gameManager.entityManager.isAlive(entity)));
      if (figure) {
        const monster = figure as Monster;
        let entity = monster.entities.find((entity) => entity.number < 1 && gameManager.entityManager.isAlive(entity) && (settingsManager.settings.eliteFirst && entity.type == MonsterType.elite || !settingsManager.settings.eliteFirst && entity.type == MonsterType.normal));
        if (!entity) {
          entity = monster.entities.find((entity) => entity.number < 1 && gameManager.entityManager.isAlive(entity));
        }
        this.standeeDialog = this.dialog.open(MonsterNumberPickerDialog, {
          panelClass: ['dialog'],
          disableClose: true,
          data: {
            monster: monster,
            type: entity && entity.type,
            entity: entity,
            range: [],
            entities: monster.entities,
            automatic: true
          }
        })

        this.standeeDialog.closed.subscribe({
          next: (cancel) => {
            if (cancel) {
              gameManager.stateManager.standeeDialogCanceled = true;
            }
            this.standeeDialog = undefined;
            if (this.standeeDialogSubscription) {
              this.standeeDialogSubscription.unsubscribe();
              this.standeeDialogSubscription = undefined;
            }
            gameManager.uiChange.emit();
          }
        })
      }
    }
  }

  async exportDataDump() {
    try {
      let datadump: any = await storageManager.datadump();
      let downloadButton = document.createElement('a');
      downloadButton.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(datadump)));
      downloadButton.setAttribute('download', "ghs-data-dump_" + new Date().toISOString() + ".json");
      document.body.appendChild(downloadButton);
      downloadButton.click();
      document.body.removeChild(downloadButton);
    } catch (e) {
      console.warn("Could not read datadump");
    }
  }
}
