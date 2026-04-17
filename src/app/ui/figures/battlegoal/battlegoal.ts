import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { BattleGoal } from 'src/app/game/model/data/BattleGoal';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { CardRevealDirective } from 'src/app/ui/helper/CardReveal';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';

@Component({
  imports: [CardRevealDirective, GhsLabelDirective, GhsRangePipe, NgClass],
  selector: 'ghs-battlegoal',
  templateUrl: './battlegoal.html',
  styleUrls: ['./battlegoal.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BattleGoalComponent implements OnChanges {
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  @Input() battleGoal: BattleGoal | undefined;
  @Input() identifier: Identifier | undefined | false;
  @Input() flipped: boolean = false;
  @Input() selected: boolean = false;
  @Input() disabled: boolean = false;
  @Input() filtered: boolean = false;
  @Input() reveal: boolean = false;

  winterIcon: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['identifier'] && changes['identifier'].previousValue != changes['identifier'].currentValue) {
      if (!this.battleGoal && this.identifier) {
        this.battleGoal = gameManager.battleGoalManager.getBattleGoal(this.identifier);
      }
    }
    if (this.battleGoal && this.battleGoal.edition == 'fh') {
      this.winterIcon = true;
    }
  }
}
