import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";

import { Character } from "src/app/game/model/Character";
import { CharacterProgress } from "src/app/game/model/CharacterProgress";
import { LootType } from "src/app/game/model/data/Loot";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";

@Component({
	standalone: false,
    selector: 'ghs-character-move-resources',
    templateUrl: 'move-resources.html',
    styleUrls: ['./move-resources.scss']
})
export class CharacterMoveResourcesDialog implements OnInit {

    gameManager: GameManager = gameManager;
    character: Character;
    lootTypes: LootType[] = Object.values(LootType);
    LootType = LootType;


    loot: Partial<Record<LootType, number>> = {};

    constructor(@Inject(DIALOG_DATA) public data: { character: Character, all: boolean }, private dialogRef: DialogRef) {
        this.character = data.character;
        if (data.all) {
            this.lootTypes.forEach((type) => {
                this.loot[type] = this.character.progress.loot[type] || 0;
            })
        }
    }

    ngOnInit(): void {
        if (!this.character.progress) {
            this.character.progress = new CharacterProgress();
        }
    }

    changeLoot(lootType: LootType, value: number) {
        if (!this.loot[lootType]) {
            this.loot[lootType] = 0;
        }
        this.loot[lootType] = (this.loot[lootType] as number) + value;

        if ((this.loot[lootType] as number) < 0) {
            this.loot[lootType] = 0;
        } else if (!this.character.progress.loot[lootType] || (this.loot[lootType] as number) > (this.character.progress.loot[lootType] as number)) {
            this.loot[lootType] = this.character.progress.loot[lootType] || 0;
        }
    }

    moveLoot() {
        Object.keys(this.loot).forEach((key) => {
            const lootType = key as LootType;
            let value = this.loot[lootType] || 0;
            if ((this.character.progress.loot[lootType] || 0) < value) {
                value = this.character.progress.loot[lootType] || 0;
            }

            if (value > 0) {
                gameManager.stateManager.before("moveResource", gameManager.characterManager.characterName(this.character), "game.loot." + lootType, value);
                gameManager.game.party.loot[lootType] = (gameManager.game.party.loot[lootType] || 0) + value;
                this.character.progress.loot[lootType] = (this.character.progress.loot[lootType] || 0) - value;
                gameManager.stateManager.after();
            }

        })
        this.close();
    }

    close() {
        ghsDialogClosingHelper(this.dialogRef);
    }

}