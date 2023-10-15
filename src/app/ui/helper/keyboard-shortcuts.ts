import { Dialog } from '@angular/cdk/dialog';
import { Directive, Input, OnDestroy, OnInit } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { Objective } from 'src/app/game/model/Objective';
import { AttackModifierDeck } from 'src/app/game/model/data/AttackModifier';
import { FooterComponent } from '../footer/footer';
import { SummonState } from 'src/app/game/model/Summon';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { EntityMenuDialogComponent } from '../figures/entity-menu/entity-menu-dialog';


export type KEYBOARD_SHORTCUT_EVENTS = "undo" | "zoom" | "round" | "am" | "loot" | "active" | "element" | "absent" | "select";

@Directive({
    selector: '[ghs-keyboard-shortcuts]'
})
export class KeyboardShortcuts implements OnInit, OnDestroy {

    @Input() footer: FooterComponent | undefined;
    @Input() allowed: KEYBOARD_SHORTCUT_EVENTS[] = ["undo", "zoom"];
    scrollTimeout: any = null;
    zoomInterval: any = null;
    currentZoom: number = 0;
    dialogOpen: boolean = false;
    keydown: any;
    keyup: any;
    timeout: any;

    constructor(private dialog: Dialog) {
        this.dialog.afterOpened.subscribe({ next: () => this.dialogOpen = true });
        this.dialog.afterAllClosed.subscribe({ next: () => this.dialogOpen = false });
    }

    applySelect() {
        const entities = gameManager.entityManager.getIndexedEntities();
        if (gameManager.stateManager.keyboardSelect > 0 && gameManager.stateManager.keyboardSelect <= entities.length) {
            this.dialog.open(EntityMenuDialogComponent, {
                panelClass: 'dialog',
                data: {
                    entity: entities[gameManager.stateManager.keyboardSelect - 1].entity,
                    figure: entities[gameManager.stateManager.keyboardSelect - 1].figure,
                    entityIndexKey: true
                }
            })
            gameManager.stateManager.keyboardSelecting = false;
        }
        gameManager.stateManager.keyboardSelect = -1;
    }

