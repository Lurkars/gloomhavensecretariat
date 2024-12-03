import { Component, Input, OnChanges, OnInit, SimpleChanges } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { TrialCard } from "src/app/game/model/data/Trials";


@Component({
	standalone: false,
    selector: 'ghs-trial-card',
    templateUrl: './trial-card.html',
    styleUrls: ['./trial-card.scss']
})
export class TrialCardComponent implements OnInit, OnChanges {

    @Input() trial!: number;
    @Input() edition!: string;
    @Input() keep: boolean = false;
    @Input() flipped: boolean = false;
    @Input() reveal: boolean = false;
    @Input() disableFlip: boolean = false;
    trialCard: TrialCard | undefined;

    revealed: boolean = false;
    animate: boolean = false;

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;

    ngOnInit(): void {
        const editionData = gameManager.editionData.find((editionData) => editionData.edition == this.edition && editionData.trials);
        if (editionData) {
            this.trialCard = editionData.trials.find((trialCard) => trialCard.edition == this.edition && trialCard.cardId == this.trial);
        }
    }

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