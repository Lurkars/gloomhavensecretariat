import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, ElementRef, EventEmitter, Inject, OnInit, ViewChild } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GameState } from "src/app/game/model/Game";
import { ChallengeCard, ChallengeDeck } from "src/app/game/model/data/Challenges";
import { ChallengeDeckChange } from "./challenge-deck";


@Component({
    standalone: false,
    selector: 'ghs-challenges-dialog',
    templateUrl: './challenge-deck-dialog.html',
    styleUrls: ['./challenge-deck-dialog.scss']
})
export class ChallengeDeckDialogComponent implements OnInit {

    @ViewChild('menu') menuElement!: ElementRef;
    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    GameState = GameState;
    reveal: number = 0;
    edit: boolean = false;
    apply: boolean = true;
    maxHeight: string = "";

    deck: ChallengeDeck;
    before: EventEmitter<ChallengeDeckChange>;
    after: EventEmitter<ChallengeDeckChange>;

    current: number = -1;
    drawing: boolean = false;

    disabled: boolean = false;
    drawDisabled: boolean = false;
    drawAvailable: number = 0;
    keepAvailable: number = 0;

    upcomingCards: ChallengeCard[] = [];
    discardedCards: ChallengeCard[] = [];
    finishedCards: ChallengeCard[] = [];
    removedCards: ChallengeCard[] = [];

    constructor(@Inject(DIALOG_DATA) public data: { deck: ChallengeDeck, before: EventEmitter<ChallengeDeckChange>, after: EventEmitter<ChallengeDeckChange> }, public dialogRef: DialogRef) {
        this.deck = data.deck;
        this.before = data.before;
        this.after = data.after;
    };

