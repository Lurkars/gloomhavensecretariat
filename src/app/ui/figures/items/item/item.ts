import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Action, ActionType } from "src/app/game/model/data/Action";
import { Identifier } from "src/app/game/model/data/Identifier";
import { ItemData } from "src/app/game/model/data/ItemData";

@Component({
    standalone: false,
    selector: 'ghs-item',
    templateUrl: './item.html',
    styleUrls: ['./item.scss']
})
export class ItemComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('container') containerElement!: ElementRef;
    @Input() item!: ItemData | undefined;
    @Input() identifier: Identifier | undefined | false;
    @Input() flipped: boolean = false;
    @Input() reveal: boolean = false;
    @Input() count: number | '-' = 1;
    @Input() slotsMarked: string[] = [];
    @Input() slotsBackMarked: string[] = [];
    @Input() editionLabel: string = "";
    @Output() revealed = new EventEmitter<boolean>();
    @Output() clickedConsumed = new EventEmitter<boolean>();
    @Output() clickedSpent = new EventEmitter<boolean>();
    @Output() clickedFlip = new EventEmitter<boolean>();
    @Output() clickedSlot = new EventEmitter<number>();
    @Output() clickedSlotBack = new EventEmitter<number>();
    @Output() clickedPersistent = new EventEmitter<boolean>();
    fhStyle: boolean = false;
    bb: boolean = false;
    craft: boolean = false;
    edition: string = "";
    slots: Action[] = [];
    slotsBack: Action[] = [];
    idNumber: boolean = false;
    usable: boolean = true;

    settingsManager: SettingsManager = settingsManager;
    gameManager: GameManager = gameManager;
    fontsize: string = "1em";

    ngOnInit(): void {
        if (!this.item && this.identifier) {
            this.item = gameManager.itemManager.getItem(this.identifier.name, this.identifier.edition, true);
        }

        if (this.item) {
            if (this.item.edition != this.editionLabel) {
                this.edition = this.item.edition;
            }

            if (this.item.edition == 'fh') {
                this.fhStyle = true;
            }

            if (this.item.edition == 'bb') {
                this.bb = true;
            }

            if (this.item.resources && Object.values(this.item.resources).some((value) => value) || this.item.requiredItems && this.item.requiredItems.length > 0 || this.item.resourcesAny && this.item.resourcesAny.length > 0) {
                this.fhStyle = true;
                this.craft = true;
            }

            this.item.actions = this.item.actions || [];

            this.applySlots(this.item.slots, this.slots);
            if (this.item.slotsBack) {
                this.item.actionsBack = this.item.actionsBack || [];
                this.applySlots(this.item.slotsBack, this.slots);
            }

            if (this.item.summon && !this.item.actions.find((action) => action.type == ActionType.summon && action.value == 'summonDataItem')) {
                const action = new Action(ActionType.summon, 'summonDataItem');
                action.valueObject = this.item.summon;
                action.small = true;
                this.item.actions.push(action);
            }

            this.idNumber = typeof this.item.id === 'number';
            this.usable = gameManager.itemManager.itemUsable(this.item);
        }

        this.uiChangeSubscription = gameManager.uiChange.subscribe({
            next: () => {
                this.fontsize = (this.containerElement.nativeElement.offsetWidth * 0.072) + 'px';
                if (this.item) {
                    this.usable = gameManager.itemManager.itemUsable(this.item);
                }
            }
        })
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.fontsize = (this.containerElement.nativeElement.offsetWidth * 0.072) + 'px';
        }, 1);
    }

    applySlots(slotCount: number, actions: Action[]) {
        if (slotCount && !actions.find((action) => action.type == ActionType.card && action.subActions.length > 0 && ('' + action.value).startsWith('slot'))) {
            for (let i = 0; i < slotCount; i++) {
                let action = new Action(ActionType.card, "slot");
                if (this.fhStyle && i == 0) {
                    action = new Action(ActionType.card, "slotStart");
                } else if (this.fhStyle && i == slotCount - 1) {
                    action = new Action(ActionType.card, "slotEnd");
                }

                if (slotCount > 3) {
                    action.small = true;
                }
                actions.push(action);
            }
        }
    }

    applySlotsGrid(slotCount: number, actions: Action[]) {
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