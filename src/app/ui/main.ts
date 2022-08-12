import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
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
    this.calcColumns();

    window.addEventListener('resize', (event) => {
      this.calcColumns();
    });

    window.addEventListener('fullscreenchange', (event) => {
      this.calcColumns();
    });

    this.gameManager.uiChange.emit();
  }

  figures(column: number): Figure[] {
    return gameManager.game.figures.slice(this.columnSize * column, this.columnSize + (gameManager.game.figures.length * column - this.columnSize * column));
  }

  calcColumns(): void {
    if (settingsManager.settings.disableColumns) {
      this.columns = 1;
      this.columnSize = 99;
    } else {
      setTimeout(() => {
        const container = this.element.nativeElement.getElementsByClassName('columns')[ 0 ];
        const figures = container.getElementsByClassName('figure');

        for (let i = 0; i < figures.length; i++) {
          this.resizeObserver.observe(figures[ i ]);
        }

        let lastFigure = figures[ 0 ];
        if (lastFigure && lastFigure.clientWidth * 1.05 < (container.clientWidth / 2)) {
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

            if (otherHeight > container.clientHeight && otherHeight > height) {
              columnSize++;
            } else if (height > container.clientHeight && otherHeight + figures[ columnSize - 1 ].clientHeight < container.clientHeight) {
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
      }, 0);
    }
  }

  drop(event: CdkDragDrop<number>) {
    gameManager.stateManager.before();
    moveItemInArray(gameManager.game.figures, event.previousIndex + event.previousContainer.data, event.currentIndex + event.container.data + (event.previousContainer.data == 0 && event.container.data > 0 ? -1 : 0));
    gameManager.stateManager.after();
    this.calcColumns();
  }

}