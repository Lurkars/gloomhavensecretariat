import { DIALOG_DATA, Dialog } from "@angular/cdk/dialog";
import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";
import { Ability } from "src/app/game/model/data/Ability";
import { AbilityDialogComponent } from "../../ability/ability-dialog";

@Component({
    standalone: false,
    selector: 'ghs-ability-cards-dialog',
    templateUrl: 'ability-cards-dialog.html',
    styleUrls: ['./ability-cards-dialog.scss']
})
export class AbilityCardsDialogComponent implements OnInit, OnDestroy {

    character: Character;
    level: number | string;
    exclusiveLevel: number | string | undefined;
    additionalLevels: (number | string)[] = [];
    abilities: Ability[] = [];
    visibleAbilities: Ability[] = [];
    smallAbilities: Ability[] = [];
    cardsToPick: number = 1;
    levelToPick: number = 1;
    sort: 'level-deck' | 'cardId' | 'level-name' | 'name' = 'level-deck';
    sorts: ('level-deck' | 'cardId' | 'level-name' | 'name')[] = ['level-deck', 'cardId', 'level-name', 'name'];
    deck: boolean = true;
    maxLevel: number = 1;

    constructor(@Inject(DIALOG_DATA) public data: { character: Character }, private dialog: Dialog) {
        this.character = data.character;
        this.level = this.character.level;
        this.abilities = gameManager.deckData(this.character).abilities;
        this.abilities.filter((ability) => typeof ability.level === 'string' && ability.level != 'X' || typeof ability.level === 'number' && ability.level > 9).forEach((ability) => {
            if (this.additionalLevels.indexOf(ability.level) == -1) {
                this.additionalLevels.push(ability.level);
            }
        })
    }