    ngOnInit(): void {
        this.currentZoom = settingsManager.settings.zoom;

        gameManager.uiChange.subscribe({ next: () => this.currentZoom = settingsManager.settings.zoom })

        this.keydown = window.addEventListener('keydown', (event: KeyboardEvent) => {
            if (!event.altKey && !event.metaKey && (!window.document.activeElement || window.document.activeElement.tagName != 'INPUT' && window.document.activeElement.tagName != 'SELECT' && window.document.activeElement.tagName != 'TEXTAREA')) {
                if (gameManager.stateManager.keyboardSelecting) {
                    if (event.key === 'Escape' || event.key === 's') {
                        gameManager.stateManager.keyboardSelect = -1;
                        gameManager.stateManager.keyboardSelecting = false;
                    } else if (event.key === 'Enter') {
                        this.applySelect();
                    } else if (event.key in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
                        const entities = gameManager.entityManager.getIndexedEntities();
                        const keyNumber = +event.key;
                        if (this.timeout) {
                            clearTimeout(this.timeout);
                            this.timeout = undefined;

                            const combined: number = gameManager.stateManager.keyboardSelect * 10 + keyNumber;
                            gameManager.stateManager.keyboardSelect = combined;
                            this.applySelect();
                        } else if (keyNumber * 10 < entities.length) {
                            gameManager.stateManager.keyboardSelect = keyNumber;
                            this.timeout = setTimeout(() => {
                                this.applySelect();
                            }, 1000);
                        } else {
                            gameManager.stateManager.keyboardSelect = keyNumber;
                            this.applySelect();
                        }
                    }
                    event.preventDefault();
                    event.stopPropagation();
                } else if ((!this.dialogOpen || this.allowed.indexOf('undo') != -1) && event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'z') {
                    gameManager.stateManager.undo();
                    event.preventDefault();
                } else if ((!this.dialogOpen || this.allowed.indexOf('undo') != -1) && event.ctrlKey && !event.shiftKey && event.key === 'y' || event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'z') {
                    gameManager.stateManager.redo();
                    event.preventDefault();
                } else if ((!this.dialogOpen || this.allowed.indexOf('zoom') != -1) && !event.ctrlKey && !event.shiftKey && !this.zoomInterval && (event.key === 'ArrowUp' || event.key === '+')) {
                    this.zoom(-1);
                    this.zoomInterval = setInterval(() => {
                        this.zoom(-1);
                    }, 30);
                    event.preventDefault();
                } else if ((!this.dialogOpen || this.allowed.indexOf('zoom') != -1) && !event.ctrlKey && !event.shiftKey && !this.zoomInterval && (event.key === 'ArrowDown' || event.key === '-')) {
                    this.zoom(1);
                    this.zoomInterval = setInterval(() => {
                        this.zoom(1);
                    }, 30);
                    event.preventDefault();
                } else if ((!this.dialogOpen || this.allowed.indexOf('zoom') != -1) && event.ctrlKey && !event.shiftKey && !this.zoomInterval && event.key.toLowerCase() === 'r') {
                    this.currentZoom = 100;
                    settingsManager.setZoom(this.currentZoom);
                    document.body.style.setProperty('--ghs-factor', this.currentZoom + '');
                    event.preventDefault();
                } else if ((!this.dialogOpen || this.allowed.indexOf('round') != -1) && this.footer && !event.ctrlKey && !event.shiftKey && !this.zoomInterval && event.key.toLowerCase() === 'n') {
                    if (!this.footer.disabled()) {
                        this.footer.next();
                    }
                } else if ((!this.dialogOpen || this.allowed.indexOf('am') != -1) && gameManager.game.state == GameState.next && !event.ctrlKey && !event.shiftKey && !this.zoomInterval && event.key.toLowerCase() === 'm') {
                    const activeFigure = gameManager.game.figures.find((figure) => figure.active);
                    let deck: AttackModifierDeck | undefined = undefined;
                    if (!activeFigure || activeFigure instanceof Monster && (!activeFigure.isAlly && !activeFigure.isAllied || !gameManager.fhRules() && !settingsManager.settings.alwaysAllyAttackModifierDeck || !settingsManager.settings.allyAttackModifierDeck)) {
                        gameManager.stateManager.before("updateAttackModifierDeck.draw", "monster");
                        deck = gameManager.game.monsterAttackModifierDeck;
                    } else if (activeFigure instanceof Monster) {
                        gameManager.stateManager.before("updateAttackModifierDeck.draw", "ally");
                        deck = gameManager.game.allyAttackModifierDeck;
                    } else if (activeFigure instanceof Character) {
                        if (settingsManager.settings.characterAttackModifierDeck) {
                            if (activeFigure.attackModifierDeckVisible) {
                                gameManager.stateManager.before("updateAttackModifierDeck.draw", "data.character." + activeFigure.name);
                                deck = activeFigure.attackModifierDeck;
                            } else {
                                activeFigure.attackModifierDeckVisible = true;
                            }
                        } else {
                            gameManager.stateManager.before("updateAttackModifierDeck.draw", "monster");
                            deck = gameManager.game.monsterAttackModifierDeck;
                        }
                    }

                    if (deck) {
                        deck.active = true;
                        gameManager.attackModifierManager.drawModifier(deck);
                        gameManager.stateManager.after();
                    }
                    event.preventDefault();
                } else if ((!this.dialogOpen || this.allowed.indexOf('loot') != -1) && gameManager.game.state == GameState.next && !event.ctrlKey && !event.shiftKey && !this.zoomInterval && event.key.toLowerCase() === 'l' && settingsManager.settings.lootDeck && gameManager.game.lootDeck.cards.length > 0) {
                    gameManager.stateManager.before('lootDeckDraw');
                    gameManager.game.lootDeck.active = true;
                    const activeCharacter = gameManager.game.figures.find((figure) => figure instanceof Character && figure.active);
                    if (!settingsManager.settings.alwaysLootApplyDialog && activeCharacter instanceof Character) {
                        gameManager.lootManager.drawCard(gameManager.game.lootDeck, activeCharacter);
                    } else {
                        gameManager.lootManager.drawCard(gameManager.game.lootDeck, undefined);
                    }
                    gameManager.stateManager.after();

                    event.preventDefault();
                } else if ((!this.dialogOpen || this.allowed.indexOf('active') != -1) && !event.ctrlKey && gameManager.game.state == GameState.next && event.key === 'Tab') {
                    this.toggleEntity(event.shiftKey);
                    event.preventDefault();
                } else if ((!this.dialogOpen || this.allowed.indexOf('element') != -1) && !event.ctrlKey && !event.shiftKey && ['1', '2', '3', '4', '5', '6'].indexOf(event.key) != -1) {
                    const index: number = +event.key - 1;
                    const element = gameManager.game.elementBoard[index];
                    const elementState = gameManager.nextElementState(element, false, true);
                    gameManager.stateManager.before("updateElement", "game.element." + element.type, "game.element.state." + elementState);
                    element.state = elementState;
                    gameManager.stateManager.after();
                    event.preventDefault();
                } else if ((!this.dialogOpen || this.allowed.indexOf('absent') != -1) && !event.ctrlKey && !event.shiftKey && gameManager.game.state == GameState.next && event.key === 'h') {
                    settingsManager.setHideAbsent(!settingsManager.settings.hideAbsent);
                    event.preventDefault();
                } else if ((!this.dialogOpen || this.allowed.indexOf('select') != -1) && !event.ctrlKey && !event.shiftKey && event.key === 's') {
                    gameManager.stateManager.keyboardSelecting = true;
                }
            }
        })

        this.keyup = window.addEventListener('keyup', (event: KeyboardEvent) => {
            if (this.zoomInterval && (event.key === 'ArrowUp' || event.key === '+' || event.key === 'ArrowDown' || event.key === '-')) {
                clearInterval(this.zoomInterval);
                this.zoomInterval = null;
                if (settingsManager.settings.zoom != this.currentZoom) {
                    settingsManager.setZoom(this.currentZoom);
                }
                event.preventDefault();
            }
        })
    }

