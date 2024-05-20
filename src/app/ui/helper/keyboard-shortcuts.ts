import { Dialog } from '@angular/cdk/dialog';
import { Directive, Input, OnDestroy, OnInit } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { SummonState } from 'src/app/game/model/Summon';
import { AttackModifierDeck } from 'src/app/game/model/data/AttackModifier';
import { EntityMenuDialogComponent } from '../figures/entity-menu/entity-menu-dialog';
import { PartySheetDialogComponent } from '../figures/party/party-sheet-dialog';
import { ScenarioChartDialogComponent } from '../figures/party/scenario-chart/scenario-chart';
import { WorldMapComponent } from '../figures/party/world-map/world-map';
import { FooterComponent } from '../footer/footer';
import { HeaderComponent } from '../header/header';
import { KeyboardShortcutsComponent } from '../header/menu/keyboard-shortcuts/keyboard-shortcuts';


export type KEYBOARD_SHORTCUT_EVENTS = "undo" | "zoom" | "round" | "am" | "loot" | "active" | "element" | "absent" | "select" | "menu" | "level" | "scenario" | "handSize" | "traits" | "party" | "map" | "chart" | "damageHP";

@Directive({
    selector: '[ghs-keyboard-shortcuts]'
})
export class KeyboardShortcuts implements OnInit, OnDestroy {

    @Input() header: HeaderComponent | undefined;
    @Input() footer: FooterComponent | undefined;
    @Input() allowed: KEYBOARD_SHORTCUT_EVENTS[] = ["undo", "zoom", "menu"];
    scrollTimeout: any = null;
    zoomInterval: any = null;
    currentZoom: number = 0;
    dialogOpen: boolean = false;
    dialogClosing: boolean = false;
    keydown: any;
    keyup: any;
    timeout: any;

    constructor(private dialog: Dialog) {
        this.dialog.afterOpened.subscribe({ next: () => { this.dialogOpen = true; this.dialogClosing = false; } });
        this.dialog.afterAllClosed.subscribe({ next: () => { this.dialogClosing = true; setTimeout(() => { if (this.dialogClosing) { this.dialogOpen = false; } }, 250) } });
    }

