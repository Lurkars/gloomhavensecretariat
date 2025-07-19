import { Dialog, DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, Inject } from "@angular/core";
import { Subscription } from "rxjs";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { EventCard, EventCardIdentifier } from "src/app/game/model/data/EventCard";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";
import { EventCardDialogComponent } from "../dialog/event-card-dialog";
import { EventCardDrawComponent } from "../draw/event-card-draw";
import { EventEffectsDialog } from "../../event-effects/event-effects";

@Component({
    standalone: false,
    selector: 'ghs-event-card-deck',
    templateUrl: './event-card-deck.html',
    styleUrls: ['./event-card-deck.scss']
})
export class EventCardDeckComponent {

    edition: string;
    type: string;
    types: string[] = [];
    upcomingCards: EventCard[] = [];
    newCards: EventCard[] = [];
    drawnCards: { identifier: EventCardIdentifier, card: EventCard | undefined }[] = [];

    filter: string = "";
    allTypes: boolean = false;
    allTypesToggle: boolean = false;
    resolved: boolean = false;

    settingsManager: SettingsManager = settingsManager;

    constructor(@Inject(DIALOG_DATA) data: { edition: string, type: string }, private dialogRef: DialogRef, private dialog: Dialog) {
        this.edition = data.edition;
        this.types = gameManager.eventCardManager.getEventTypesForEdition(this.edition).filter((type) => this.allTypes || gameManager.game.party.eventDecks[type] && gameManager.game.party.eventDecks[type].length);
        this.allTypesToggle = gameManager.eventCardManager.getEventTypesForEdition(this.edition).length != this.types.length;
        this.type = data.type || this.types[0];
        this.update();
        this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() });
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    update() {
        const deck = gameManager.eventCardManager.getEventCardsForEdition(this.edition, this.type);
        const current = gameManager.game.party.eventDecks[this.type] || [];
        this.upcomingCards = current.map((cardId) => deck.find((e) => e.cardId == cardId)).filter((e) => e).map((e) => e as EventCard);
        this.newCards = deck.filter((e) => current.indexOf(e.cardId) == -1 && !gameManager.game.party.eventCards.find((id) => id.type == this.type && id.cardId == e.cardId));
        this.drawnCards = gameManager.game.party.eventCards.filter((id) => deck.find((e) => e.edition == id.edition && e.type == id.type && e.cardId == id.cardId)).map((id) => { return { identifier: id, card: deck.find((card) => card.cardId == id.cardId) }; });
    }

    selectType(type: string) {
        this.type = type;
        this.update();
    }

    toggleAllTypes() {
        this.allTypes = !this.allTypes;
        this.types = gameManager.eventCardManager.getEventTypesForEdition(this.edition).filter((type) => this.allTypes || gameManager.game.party.eventDecks[type] && gameManager.game.party.eventDecks[type].length);
    }

    shuffle() {
        gameManager.stateManager.before("events.deck.shuffle", this.type);
        gameManager.eventCardManager.shuffleEvents(this.type);
        gameManager.stateManager.after();
    }

    dropUpcoming(event: CdkDragDrop<EventCard[]>) {
        gameManager.stateManager.before("events.deck.reorder", this.type);
        if (event.container == event.previousContainer) {
            moveItemInArray(gameManager.game.party.eventDecks[this.type] || [], event.previousIndex, event.currentIndex);
        } else {
            (gameManager.game.party.eventDecks[this.type] || []).splice(event.currentIndex < 0 ? 0 : event.currentIndex, 0, this.newCards[event.previousIndex].cardId);
        }
        gameManager.stateManager.after();
    }

    dropNew(event: CdkDragDrop<EventCard[]>) {
        gameManager.stateManager.before("events.deck.reorder", this.type);
        if (event.container == event.previousContainer) {
            moveItemInArray(this.newCards, event.previousIndex, event.currentIndex);
        } else {
            (gameManager.game.party.eventDecks[this.type] || []).splice(event.previousIndex, 1);
        }
        gameManager.stateManager.after();
    }

    dropDrawn(event: CdkDragDrop<EventCard[]>) {
        let eventCard: EventCard | undefined;
        if (event.previousContainer.id == 'new-list') {
            eventCard = this.newCards[event.previousIndex];
        } else if (event.previousContainer.id == 'upcoming-list') {
            eventCard = this.upcomingCards[event.previousIndex];
        }

        if (eventCard) {
            gameManager.stateManager.before("events.deck.markDrawn", eventCard.type, eventCard.cardId);
            gameManager.game.party.eventCards.splice(event.currentIndex, 0, new EventCardIdentifier(eventCard.cardId, eventCard.edition, eventCard.type, -1, []));
            gameManager.stateManager.after();
        }
    }

    removeCard(eventCard: EventCard) {
        gameManager.stateManager.before("events.deck.removeEvent", this.type, eventCard.cardId);
        gameManager.eventCardManager.removeEvent(eventCard.type, eventCard.cardId);
        gameManager.stateManager.after();
    }

    addCard(eventCard: EventCard) {
        gameManager.stateManager.before("events.deck.addEvent", this.type, eventCard.cardId);
        gameManager.eventCardManager.addEvent(eventCard.type, eventCard.cardId);
        gameManager.stateManager.after();
    }

    removeDrawn(id: EventCardIdentifier) {
        const index = gameManager.game.party.eventCards.indexOf(id);
        if (index != -1) {
            gameManager.stateManager.before("events.deck.removeDrawn", this.type, id.cardId);
            gameManager.game.party.eventCards.splice(index, 1);
            gameManager.stateManager.after();
        }
    }

    updateDrawnSelect(id: EventCardIdentifier, change: EventCardIdentifier | undefined = undefined) {
        const newSelected = (change ? change.selected : -1);
        const newSubSelections = change ? change.subSelections : [];
        if (id.selected != newSelected || id.subSelections.length != newSubSelections.length || id.subSelections.some((value) => newSubSelections.indexOf(value) == -1)) {
            gameManager.stateManager.before("events.deck.changeSelection", this.type, id.cardId);
            id.selected = newSelected;
            id.subSelections = newSubSelections;
            gameManager.stateManager.after(!change ? 750 : 0);
        }
    }

    showEventCard(eventCard: EventCard, id: EventCardIdentifier | undefined = undefined) {
        this.dialog.open(EventCardDialogComponent, {
            panelClass: ['fullscreen-panel'],
            disableClose: true,
            data: { eventCard: eventCard, interactive: true, id: id }
        });
    }

    drawEvent(cardId: string | undefined = undefined) {
        this.dialog.open(EventCardDrawComponent, {
            panelClass: ['dialog'],
            data: {
                edition: this.edition,
                type: this.type,
                cardId: cardId
            }
        }).closed.subscribe({
            next: (results: any) => {
                if (settingsManager.settings.eventsApply && results && results.length) {
                    this.dialog.open(EventEffectsDialog, {
                        panelClass: ['dialog'],
                        data: { eventResults: results }
                    });
                }
            }
        })
    }

    close() {
        ghsDialogClosingHelper(this.dialogRef);
    }
}