    ngOnInit(): void {
        this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() })
        this.update();
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    update() {
        this.cardsToPick = this.character.level - this.character.progress.deck.length - 1;
        if (this.cardsToPick < 0) {
            this.cardsToPick = 0;
        }
        this.character.progress.deck = this.character.progress.deck || [];
        this.levelToPick = this.deck && this.cardsToPick ? this.character.level - this.cardsToPick + 1 : 0;
        this.maxLevel = Math.max(...this.abilities.filter((ability, i) => typeof ability.level === 'number' && this.character.progress.deck.indexOf(i) != -1).map((ability) => +ability.level), this.character.level);
        if (this.levelToPick) {
            this.visibleAbilities = this.abilities.filter((ability, i) => typeof ability.level == 'number' && ability.level > 1 && ability.level <= this.levelToPick && this.character.progress.deck.indexOf(i) == -1).sort((a, b) => {
                if (typeof a.level === 'number' && typeof b.level === 'number' && a.level != b.level) {
                    return b.level - a.level;
                }
                if (a.cardId && b.cardId) {
                    return a.cardId - b.cardId;
                }
                return 0;
            });
            this.smallAbilities = this.abilities.filter((ability, i) => ability.level == 'X' || ability.level == 1 || this.character.progress.deck.indexOf(i) != -1);
        } else {
            this.visibleAbilities = this.abilities.filter((ability) => !this.exclusiveLevel && typeof this.level === 'number' && (typeof ability.level == 'string' || +ability.level <= this.level) && this.additionalLevels.indexOf(ability.level) == -1 || this.exclusiveLevel && ability.level == this.exclusiveLevel || this.exclusiveLevel == 1 && ability.level == 'X');
            this.smallAbilities = [];

            if (this.deck) {
                this.visibleAbilities = this.visibleAbilities.filter((ability) => ability.level == 'X' || ability.level == 1 || this.character.progress.deck.indexOf(this.abilities.indexOf(ability)) != -1);
            }

            if (this.sort == 'cardId') {
                this.visibleAbilities.sort((a, b) => {
                    if (a.cardId && b.cardId) {
                        return a.cardId - b.cardId;
                    }
                    return 0;
                });
            } else if (this.sort == 'level-name') {
                this.visibleAbilities.sort((a, b) => {
                    if (a.level == b.level) {
                        if (a.name && b.name) {
                            return a.name < b.name ? -1 : 1;
                        } else if (a.cardId && b.cardId) {
                            return a.cardId - b.cardId;
                        }
                        return 0;
                    } else if (a.level == 1 && b.level == "X") {
                        return -1;
                    } else if (a.level == "X" && b.level == 1) {
                        return 1;
                    } else if (a.level == "X") {
                        return -1;
                    } else if (b.level == "X") {
                        return 1;
                    } else if (typeof a.level === 'number' && typeof b.level == 'number') {
                        return a.level - b.level
                    }
                    return 0;
                });
            } else if (this.sort == 'level-deck') {
                this.visibleAbilities.sort((a, b) => {
                    if ((a.level == 1 || a.level == 'X') && (b.level == 1 || b.level == 'X')) {
                        return 0;
                    } else if (a.level == 1 || a.level == 'X') {
                        return -1;
                    } else if (b.level == 1 || b.level == 'X') {
                        return 1;
                    } else if (this.character.progress.deck.indexOf(this.abilities.indexOf(a)) != -1 && this.character.progress.deck.indexOf(this.abilities.indexOf(b)) == -1) {
                        return -1;
                    } else if (this.character.progress.deck.indexOf(this.abilities.indexOf(a)) == -1 && this.character.progress.deck.indexOf(this.abilities.indexOf(b)) != -1) {
                        return 1;
                    }
                    return 0;
                });
            } else if (this.sort == 'name') {
                this.visibleAbilities.sort((a, b) => {
                    if (a.name && b.name) {
                        return a.name < b.name ? -1 : 1;
                    } else if (a.cardId && b.cardId) {
                        return a.cardId - b.cardId;
                    }
                    return 0;
                });
            }
        }
    }

    togglePick() {
        this.deck = !this.deck;
        this.update();
    }

    setLevel(level: number | string, exclusive: boolean = false) {
        this.level = level;
        this.exclusiveLevel = exclusive ? level : undefined;
        if (this.additionalLevels.indexOf(level) != -1) {
            this.exclusiveLevel = level;
        }
        this.update();
    }

    undoLastCard() {
        gameManager.stateManager.before("character.undoLastCard", gameManager.characterManager.characterName(this.character));
        this.character.progress.deck.splice(-1, 1);
        gameManager.stateManager.after();
        this.update();
    }

    resetDeck() {
        gameManager.stateManager.before("character.resetDeck", gameManager.characterManager.characterName(this.character));
        this.character.progress.deck = [];
        gameManager.stateManager.after();
        this.update();
    }

    clickAbility(ability: Ability) {
        const level1 = typeof ability.level === 'string' || ability.level == 1;
        if (level1 || !this.levelToPick || !this.deck) {
            this.openDialog(ability);
        } else {
            this.toggleDeck(ability);
        }
    }

    toggleDeck(ability: Ability, force: boolean = false) {
        const inDeck = this.character.progress.deck.indexOf(this.abilities.indexOf(ability)) != -1;
        if (inDeck || force || this.levelToPick >= +ability.level && this.cardsToPick > 0) {
            if (inDeck) {
                gameManager.stateManager.before("character.cardFromDeck", gameManager.characterManager.characterName(this.character), ability.name || ability.cardId || '');
                this.character.progress.deck = this.character.progress.deck.filter((value) => value != this.abilities.indexOf(ability));
            } else {
                gameManager.stateManager.before("character.cardToDeck", gameManager.characterManager.characterName(this.character), ability.name || ability.cardId || '');
                this.character.progress.deck.push(this.abilities.indexOf(ability));
            }
            gameManager.stateManager.after();
            this.update();
        }
    }

    openDialog(ability: Ability) {
        this.dialog.open(AbilityDialogComponent, {
            panelClass: ['fullscreen-panel'],
            disableClose: true,
            data: { ability: ability, character: this.character }
        });
    }
}