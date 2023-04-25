import { DIALOG_DATA, DialogRef, } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";

@Component({
    selector: 'ghs-select-gold',
    templateUrl: 'select-gold.html',
    styleUrls: ['./select-gold.scss']
})
export class SelectGoldDialog implements OnInit {

    settingsManager: SettingsManager = settingsManager;
    characters: Character[] = [];
    characterGold: number[] = [];
    min: number = -1;
    max: number = -1;
    gold: number = 0;

    constructor(@Inject(DIALOG_DATA) private range: { min: number, max: number }, private dialogRef: DialogRef) {
        if (this.range) {
            this.min = this.range.min || -1;
            this.max = this.range.max || -1;
        }
    }

    ngOnInit(): void {
        this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character && figure.progress.gold > 0).map((figure) => figure as Character);
        this.characters.forEach((character, index) => {
            this.characterGold[index] = 0;
        })
    }

    changeGold(index: number, value: number) {
        if (!this.characterGold[index]) {
            this.characterGold[index] = 0;
        }
        this.characterGold[index] += value;
        this.gold += value;
    }

    moveGold() {
        let gold = 0;
        this.characterGold.forEach((value, index) => {
            const character = this.characters[index];
            if (character.progress.gold < value) {
                value = character.progress.gold || 0;
            }

            if (value > 0) {
                gold += value;
            }

        })

        if (gold && gold >= this.min && gold <= this.max) {
            gameManager.stateManager.before("selectGold", gold + '');
            this.characterGold.forEach((value, index) => {
                const character = this.characters[index];
                if (character.progress.gold < value) {
                    value = character.progress.gold || 0;
                }
                if (value > 0) {
                    character.progress.gold -= value;
                }
            })
            gameManager.stateManager.after();
            this.dialogRef.close(gold);
        }
    }



    close() {
        this.dialogRef.close();
    }

}