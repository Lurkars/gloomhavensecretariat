import { Dialog } from "@angular/cdk/dialog";
import { Component, Input, OnChanges, OnInit, SimpleChanges } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { Loot, LootType } from "src/app/game/model/Loot";
import { LootApplyDialogComponent } from "./loot-apply-dialog";

@Component({
    selector: 'ghs-loot',
    templateUrl: './loot.html',
    styleUrls: ['./loot.scss']
})
export class LootComponent implements OnInit, OnChanges {

    @Input() loot!: Loot;
    @Input() index: number = -1;
    @Input() disableFlip: boolean = false;
    @Input() flipped: boolean = false;
    @Input() reveal: boolean = false;
    @Input() edit: boolean = false;
    @Input() looted: boolean = false;
    @Input() character: string = "";

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    LootType = LootType;

    revealed: boolean = false;
    animate: boolean = false;

    constructor(private dialog: Dialog) { }

    ngOnInit(): void {
        this.animate = !this.disableFlip;
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

    changeCharacter(event: any) {
        if (settingsManager.settings.applyLoot && (this.edit || !this.character)) {
            event.preventDefault();
            event.stopPropagation();
            const dialog = this.dialog.open(LootApplyDialogComponent, {
                panelClass: 'dialog',
                data: { loot: this.loot, selected: this.character }
            });

            dialog.closed.subscribe({
                next: (name) => {
                    if (name) {
                        const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.name == name);
                        if (character instanceof Character) {
                            gameManager.stateManager.before("addResource", "data.character." + character.name, "game.loot." + this.loot.type, gameManager.lootManager.getValue(this.loot) + '');

                            if (this.character) {
                                const charBefore = gameManager.game.figures.find((figure) => figure instanceof Character && figure.name == this.character);
                                if (charBefore instanceof Character) {
                                    charBefore.lootCards = charBefore.lootCards.filter((index) => index != this.index);
                                }
                            }

                            character.lootCards = character.lootCards || [];
                            if (this.loot.type == LootType.money || this.loot.type == LootType.special1 || this.loot.type == LootType.special2) {
                                character.loot += gameManager.lootManager.getValue(this.loot);
                            }
                            character.lootCards.push(this.index);
                            character.lootCards.sort((a, b) => a - b);
                            gameManager.stateManager.after();
                        }
                    }
                }
            })
        }
    }
}