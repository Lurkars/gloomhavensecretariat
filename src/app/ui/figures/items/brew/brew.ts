import { DIALOG_DATA, Dialog, DialogRef, } from "@angular/cdk/dialog";
import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { CountIdentifier, Identifier } from "src/app/game/model/data/Identifier";
import { ItemData } from "src/app/game/model/data/ItemData";
import { LootType } from "src/app/game/model/data/Loot";
import { ItemDialogComponent } from "../dialog/item-dialog";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";

@Component({
    standalone: false,
    selector: 'ghs-items-brew',
    templateUrl: 'brew.html',
    styleUrls: ['./brew.scss']
})
export class ItemsBrewDialog implements OnInit, OnDestroy {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    herbs: LootType[] = [LootType.arrowvine, LootType.axenut, LootType.corpsecap, LootType.flamefruit, LootType.rockroot, LootType.snowthistle];

    brewing: number;
    characterSpent: Partial<Record<LootType, number>> = {};
    fhSupportSpent: Partial<Record<LootType, number>> = {};
    receipe: (LootType | undefined)[] = [undefined, undefined];
    item: ItemData | undefined;
    brewed: ItemData | undefined;
    otherCharacters: Character[] = [];
    otherCharacter: Character | undefined;
    noChar: boolean = false;

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
        this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.updateItem() })
        this.updateItem();
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    updateItem() {
        const item = this.getItem();
        this.item = item && gameManager.game.party.unlockedItems.find((identitfier) => identitfier.name == '' + item.id && identitfier.edition == item.edition) && item;
        this.brewed = undefined;
        this.otherCharacters = [];
        this.otherCharacter = undefined;
        this.noChar = false;
    }

    addHerb(type: LootType | undefined, source: Partial<Record<LootType, number>> | false, index: number = -1) {
        if (type) {
            if (!source) {
                if (this.character.progress.loot[type] && (this.character.progress.loot[type] || 0) > (this.characterSpent[type] || 0)) {
                    source = this.characterSpent;
                } else if (gameManager.game.party.loot[type] && (gameManager.game.party.loot[type] || 0) > (this.fhSupportSpent[type] || 0)) {
                    source = this.fhSupportSpent;
                }
            }

            if (source) {
                source[type] = (source[type] || 0) + 1;
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
        if (type) {
            if (!source) {
                if (this.fhSupportSpent[type]) {
                    source = this.fhSupportSpent;
                } else {
                    source = this.characterSpent;
                }
            }
            source[type] = (source[type] || 1) - 1;
        }
        this.updateItem();
    }

    toggleHerb(type: LootType, index: number) {
        const add = this.receipe[index] != type;
        if (this.receipe[index]) {
            this.removeHerb(this.receipe[index], false, index);
        }
        if (add) {
            if ((this.character.progress.loot[type] || 0) <= (this.characterSpent[type] || 0) && (gameManager.game.party.loot[type] || 0) <= (this.fhSupportSpent[type] || 0)) {
                this.removeHerb(type, false);
            }
            this.addHerb(type, false, index);
        }
    }

    moveHerb(type: LootType, source: Partial<Record<LootType, number>>, target: Partial<Record<LootType, number>>) {
        source[type] = (source[type] || 1) - 1;
        target[type] = (target[type] || 0) + 1;
    }

    brew(force: boolean = false) {
        if (!gameManager.itemManager.brewingDisabled() || force) {
            this.brewed = this.getItem();
            if (this.brewed) {
                if (this.otherCharacter) {
                    this.brewInternal(this.otherCharacter, this.brewed);
                } else if (this.character.progress.items.find((identifier) => this.brewed && identifier.name == '' + this.brewed.id && identifier.edition == this.brewed.edition)) {
                    this.otherCharacters = gameManager.game.figures.filter((figure) => figure instanceof Character && figure != this.character && !figure.progress.items.find((identifier) => this.brewed && identifier.name == '' + this.brewed.id && identifier.edition == this.brewed.edition)).map((figure) => figure as Character);
                    this.noChar = this.otherCharacters.length == 0;
                    if (this.otherCharacters.length == 1) {
                        this.otherCharacter = this.otherCharacters[0];
                    }
                } else {
                    this.brewInternal(this.character, this.brewed);
                    this.otherCharacters = [];
                    this.otherCharacter = undefined;
                    this.noChar = false;
                }
            }
        }
    }

    brewInternal(character: Character, itemData: ItemData) {
        this.otherCharacter = character != this.character ? character : undefined
        gameManager.stateManager.before(!this.otherCharacter ? 'brewPotion' : 'brewPotionOther', gameManager.characterManager.characterName(this.character), itemData.id, itemData.edition, this.otherCharacter ? gameManager.characterManager.characterName(this.otherCharacter) : '');
        this.herbs.forEach((herb) => {
            if (this.fhSupportSpent[herb]) {
                gameManager.game.party.loot[herb] = (gameManager.game.party.loot[herb] || 0) - (this.fhSupportSpent[herb] || 0);
            }
            if (this.characterSpent[herb]) {
                this.character.progress.loot[herb] = (this.character.progress.loot[herb] || 0) - (this.characterSpent[herb] || 0);
            }
        })
        if (!gameManager.game.party.unlockedItems.find((identitfier) => identitfier.name == '' + itemData.id && identitfier.edition == itemData.edition)) {
            gameManager.game.party.unlockedItems.push(new CountIdentifier('' + itemData.id, itemData.edition));
        }
        character.progress.items.push(new Identifier('' + itemData.id, itemData.edition));
        gameManager.stateManager.after();
        this.brewed = itemData;
        this.otherCharacter = character != this.character ? character : undefined
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