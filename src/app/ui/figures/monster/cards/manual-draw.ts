import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { take } from 'rxjs';
import { Ability } from 'src/app/game/model/data/Ability';
import { Monster } from 'src/app/game/model/Monster';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { MonsterManualDrawDialogComponent } from './manual-draw-dialog';

@Component({
    standalone: false,
    selector: 'ghs-manual-draw',
    templateUrl: './manual-draw.html',
    styleUrl: './manual-draw.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonsterManualDrawComponent implements OnInit, OnDestroy {
    @Input() monster!: Monster;

    dialogRef!: DialogRef<any, MonsterManualDrawDialogComponent> | undefined;
    manualDrawnAbility: Ability | undefined;

    gameManager: GameManager = gameManager;

    constructor(private dialog: Dialog, private cd: ChangeDetectorRef) {
    }

    ngOnInit() {
        if (this.monster.abilities.length === 1) {
            this.monster.ability = 0;
            this.manualDrawnAbility = gameManager.abilities(this.monster)[0];
        }
    }

    openDropdown() {
        if (this.monster.abilities.length === 1) {
            return;
        }
        this.dialogRef = this.dialog.open(MonsterManualDrawDialogComponent, {
            panelClass: ['dialog'],
            width: '90vw',
            data: {monster: this.monster, manualDrawnAbility: this.manualDrawnAbility},
        });

        this.dialogRef.closed.pipe(take(1))
            .subscribe((ability: Ability) => {
                this.manualDrawnAbility = ability;
                this.cd.detectChanges();
            });
    }

    ngOnDestroy() {
        this.dialogRef?.close();
        this.dialogRef = undefined;
    }
}
