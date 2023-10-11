import { Dialog } from "@angular/cdk/dialog";
import { Component, Input, OnChanges, OnInit, SimpleChanges } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { Loot, LootType } from "src/app/game/model/data/Loot";
import { LootApplyDialogComponent } from "./loot-apply-dialog";
import { LootRandomItemDialogComponent } from "./random-item/random-item-dialog";
import { AdditionalIdentifier, Identifier } from "src/app/game/model/data/Identifier";
import { ItemData } from "src/app/game/model/data/ItemData";

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
    @Input() highlight: boolean = true;
    @Input() apply: boolean = true;
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
                data: { loot: this.loot, selected: this.character, edit: this.edit }
            });

            dialog.closed.subscribe({
                next: (name) => {
                    if (typeof name === 'string') {
                        const charBefore = gameManager.game.figures.find((figure) => figure instanceof Character && figure.name == this.character);
                        let randomItemIdentifier: AdditionalIdentifier | undefined;
                        if (charBefore instanceof Character && charBefore.name != name) {
                            if (this.loot.type == LootType.random_item && name) {
                                randomItemIdentifier = charBefore.progress.equippedItems.find((value) => value.marker == "loot-random-item");
                            } else {
                                gameManager.stateManager.before("removeLootCard", "data.character." + charBefore.name, "game.loot." + this.loot.type, gameManager.lootManager.getValue(this.loot) + '');
                                charBefore.lootCards = charBefore.lootCards.filter((index) => index != this.index);
                                if (this.loot.type == LootType.money || this.loot.type == LootType.special1 || this.loot.type == LootType.special2) {
                                    charBefore.loot -= gameManager.lootManager.getValue(this.loot);
                                }

                                if (this.loot.type == LootType.random_item) {
                                    randomItemIdentifier = charBefore.progress.equippedItems.find((value) => value.marker == "loot-random-item");
                                    if (randomItemIdentifier) {
                                        charBefore.progress.items = charBefore.progress.items.filter((value) => randomItemIdentifier && (value.edition != randomItemIdentifier.edition || value.name != randomItemIdentifier.name));
                                        charBefore.progress.equippedItems = charBefore.progress.equippedItems.filter((value) => randomItemIdentifier && (value.edition != randomItemIdentifier.edition || value.name != randomItemIdentifier.name));
                                    }
                                }
                                gameManager.stateManager.after();
                            }
                        }

                        if (name && (!charBefore || charBefore.name != name)) {
                            const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.name == name);
                            if (character instanceof Character) {
                                if (this.loot.type != LootType.random_item) {
                                    gameManager.stateManager.before("addLootCard", "data.character." + character.name, "game.loot." + this.loot.type, gameManager.lootManager.getValue(this.loot) + '');
                                    gameManager.lootManager.applyLoot(this.loot, character, this.index);
                                    gameManager.stateManager.after();
                                } else {
                                    let result: ItemData | undefined = randomItemIdentifier ? gameManager.itemManager.getItem(+randomItemIdentifier.name, randomItemIdentifier.edition, true) : undefined;
                                    if (!result) {
                                        result = gameManager.lootManager.applyLoot(this.loot, character, this.index);
                                    }
                                    if (result) {
                                        this.dialog.open(LootRandomItemDialogComponent, {
                                            panelClass: 'dialog',
                                            data: { item: result, loot: this.loot, index: this.index, character: character }
                                        }).closed.subscribe({
                                            next: (result) => {
                                                if (result) {
                                                    const item = result as ItemData;
                                                    gameManager.stateManager.before("selectRandomItemLoot");
                                                    let itemIdentifier: Identifier = new Identifier('' + item.id, item.edition);
                                                    gameManager.itemManager.addItemCount(item);
                                                    if (character.lootCards.indexOf(this.index) == -1) {
                                                        character.lootCards.push(this.index);
                                                        character.lootCards.sort((a, b) => a - b);
                                                    }
                                                    if (character.progress.items.find((existing) => existing.name == '' + item.id && existing.edition == item.edition) != undefined) {
                                                        character.progress.gold += gameManager.itemManager.itemSellValue(item);
                                                    } else {
                                                        character.progress.items.push(itemIdentifier);
                                                        character.progress.equippedItems.push(new AdditionalIdentifier(itemIdentifier.name, itemIdentifier.edition, undefined, "loot-random-item"));
                                                    }

                                                    if (randomItemIdentifier && charBefore instanceof Character) {
                                                        charBefore.lootCards = charBefore.lootCards.filter((index) => index != this.index);
                                                        charBefore.progress.items = charBefore.progress.items.filter((value) => randomItemIdentifier && (value.edition != randomItemIdentifier.edition || value.name != randomItemIdentifier.name));
                                                        charBefore.progress.equippedItems = charBefore.progress.equippedItems.filter((value) => value.marker != "loot-random-item");
                                                    }
                                                    gameManager.stateManager.after();
                                                } else {
                                                    character.lootCards = character.lootCards.filter((index) => index != this.index);
                                                }
                                            }
                                        })
                                    }
                                }
                            }
                        }
                    }
                }
            })
        }
    }
}