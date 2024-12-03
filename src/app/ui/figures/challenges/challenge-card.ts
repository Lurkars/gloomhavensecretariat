import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ChallengeCard } from "src/app/game/model/data/Challenges";


@Component({
	standalone: false,
    selector: 'ghs-challenge-card',
    templateUrl: './challenge-card.html',
    styleUrls: ['./challenge-card.scss']
})
export class ChallengeCardComponent implements OnChanges {

    @Input() challenge: ChallengeCard | undefined;
    @Input() keep: boolean = false;
    @Input() flipped: boolean = false;
    @Input() reveal: boolean = false;
    @Input() disableFlip: boolean = false;

    revealed: boolean = false;
    animate: boolean = false;

    settingsManager: SettingsManager = settingsManager;

    onChange(revealed: boolean) {
        this.revealed = revealed;
    }

    ngOnChanges(changes: SimpleChanges): void {
        const flipped = changes['flipped'];
        if (flipped && !this.disableFlip && flipped.currentValue && flipped.currentValue != flipped.previousValue) {
            this.animate = true;
        }
    }
}