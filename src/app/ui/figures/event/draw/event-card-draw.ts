import { Dialog, DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { Subscription } from "rxjs";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { EventCard, EventCardIdentifier } from "src/app/game/model/data/EventCard";
import { ghsDialogClosingHelper } from "../../../helper/Static";
import { EventCardDialogComponent } from "../dialog/event-card-dialog";

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
    checks: number[] = [];
    globalDraw: boolean = false;
    requirementWarning: boolean = false;

    settingsManager: SettingsManager = settingsManager;

    constructor(@Inject(DIALOG_DATA) data: { edition: string, type: string, cardId: string | undefined }, private dialogRef: DialogRef, private dialog: Dialog) {
        const deck = gameManager.game.party.eventDecks[data.type];
        this.globalDraw = gameManager.game.eventDraw != undefined;
        if (deck) {
            this.event = gameManager.eventCardManager.getEventCardForEdition(data.edition, data.type, data.cardId || deck[0]);
        }
        if (!this.event) {
            console.debug("No event card found for", data.edition, data.type);
            this.dialogRef.close();
        }

        if (this.event && this.event.requirement && this.event.requirement.partyAchievement) {
            this.requirementWarning = gameManager.game.party.achievementsList.indexOf(this.event.requirement.partyAchievement) == -1;
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

    select(change: EventCardIdentifier) {
        this.selected = change.selected;
        this.subSelections = change.subSelections;
        this.checks = change.checks;
    }

    cancel() {
        gameManager.stateManager.before('eventDraw.cancel');
        gameManager.game.eventDraw = undefined;
        gameManager.stateManager.after();
        ghsDialogClosingHelper(this.dialogRef);
    }

    accept(apply: boolean = true) {
        if (this.event && (this.selected != -1 || !apply)) {
            gameManager.stateManager.before('eventDraw.accept');
            gameManager.game.eventDraw = undefined;
            const result = gameManager.eventCardManager.applyEvent(this.event, this.selected, this.subSelections, this.checks, gameManager.game.scenario != undefined && gameManager.roundManager.firstRound, apply);
            gameManager.stateManager.after(settingsManager.settings.animations ? 1000 : 250);
            ghsDialogClosingHelper(this.dialogRef, result.length ? result : undefined);
        }
    }

    drawNew() {
        if (this.event) {
            const edition = this.event.edition;
            const type = this.event.type;
            const cardId = this.event.cardId;
            gameManager.stateManager.before('eventDraw.new');
            gameManager.eventCardManager.removeEvent(type, cardId);
            const deck = gameManager.game.party.eventDecks[type];
            if (deck) {
                this.event = gameManager.eventCardManager.getEventCardForEdition(edition, type, deck[0]);
                if (this.event) {
                    this.requirementWarning = false;
                    if (this.event.requirement && this.event.requirement.partyAchievement) {
                        this.requirementWarning = gameManager.game.party.achievementsList.indexOf(this.event.requirement.partyAchievement) == -1;
                    }
                }
            }
            gameManager.eventCardManager.addEvent(type, cardId);
            gameManager.stateManager.after();
        }
    }

    showEventCard(eventCard: EventCard) {
        this.dialog.open(EventCardDialogComponent, {
            panelClass: ['fullscreen-panel'],
            disableClose: true,
            data: { eventCard: eventCard, interactive: true, id: this.selected != -1 ? new EventCardIdentifier(eventCard.cardId, eventCard.edition, eventCard.type, this.selected, this.subSelections) : undefined }
        });
    }
}