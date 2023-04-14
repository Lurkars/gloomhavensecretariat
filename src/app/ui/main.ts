import { CdkDragDrop, CdkDragEnter, CdkDragExit, CdkDragRelease, CdkDragStart, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { GameState } from 'src/app/game/model/Game';
import { environment } from 'src/environments/environment';
import { SettingsManager, settingsManager } from '../game/businesslogic/SettingsManager';
import { Character } from '../game/model/Character';
import { FooterComponent } from './footer/footer';
import { SubMenu } from './header/menu/menu';
import { Monster } from '../game/model/Monster';
import { Objective } from '../game/model/Objective';
import { Figure } from '../game/model/Figure';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { MonsterNumberPickerDialog } from './figures/monster/dialogs/numberpicker-dialog';
import { MonsterType } from '../game/model/data/MonsterType';

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
  scrollTimeout: any = null;
  zoomInterval: any = null;
  currentZoom: number = 0;

  draggingEnabled: boolean = false;
  draggingeTimeout: any = null;
  isTouch: boolean = false;

  standeeDialog: DialogRef<unknown, MonsterNumberPickerDialog> | undefined;

  @ViewChild('footer') footer!: FooterComponent;

  constructor(private element: ElementRef, private swUpdate: SwUpdate, private dialog: Dialog) {
    gameManager.uiChange.subscribe({
      next: () => {

        this.figures = settingsManager.settings.monsters ? gameManager.game.figures : gameManager.game.figures.filter((figure) => !(figure instanceof Monster));

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
            if (settingsManager.settings.automaticStandeesDialog && settingsManager.settings.automaticStandees && !settingsManager.settings.disableStandees && !settingsManager.settings.randomStandees && settingsManager.settings.scenarioRooms) {
              this.automaticStandeeDialogs();
            }
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
  }

  async ngOnInit() {
    this.isTouch = window.matchMedia("(pointer: coarse)").matches;
    document.body.classList.add('no-select');
    await settingsManager.init(!environment.production);
    this.initialized = true;
    gameManager.stateManager.init();
    document.body.style.setProperty('--ghs-factor', settingsManager.settings.zoom + '');
    document.body.style.setProperty('--ghs-barsize', settingsManager.settings.barsize + '');
    document.body.style.setProperty('--ghs-fontsize', settingsManager.settings.fontsize + '');

    this.currentZoom = settingsManager.settings.zoom;

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

    window.addEventListener('keydown', (event: KeyboardEvent) => {
      if (!event.altKey && !event.metaKey && (!window.document.activeElement || window.document.activeElement.tagName != 'INPUT' && window.document.activeElement.tagName != 'SELECT')) {
        if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'z') {
          gameManager.stateManager.undo();
          event.preventDefault();
        } else if (event.ctrlKey && !event.shiftKey && event.key === 'y' || event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'z') {
          gameManager.stateManager.redo();
          event.preventDefault();
        } else if (!event.ctrlKey && !event.shiftKey && !this.zoomInterval && event.key === 'ArrowUp') {
          this.zoom(-1);
          this.zoomInterval = setInterval(() => {
            this.zoom(-1);
          }, 30);
          event.preventDefault();
        } else if (!event.ctrlKey && !event.shiftKey && !this.zoomInterval && event.key === 'ArrowDown') {
          this.zoom(1);
          this.zoomInterval = setInterval(() => {
            this.zoom(1);
          }, 30);
          event.preventDefault();
        } else if (event.ctrlKey && !event.shiftKey && !this.zoomInterval && event.key.toLowerCase() === 'r') {
          this.currentZoom = 100;
          settingsManager.setZoom(this.currentZoom);
          document.body.style.setProperty('--ghs-factor', this.currentZoom + '');
          event.preventDefault();
        } else if (!event.ctrlKey && !event.shiftKey && !this.zoomInterval && event.key.toLowerCase() === 'n') {
          if (!this.footer.disabled()) {
            this.footer.next();
          }
        } else if (!event.ctrlKey && gameManager.game.state == GameState.next && event.key === 'Tab') {
          this.toggleEntity(event.shiftKey);
          event.preventDefault();
        }
      }
    })

    window.addEventListener('keyup', (event: KeyboardEvent) => {
      if (this.zoomInterval && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        clearInterval(this.zoomInterval);
        this.zoomInterval = null;
        settingsManager.setZoom(this.currentZoom);
      }
    })

    if (!settingsManager.settings.disableWakeLock && "wakeLock" in navigator) {
      gameManager.stateManager.wakeLock = await navigator.wakeLock.request("screen");

      document.addEventListener("visibilitychange", async () => {
        if (gameManager.stateManager.wakeLock !== null && document.visibilityState === "visible") {
          gameManager.stateManager.wakeLock = await navigator.wakeLock.request("screen");
        }
      });
    }
  }

  toggleEntity(reverse: boolean) {
    const figures = this.figures.filter((figure) => gameManager.gameplayFigure(figure));
    let activeFigure = figures.find((figure) => figure.active);

    if (!activeFigure && reverse) {
      activeFigure = figures[figures.length - 1];
    } else if (activeFigure && reverse && figures.indexOf(activeFigure) > 0) {
      activeFigure = figures[figures.indexOf(activeFigure) - 1];
    }

    if (activeFigure) {
      if (activeFigure instanceof Character) {
        let toggleFigure = true;
        if (settingsManager.settings.activeSummons) {
          const summons = activeFigure.summons.filter((summon) => gameManager.entityManager.isAlive(summon));
          let activeSummon = summons.find((summon) => summon.active);
          if (!activeSummon && summons.length > 0 && reverse && activeFigure.active) {
            activeSummon = summons[summons.length - 1];
            gameManager.stateManager.before("summonActive", "data.character." + activeFigure.name, "data.summon." + activeSummon.name);
            activeSummon.active = true;
            toggleFigure = false;
            gameManager.stateManager.after();
          } else if (activeSummon && !reverse) {
            gameManager.stateManager.before("summonInactive", "data.character." + activeFigure.name, "data.summon." + activeSummon.name);
            activeSummon.active = false;
            if (summons.indexOf(activeSummon) < summons.length - 1) {
              summons[summons.indexOf(activeSummon) + 1].active = true;
            }
            toggleFigure = false;
            gameManager.stateManager.after();
          }
        }
        if (toggleFigure) {
          gameManager.stateManager.before(activeFigure.active ? "unsetActive" : "setActive", "data.character." + activeFigure.name);
          gameManager.roundManager.toggleFigure(activeFigure);
          gameManager.stateManager.after();
        }
      } else if (activeFigure instanceof Monster) {
        let toggleFigure = true;
        const entities = activeFigure.entities.filter((entity) => gameManager.entityManager.isAlive(entity));
        if (settingsManager.settings.activeStandees) {
          let activeEntity = entities.find((entity) => entity.active);
          if (!activeEntity && entities.length > 0 && reverse && activeFigure.active) {
            activeEntity = entities[entities.length - 1];
            gameManager.stateManager.before(activeEntity ? "unsetEntityActive" : "setEntityActive", "data.monster." + activeFigure.name, "monster." + activeEntity.type, "" + activeEntity.number);
            gameManager.monsterManager.toggleActive(activeFigure, activeEntity);
            activeEntity.active = true;
            toggleFigure = false;
            gameManager.stateManager.after();
          } else if (activeEntity && !reverse) {
            gameManager.stateManager.before(activeEntity ? "unsetEntityActive" : "setEntityActive", "data.monster." + activeFigure.name, "monster." + activeEntity.type, "" + activeEntity.number);
            gameManager.monsterManager.toggleActive(activeFigure, activeEntity);
            if (entities.indexOf(activeEntity) < entities.length - 1) {
              entities[entities.indexOf(activeEntity) + 1].active = true;
            }
            toggleFigure = false;
            gameManager.stateManager.after();
          }
        }
        if (toggleFigure) {
          gameManager.stateManager.before(activeFigure.active ? "unsetActive" : "setActive", "data.monster." + activeFigure.name);
          if (reverse && !activeFigure.active && settingsManager.settings.activeStandees) {
            activeFigure.entities.forEach((entity) => {
              if (gameManager.entityManager.isAlive(entity)) {
                entity.active = true;
                entity.off = false;
              }
            });
          }
          gameManager.roundManager.toggleFigure(activeFigure);
          gameManager.stateManager.after();
        }
      } else if (activeFigure instanceof Objective) {
        gameManager.stateManager.before(activeFigure.active ? "unsetActive" : "setActive", activeFigure.title || activeFigure.name);
        gameManager.roundManager.toggleFigure(activeFigure);
        gameManager.stateManager.after();
      }
    }
  }

  @HostListener('pinchmove', ['$event'])
  pinchmove(event: any) {
    if (event.scale < 1) {
      this.zoom(1);
    } else {
      this.zoom(-1);
    }
  }

  @HostListener('pinchend', ['$event'])
  pinchend(event: any) {
    settingsManager.setZoom(this.currentZoom);
  }

  zoom(value: number) {
    this.currentZoom += value;
    document.body.style.setProperty('--ghs-factor', this.currentZoom + '');
  }

  startCampaign(edition: string) {
    gameManager.stateManager.before("startCampaign", 'data.edition.' + edition);
    gameManager.game.edition = edition;
    if (edition == 'fh') {
      settingsManager.setFhStyle(true);
    } else {
      settingsManager.setFhStyle(false);
    }
    gameManager.game.party.campaignMode = true;
    gameManager.stateManager.after();
  }

  calcColumns(scrollTo: HTMLElement | undefined = undefined): void {
    if (settingsManager.settings.disableColumns) {
      this.columns = 1;
      this.columnSize = 99;
      setTimeout(() => {
        const containerElement = this.element.nativeElement.getElementsByClassName('figures')[0];
        if (containerElement) {
          this.translate(scrollTo);
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

              while (diff >= diffMinus) {
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

              while (diff >= diffPlus) {
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

          this.translate(scrollTo);
        }
      }, 1);
    }
  }

  figureSize(start: number, end: number, figureElements: any[]) {
    return figureElements.slice(start, end).map((element) => element.firstChild.clientHeight).reduce((a: any, b: any) => a + b, 0);
  }

  activeFigureSize(start: number, end: number, figureElements: any[]) {
    const figures = this.figures;
    let lastActive = 0;

    figures.slice(start, end).forEach((figure, index) => {
      if (index > lastActive && gameManager.gameplayFigure(figure)) {
        lastActive = index;
      }
    })

    return figureElements.slice(start, end).filter((element: any, index: number) => index <= lastActive).map((element) => element.firstChild.clientHeight).reduce((a: any, b: any) => a + b, 0);
  }

  translate(scrollTo: HTMLElement | undefined = undefined) {
    setTimeout(() => {
      const container = this.element.nativeElement.getElementsByClassName('figures')[0];
      const figures = container.getElementsByClassName('figure');
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
              behavior: settingsManager.settings.disableAnimations ? 'auto' : 'smooth',
              block: 'end',
              inline: 'center'
            });
          }, settingsManager.settings.disableAnimations ? 0 : 250);
        }
      }
    }, 1);
  }

  enabledDragging(event: any, element: HTMLElement) {
    this.draggingEnabled = true;
    element.classList.add('dragging');
    window.document.body.classList.add('dragging');
    this.draggingeTimeout = setTimeout(() => {
      this.draggingEnabled = false;
      window.document.body.classList.remove('dragging');
      element.classList.remove('dragging');
      this.draggingeTimeout = null;
    }, 1500);
  }

  disableDragging(event: any, element: HTMLElement) {
    this.draggingEnabled = false;
    window.document.body.classList.remove('dragging');
    element.classList.remove('dragging');
    this.draggingeTimeout = null;
    if (this.draggingeTimeout) {
      clearTimeout(this.draggingeTimeout);
    }
  }

  startedDrag(event: CdkDragStart, element: HTMLElement) {
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
      this.calcColumns(event.item.element.nativeElement);
    } else {
      this.translate();
    }
    this.draggingEnabled = false;
  }

  entered(event: CdkDragEnter<number>) {
    this.translate();
  }

  exited(event: CdkDragExit<number>) {
    this.translate();
  }

  handleClick(event: any) {
    let elements = document.elementsFromPoint(event.clientX, event.clientY);
    if (elements[0].classList.contains('cdk-drag-handle') && elements.length > 1) {
      (elements[1] as HTMLElement).click();
    }
    event.preventDefault();
  }

  automaticStandeeDialogs() {
    if (!gameManager.stateManager.standeeDialogCanceled && !this.standeeDialog && gameManager.game.scenarioRules.length == 0) {
      const figure = gameManager.game.figures.find((figure) => figure instanceof Monster && figure.entities.find((entity) => entity.number < 1 && gameManager.entityManager.isAlive(entity)));
      if (figure) {
        const monster = figure as Monster;
        let entity = monster.entities.find((entity) => entity.number < 1 && gameManager.entityManager.isAlive(entity) && (settingsManager.settings.eliteFirst && entity.type == MonsterType.elite || !settingsManager.settings.eliteFirst && entity.type == MonsterType.normal));
        if (!entity) {
          entity = monster.entities.find((entity) => entity.number < 1 && gameManager.entityManager.isAlive(entity));
        }
        this.standeeDialog = this.dialog.open(MonsterNumberPickerDialog, {
          panelClass: 'dialog',
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
            gameManager.uiChange.emit();
          }
        })
      }
    }
  }
}