    ngOnInit(): void {
        setTimeout(() => {
            this.maxHeight = 'calc(80vh - ' + this.menuElement.nativeElement.offsetHeight + 'px)';
        }, !settingsManager.settings.animations ? 0 : 250);
        this.update();
        this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() });
        this.edit = !gameManager.game.scenario;
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    update() {
        this.upcomingCards = this.deck.cards.filter((card, index) => index > this.deck.current);
        this.discardedCards = this.deck.cards.filter((card, index) => index <= this.deck.current && index > this.deck.finished).reverse();
        this.finishedCards = this.deck.cards.filter((card, index) => index <= this.deck.finished).reverse();

        this.removedCards = gameManager.challengesData(gameManager.game.edition).filter((challengeCard) => this.deck.cards.find((other) => other.cardId == challengeCard.cardId) == undefined);

        const building = gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == 'town-hall' && buildingModel.level && buildingModel.state != 'wrecked');
        if (building) {
            this.drawAvailable = building.level;
            this.keepAvailable = Math.ceil(building.level / 2);
        }


        this.disabled = !gameManager.roundManager.firstRound || gameManager.game.state == GameState.next || !gameManager.game.scenario || !this.deck.cards.length;
        this.drawDisabled = this.disabled || this.deck.current - this.deck.finished >= this.drawAvailable;
    }


    toggleEdit() {
        this.edit = !this.edit;
        setTimeout(() => {
            this.maxHeight = 'calc(80vh - ' + this.menuElement.nativeElement.offsetHeight + 'px)';
        }, 0);
    }

    shuffle(upcoming: boolean = false): void {
        this.before.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.shuffle' + (upcoming ? "Upcoming" : "")));
        gameManager.challengesManager.shuffleDeck(this.deck, upcoming);
        this.after.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.shuffle' + (upcoming ? "Upcoming" : "")));
        this.update();
    }

    clear(keep: boolean = true): void {
        this.before.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.clear'));
        gameManager.challengesManager.clearDrawn(this.deck, keep);
        this.after.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.clear'));
        this.update();
    }

    drawCard() {
        if (!this.disabled && this.deck.cards.length > 0) {
            this.before.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.draw'));
            gameManager.challengesManager.drawCard(this.deck);
            this.after.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.draw'));
        }
    }

    dropUpcoming(event: CdkDragDrop<ChallengeCard[]>) {
        this.before.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.reorder'));
        let offset = 0;
        let prev = 0;
        let cur = 0;
        if (event.container == event.previousContainer) {
            offset = this.deck.current + 1;
            prev = event.previousIndex + offset;
            cur = event.currentIndex + offset;
            moveItemInArray(this.deck.cards, prev, cur);
        } else if (event.previousContainer.id == "listFinished") {
            offset = this.deck.finished;
            prev = offset - event.previousIndex;
            cur = event.currentIndex + this.deck.current;
            this.deck.finished = this.deck.finished - 1;
            this.deck.current = this.deck.current - 1;
            moveItemInArray(this.deck.cards, prev, cur);
        } else {
            offset = this.deck.current;
            prev = offset - event.previousIndex;
            cur = event.currentIndex + offset;
            this.deck.current = this.deck.current - 1;
            moveItemInArray(this.deck.cards, prev, cur);
        }

        this.after.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.reorder'));
        this.update();
    }

    dropDiscarded(event: CdkDragDrop<ChallengeCard[]>) {
        this.before.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.reorder'));
        let offset = 0;
        let prev = 0;
        let cur = 0;
        if (event.container == event.previousContainer) {
            offset = this.deck.current;
            prev = offset - event.previousIndex;
            cur = offset - event.currentIndex;
            moveItemInArray(this.deck.cards, prev, cur);
        } else if (event.previousContainer.id == "listFinished") {
            offset = this.deck.finished;
            prev = offset - event.previousIndex;
            this.deck.finished = this.deck.finished - 1;
            cur = this.deck.current - event.currentIndex;
            moveItemInArray(this.deck.cards, prev, cur);
        } else {
            this.deck.current = this.deck.current + 1;
            offset = this.deck.current;
            prev = offset + event.previousIndex;
            cur = offset - event.currentIndex;
            moveItemInArray(this.deck.cards, prev, cur);
        }

        this.after.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.reorder'));
        this.update();
    }

    dropFinished(event: CdkDragDrop<ChallengeCard[]>) {
        this.before.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.reorder'));
        let offset = 0;
        let prev = 0;
        let cur = 0;
        if (event.container == event.previousContainer) {
            offset = this.deck.finished;
            prev = offset - event.previousIndex;
            cur = offset - event.currentIndex;
            moveItemInArray(this.deck.cards, prev, cur);
        } else if (event.previousContainer.id == "listDiscarded") {
            this.deck.finished = this.deck.finished + 1;
            offset = this.deck.finished;
            prev = this.deck.current - event.previousIndex;
            cur = offset - event.currentIndex;
            moveItemInArray(this.deck.cards, prev, cur);
        } else {
            this.deck.finished = this.deck.finished + 1;
            this.deck.current = this.deck.current + 1;
            offset = this.deck.finished;
            prev = this.deck.current + event.previousIndex;
            cur = offset - event.currentIndex;
            moveItemInArray(this.deck.cards, prev, cur);
        }

        this.after.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.reorder'));
        this.update();
    }

    toggleKeep(index: number, force: boolean = false) {
        if (index <= this.deck.current && (force || !this.edit && gameManager.game.scenario && gameManager.roundManager.firstRound && gameManager.game.state == GameState.draw)) {
            this.before.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.toggle', index));
            gameManager.challengesManager.toggleKeep(this.deck, index, this.keepAvailable);
            this.after.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.toggle', index));
        }
    }

    remove(index: number) {
        this.before.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.removeCard', index));
        if (index <= this.deck.current) {
            this.deck.current--;
            this.current = this.deck.current;
        }
        this.deck.cards.splice(index, 1);
        this.after.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.removeCard', index));
        this.update();
    }

    restoreCard(index: number) {
        const card = this.removedCards[index];
        if (card) {
            this.before.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.restoreCard', card.cardId));
            index = Math.floor(Math.random() * (this.deck.cards.length - this.deck.current)) + this.deck.current + 1;
            this.deck.cards.splice(index, 0, card);
            this.after.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.restoreCard'));
            this.update();
        }
    }
}