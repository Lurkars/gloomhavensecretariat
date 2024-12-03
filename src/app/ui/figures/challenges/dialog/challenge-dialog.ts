import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ChallengeCard } from 'src/app/game/model/data/Challenges';

@Component({
	standalone: false,
    selector: 'ghs-challenge-dialog',
    templateUrl: './challenge-dialog.html',
    styleUrls: ['./challenge-dialog.scss'],
})
export class ChallengeDialogComponent implements OnInit {

    opened: boolean = false;

    constructor(@Inject(DIALOG_DATA) public card: ChallengeCard, private dialogRef: DialogRef) { }

    ngOnInit(): void {
        this.opened = true;
    }

    close() {
        this.opened = false;
        setTimeout(() => {
            this.dialogRef.close();
        }, settingsManager.settings.animations ? 1000 : 0);
    }
}