import { Dialog } from "@angular/cdk/dialog";
import { Component, ElementRef, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { LootManager } from "src/app/game/businesslogic/LootManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { appliableLootTypes, LootDeck, LootType } from "src/app/game/model/Loot";
import { LootApplyDialogComponent } from "./loot-apply-dialog";
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
    @Input() characters: boolean = true;
    @Input() fullscreen: boolean = true;
    @Input() vertical: boolean = false;
    @Input() standalone: boolean = false;
    @Output('before') before: EventEmitter<LootDeckChange> = new EventEmitter<LootDeckChange>();
    @Output('after') after: EventEmitter<LootDeckChange> = new EventEmitter<LootDeckChange>();
    gameManager: GameManager = gameManager;
    lootManager: LootManager = gameManager.lootManager;
    current: number = -1;
    internalDraw: number = -99;
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
        this.internalDraw = -99;
        gameManager.uiChange.subscribe({
            next: () => {
                if (this.internalDraw == -99 && this.current < this.deck.current) {
                    this.current = this.deck.current;
                    this.internalDraw = this.deck.current;
                } else if (this.internalDraw != -99) {
                    if (this.internalDraw < this.deck.current) {
                        if (!this.queueTimeout) {
                            this.current++;
                            this.update(false);
                        } else {
                            this.queue = this.queue + Math.max(0, this.deck.current - this.internalDraw);
                        }
                        this.internalDraw = this.deck.current;
                    } else if (!this.queueTimeout || this.deck.current < this.current + this.queue) {
                        if (this.queueTimeout) {
                            clearTimeout(this.queueTimeout);
                            this.queueTimeout = null;
                        }
                        this.queue = 0;
                        this.drawing = false;
                        this.current = this.deck.current;
                        this.internalDraw = this.deck.current;
                    }
                }
            }
        })
    }

    update(local: boolean = true) {
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

            const loot = this.deck.cards[this.deck.current];
            if (local && loot && appliableLootTypes.indexOf(loot.type) != null && settingsManager.settings.applyLoot && gameManager.game.figures.find((figure) => figure instanceof Character && gameManager.gameplayFigure(figure)) && (!gameManager.game.figures.find((figure) => figure instanceof Character && figure.active) || settingsManager.settings.alwaysLootApplyDialog)) {
                const dialog = this.dialog.open(LootApplyDialogComponent, {
                    panelClass: 'dialog',
                    data: loot
                });

                dialog.closed.subscribe({
                    next: (name) => {
                        if (name) {
                            const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.name == name);
                            if (character instanceof Character) {
                                gameManager.stateManager.before("addResource", "data.character." + character.name, "game.loot." + loot.type, this.lootManager.getValue(loot) + '');
                                character.lootCards = character.lootCards || [];
                                if (loot.type == LootType.money || loot.type == LootType.special1 || loot.type == LootType.special2) {
                                    character.loot += gameManager.lootManager.getValue(loot);
                                }
                                character.lootCards.push(this.deck.current);
                                gameManager.stateManager.after();
                            }
                        }
                    }
                })
            }
        }, settingsManager.settings.disableAnimations ? 0 : 1850);
    }

    draw(event: any) {
        if (!this.drawing && this.deck.cards.length > 0 && this.fullscreen && settingsManager.settings.automaticAttackModifierFullscreen && (window.innerWidth < 800 || window.innerHeight < 400)) {
            this.openFullscreen(event);
        } else if ((this.standalone || gameManager.game.state == GameState.next) && this.deck.cards.length > 0) {
            if (!this.drawTimeout && this.deck.current < this.deck.cards.length - 1) {
                this.drawTimeout = setTimeout(() => {
                    this.before.emit(new LootDeckChange(this.deck, 'lootDeckDraw'));
                    gameManager.lootManager.drawCard(this.deck); this.internalDraw = this.deck.current;
                    this.after.emit(new LootDeckChange(this.deck, 'lootDeckDraw'));
                    if (this.drawing && this.deck.current + this.queue < this.deck.cards.length) {
                        this.queue++;
                    }
                    if (!this.queueTimeout) {
                        this.update();
                    }
                    this.drawTimeout = null;
                }, settingsManager.settings.disableAnimations ? 0 : 150)
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

    getCharacter(index: number): string {
        if (this.characters) {
            const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.lootCards && figure.lootCards.indexOf(index) != -1);
            if (character) {
                return character.name;
            }
        }
        return "";
    }

    open(event: any) {
        if (this.deck.cards.length > 0 && gameManager.game.state == GameState.next && this.fullscreen && settingsManager.settings.automaticAttackModifierFullscreen && (window.innerWidth < 800 || window.innerHeight < 400)) {
            this.openFullscreen(event);
        } else {
            this.dialog.open(LootDeckDialogComponent, {
                panelClass: 'dialog',
                data: {
                    deck: this.deck,
                    characters: this.characters,
                    before: this.before,
                    after: this.after
                }
            });
        }
        event.preventDefault();
        event.stopPropagation();
    }
}