import { Dialog } from "@angular/cdk/dialog";
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { LootManager } from "src/app/game/businesslogic/LootManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { appliableLootTypes, Loot, LootDeck, LootType } from "src/app/game/model/data/Loot";
import { LootApplyDialogComponent } from "./loot-apply-dialog";
import { LootDeckDialogComponent } from "./loot-deck-dialog";
import { LootDeckFullscreenComponent } from "./loot-deck-fullscreen";
import { Subscription } from "rxjs";
import { LootRandomItemDialogComponent } from "./random-item/random-item-dialog";
import { ItemData } from "src/app/game/model/data/ItemData";
import { AdditionalIdentifier, Identifier } from "src/app/game/model/data/Identifier";

export class LootDeckChange {

    deck: LootDeck;
    type: string;
    values: (string | number | boolean)[];

    constructor(deck: LootDeck, type: string, ...values: (string | number | boolean)[]) {
        this.deck = deck;
        this.type = type;
        this.values = values;
    }

}

@Component({
    standalone: false,
    selector: 'ghs-loot-deck',
    templateUrl: './loot-deck.html',
    styleUrls: ['./loot-deck.scss']
})
export class LootDeckComponent implements OnInit, OnDestroy, OnChanges {

    @Input('deck') deck!: LootDeck;
    @Input() bottom: boolean = false;
    @Input() characters: boolean = true;
    @Input() fullscreen: boolean = true;
    @Input() vertical: boolean = false;
    @Input() standalone: boolean = false;
    @Output('before') before: EventEmitter<LootDeckChange> = new EventEmitter<LootDeckChange>();
    @Output('after') after: EventEmitter<LootDeckChange> = new EventEmitter<LootDeckChange>();
    @Input() initTimeout: number = 1500;
    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    lootManager: LootManager = gameManager.lootManager;
    current: number = -1;
    internalDraw: number = -99;
    LootType = LootType;
    GameState = GameState;
    drawing: boolean = false;
    drawTimeout: any = null;
    queue: number = 0;
    queueTimeout: any = null;
    compact: boolean = false;
    disabled: boolean = false;
    init: boolean = false;
    initServer: boolean = false;

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
        this.disabled = !this.standalone && gameManager.game.state == GameState.draw;

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
        this.disabled = !this.standalone && gameManager.game.state == GameState.draw;

        if (this.initServer && gameManager.stateManager.wsState() != WebSocket.OPEN) {
            this.initServer = false;
        }

