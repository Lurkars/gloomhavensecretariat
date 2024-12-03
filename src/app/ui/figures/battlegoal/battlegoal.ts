import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { BattleGoal } from "src/app/game/model/data/BattleGoal";
import { Identifier } from "src/app/game/model/data/Identifier";


@Component({
	standalone: false,
    selector: 'ghs-battlegoal',
    templateUrl: './battlegoal.html',
    styleUrls: ['./battlegoal.scss']
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

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['identifier'] && changes['identifier'].previousValue != changes['identifier'].currentValue) {
            if (!this.battleGoal && this.identifier) {
                this.battleGoal = gameManager.battleGoalManager.getBattleGoal(this.identifier);
            }
        }
    }

}