import { Dialog } from "@angular/cdk/dialog";
import { Component, ElementRef, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { LootManager } from "src/app/game/businesslogic/LootManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GameState } from "src/app/game/model/Game";
import { LootDeck, LootType } from "src/app/game/model/Loot";
import { LootDeckDialogComponent } from "./loot-deck-dialog";
import { LootDeckFullscreenComponent } from "./loot-deck-fullscreen";

export class LootDeckChange {

    deck: LootDeck;
    type: string;
    values: string[];

    constructor(deck: LootDeck, type: string, ...values: string[]) {
        this.deck = deck;
        this.type = type;
        this.values = values;
    }

}

@Component({
    selector: 'ghs-loot-deck',
    templateUrl: './loot-deck.html',
    styleUrls: ['./loot-deck.scss']
})
export class LootDeckComponent implements OnInit {

    @Input('deck') deck!: LootDeck;
    @Input() bottom: boolean = false;
    @Input() fullscreen: boolean = true;
    @Input() vertical: boolean = false;
    @Input() standalone: boolean = false;
    @Output('before') before: EventEmitter<LootDeckChange> = new EventEmitter<LootDeckChange>();
    @Output('after') after: EventEmitter<LootDeckChange> = new EventEmitter<LootDeckChange>();
    gameManager: GameManager = gameManager;
    lootManager: LootManager = gameManager.lootManager;
    current: number = -1;
    LootType = LootType;
    GameState = GameState;
    drawing: boolean = false;
    drawTimeout: any = null;
    queue: number = 0;
    queueTimeout: any = null;

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
        gameManager.uiChange.subscribe({
            next: () => {
                if (!this.queueTimeout || this.deck.current < this.current + this.queue) {
                    if (this.queueTimeout) {
                        clearTimeout(this.queueTimeout);
                        this.queueTimeout = null;
                    }
                    this.queue = 0;
                    this.drawing = false;
                    this.current = this.deck.current;
                }
            }
        })
    }

    update() {
        this.drawing = true;
        this.element.nativeElement.getElementsByClassName('deck')[0].classList.add('drawing');
        this.queueTimeout = setTimeout(() => {
            this.drawing = false;
            this.queueTimeout = null;
            if (this.queue > 0) {
                this.queue--;
                this.current++;
                this.update();
            } else {
                this.element.nativeElement.getElementsByClassName('deck')[0].classList.remove('drawing');
            }
        }, 1850);
    }

    draw(event: any) {
        if (!this.drawing && this.deck.cards.length > 0 && this.fullscreen && settingsManager.settings.automaticAttackModifierFullscreen && (window.innerWidth < 800 || window.innerHeight < 400)) {
            this.openFullscreen(event);
        } else if ((this.standalone || gameManager.game.state == GameState.next) && this.deck.cards.length > 0) {
            if (!this.drawTimeout && this.deck.current < this.deck.cards.length - 1) {
                this.drawTimeout = setTimeout(() => {
                    this.before.emit(new LootDeckChange(this.deck, 'lootDeckDraw'));
                    this.lootManager.drawCard(this.deck);
                    this.after.emit(new LootDeckChange(this.deck, 'lootDeckDraw'));
                    if (this.drawing && this.deck.current + this.queue < this.deck.cards.length) {
                        this.queue++;
                    }
                    if (!this.queueTimeout) {
                        this.update();
                    }
                    this.drawTimeout = null;
                }, 150)
            }
        } else if (!this.drawing) {
            this.open(event);
        }
    }

    openFullscreen(event: any) {
        if (this.fullscreen) {
            this.dialog.open(LootDeckFullscreenComponent, {
                backdropClass: 'fullscreen-backdrop',
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
        if (!this.drawing || index > this.current) {
            this.open(event);
        }
    }

    open(event: any) {
        if (this.deck.cards.length > 0 && gameManager.game.state == GameState.next && this.fullscreen && settingsManager.settings.automaticAttackModifierFullscreen && (window.innerWidth < 800 || window.innerHeight < 400)) {
            this.openFullscreen(event);
        } else {
            this.dialog.open(LootDeckDialogComponent, {
                panelClass: 'dialog',
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