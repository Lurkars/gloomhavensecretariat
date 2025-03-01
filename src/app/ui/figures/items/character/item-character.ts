import { Component, Input } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { AdditionalIdentifier } from "src/app/game/model/data/Identifier";
import { ItemData, ItemFlags, ItemSlot } from "src/app/game/model/data/ItemData";

@Component({
    standalone: false,
    selector: 'ghs-character-item',
    templateUrl: './item-character.html',
    styleUrls: ['./item-character.scss']
})
export class CharacterItemComponent {

    @Input() character!: Character;
    @Input() item!: ItemData;
    @Input() flipped: boolean = true;
    @Input() setup: boolean = false;
    @Input() dialog: boolean = false;

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    ItemFlags = ItemFlags;
    GameState = GameState;

    equipped(): AdditionalIdentifier | undefined {
        return this.character.progress.equippedItems.find((identifier) => identifier.name == '' + this.item.id && identifier.edition == this.item.edition);
    }

    bbBlocked(): boolean {
        return gameManager.bbRules() && !this.equipped() && this.character.progress.equippedItems.find((identifier) => typeof this.item.id === 'number' && (+identifier.name) == (this.item.id % 2 == 0 ? this.item.id - 1 : this.item.id + 1) && identifier.edition == this.item.edition) != undefined;
    }

    isLootRandomItem() {
        return this.character.progress.equippedItems.find((identifier) => identifier.name == '' + this.item.id && identifier.edition == this.item.edition && identifier.marker == "loot-random-item");
    }

    toggleEquippedItem(force: boolean = false) {
        const owned = this.character.progress.items.find((identifier) => identifier.name == '' + this.item.id && identifier.edition == this.item.edition) != undefined;
        if ((this.setup || force) && (owned || !this.bbBlocked() || force)) {
            gameManager.stateManager.before(this.equipped() ? 'unequipItem' : 'equipItem', gameManager.characterManager.characterName(this.character), this.item.id, this.item.edition)
            gameManager.itemManager.toggleEquippedItem(this.item, this.character, force);
            if (gameManager.bbRules()) {
                if (!this.equipped() && owned) {
                    gameManager.itemManager.removeItem(this.item, this.character);
                } else if (this.equipped() && !owned) {
                    gameManager.itemManager.addItem(this.item, this.character);
                }
            }
            gameManager.stateManager.after();

            if (settingsManager.settings.animations) {
                setTimeout(() => { gameManager.uiChange.emit() }, 500);
            }
        }
    }

    countFlag(flag: string): number {
        const equipped = this.equipped();
        if (equipped) {
            return equipped.tags && equipped.tags.filter((tag) => tag == flag).length || 0;
        }
        return 0;
    }

    toggleFlag(force: boolean, flag: string) {
        if (!force && gameManager.challengesManager.apply && gameManager.challengesManager.isActive(1502, 'fh') && this.item.slot == ItemSlot.small) {
            return;
        }

        if (!this.setup && gameManager.game.state == GameState.next || force) {
            const equipped = this.equipped();
            if (equipped && (gameManager.itemManager.itemUsable(this.item) || force)) {
                equipped.tags = equipped.tags || [];
                gameManager.stateManager.before((equipped.tags.indexOf(flag) == -1 ? 'characterItemApply.' : 'characterItemUnapply.') + flag, gameManager.characterManager.characterName(this.character), this.item.id, this.item.edition, this.item.name)
                if (equipped.tags.indexOf(flag) == -1) {
                    if (!force && gameManager.challengesManager.apply && gameManager.challengesManager.isActive(1507, 'fh') && flag == ItemFlags.spent) {
                        equipped.tags.push(ItemFlags.consumed);
                    } else {
                        equipped.tags.push(flag);
                    }
                } else {
                    equipped.tags = equipped.tags.filter((tag) => tag != flag);
                    if (flag == ItemFlags.spent) {
                        equipped.tags = equipped.tags.filter((tag) => tag != ItemFlags.slot && tag != ItemFlags.slotBack);
                    }
                }

                if ((flag == ItemFlags.consumed || flag == ItemFlags.spent) && equipped.tags.indexOf(flag) != -1 && settingsManager.settings.characterItemsApply) {
                    gameManager.itemManager.applyItemEffects(this.character, this.item, true);
                }
                gameManager.stateManager.after();

                if (settingsManager.settings.animations) {
                    setTimeout(() => { gameManager.uiChange.emit() }, 500);
                }
            }
        }
    }

    toggleFlagCount(index: number, flag: string) {
        if (!this.setup && gameManager.game.state == GameState.next) {
            const equipped = this.equipped();
            if (equipped) {
                equipped.tags = equipped.tags || [];
                const count = this.countFlag(flag);
                gameManager.stateManager.before((count <= index ? 'characterItemApply.' : 'characterItemUnapply.') + flag, gameManager.characterManager.characterName(this.character), this.item.id, this.item.edition, this.item.name);
                if (count <= index) {
                    for (let i = count; i <= index; i++) {
                        equipped.tags.push(flag);
                    }
                    if (flag == ItemFlags.slot && this.countFlag(flag) == this.item.slots) {
                        if (this.item.spent && !this.countFlag(ItemFlags.spent)) {
                            equipped.tags.push(ItemFlags.spent);
                        } else if (this.item.consumed && !this.countFlag(ItemFlags.consumed)) {
                            equipped.tags.push(ItemFlags.consumed);
                        }
                    }
                } else {
                    for (let i = index; i < count; i++) {
                        equipped.tags.splice(equipped.tags.indexOf(flag), 1);
                    }
                }
                gameManager.stateManager.after();

                if (settingsManager.settings.animations) {
                    setTimeout(() => { gameManager.uiChange.emit() }, 500);
                }
            }
        }
    }

    slotsMarked(flag: string): string[] {
        let marked: string[] = [];
        for (let i = 0; i < this.countFlag(flag); i++) {
            marked.push(this.character.name);
        }
        return marked
    }
}