        if (!this.deck.active && !this.standalone) {
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
            const currentIndex = this.current;
            const loot = this.deck.cards[currentIndex];

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

            if (!fromServer && loot && appliableLootTypes.indexOf(loot.type) != null && settingsManager.settings.applyLoot && !this.standalone && gameManager.game.figures.find((figure) => figure instanceof Character && gameManager.gameplayFigure(figure))) {
                let activeCharacter = gameManager.game.figures.find((figure) => figure instanceof Character && figure.active) as Character;
                if ((!activeCharacter || settingsManager.settings.alwaysLootApplyDialog)) {
                    const dialog = this.dialog.open(LootApplyDialogComponent, {
                        panelClass: ['dialog'],
                        data: { loot: loot }
                    });

                    dialog.closed.subscribe({
                        next: (name) => {
                            if (name) {
                                const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.name == name);
                                if (character instanceof Character) {
                                    this.applyLoot(character, loot, currentIndex);
                                }
                            }
                        }
                    })
                } else if (activeCharacter) {
                    this.applyLoot(activeCharacter, loot, currentIndex);
                }
            }

        }, !settingsManager.settings.animations ? 0 : (this.vertical ? 1050 : 1850));
    }

    applyLoot(character: Character, loot: Loot, index: number) {
        if (character.lootCards.indexOf(index) == -1) {
            gameManager.stateManager.before(loot.type == LootType.random_item ? "lootRandomItem" : "addResource", gameManager.characterManager.characterName(character), "game.loot." + loot.type, this.lootManager.getValue(loot));
            const result = gameManager.lootManager.applyLoot(loot, character, index);
            gameManager.stateManager.after();
            if (result) {
                this.dialog.open(LootRandomItemDialogComponent, {
                    panelClass: ['dialog'],
                    data: { item: result, character: character }
                }).closed.subscribe({
                    next: (result) => {
                        if (result) {
                            const item = result as ItemData;
                            gameManager.stateManager.before("lootRandomItem", item.id, item.edition, item.name, gameManager.characterManager.characterName(character));
                            let itemIdentifier: Identifier = new Identifier('' + item.id, item.edition);
                            gameManager.itemManager.addItemCount(item);
                            if (character.lootCards.indexOf(index) == -1) {
                                character.lootCards.push(index);
                                character.lootCards.sort((a, b) => a - b);
                            }
                            if (character.progress.items.find((existing) => existing.name == '' + item.id && existing.edition == item.edition) != undefined) {
                                character.progress.gold += gameManager.itemManager.itemSellValue(item);
                            } else {
                                character.progress.items.push(itemIdentifier);
                                character.progress.equippedItems.push(new AdditionalIdentifier(itemIdentifier.name, itemIdentifier.edition, undefined, "loot-random-item"));
                            }
                            gameManager.stateManager.after();
                        } else {
                            character.lootCards = character.lootCards.filter((index) => index != index);
                        }
                    }
                })
            }
        }
    }

    draw(event: any, forceDraw: boolean = false) {
        if (this.compact && this.fullscreen && !forceDraw) {
            this.openFullscreen(event);
        } else if (!this.disabled && this.deck.cards.length > 0) {
            if (!this.drawTimeout && this.deck.current < (this.deck.cards.length - (this.queue == 0 ? 0 : 1))) {
                const activeCharacter = gameManager.game.figures.find((figure) => figure instanceof Character && figure.active);
                this.drawTimeout = setTimeout(() => {
                    this.before.emit(new LootDeckChange(this.deck, 'lootDeckDraw'));
                    if (!settingsManager.settings.alwaysLootApplyDialog && activeCharacter instanceof Character) {
                        const result = gameManager.lootManager.drawCard(this.deck, activeCharacter);
                        if (result) {
                            setTimeout(() => {
                                this.dialog.open(LootRandomItemDialogComponent, {
                                    panelClass: ['dialog'],
                                    data: { item: result, character: activeCharacter }
                                }).closed.subscribe({
                                    next: (result) => {
                                        if (result) {
                                            const item = result as ItemData;
                                            gameManager.stateManager.before("lootRandomItem", item.id, item.edition, item.name, gameManager.characterManager.characterName(activeCharacter));
                                            let itemIdentifier: Identifier = new Identifier('' + item.id, item.edition);
                                            gameManager.itemManager.addItemCount(item);
                                            if (activeCharacter.lootCards.indexOf(this.current) == -1) {
                                                activeCharacter.lootCards.push(this.current);
                                                activeCharacter.lootCards.sort((a, b) => a - b);
                                            }
                                            if (activeCharacter.progress.items.find((existing) => existing.name == '' + item.id && existing.edition == item.edition) != undefined) {
                                                activeCharacter.progress.gold += gameManager.itemManager.itemSellValue(item);
                                            } else {
                                                activeCharacter.progress.items.push(itemIdentifier);
                                                activeCharacter.progress.equippedItems.push(new AdditionalIdentifier(itemIdentifier.name, itemIdentifier.edition, undefined, "loot-random-item"));
                                            }
                                            gameManager.stateManager.after();
                                        } else {
                                            activeCharacter.lootCards = activeCharacter.lootCards.filter((index) => index != this.current);
                                        }
                                    }
                                })
                            }, !settingsManager.settings.animations ? 0 : (this.vertical ? 1050 : 1850))
                        }
                    } else {
                        gameManager.lootManager.drawCard(this.deck, undefined);
                    }
                    this.after.emit(new LootDeckChange(this.deck, 'lootDeckDraw'));
                    this.drawTimeout = null;
                }, !settingsManager.settings.animations ? 0 : 150)
            }
        } else {
            this.dialog.open(LootDeckDialogComponent, {
                panelClass: ['dialog'],
                data: {
                    deck: this.deck,
                    characters: this.characters,
                    before: this.before,
                    after: this.after,
                    apply: !this.standalone
                }
            });
        }
    }

    openFullscreen(event: any) {
        if (this.fullscreen) {
            this.dialog.open(LootDeckFullscreenComponent, {
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
        if (this.deck.cards.length > 0 && gameManager.game.state == GameState.next && this.fullscreen && settingsManager.settings.automaticAttackModifierFullscreen && settingsManager.settings.portraitMode && (window.innerWidth < 800 || window.innerHeight < 400)) {
            this.openFullscreen(event);
        } else {
            this.dialog.open(LootDeckDialogComponent, {
                panelClass: ['dialog'],
                data: {
                    deck: this.deck,
                    characters: this.characters,
                    before: this.before,
                    after: this.after,
                    apply: !this.standalone
                }
            });
        }
        event.preventDefault();
        event.stopPropagation();
    }
}