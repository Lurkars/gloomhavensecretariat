import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';

@Component({
	standalone: false,
    selector: 'ghs-trial-dialog',
    templateUrl: './trial-dialog.html',
    styleUrls: ['./trial-dialog.scss'],
})
export class TrialDialogComponent implements OnInit {

    opened: boolean = false;

    constructor(@Inject(DIALOG_DATA) public data: { edition: string, trial: number }, private dialogRef: DialogRef) { }

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