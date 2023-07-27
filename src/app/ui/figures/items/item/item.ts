import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Action, ActionType } from "src/app/game/model/data/Action";
import { Identifier } from "src/app/game/model/data/Identifier";
import { ItemData } from "src/app/game/model/data/ItemData";

@Component({
    selector: 'ghs-item',
    templateUrl: './item.html',
    styleUrls: ['./item.scss']
})
export class ItemComponent implements OnInit {

    @Input() item!: ItemData | undefined;
    @Input() identifier: Identifier | undefined | false;
    @Input() flipped: boolean = false;
    @Input() selected: boolean = false;
    @Input() disabled: boolean = false;
    @Input() filtered: boolean = false;
    @Input() owned: boolean = false;
    @Input() unavailable: boolean = false;
    @Input() reveal: boolean = false;
    @Input() count: number | '-' = 1;
    @Output() revealed = new EventEmitter<boolean>();
    fhStyle: boolean = false;
    craft: boolean = false;
    edition: string = "";

    settingsManager: SettingsManager = settingsManager;


    ngOnInit(): void {
        if (!this.item && this.identifier) {
            this.item = gameManager.itemManager.getItem(+this.identifier.name, this.identifier.edition, true);
        }

        if (this.item) {

            if (!gameManager.game.edition || gameManager.itemManager.itemEditions(gameManager.game.edition).find((edition) => edition != gameManager.game.edition)) {
                this.edition = this.item.edition;
            }

            if (this.item.edition == 'fh') {
                this.fhStyle = true;
            }

            if (this.item.resources && Object.values(this.item.resources).some((value) => value) || this.item.requiredItems && this.item.requiredItems.length > 0 || this.item.resourcesAny && this.item.resourcesAny.length > 0) {
                this.fhStyle = true;
                this.craft = true;
            }

            this.item.actions = this.item.actions || [];

            this.applySlots(this.item.slots, this.item.actions);
            if (this.item.slotsBack) {
                this.item.actionsBack = this.item.actionsBack || [];
                this.applySlots(this.item.slotsBack, this.item.actionsBack);
            }

            if (this.item.summon && !this.item.actions.find((action) => action.type == ActionType.summon && action.value == 'summonDataItem')) {
                const action = new Action(ActionType.summon, 'summonDataItem');
                action.valueObject = this.item.summon;
                action.small = true;
                this.item.actions.push(action);
            }

        }
    }

    applySlots(slotCount: number, actions: Action[]) {
        if (slotCount && !actions.find((action) => action.type == ActionType.grid && action.subActions.length > 0 && action.subActions[0].type == ActionType.card && ('' + action.subActions[0].value).startsWith('slot'))) {
            if (slotCount < 5) {
                const action = new Action(ActionType.grid, slotCount);
                for (let i = 0; i < slotCount; i++) {
                    if (this.fhStyle && i == 0) {
                        action.subActions.push(new Action(ActionType.card, "slotStart"));
                    } else if (this.fhStyle && i == slotCount - 1) {
                        action.subActions.push(new Action(ActionType.card, "slotEnd"));
                    } else {
                        action.subActions.push(new Action(ActionType.card, "slot"));
                    }
                }
                if (slotCount > 3) {
                    action.small = true;
                }
                actions.push(action);
            } else {
                const columns = Math.ceil(slotCount / 3);
                for (let grid = 0; grid < columns; grid++) {
                    const slots = grid < columns - 1 ? 3 : (slotCount % 3);
                    const action = new Action(ActionType.grid, slots);
                    if (columns > 1) {
                        action.small = true;
                    }
                    for (let i = 0; i < slots; i++) {
                        if (this.fhStyle && i == 0 && grid == 0) {
                            action.subActions.push(new Action(ActionType.card, "slotStart"));
                        } else if (this.fhStyle && i == slots - 1 && grid == columns - 1) {
                            action.subActions.push(new Action(ActionType.card, "slotEnd"));
                        } else {
                            action.subActions.push(new Action(ActionType.card, "slot"));
                        }
                    }
                    actions.push(action);
                }
            }
        }
    }

    emitRevealed(revealed: boolean) {
        this.revealed.emit(revealed);
    }
}