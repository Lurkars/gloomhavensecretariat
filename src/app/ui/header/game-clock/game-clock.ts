import { DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { GameClockTimestamp } from 'src/app/game/model/Game';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsDurationLabelPipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, PointerInputDirective, GhsDurationLabelPipe, TrackUUIDPipe, DatePipe],
  selector: 'ghs-game-clock-dialog',
  templateUrl: 'game-clock.html',
  styleUrls: ['./game-clock.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameClockDialogComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  gameClock: GameClockTimestamp[] = [];
  current: number | undefined;
  total: number = 0;
  currentIntervall: any;

  constructor() {
    this.more();
  }

  ngOnInit(): void {
    this.currentIntervall = setInterval(() => this.update(), 1000);
    this.destroyRef.onDestroy(() => {
      if (this.currentIntervall) {
        clearInterval(this.currentIntervall);
      }
    });
  }

  update() {
    this.current =
      this.gameClock.length && !this.gameClock[0].clockOut ? (new Date().getTime() - this.gameClock[0].clockIn) / 1000 : undefined;
    this.total = gameManager.game.gameClock.length
      ? gameManager.game.gameClock
          .map((value) => ((value.clockOut || new Date().getTime()) - value.clockIn) / 1000)
          .reduce((a, b) => a + b, 0)
      : 0;
    this.cdr.markForCheck();
  }

  more() {
    if (this.gameClock.length < gameManager.game.gameClock.length) {
      this.gameClock = gameManager.game.gameClock.slice(0, this.gameClock.length + 10);
    }
    this.update();
  }

  merge(index: number) {
    if (index > 0) {
      gameManager.stateManager.before('gameClock.merge');
      gameManager.game.gameClock[index - 1].clockIn = gameManager.game.gameClock[index].clockIn;
      gameManager.game.gameClock.splice(index, 1);
      this.gameClock = gameManager.game.gameClock.slice(0, this.gameClock.length - 1);
      this.update();
      gameManager.stateManager.after();
    }
  }

  toggleGameClock() {
    gameManager.stateManager.before('gameClock.' + (this.current ? 'clockOut' : 'clockIn'));
    gameManager.toggleGameClock();
    this.gameClock = gameManager.game.gameClock.slice(0, this.gameClock.length + (this.current ? 1 : 0));
    this.update();
    gameManager.stateManager.after();
  }
}
