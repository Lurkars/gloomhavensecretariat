import { Dialog } from "@angular/cdk/dialog";
import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";
import { Action } from "src/app/game/model/data/Action";
import { EnhancementAction, EnhancementType } from "src/app/game/model/data/Enhancement";
import { EnhancementDialogComponent } from "../../character/sheet/abilities/enhancements/enhancement-dialog";

@Component({
    standalone: false,
    selector: 'ghs-action-enhancements',
    templateUrl: './enhancements.html',
    styleUrls: ['./enhancements.scss']
})
export class ActionEnhancementsComponent implements OnInit, OnDestroy {

    @Input('action') action!: Action;
    @Input('index') actionIndex: string = "";
    @Input('cardId') cardId: number | undefined;
    @Input('character') character: Character | undefined;

    slots: EnhancementType[] = [];
    enhancements: EnhancementAction[] = [];
    edit: boolean = false;

    constructor(private dialog: Dialog) { }

    ngOnInit() {
        this.update();
        this.uiChangeSubscription = gameManager.uiChange.subscribe({
            next: () => {
                this.update();
            }
        })
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }
    update() {
        if (this.action.enhancementTypes) {
            this.slots = this.action.enhancementTypes;
        }

        if (this.character && this.cardId && this.character.progress && this.character.progress.enhancements && this.character.progress.enhancements[this.cardId] && this.character.progress.enhancements[this.cardId][this.actionIndex]) {
            this.enhancements = this.character.progress.enhancements[this.cardId] && this.character.progress.enhancements[this.cardId][this.actionIndex];
        }

        this.edit = this.character && this.character.tags.indexOf('edit-abilities') != -1 || false;
    }

    enhance(index: number, event: any) {
        if (this.edit) {
            this.dialog.open(EnhancementDialogComponent, {
                panelClass: ['dialog'],
                data: { action: this.action, actionIndex: this.actionIndex, cardId: this.cardId, enhancementIndex: index, character: this.character }
            });
            event.stopPropagation();
            event.preventDefault();
        }
    }
}