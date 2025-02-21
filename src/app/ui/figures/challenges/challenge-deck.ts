import { Dialog } from "@angular/cdk/dialog";
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GameState } from "src/app/game/model/Game";
import { ChallengeDeck } from "src/app/game/model/data/Challenges";
import { ChallengeDeckDialogComponent } from "./challenge-deck-dialog";
import { ChallengeDeckFullscreenComponent } from "./challenge-deck-fullscreen";

export class ChallengeDeckChange {

    deck: ChallengeDeck;
    type: string;
    values: (string | number | boolean)[];

    constructor(deck: ChallengeDeck, type: string, ...values: (string | number | boolean)[]) {
        this.deck = deck;
        this.type = type;
        this.values = values;
    }
}

@Component({
    standalone: false,
    selector: 'ghs-challenge-deck',
    templateUrl: './challenge-deck.html',
    styleUrls: ['./challenge-deck.scss']
})
export class ChallengeDeckComponent implements OnInit, OnDestroy, OnChanges {

    @Input('deck') deck!: ChallengeDeck;
    @Input() bottom: boolean = false;
    @Input() fullscreen: boolean = true;
    @Input() vertical: boolean = false;
    @Output('before') before: EventEmitter<ChallengeDeckChange> = new EventEmitter<ChallengeDeckChange>();
    @Output('after') after: EventEmitter<ChallengeDeckChange> = new EventEmitter<ChallengeDeckChange>();
    @Input() initTimeout: number = 1500;
    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    current: number = -1;
    internalDraw: number = -99;
    GameState = GameState;
    drawing: boolean = false;
    drawTimeout: any = null;
    queue: number = 0;
    queueTimeout: any = null;
    compact: boolean = false;
    disabled: boolean = false;
    drawDisabled: boolean = false;
    init: boolean = false;
    initServer: boolean = false;
    drawAvailable: number = 0;
    keepAvailable: number = 0;


    constructor(private element: ElementRef, private dialog: Dialog) {
        this.element.nativeElement.addEventListener('click', (event: any) => {
            let elements = document.elementsFromPoint(event.clientX, event.clientY);
            if (elements[0].classList.contains('deck') && elements.length > 2) {
                (elements[2] as HTMLElement).click();
            }
        })
    };

    ngOnInit(): void {
        this.current = this.deck.current;
        this.internalDraw = -99;
        this.compact = this.deck.cards.length > 0 && settingsManager.settings.automaticAttackModifierFullscreen && settingsManager.settings.portraitMode && (window.innerWidth < 800 || window.innerHeight < 400);

        const building = gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == 'town-hall' && buildingModel.level && buildingModel.state != 'wrecked');
        if (building) {
            this.drawAvailable = building.level;
            this.keepAvailable = Math.ceil(building.level / 2);
        }

        this.disabled = !gameManager.roundManager.firstRound || gameManager.game.state == GameState.next || !gameManager.game.scenario || !this.deck.cards.length;
        this.drawDisabled = this.disabled || this.deck.current - this.deck.finished >= this.drawAvailable;

        if (!this.init) {
            this.drawTimeout = setTimeout(() => {
                this.current = this.deck.current;
                this.drawTimeout = null;
                this.init = true;
            }, !settingsManager.settings.animations ? 0 : this.initTimeout)
        }

        this.uiChangeSubscription = gameManager.uiChange.subscribe({
            next: (fromServer: boolean) => { this.update(fromServer); }
        })

        window.addEventListener('resize', (event) => {
            this.compact = this.deck.cards.length > 0 && settingsManager.settings.automaticAttackModifierFullscreen && settingsManager.settings.portraitMode && (window.innerWidth < 800 || window.innerHeight < 400);
        });

