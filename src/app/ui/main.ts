import { CdkDragDrop, CdkDragEnter, CdkDragExit, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, OnInit } from '@angular/core';
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

  constructor(private element: ElementRef) {
    gameManager.uiChange.subscribe({
      next: () => {
        const figure = gameManager.game.figures.find((figure) => figure instanceof Character && figure.fullview);
        if (figure) {
          this.fullviewChar = figure as Character;
        } else {
          this.fullviewChar = undefined;
          this.calcColumns();
        }
      }
    })

    this.resizeObserver = new ResizeObserver((elements) => {
      if (!this.fullviewChar) {
        this.calcColumns();
      }
    })
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

    window.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        gameManager.stateManager.undo();
      } else if (event.ctrlKey && event.key === 'y' || event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'z') {
        gameManager.stateManager.redo();
      }
    })
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
          const figureElements = containerElement.getElementsByClassName('figure');
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
            }

            if (columnSize < figures.length) {
              this.columns = 2;

              if (columnSize < minColumn) {
                columnSize = minColumn;
              } else if (columnSize > minColumn) {
                columnSize--;
              }

              height = 0;
              for (let i = 0; i < columnSize; i++) {
                height += figureElements[i].clientHeight;
              }

              let otherHeight = 0;
              for (let i = figures.length - 1; i >= columnSize; i--) {
                const figure = figures[i];
                const ignore = figure instanceof Monster && (figure.entities.length == 0 || figure.entities.every((entity) => entity.dead || entity.health < 1)) || figure instanceof Character && figure.absent;
                if (otherHeight != 0 || !ignore) {
                  otherHeight += figureElements[i].clientHeight;
                }
              }

              while (height < otherHeight) {
                otherHeight -= figureElements[columnSize].clientHeight;
                height += figureElements[columnSize].clientHeight;
                columnSize++;
              }

              while (height > containerElement.clientHeight && otherHeight + figureElements[columnSize - 1].clientHeight < containerElement.clientHeight) {
                otherHeight += figureElements[columnSize - 1].clientHeight;
                height -= figureElements[columnSize - 1].clientHeight;
                columnSize--;
              }

              while (height > containerElement.clientHeight && height > otherHeight && otherHeight + figureElements[columnSize - 1].clientHeight < height) {
                otherHeight += figureElements[columnSize - 1].clientHeight;
                height -= figureElements[columnSize - 1].clientHeight;
                columnSize--;
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
              behavior: 'smooth',
              block: 'center',
              inline: 'center'
            });
          }, 250);
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
