import { Dialog } from '@angular/cdk/dialog';
import { Directive, HostListener, Input, OnInit } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { Objective } from 'src/app/game/model/Objective';
import { AttackModifierDeck } from 'src/app/game/model/data/AttackModifier';
import { FooterComponent } from '../footer/footer';
import { SummonState } from 'src/app/game/model/Summon';
import { LootApplyDialogComponent } from '../figures/loot/loot-apply-dialog';
import { LootType } from 'src/app/game/model/data/Loot';


export type KEYBOARD_SHORTCUT_EVENTS = "undo" | "zoom" | "round" | "am" | "loot" | "active" | "element";

@Directive({
    selector: '[ghs-keyboard-shortcuts]'
})
export class KeyboardShortcuts implements OnInit {

    @Input() footer: FooterComponent | undefined;
    @Input() allowed: KEYBOARD_SHORTCUT_EVENTS[] = ["undo"];
    scrollTimeout: any = null;
    zoomInterval: any = null;
    currentZoom: number = 0;
    dialogOpen: boolean = false;


    constructor(private dialog: Dialog) {
        this.dialog.afterOpened.subscribe({ next: () => this.dialogOpen = true });
        this.dialog.afterAllClosed.subscribe({ next: () => this.dialogOpen = false });
    }

    ngOnInit(): void {
        this.currentZoom = settingsManager.settings.zoom;

        window.addEventListener('keydown', (event: KeyboardEvent) => {
            if (!event.altKey && !event.metaKey && (!window.document.activeElement || window.document.activeElement.tagName != 'INPUT' && window.document.activeElement.tagName != 'SELECT' && window.document.activeElement.tagName != 'TEXTAREA')) {
                if ((!this.dialogOpen || this.allowed.indexOf('undo') != -1) && event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'z') {
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
                } else if ((!this.dialogOpen || this.allowed.indexOf('loot') != -1) && gameManager.game.state == GameState.next && !event.ctrlKey && !event.shiftKey && !this.zoomInterval && event.key.toLowerCase() === 'l' && settingsManager.settings.lootDeck && gameManager.game.lootDeck.cards.length > 0) {
                    gameManager.stateManager.before('lootDeckDraw');
                    gameManager.game.lootDeck.active = true;
                    const activeCharacter = gameManager.game.figures.find((figure) => figure instanceof Character && figure.active);
                    if (!settingsManager.settings.alwaysLootApplyDialog && activeCharacter instanceof Character) {
                        gameManager.lootManager.drawCard(gameManager.game.lootDeck, activeCharacter);
                    } else {
                        gameManager.lootManager.drawCard(gameManager.game.lootDeck, undefined);
                        if (settingsManager.settings.applyLoot) {
                            setTimeout(() => {
                                const loot = gameManager.game.lootDeck.cards[gameManager.game.lootDeck.current];
                                const dialog = this.dialog.open(LootApplyDialogComponent, {
                                    panelClass: 'dialog',
                                    data: { loot: loot }
                                });

                                dialog.closed.subscribe({
                                    next: (name) => {
                                        if (name) {
                                            const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.name == name);
                                            if (character instanceof Character) {
                                                gameManager.stateManager.before(loot.type == LootType.random_item ? "lootRandomItem" : "addResource", "data.character." + character.name, "game.loot." + loot.type, gameManager.lootManager.getValue(loot) + '');
                                                gameManager.lootManager.applyLoot(loot, character, gameManager.game.lootDeck.current);
                                                gameManager.stateManager.after();
                                            }
                                        }
                                    }
                                })
                            }, settingsManager.settings.disableAnimations ? 0 : 1850);
                        }
                    }
                    gameManager.stateManager.after();
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
                }
            }
        })

        window.addEventListener('keyup', (event: KeyboardEvent) => {
            if (this.zoomInterval && (event.key === 'ArrowUp' || event.key === '+' || event.key === 'ArrowDown' || event.key === '-')) {
                clearInterval(this.zoomInterval);
                this.zoomInterval = null;
                settingsManager.setZoom(this.currentZoom);
            }
        })
    }

    @HostListener('pinchmove', ['$event'])
    pinchmove(event: any) {
        if (event.scale < 1) {
            this.zoom(1);
        } else {
            this.zoom(-1);
        }
    }

    @HostListener('pinchend', ['$event'])
    pinchend(event: any) {
        settingsManager.setZoom(this.currentZoom);
    }

    zoom(value: number) {
        this.currentZoom += value;
        document.body.style.setProperty('--ghs-factor', this.currentZoom + '');
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
                let toggleFigure = true;
                if (settingsManager.settings.activeSummons) {
                    const summons = activeFigure.summons.filter((summon) => gameManager.entityManager.isAlive(summon) && summon.state != SummonState.new);
                    let activeSummon = summons.find((summon) => summon.active);
                    if (!activeSummon && summons.length > 0 && reverse && activeFigure.active) {
                        activeSummon = summons[summons.length - 1];
                        gameManager.stateManager.before("summonActive", "data.character." + activeFigure.name, "data.summon." + activeSummon.name);
                        activeSummon.active = true;
                        toggleFigure = false;
                        gameManager.stateManager.after();
                    } else if (activeSummon && !reverse) {
                        gameManager.stateManager.before("summonInactive", "data.character." + activeFigure.name, "data.summon." + activeSummon.name);
                        activeSummon.active = false;
                        if (summons.indexOf(activeSummon) < summons.length - 1) {
                            summons[summons.indexOf(activeSummon) + 1].active = true;
                        }
                        toggleFigure = false;
                        gameManager.stateManager.after();
                    } else if (activeSummon && summons.indexOf(activeSummon) != 0) {
                        const prevSummon = summons[summons.indexOf(activeSummon) - 1];
                        gameManager.stateManager.before("summonActive", "data.character." + activeFigure.name, "data.summon." + prevSummon.name);
                        activeSummon.active = false;
                        prevSummon.active = true;
                        toggleFigure = false;
                        gameManager.stateManager.after();
                    }
                }
                if (toggleFigure) {
                    gameManager.stateManager.before(activeFigure.active ? "unsetActive" : "setActive", "data.character." + activeFigure.name);
                    gameManager.roundManager.toggleFigure(activeFigure);
                    gameManager.stateManager.after();
                }
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
            } else if (activeFigure instanceof Objective) {
                gameManager.stateManager.before(activeFigure.active ? "unsetActive" : "setActive", activeFigure.title || activeFigure.name);
                gameManager.roundManager.toggleFigure(activeFigure);
                gameManager.stateManager.after();
            }
        }
    }
}

