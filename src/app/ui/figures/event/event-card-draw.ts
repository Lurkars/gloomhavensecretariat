import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { EventCard } from "src/app/game/model/data/EventCard";
import { ghsDialogClosingHelper } from "../../helper/Static";
import { Subscription } from "rxjs";

@Component({
    standalone: false,
    selector: 'ghs-event-card-draw',
    templateUrl: './event-card-draw.html',
    styleUrls: ['./event-card-draw.scss']
})
export class EventCardDrawComponent {


    event: EventCard | undefined;
    selected: number = -1;
    subSelections: number[] = [];
    globalDraw: boolean = false;

    constructor(@Inject(DIALOG_DATA) data: { edition: string, type: string }, private dialogRef: DialogRef) {
        const deck = gameManager.game.party.eventDecks[data.type];
        this.globalDraw = gameManager.game.eventDraw != undefined;
        if (deck) {
            this.event = gameManager.eventCardManager.getEventCardForEdition(data.edition, data.type, deck[0]);
        }
        if (!this.event) {
            console.debug("No event card found for", data.edition, data.type);
            this.dialogRef.close();
        }

        this.uiChangeSubscription = gameManager.uiChange.subscribe({
            next: () => {
                if (this.globalDraw && !gameManager.game.eventDraw) {
                    this.dialogRef.close();
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

    select(index: number) {
        this.selected = index;
    }

    cancel() {
        gameManager.stateManager.before('eventDraw.cancel');
        gameManager.game.eventDraw = undefined;
        gameManager.stateManager.after();
        ghsDialogClosingHelper(this.dialogRef);
    }

    accept() {
        if (this.event && this.selected != -1) {
            ghsDialogClosingHelper(this.dialogRef);
            this.dialogRef.closed.subscribe({
                next: () => {
                    if (this.event && this.selected != -1) {
                        gameManager.stateManager.before('eventDraw.accept');
                        gameManager.game.eventDraw = undefined;
                        gameManager.eventCardManager.applyEvent(this.event, this.selected, this.subSelections, gameManager.game.scenario != undefined && gameManager.roundManager.firstRound);
                        gameManager.stateManager.after();
                    }
                }
            })
        }
    }
}