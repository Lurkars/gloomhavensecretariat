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
  }

  calcColumns(): void {
    this.columns = 1;
    this.columnSize = gameManager.game.figures.length;

    gameManager.working = true;
    window.document.body.classList.add('working');
    setTimeout(() => {
      const firstCol = this.element.nativeElement.getElementsByClassName('figures')[ 0 ];

      if (firstCol.firstChild && firstCol.firstChild.clientWidth * 1.05 < (this.element.nativeElement.clientWidth / 2)) {
        let columnSize = gameManager.game.figures.length;
        let bottom = 0;
        let figure = 0;
        while (bottom < firstCol.getBoundingClientRect().bottom && figure < firstCol.children.length) {
          bottom = firstCol.children[ figure ].getBoundingClientRect().bottom;
          figure++;
        }

        if (figure < columnSize) {
          this.columns = 2;
          this.columnSize = (figure < columnSize / 2 ? columnSize / 2 : figure) - 1;
        }
      }

      gameManager.working = false;
      window.document.body.classList.remove('working');
    }, 1);
  }

  drop(event: CdkDragDrop<number>) {
    gameManager.stateManager.before();
    moveItemInArray(gameManager.game.figures, event.previousIndex + event.previousContainer.data, event.currentIndex + event.container.data);
    gameManager.stateManager.after();
    this.calcColumns();
  }

}