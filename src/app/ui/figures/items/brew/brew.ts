import { DIALOG_DATA, Dialog, DialogRef, } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { CountIdentifier, Identifier } from "src/app/game/model/data/Identifier";
import { ItemData } from "src/app/game/model/data/ItemData";
import { LootType } from "src/app/game/model/data/Loot";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";
import { ItemDialogComponent } from "../dialog/item-dialog";

@Component({
    standalone: false,
    selector: 'ghs-items-brew',
    templateUrl: 'brew.html',
    styleUrls: ['./brew.scss']
})
export class ItemsBrewDialog implements OnInit {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    herbs: LootType[] = [LootType.arrowvine, LootType.axenut, LootType.corpsecap, LootType.flamefruit, LootType.rockroot, LootType.snowthistle];

    brewing: number;
    characterSpent: Partial<Record<LootType, number>> = {};
    fhSupportSpent: Partial<Record<LootType, number>> = {};
    receipe: (LootType | undefined)[] = [undefined, undefined];
    item: ItemData | undefined;
    brewed: ItemData | undefined;
    characters: Character[] = [];
    selectedCharacter: Character | undefined;
    applied: boolean = false;
    forced: boolean[] = [];

    constructor(@Inject(DIALOG_DATA) public character: Character, private dialogRef: DialogRef, private dialog: Dialog) {
        this.brewing = 0;
        if (gameManager.fhRules() && gameManager.game.party.campaignMode && gameManager.game.party.buildings) {
            const alchemist = gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == 'alchemist');
            if (alchemist && alchemist.level) {
                this.brewing = alchemist.level < 3 ? 2 : 3;
            }
        }
    }

    ngOnInit(): void {
        this.updateItem();
    }

    updateItem() {
        const item = this.getItem();
        this.item = item && gameManager.game.party.unlockedItems.find((identitfier) => identitfier.name == '' + item.id && identitfier.edition == item.edition) && item;
        this.brewed = undefined;
        this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character && (!this.item || !figure.progress.items.find((identifier) => this.item && identifier.name == '' + this.item.id && identifier.edition == this.item.edition))).map((figure) => figure as Character).sort((a, b) => {
            if (a == this.character) {
                return -1;
            } else if (b == this.character) {
                return 1;
            }
            return gameManager.sortFiguresByTypeAndName(a, b);
        });
        this.selectedCharacter = this.characters.length ? this.characters[0] : undefined;
        this.applied = false;
    }

    addHerb(type: LootType | undefined, source: Partial<Record<LootType, number>> | false, index: number = -1, force: boolean = false) {
        if (type) {
            if (!force) {
                if (!source) {
                    if (this.character.progress.loot[type] && (this.character.progress.loot[type] || 0) > (this.characterSpent[type] || 0)) {
                        source = this.characterSpent;
                    } else if (gameManager.game.party.loot[type] && (gameManager.game.party.loot[type] || 0) > (this.fhSupportSpent[type] || 0)) {
                        source = this.fhSupportSpent;
                    }
                }

                if (source) {
                    source[type] = (source[type] || 0) + 1;
                }
            } else {
                this.forced[index > -1 ? index : this.receipe.length] = true;
            }

            if (source || force) {
                this.receipe[index > -1 ? index : this.receipe.length] = type;
            }
        }
        this.updateItem();
    }

    removeHerb(type: LootType | undefined, source: Partial<Record<LootType, number>> | false, index: number = -1) {
        this.receipe[index > -1 ? index : this.receipe.indexOf(type)] = undefined;
        if (index == 2) {
            this.receipe.splice(2, 1);
        }
        if (type && !this.forced[index > -1 ? index : this.receipe.indexOf(type)]) {
            if (!source) {
                if (this.fhSupportSpent[type]) {
                    source = this.fhSupportSpent;
                } else {
                    source = this.characterSpent;
                }
            }
            source[type] = (source[type] || 1) - 1;
        } else if (type) {
            this.forced[index > -1 ? index : this.receipe.indexOf(type)] = false;
        }
        this.updateItem();
    }

    toggleHerb(type: LootType, index: number, force: boolean = false) {
        const add = this.receipe[index] != type || !this.forced[index] && force || this.forced[index] && !force;
        if (this.receipe[index]) {
            this.removeHerb(this.receipe[index], false, index);
        }
        if (add) {
            if ((this.character.progress.loot[type] || 0) <= (this.characterSpent[type] || 0) && (gameManager.game.party.loot[type] || 0) <= (this.fhSupportSpent[type] || 0)) {
                this.removeHerb(type, false);
            }
            this.addHerb(type, false, index, force);
        }
    }

    moveHerb(type: LootType, source: Partial<Record<LootType, number>>, target: Partial<Record<LootType, number>>) {
        source[type] = (source[type] || 1) - 1;
        target[type] = (target[type] || 0) + 1;
    }

    brew(force: boolean = false) {
        if (!gameManager.itemManager.brewingDisabled() && !this.forced.includes(true) || force) {
            this.brewed = this.getItem();
            if (this.selectedCharacter && this.brewed) {
                gameManager.stateManager.before(this.selectedCharacter == this.character ? 'brewPotion' : 'brewPotionOther', gameManager.characterManager.characterName(this.character), this.brewed.id, this.brewed.edition, gameManager.characterManager.characterName(this.selectedCharacter));
                if (!force) {
                    this.herbs.forEach((herb) => {
                        if (this.fhSupportSpent[herb]) {
                            gameManager.game.party.loot[herb] = (gameManager.game.party.loot[herb] || 0) - (this.fhSupportSpent[herb] || 0);
                        }
                        if (this.characterSpent[herb]) {
                            this.character.progress.loot[herb] = (this.character.progress.loot[herb] || 0) - (this.characterSpent[herb] || 0);
                        }
                    })
                }
                if (!gameManager.game.party.unlockedItems.find((identitfier) => this.brewed && identitfier.name == '' + this.brewed.id && identitfier.edition == this.brewed.edition)) {
                    gameManager.game.party.unlockedItems.push(new CountIdentifier('' + this.brewed.id, this.brewed.edition));
                }
                this.selectedCharacter.progress.items.push(new Identifier('' + this.brewed.id, this.brewed.edition));
                this.applied = true;
                gameManager.stateManager.after();
            }
        }
    }

    getItem(): ItemData | undefined {
        if (this.receipe[0] && this.receipe[1]) {
            if (this.receipe.filter((herb, index, self) => herb && self.indexOf(herb) == index).length != this.receipe.filter((herb) => herb).length) {
                return gameManager.itemManager.getItems(gameManager.currentEdition(), true).find((itemData) => (!itemData.requiredItems || !itemData.requiredItems.length) && itemData.requiredBuilding == 'alchemist' && (!this.receipe[2] ? itemData.requiredBuildingLevel < 3 : itemData.requiredBuildingLevel >= 3) && !itemData.resources);
            } else {
                return gameManager.itemManager.getItems(gameManager.currentEdition(), true).find((itemData) => (!itemData.requiredItems || !itemData.requiredItems.length) && itemData.requiredBuilding == 'alchemist' && (!this.receipe[2] ? itemData.requiredBuildingLevel < 3 : itemData.requiredBuildingLevel >= 3) && itemData.resources && this.herbs.every((herb) => itemData.resources && this.receipe.filter((value) => value == herb).length == (itemData.resources[herb] || 0)));
            }
        } else {
            return undefined;
        }
    }

    openItemDialog() {
        this.dialog.open(ItemDialogComponent, {
            panelClass: ['fullscreen-panel'],
            disableClose: true,
            data: { item: this.brewed || this.item }
        })
    }

    close() {
        ghsDialogClosingHelper(this.dialogRef);
    }

}