import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, OnChanges, SimpleChanges } from '@angular/core';
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

  readonly inputBattleGoal = input<BattleGoal>(undefined, { alias: 'battleGoal' });

  readonly inputIdentifier = input<Identifier | undefined | false>(undefined, { alias: 'identifier' });
  get identifier(): Identifier | undefined | false {
    return this.inputIdentifier();
  }

  readonly flipped = input<boolean>(false);
  readonly selected = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly filtered = input<boolean>(false);
  readonly reveal = input<boolean>(false);

  battleGoal: BattleGoal | undefined;
  winterIcon: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    this.battleGoal = this.inputBattleGoal();
    if (changes['identifier'] && changes['identifier'].previousValue !== changes['identifier'].currentValue) {
      if (!this.battleGoal && this.identifier) {
        this.battleGoal = gameManager.battleGoalManager.getBattleGoal(this.identifier);
      }
    }
    if (this.battleGoal && this.battleGoal.edition === 'fh') {
      this.winterIcon = true;
    }
  }
}
