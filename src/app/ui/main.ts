import { CdkDragDrop, CdkDragEnter, CdkDragExit, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { last } from 'rxjs';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { GameState } from 'src/app/game/model/Game';
import { SettingsManager, settingsManager } from '../game/businesslogic/SettingsManager';
import { Character } from '../game/model/Character';
import { Monster } from '../game/model/Monster';

@Component({
  selector: 'ghs-main',
  templateUrl: './main.html',
  styleUrls: ['./main.scss'],
})
export class MainComponent implements OnInit {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;

  columnSize: number = 3;
  columns: number = 2;

  resizeObserver: ResizeObserver;

  fullviewChar: Character | undefined;

  hasAllyDeck: boolean = false;

  scrollTimeout: any = null;

  constructor(private element: ElementRef, private swUpdate: SwUpdate) {
    this.hasAllyDeck = (settingsManager.settings.alwaysAllyAttackModifierDeck || gameManager.fhRules()) && gameManager.game.figures.some((figure) => figure instanceof Monster && figure.isAlly) || gameManager.game.scenario && gameManager.game.scenario.allyDeck || false;
    gameManager.uiChange.subscribe({
      next: () => {
        const figure = gameManager.game.figures.find((figure) => figure instanceof Character && figure.fullview);
        if (figure) {
          this.fullviewChar = figure as Character;
        } else {
          this.fullviewChar = undefined;
          this.calcColumns();
        }
        this.hasAllyDeck = (settingsManager.settings.alwaysAllyAttackModifierDeck || gameManager.fhRules()) && gameManager.game.figures.some((figure) => figure instanceof Monster && figure.isAlly) || gameManager.game.scenario && gameManager.game.scenario.allyDeck || false;
      }
    })

    this.resizeObserver = new ResizeObserver((elements) => {
      if (!this.fullviewChar) {
        this.calcColumns();
      }
    })

    this.swUpdate.versionUpdates.subscribe(evt => {
      if (evt.type == 'VERSION_READY') {
        gameManager.stateManager.hasUpdate = true;
      } else if (evt.type == 'VERSION_INSTALLATION_FAILED') {
        console.error(`Failed to install version '${evt.version.hash}': ${evt.error}`);
      }
    })

    if (this.swUpdate.isEnabled) {
      // check for PWA update every 30s
      setInterval(() => {
        this.swUpdate.checkForUpdate();
      }, 30000);
    }
  }

  async ngOnInit() {
    document.body.classList.add('no-select');
    await settingsManager.init();
    gameManager.stateManager.init();
    gameManager.uiChange.emit();
    document.body.style.setProperty('--ghs-factor', settingsManager.settings.zoom + '');
    document.body.style.setProperty('--ghs-barsize', settingsManager.settings.barsize + '');
    document.body.style.setProperty('--ghs-fontsize', settingsManager.settings.fontsize + '');

    const figure = gameManager.game.figures.find((figure) => figure instanceof Character && figure.fullview);
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
      if (settingsManager.settings.serverAutoconnect && gameManager.stateManager.wsState() == WebSocket.CLOSED) {
        gameManager.stateManager.connect();
      }
    });
  }

  scroll(event: any) {
    window.document.body.classList.add('scrolling');
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.scrollTimeout = setTimeout(() => {
      window.document.body.classList.remove('scrolling');
      this.scrollTimeout = null;
    }, settingsManager.settings.disableAnimations ? 0 : 250)
  }

  calcColumns(scrollTo: HTMLElement | undefined = undefined): void {
    if (settingsManager.settings.disableColumns) {
      this.columns = 1;
      this.columnSize = 99;
      setTimeout(() => {
        this.translate(scrollTo);
      }, 0)
    } else {
      setTimeout(() => {
        const containerElement = this.element.nativeElement.getElementsByClassName('figures')[0];
        if (containerElement) {
          const figureElements: any[] = Array.from(containerElement.getElementsByClassName('figure'));
          const figures = gameManager.game.figures;

          for (let i = 0; i < figureElements.length; i++) {
            this.resizeObserver.observe(figureElements[i]);
          }
          let figureWidth = containerElement.clientWidth;
          if (figureElements.length > 0) {
            figureWidth = figureElements[0].firstChild.clientWidth;
          }

          if (figureWidth < (containerElement.clientWidth / 2)) {
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

              while (activeRightHeight > containerElement.clientHeight && activeLeftHeight > activeRightHeight) {
                columnSize++;
                activeLeftHeight = this.activeFigureSize(0, columnSize, figureElements);
                activeRightHeight = this.activeFigureSize(columnSize, figures.length, figureElements);
              }

              while (activeLeftHeight > containerElement.clientHeight && activeLeftHeight > activeRightHeight) {
                columnSize--;
                activeLeftHeight = this.activeFigureSize(0, columnSize, figureElements);
                activeRightHeight = this.activeFigureSize(columnSize, figures.length, figureElements);
              }

              if (activeLeftHeight < activeRightHeight && activeLeftHeight + figureElements[columnSize].clientHeight > containerElement.clientHeight && activeRightHeight - figureElements[columnSize].clientHeight > containerElement.clientHeight) {
                columnSize++;
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
      }, 0);
    }
  }

  figureSize(start: number, end: number, figureElements: any[]) {
    return figureElements.slice(start, end).map((element) => element.clientHeight).reduce((a: any, b: any) => a + b, 0);
  }

  activeFigureSize(start: number, end: number, figureElements: any[]) {
    const figures = gameManager.game.figures;
    let lastActive = 0;

    figures.slice(start, end).forEach((figure, index) => {
      if (index > lastActive && gameManager.gameplayFigure(figure)) {
        lastActive = index;
      }
    })

    return figureElements.slice(start, end).filter((element: any, index: number) => index <= lastActive).map((element) => element.clientHeight).reduce((a: any, b: any) => a + b, 0);
  }

  translate(scrollTo: HTMLElement | undefined = undefined) {
    setTimeout(() => {
      const container = this.element.nativeElement.getElementsByClassName('figures')[0];
      const figures = container.getElementsByClassName('figure');
      for (let index = 0; index < gameManager.game.figures.length; index++) {
        let start = 0;
        let left = "-50%";
        if (this.columns > 1) {
          const lastFigure = figures[0];
          const leftOffset = Math.floor(((container.clientWidth / 2) - lastFigure.clientWidth) / 4);
          if (index < this.columnSize) {
            left = "calc(-100% - " + leftOffset + "px)";
          } else {
            left = "calc(" + leftOffset + "px)";
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
              block: 'center',
              inline: 'center'
            });
          }, settingsManager.settings.disableAnimations ? 0 : 250);
        }
      }
    }, 1);
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
  }
}
