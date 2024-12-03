import { Dialog, } from "@angular/cdk/dialog";
import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { AdditionalIdentifier } from "src/app/game/model/data/Identifier";
import { ItemData, ItemFlags, ItemSlot } from "src/app/game/model/data/ItemData";
import { ItemsDialogComponent } from "../../items/dialog/items-dialog";
import { ItemDialogComponent } from "../../items/dialog/item-dialog";


@Component({
	standalone: false,
    selector: 'ghs-character-item-list',
    templateUrl: './item-list.html',
    styleUrls: ['./item-list.scss']
})
export class CharacterItemListComponent implements OnInit, OnDestroy {

    @Input() character!: Character;

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    setup: boolean = false;
    items: ItemData[] = [];
    ItemFlags = ItemFlags;
    GameState = GameState;

    constructor(private dialog: Dialog) { }

    ngOnInit(): void {
        this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() })
        this.update();
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    update() {
        this.setup = gameManager.game.state == GameState.draw && gameManager.roundManager.firstRound;
        this.items = (gameManager.bbRules() ? gameManager.itemManager.getItems('bb') : this.character.progress.items.map((identifier) => gameManager.itemManager.getItem(identifier.name, identifier.edition, true))).filter((itemData) => itemData && (this.setup || !settingsManager.settings.characterItemsPermanentEquipped || this.equipped(itemData))).map((itemData) => itemData as ItemData).sort((a, b) => this.sortItems(a, b));
    }

    sortItems(a: ItemData, b: ItemData) {
        if (!settingsManager.settings.characterItemsPermanentSorted) {
            return 0;
        }

        if (!this.setup) {
            if (this.equipped(a) && !this.equipped(b)) {
                return -1;
            } else if (this.equipped(b) && !this.equipped(a)) {
                return 1;
            }

            if (this.countFlag(a, ItemFlags.consumed) && !this.countFlag(b, ItemFlags.consumed)) {
                return 1;
            } else if (this.countFlag(b, ItemFlags.consumed) && !this.countFlag(a, ItemFlags.consumed)) {
                return -1;
            }
        }

        if (a.slot && !b.slot) {
            return -1;
        } else if (b.slot && !a.slot) {
            return 1;
        }

        if (a.slot && b.slot) {
            return Object.values(ItemSlot).indexOf(a.slot) - Object.values(ItemSlot).indexOf(b.slot);
        }

        return 0;
    }

    equipped(itemData: ItemData): AdditionalIdentifier | undefined {
        return this.character.progress.equippedItems.find((identifier) => identifier.name == '' + itemData.id && identifier.edition == itemData.edition);
    }

    countFlag(itemData: ItemData, flag: string): number {
        const equipped = this.equipped(itemData);
        if (equipped) {
            return equipped.tags && equipped.tags.filter((tag) => tag == flag).length || 0;
        }
        return 0;
    }

    toggleEquipped() {
        settingsManager.settings.characterItemsPermanentEquipped = !settingsManager.settings.characterItemsPermanentEquipped;
        settingsManager.storeSettings();
    }

    toggleSorted() {
        settingsManager.settings.characterItemsPermanentSorted = !settingsManager.settings.characterItemsPermanentSorted;
        settingsManager.storeSettings();
    }


    zoom(value: number) {
        settingsManager.settings.characterItemsPermanentZoom += value;
        if (settingsManager.settings.characterItemsPermanentZoom < 0.5) {
            settingsManager.settings.characterItemsPermanentZoom = 0.5;
        } else if (settingsManager.settings.characterItemsPermanentZoom > 1.5) {
            settingsManager.settings.characterItemsPermanentZoom = 1.5;
        }
        settingsManager.storeSettings();

        if (settingsManager.settings.animations) {
            setTimeout(() => { gameManager.uiChange.emit() }, 500);
        }
    }

    resetZoom() {
        settingsManager.settings.characterItemsPermanentZoom = 1;
        settingsManager.storeSettings();

        if (settingsManager.settings.animations) {
            setTimeout(() => { gameManager.uiChange.emit() }, 500);
        }
    }

    openShop() {
        this.dialog.open(ItemsDialogComponent, {
            panelClass: ['dialog'],
            data: { edition: gameManager.game.edition, select: this.character, affordable: true }
        })
    }

    openItemDialog(item: ItemData) {
        this.dialog.open(ItemDialogComponent, {
            panelClass: ['fullscreen-panel'],
            disableClose: true,
            data: { item: item, character: this.character, setup: this.setup }
        })
    }
}