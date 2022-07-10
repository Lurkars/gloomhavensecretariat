import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { AfterViewChecked, AfterViewInit, Component, ElementRef, NgZone, OnChanges, OnInit } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { GameState } from 'src/app/game/model/Game';
import { SettingsManager, settingsManager } from '../game/businesslogic/SettingsManager';

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

  constructor(private element: ElementRef) {
    gameManager.uiChange.subscribe({
      next: (value: boolean) => {
        this.calcColumns();
      }
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
  }

  calcColumns(): void {
    setTimeout(() => {
      const container = this.element.nativeElement.getElementsByClassName('columns')[ 0 ];
      const figures = container.getElementsByClassName('figure');
      let lastFigure = figures[ 0 ];
      if (lastFigure && lastFigure.clientWidth * 1.05 < (container.clientWidth / 2)) {
        let height = 0;
        let columnSize = 0;
        const minColumn = Math.ceil(gameManager.game.figures.length / 2);
        while ((height < container.clientHeight || columnSize < minColumn) && columnSize < figures.length) {
          height += figures[ columnSize ].clientHeight;
          columnSize++;
        }

        if (columnSize < gameManager.game.figures.length) {
          this.columns = 2;
          if (columnSize < minColumn) {
            columnSize = minColumn;
          } else if (columnSize > minColumn) {
            columnSize--;
          }
          this.columnSize = columnSize;
        } else {
          this.columns = 1;
          this.columnSize = gameManager.game.figures.length;
        }
      } else {
        this.columns = 1;
        this.columnSize = gameManager.game.figures.length;
      }
    }, 0);
  }

  drop(event: CdkDragDrop<number>) {
    gameManager.stateManager.before();
    moveItemInArray(gameManager.game.figures, event.previousIndex + event.previousContainer.data, event.currentIndex + event.container.data);
    gameManager.stateManager.after();
    this.calcColumns();
  }

}