    ngOnDestroy(): void {
        window.removeEventListener('keydown', this.keydown);
        window.removeEventListener('keyup', this.keyup);
    }

    zoom(value: number) {
        this.currentZoom += value;
        document.body.style.setProperty('--ghs-factor', this.currentZoom + '');
        const maxWidth = +window.getComputedStyle(document.body).getPropertyValue('min-width').replace('px', '');
        if (value < 0 && maxWidth >= window.innerWidth) {
            this.currentZoom -= value;
            document.body.style.setProperty('--ghs-factor', this.currentZoom + '');
        }
    }

    toggleEntity(reverse: boolean) {
        const figures = gameManager.game.figures.filter((figure) => gameManager.gameplayFigure(figure));
        let activeFigure = figures.find((figure) => figure.active);

        if (!activeFigure && reverse) {
            activeFigure = figures[figures.length - 1];
        } else if (activeFigure && reverse && figures.indexOf(activeFigure) > 0) {
            if (activeFigure instanceof Character) {
                const summons = activeFigure.summons.filter((summon) => gameManager.entityManager.isAlive(summon) && summon.state != SummonState.new);
                let activeSummon = summons.find((summon) => summon.active);
                if (!activeSummon || activeSummon && summons.indexOf(activeSummon) == 0) {
                    activeFigure.summons.forEach((summon) => summon.active = false);
                    activeFigure = figures[figures.indexOf(activeFigure) - 1];
                }
            } else {
                activeFigure = figures[figures.indexOf(activeFigure) - 1];
            }
        }

        if (activeFigure) {
            if (activeFigure instanceof Character) {
                const activeSummon = activeFigure.summons.find((summon) => summon.active);
                if (settingsManager.settings.activeSummons && activeFigure.active && activeSummon) {
                    gameManager.stateManager.before("summonInactive", "data.character." + activeFigure.name, "data.summon." + activeSummon.name);
                } else {
                    gameManager.stateManager.before(activeFigure.active ? "unsetActive" : "setActive", "data.character." + activeFigure.name);
                }
                gameManager.roundManager.toggleFigure(activeFigure);
                gameManager.stateManager.after();
            } else if (activeFigure instanceof Monster) {
                let toggleFigure = true;
                const entities = activeFigure.entities.filter((entity) => gameManager.entityManager.isAlive(entity) && entity.summon != SummonState.new);
                if (settingsManager.settings.activeStandees) {
                    let activeEntity = entities.find((entity) => entity.active);
                    if (!activeEntity && entities.length > 0 && reverse && activeFigure.active) {
                        activeEntity = entities[entities.length - 1];
                        gameManager.stateManager.before(activeEntity ? "unsetEntityActive" : "setEntityActive", "data.monster." + activeFigure.name, "monster." + activeEntity.type, "" + activeEntity.number);
                        gameManager.monsterManager.toggleActive(activeFigure, activeEntity);
                        activeEntity.active = true;
                        toggleFigure = false;
                        gameManager.stateManager.after();
                    } else if (activeEntity && !reverse) {
                        gameManager.stateManager.before(activeEntity ? "unsetEntityActive" : "setEntityActive", "data.monster." + activeFigure.name, "monster." + activeEntity.type, "" + activeEntity.number);
                        gameManager.monsterManager.toggleActive(activeFigure, activeEntity);
                        if (entities.indexOf(activeEntity) < entities.length - 1) {
                            entities[entities.indexOf(activeEntity) + 1].active = true;
                        }
                        toggleFigure = false;
                        gameManager.stateManager.after();
                    }
                }
                if (toggleFigure) {
                    gameManager.stateManager.before(activeFigure.active ? "unsetActive" : "setActive", "data.monster." + activeFigure.name);
                    if (reverse && !activeFigure.active && settingsManager.settings.activeStandees) {
                        activeFigure.entities.forEach((entity) => {
                            if (gameManager.entityManager.isAlive(entity)) {
                                entity.active = true;
                                entity.off = false;
                            }
                        });
                    }
                    gameManager.roundManager.toggleFigure(activeFigure);
                    gameManager.stateManager.after();
                }
            } else if (activeFigure instanceof Objective || activeFigure instanceof ObjectiveContainer) {
                gameManager.stateManager.before(activeFigure.active ? "unsetActive" : "setActive", activeFigure.title || activeFigure.name);
                gameManager.roundManager.toggleFigure(activeFigure);
                gameManager.stateManager.after();
            }
        }
    }
}

