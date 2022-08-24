import { CdkDragDrop, CdkDragEnter, CdkDragExit, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, ElementRef, OnInit } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { GameState } from 'src/app/game/model/Game';
import { SettingsManager, settingsManager } from '../game/businesslogic/SettingsManager';
import { Figure } from '../game/model/Figure';

@Component({
  selector: 'ghs-main',
  templateUrl: './main.html',
  styleUrls: [ './main.scss' ],
})
export class MainComponent implements OnInit {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;

  columnSize: number = 3;
  columns: number = 2;

  resizeObserver: ResizeObserver;

  constructor(private element: ElementRef) {
    gameManager.uiChange.subscribe({
      next: () => {
        this.calcColumns();
      }
    })

    this.resizeObserver = new ResizeObserver((elements) => {
      this.calcColumns();
    })
  }

  async ngOnInit() {
    document.body.classList.add('no-select');
    await settingsManager.init();
    gameManager.stateManager.init();
    document.body.style.setProperty('--ghs-factor', settingsManager.settings.zoom + '');
    document.body.style.setProperty('--ghs-barsize', settingsManager.settings.barSize + '');

    this.calcColumns();

    window.addEventListener('resize', (event) => {
      this.calcColumns();
    });

    window.addEventListener('fullscreenchange', (event) => {
      this.calcColumns();
    });
  }

  figures(column: number): Figure[] {
    return gameManager.game.figures.slice(this.columnSize * column, this.columnSize + (gameManager.game.figures.length * column - this.columnSize * column));
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
        const container = this.element.nativeElement.getElementsByClassName('figures')[ 0 ];
        const figures = container.getElementsByClassName('figure');

        for (let i = 0; i < figures.length; i++) {
          this.resizeObserver.observe(figures[ i ]);
        }
        let figureWidth = container.clientWidth;
        if (figures.length > 0) {
          figureWidth = figures[ 0 ].firstChild.clientWidth;
        }

        if (figureWidth < (container.clientWidth / 2)) {
          let height = 0;
          let columnSize = 0;
          const minColumn = Math.ceil(gameManager.game.figures.length / 2);
          while ((height < container.clientHeight || columnSize < minColumn) && columnSize < figures.length) {
            height += figures[ columnSize ].clientHeight;
            columnSize++;
          }

          if (columnSize == gameManager.game.figures.length && height > container.clientHeight) {
            columnSize--;
          }

          if (columnSize < gameManager.game.figures.length) {
            this.columns = 2;

            if (columnSize < minColumn) {
              columnSize = minColumn;
            } else if (columnSize > minColumn) {
              columnSize--;
            }

            height = 0;
            for (let i = 0; i < columnSize; i++) {
              height += figures[ i ].clientHeight;
            }

            let otherHeight = 0;
            for (let i = columnSize; i < gameManager.game.figures.length; i++) {
              otherHeight += figures[ i ].clientHeight;
            }

            while (height > otherHeight && otherHeight + figures[ columnSize - 1 ].clientHeight < height) {
              otherHeight += figures[ columnSize - 1 ].clientHeight;
              height -= figures[ columnSize - 1 ].clientHeight;
              columnSize--;
            }

            while (height < otherHeight) {
              otherHeight -= figures[ columnSize ].clientHeight;
              height += figures[ columnSize ].clientHeight;
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
      }, 0);
    }
  }

  translate(scrollTo: HTMLElement | undefined = undefined) {
    setTimeout(() => {
      const container = this.element.nativeElement.getElementsByClassName('figures')[ 0 ];
      const figures = container.getElementsByClassName('figure');
      for (let index = 0; index < gameManager.game.figures.length; index++) {
        let start = 0;
        let left = "-50%";
        if (this.columns > 1) {
          const lastFigure = figures[ 0 ];
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
          height += figures[ i ].clientHeight;
        }

        figures[ index ].style.transform = "scale(1) translate(" + left + "," + height + "px)";

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
      moveItemInArray(gameManager.game.figures, event.previousContainer.data, event.container.data);
      if (event.currentIndex > 0 && event.previousContainer.data > event.container.data) {
        moveItemInArray(gameManager.game.figures, event.container.data + event.currentIndex, event.container.data);
      } else if (event.currentIndex == 0 && event.previousContainer.data < event.container.data) {
        moveItemInArray(gameManager.game.figures, event.container.data - 1, event.container.data);
      }
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
    if (elements[ 0 ].classList.contains('cdk-drag-handle') && elements.length > 1) {
      (elements[ 1 ] as HTMLElement).click();
    }
  }
}