    applySelect() {
        const entities = gameManager.entityManager.getIndexedEntities();
        if (gameManager.stateManager.keyboardSelect > 0 && gameManager.stateManager.keyboardSelect <= entities.length) {
            this.dialog.open(EntityMenuDialogComponent, {
                panelClass: ['dialog'],
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
                } else if ((!this.dialogOpen || this.allowed.indexOf('am') != -1) && !event.ctrlKey && !event.shiftKey && !this.zoomInterval && gameManager.game.state == GameState.next && (event.key.toLowerCase() === 'm' || settingsManager.settings.amAdvantage && (event.key.toLowerCase() === 'a' || event.key.toLowerCase() === 'd'))) {
                    const activeFigure = gameManager.game.figures.find((figure) => figure.active);
                    let deck: AttackModifierDeck | undefined = undefined;
                    const state: 'advantage' | 'disadvantage' | undefined = settingsManager.settings.amAdvantage && event.key.toLowerCase() === 'a' ? 'advantage' : (settingsManager.settings.amAdvantage && event.key.toLowerCase() === 'd' ? 'disadvantage' : undefined);

                    if (!activeFigure || activeFigure instanceof Monster && (!activeFigure.isAlly && !activeFigure.isAllied || !gameManager.fhRules() && !settingsManager.settings.alwaysAllyAttackModifierDeck || !settingsManager.settings.allyAttackModifierDeck)) {
                        gameManager.stateManager.before("updateAttackModifierDeck.draw" + (state ? state : ''), "monster");
                        deck = gameManager.game.monsterAttackModifierDeck;
                    } else if (activeFigure instanceof Monster) {
                        gameManager.stateManager.before("updateAttackModifierDeck.draw" + (state ? state : ''), "ally");
                        deck = gameManager.game.allyAttackModifierDeck;
                    } else if (activeFigure instanceof Character) {
                        if (settingsManager.settings.characterAttackModifierDeck) {
                            if (activeFigure.attackModifierDeckVisible) {
                                gameManager.stateManager.before("updateAttackModifierDeck.draw" + (state ? state : ''), gameManager.characterManager.characterName(activeFigure));
                                deck = activeFigure.attackModifierDeck;
                            } else {
                                activeFigure.attackModifierDeckVisible = true;
                            }
                        } else {
                            gameManager.stateManager.before("updateAttackModifierDeck.draw" + (state ? state : ''), "monster");
                            deck = gameManager.game.monsterAttackModifierDeck;
                        }
                    }

                    if (deck) {
                        deck.active = true;
                        gameManager.attackModifierManager.drawModifier(deck, state);
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
                } else if (!this.dialogOpen && !event.ctrlKey && event.key === 'Tab' && gameManager.game.figures.length > 0) {
                    if (gameManager.game.state == GameState.next) {
                        this.toggleEntity(event.shiftKey);
                    } else {
                        let focus = true;
                        gameManager.game.figures.filter((figure) => figure instanceof Character && !figure.absent).forEach((char, index) => {
                            const current = document.getElementById('initiative-input-' + index);
                            if (document.activeElement == current) {
                                focus = false;
                            }
                        })
                        if (focus) {
                            const current = document.getElementById('initiative-input-0');
                            if (current) {
                                current.focus();
                            }
                        }
                        event.stopPropagation();
                    }
                    event.preventDefault();
                } else if ((!this.dialogOpen || this.allowed.indexOf('level') != -1) && this.footer && !event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'x' && this.footer.ghsLevel) {
                    this.footer.ghsLevel.open();
                } else if ((!this.dialogOpen || this.allowed.indexOf('scenario') != -1) && !event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'e') {
                    if (gameManager.game.scenario && this.header) {
                        this.header.openEventEffects();
                    } else if (!gameManager.game.scenario && this.footer && this.footer.ghsScenario) {
                        this.footer.ghsScenario.open(event);
                    }
                } else if ((!this.dialogOpen || this.allowed.indexOf('scenario') != -1) && this.footer && !event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'f' && this.footer.ghsScenario && gameManager.game.scenario) {
                    this.footer.ghsScenario.open(event);
                } else if ((!this.dialogOpen || this.allowed.indexOf('party') != -1) && !event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'p' && settingsManager.settings.partySheet) {
                    this.dialog.open(PartySheetDialogComponent, {
                        panelClass: ['dialog-invert'],
                        data: { partySheet: true }
                    });
                    event.stopPropagation();
                    event.preventDefault();
                } else if ((!this.dialogOpen || this.allowed.indexOf('map') != -1) && !event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'g' && gameManager.game.edition) {
                    const editionData = gameManager.editionData.find((editionData) => editionData.edition == gameManager.game.edition);
                    if (editionData) {
                        if (editionData.worldMap || editionData.extendWorldMap) {
                            if (this.dialogOpen) {
                                this.dialog.closeAll();
                            }
                            this.dialog.open(WorldMapComponent, {
                                panelClass: ['fullscreen-panel'],
                                backdropClass: ['fullscreen-backdrop'],
                                data: gameManager.game.edition
                            })
                            event.stopPropagation();
                            event.preventDefault();
                        }
                    }
                } else if ((!this.dialogOpen || this.allowed.indexOf('chart') != -1) && !event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'c' && gameManager.game.edition) {
                    if (this.dialogOpen) {
                        this.dialog.closeAll();
                    }
                    this.dialog.open(ScenarioChartDialogComponent, {
                        panelClass: ['fullscreen-panel'],
                        backdropClass: ['fullscreen-backdrop'],
                        data: {
                            edition: gameManager.game.edition
                        }
                    })
                    event.stopPropagation();
                    event.preventDefault();
                } else if (!this.dialogOpen && !event.ctrlKey && this.header && event.key === 'Escape') {
                    this.header.openMenu();
                    event.stopPropagation();
                    event.preventDefault();
                } else if ((!this.dialogOpen || this.allowed.indexOf('element') != -1) && !event.ctrlKey && !event.shiftKey && ['1', '2', '3', '4', '5', '6'].indexOf(event.key) != -1) {
                    const index: number = +event.key - 1;
                    const element = gameManager.game.elementBoard[index];
                    const elementState = gameManager.nextElementState(element, false, true);
                    gameManager.stateManager.before("updateElement", "game.element." + element.type, "game.element.state." + elementState);
                    element.state = elementState;
                    gameManager.stateManager.after();
                    event.preventDefault();
                } else if ((!this.dialogOpen || this.allowed.indexOf('absent') != -1) && !event.ctrlKey && !event.shiftKey && event.key === 'h') {
                    settingsManager.toggle('hideAbsent');
                    event.preventDefault();
                } else if ((!this.dialogOpen || this.allowed.indexOf('handSize') != -1) && !event.ctrlKey && event.shiftKey && event.key === 'H') {
                    settingsManager.toggle('characterHandSize');
                    event.preventDefault();
                } else if ((!this.dialogOpen || this.allowed.indexOf('traits') != -1) && !event.ctrlKey && !event.shiftKey && event.key === 't') {
                    settingsManager.toggle('characterTraits');
                    event.preventDefault();
                } else if ((!this.dialogOpen || this.allowed.indexOf('damageHP') != -1) && !event.ctrlKey && !event.shiftKey && event.key === 'i') {
                    settingsManager.toggle('damageHP');
                    event.preventDefault();
                } else if ((!this.dialogOpen || this.allowed.indexOf('select') != -1) && !event.ctrlKey && !event.shiftKey && event.key === 's') {
                    gameManager.stateManager.keyboardSelecting = true;
                } else if (!this.dialogOpen && !event.ctrlKey && event.key === '?') {
                    this.dialog.open(KeyboardShortcutsComponent, {
                        panelClass: ['dialog'],
                    });
                    event.preventDefault();
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
                    gameManager.stateManager.before("summonInactive", gameManager.characterManager.characterName(activeFigure), "data.summon." + activeSummon.name);
                } else {
                    gameManager.stateManager.before(activeFigure.active ? "unsetActive" : "setActive", gameManager.characterManager.characterName(activeFigure));
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
            } else if (activeFigure instanceof ObjectiveContainer) {
                gameManager.stateManager.before(activeFigure.active ? "unsetActive" : "setActive", activeFigure.title || activeFigure.name);
                gameManager.roundManager.toggleFigure(activeFigure);
                gameManager.stateManager.after();
            }
        }
    }
}

