import { CdkDragDrop, CdkDragEnter, CdkDragExit, CdkDragRelease, CdkDragStart, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { GameState } from 'src/app/game/model/Game';
import { environment } from 'src/environments/environment';
import { SettingsManager, settingsManager } from '../game/businesslogic/SettingsManager';
import { Character } from '../game/model/Character';
import { FooterComponent } from './footer/footer';
import { SubMenu } from './header/menu/menu';
import { Monster } from '../game/model/Monster';
import { Figure } from '../game/model/Figure';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { MonsterNumberPickerDialog } from './figures/monster/dialogs/numberpicker-dialog';
import { MonsterType } from '../game/model/data/MonsterType';
import { storageManager } from '../game/businesslogic/StorageManager';
import { PointerInputService } from './helper/pointer-input';
import { Subscription } from 'rxjs';
import { ghsDialogClosingHelper } from './helper/Static';

@Component({
  selector: 'ghs-main',
  templateUrl: './main.html',
  styleUrls: ['./main.scss'],
})
export class MainComponent implements OnInit {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;

  figures: Figure[] = [];
  columnSize: number = 3;
  columns: number = 2;

  SubMenu = SubMenu;

  initialized: boolean = false;
  loading: boolean = true;
  cancelLoading: boolean = false;
  welcome: boolean = false;
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
            if (!event.ctrlKey && !event.shiftKey && !event.altKey && event.key === "Escape") {
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
    } catch {
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
          document.body.requestFullscreen();
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
    });

    if (settingsManager.settings.wakeLock && "wakeLock" in navigator) {
      gameManager.stateManager.wakeLock = await navigator.wakeLock.request("screen");

      document.addEventListener("visibilitychange", async () => {
        if (gameManager.stateManager.wakeLock !== null && document.visibilityState === "visible") {
          gameManager.stateManager.wakeLock = await navigator.wakeLock.request("screen");
        }
      });
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
    if (settingsManager.settings.automaticTheme) {
      if (edition == 'fh') {
        settingsManager.setFhStyle(true);
      } else {
        settingsManager.setFhStyle(false);
      }
    }
    gameManager.game.party.campaignMode = true;
    gameManager.stateManager.after();
  }

  calcColumns(scrollTo: HTMLElement | undefined = undefined, skipAnimation: boolean = false): void {
    if (!settingsManager.settings.columns) {
      this.columns = 1;
      this.columnSize = 99;
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
          const figureElements: any[] = Array.from(containerElement.getElementsByClassName('figure'));
          const figures = this.figures;

          let figureWidth = containerElement.clientWidth;
          if (figureElements.length > 0) {
            figureWidth = figureElements[0].firstChild.clientWidth;
          }

          if (figureWidth < (containerElement.clientWidth / 2.06)) {
            let height = 0;
            let columnSize = 0;
            const minColumn = Math.ceil(figures.length / 2);

            while ((height < containerElement.clientHeight || columnSize < minColumn) && columnSize < figureElements.length) {
              height += figureElements[columnSize].clientHeight;
              columnSize++;
            }

            if (columnSize == figures.length && height > containerElement.clientHeight) {
              columnSize--;
              height -= figureElements[columnSize].clientHeight;
            }

            if (columnSize < figures.length) {
              this.columns = 2;

              if (columnSize < minColumn) {
                columnSize = minColumn;
              } else if (columnSize > minColumn) {
                columnSize--;
              }

              let activeLeftHeight = this.activeFigureSize(0, columnSize, figureElements);
              let activeRightHeight = this.activeFigureSize(columnSize, figures.length, figureElements);
              let activeLeftHeightMinus = this.activeFigureSize(0, columnSize - 1, figureElements);
              let activeRightHeightMinus = this.activeFigureSize(columnSize - 1, figures.length, figureElements);
              let activeLeftHeightPlus = this.activeFigureSize(0, columnSize + 1, figureElements);
              let activeRightHeightPlus = this.activeFigureSize(columnSize + 1, figures.length, figureElements);

              let diff = activeLeftHeight > activeRightHeight ? activeLeftHeight - activeRightHeight : activeRightHeight - activeLeftHeight;
              let diffMinus = activeLeftHeightMinus > activeRightHeightMinus ? activeLeftHeightMinus - activeRightHeightMinus : activeRightHeightMinus - activeLeftHeightMinus;
              let diffPlus = activeLeftHeightPlus > activeRightHeightPlus ? activeLeftHeightPlus - activeRightHeightPlus : activeRightHeightPlus - activeLeftHeightPlus;

              while (diff > diffMinus) {
                columnSize--;
                activeLeftHeight = this.activeFigureSize(0, columnSize, figureElements);
                activeRightHeight = this.activeFigureSize(columnSize, figures.length, figureElements);
                activeLeftHeightMinus = this.activeFigureSize(0, columnSize - 1, figureElements);
                activeRightHeightMinus = this.activeFigureSize(columnSize - 1, figures.length, figureElements);
                activeLeftHeightPlus = this.activeFigureSize(0, columnSize + 1, figureElements);
                activeRightHeightPlus = this.activeFigureSize(columnSize + 1, figures.length, figureElements);

                diff = activeLeftHeight > activeRightHeight ? activeLeftHeight - activeRightHeight : activeRightHeight - activeLeftHeight;
                diffMinus = activeLeftHeightMinus > activeRightHeightMinus ? activeLeftHeightMinus - activeRightHeightMinus : activeRightHeightMinus - activeLeftHeightMinus;
                diffPlus = activeLeftHeightPlus > activeRightHeightPlus ? activeLeftHeightPlus - activeRightHeightPlus : activeRightHeightPlus - activeLeftHeightPlus;
              }

              while (diff > diffPlus) {
                columnSize++;
                activeLeftHeight = this.activeFigureSize(0, columnSize, figureElements);
                activeRightHeight = this.activeFigureSize(columnSize, figures.length, figureElements);
                activeLeftHeightMinus = this.activeFigureSize(0, columnSize - 1, figureElements);
                activeRightHeightMinus = this.activeFigureSize(columnSize - 1, figures.length, figureElements);
                activeLeftHeightPlus = this.activeFigureSize(0, columnSize + 1, figureElements);
                activeRightHeightPlus = this.activeFigureSize(columnSize + 1, figures.length, figureElements);

                diff = activeLeftHeight > activeRightHeight ? activeLeftHeight - activeRightHeight : activeRightHeight - activeLeftHeight;
                diffMinus = activeLeftHeightMinus > activeRightHeightMinus ? activeLeftHeightMinus - activeRightHeightMinus : activeRightHeightMinus - activeLeftHeightMinus;
                diffPlus = activeLeftHeightPlus > activeRightHeightPlus ? activeLeftHeightPlus - activeRightHeightPlus : activeRightHeightPlus - activeLeftHeightPlus;
              }

              this.columnSize = columnSize;
            } else {
              this.columns = 1;
              this.columnSize = 99;
            }
          } else {
            this.columns = 1;
            this.columnSize = 99;
          }

          this.lastScroll = this.lastActive();
          this.lastScrollColumn = this.columns > 1 ? this.columnSize - 1 : -1;

          this.translate(scrollTo, skipAnimation);
        }
      }, 1);
    }
  }

  figureSize(start: number, end: number, figureElements: any[]) {
    return figureElements.slice(start, end).map((element) => element.firstChild.clientHeight).reduce((a: any, b: any) => a + b, 0);
  }

  activeFigureSize(start: number, end: number, figureElements: any[]) {
    let lastActive = this.lastActive(start, end);
    return figureElements.slice(start, end).filter((element: any, index: number) => index <= lastActive).map((element) => element.firstChild.clientHeight).reduce((a: any, b: any) => a + b, 0);
  }

  lastActive(start: number | undefined = undefined, end: number | undefined = undefined): number {
    let lastActive = -1;
    this.figures.slice(start, end).forEach((figure, index) => {
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
        for (let index = 0; index < figures.length; index++) {
          let start = 0;
          let left = "-50%";
          if (this.columns > 1) {
            if (index < this.columnSize) {
              left = "calc(-100% - var(--ghs-unit) * 0.5)";
            } else {
              left = "calc(var(--ghs-unit) * 0.5)";
              start = this.columnSize;
            }
          }

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
      downloadButton.setAttribute('download', "ghs-data-dump.json");
      document.body.appendChild(downloadButton);
      downloadButton.click();
      document.body.removeChild(downloadButton);
    } catch {
      console.warn("Could not read datadump");
    }
  }
}
