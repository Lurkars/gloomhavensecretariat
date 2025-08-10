import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, Inject, ViewEncapsulation } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { Ability } from 'src/app/game/model/data/Ability';
import { Monster } from 'src/app/game/model/Monster';

@Component({
    standalone: false,
    selector: 'ghs-manual-draw-dialog',
    templateUrl: './manual-draw-dialog.html',
    styleUrl: './manual-draw-dialog.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
})
export class MonsterManualDrawDialogComponent {
    monster: Monster;
    abilities: Ability[] = [];
    manualDrawnAbility: Ability | undefined;
    manualDrawnAbilityIndex: number;
    noSpoiler: boolean = true;

    gameManager: GameManager = gameManager;

    constructor(@Inject(DIALOG_DATA) data: { monster: Monster, manualDrawnAbility: Ability }, public dialogRef: DialogRef) {
        this.monster = data.monster;
        this.manualDrawnAbility = data.manualDrawnAbility;
        this.manualDrawnAbilityIndex = data.monster.ability;
        this.abilities = this.gameManager.abilities(this.monster);
    }

    selectAbility(ability: Ability, index: number): void {
        this.manualDrawnAbility = ability;
        this.manualDrawnAbilityIndex = index;
    }

    toggleNoSpoiler() {
        this.noSpoiler = !this.noSpoiler;
    }

    cancel(): void {
        this.dialogRef.close(undefined);
    }

    accept(): void {
        if (this.manualDrawnAbility) {
            this.monster.abilities = Array.from({length: this.abilities.length}, (_, i) => i);
            this.monster.ability = this.manualDrawnAbilityIndex;
            this.dialogRef.close(this.manualDrawnAbility);
        }
    }
}