        window.addEventListener('fullscreenchange', (event) => {
            this.compact = this.deck.cards.length > 0 && settingsManager.settings.automaticAttackModifierFullscreen && settingsManager.settings.portraitMode && (window.innerWidth < 800 || window.innerHeight < 400);
        });
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['deck']) {
            this.update()
        }
    }

    update(fromServer: boolean = false) {

        const building = gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == 'town-hall' && buildingModel.level && buildingModel.state != 'wrecked');
        if (building) {
            this.drawAvailable = building.level;
            this.keepAvailable = Math.ceil(building.level / 2);
        }

        this.disabled = !gameManager.roundManager.firstRound || gameManager.game.state == GameState.next || !gameManager.game.scenario || !this.deck.cards.length;
        this.drawDisabled = this.disabled || this.deck.current - this.deck.finished >= this.drawAvailable;

        if (this.initServer && gameManager.stateManager.wsState() != WebSocket.OPEN) {
            this.initServer = false;
        }

        if (!this.deck.active) {
            if (this.queueTimeout) {
                clearTimeout(this.queueTimeout);
                this.queueTimeout = null;
            }
            this.queue = 0;
            this.drawing = false;
            this.current = this.deck.current;
            this.initServer = gameManager.stateManager.wsState() == WebSocket.OPEN;
        } else if (this.init && (!fromServer || this.initServer)) {
            if (this.current < this.deck.current) {
                this.queue = Math.max(0, this.deck.current - this.current);
                if (!this.queueTimeout) {
                    this.queue--;
                    this.current++;
                    this.drawQueue(fromServer);
                }
            } else if (!this.queueTimeout || this.deck.current < this.current + this.queue) {
                if (this.queueTimeout) {
                    clearTimeout(this.queueTimeout);
                    this.queueTimeout = null;
                }
                this.queue = 0;
                this.drawing = false;
                this.current = this.deck.current;
            }
        } else {
            this.current = this.deck.current;
            if (fromServer && !this.initServer) {
                this.initServer = true;
            }
        }

        this.compact = settingsManager.settings.automaticAttackModifierFullscreen && settingsManager.settings.portraitMode && (window.innerWidth < 800 || window.innerHeight < 400);
    }

    drawQueue(fromServer: boolean) {
        this.drawing = true;
        this.element.nativeElement.getElementsByClassName('deck')[0].classList.add('drawing');
        this.queueTimeout = setTimeout(() => {
            this.drawing = false;
            this.queueTimeout = null;

            if (this.queue > 0) {
                this.queue--;
                this.current++;
                this.drawQueue(fromServer);
            } else {
                this.element.nativeElement.getElementsByClassName('deck')[0].classList.remove('drawing');
                if (this.queue < 0) {
                    this.queue = 0;
                }
            }
        }, !settingsManager.settings.animations ? 0 : (this.vertical ? 1050 : 1850));
    }

    draw(event: any) {
        if (this.compact && this.fullscreen) {
            this.openFullscreen(event);
        } else if (!this.drawDisabled && this.deck.cards.length > 0) {
            if (!this.drawTimeout && this.deck.current < (this.deck.cards.length - (this.queue == 0 ? 0 : 1))) {
                this.drawTimeout = setTimeout(() => {
                    this.before.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.draw'));
                    gameManager.challengesManager.drawCard(this.deck);
                    this.after.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.draw'));
                    this.drawTimeout = null;
                }, !settingsManager.settings.animations ? 0 : 150)
            }
        } else {
            this.dialog.open(ChallengeDeckDialogComponent, {
                panelClass: ['dialog'],
                data: {
                    deck: this.deck,
                    before: this.before,
                    after: this.after
                }
            });
        }
    }

    openFullscreen(event: any) {
        if (this.fullscreen) {
            this.dialog.open(ChallengeDeckFullscreenComponent, {
                panelClass: ['fullscreen-panel'],
                backdropClass: ['fullscreen-backdrop'],
                data: {
                    deck: this.deck,
                    before: this.before,
                    after: this.after
                }
            });

            event.preventDefault();
            event.stopPropagation();
        }
    }

    clickCard(index: number, event: any) {
        if (this.disabled) {
            this.open(event);
        } else if (index <= this.current) {
            this.before.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.toggle', index));
            gameManager.challengesManager.toggleKeep(this.deck, index, this.keepAvailable);
            this.after.emit(new ChallengeDeckChange(this.deck, 'challengeDeck.toggle', index));
        }
    }

    doubleClickCard(index: number, event: any) {
        if (!this.drawing || index > this.current) {
            this.open(event);
        }
    }

    open(event: any) {
        if (this.deck.cards.length > 0 && this.fullscreen && settingsManager.settings.automaticAttackModifierFullscreen && settingsManager.settings.portraitMode && (window.innerWidth < 800 || window.innerHeight < 400)) {
            this.openFullscreen(event);
        } else {
            this.dialog.open(ChallengeDeckDialogComponent, {
                panelClass: ['dialog'],
                data: {
                    deck: this.deck,
                    before: this.before,
                    after: this.after
                }
            });
        }
        event.preventDefault();
        event.stopPropagation();
    }
}