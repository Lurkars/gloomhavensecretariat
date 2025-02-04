import { Dialog } from "@angular/cdk/dialog";
import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { storageManager } from "src/app/game/businesslogic/StorageManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { environment } from "src/environments/environment";
import { AttackModiferDeckChange } from "../../figures/attackmodifier/attackmodifierdeck";
import { CharacterSheetDialog } from "../../figures/character/dialogs/character-sheet-dialog";
import { HeaderComponent } from "../../header/header";
import { SubMenu } from "../../header/menu/menu";

@Component({
    standalone: false,
    selector: 'ghs-attackmodifier-standalone',
    templateUrl: './attackmodifier-standalone.html',
    styleUrls: ['./attackmodifier-standalone.scss',]
})
export class AttackModifierStandaloneComponent implements OnInit, OnDestroy {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    characters: Character[] = [];
    characterWarning: boolean = false;
    init: boolean = false;
    activeDeckIndex: number = -1;

    @ViewChild('header') header!: HeaderComponent;

    constructor(private route: ActivatedRoute, private router: Router, private dialog: Dialog) { }

    async ngOnInit() {
        try {
            await storageManager.init();
        } catch (e) {
            // continue
        }
        await settingsManager.init(!environment.production);
        await gameManager.stateManager.init(true);
        gameManager.game.figures.forEach((figure) => figure.active = false);
        this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure as Character);
        gameManager.uiChange.emit();
        if (gameManager.game.state != GameState.next) {
            gameManager.roundManager.nextGameState(true);
        }

        this.route.queryParams.subscribe({
            next: (queryParams) => {
                this.characterWarning = false;
                if (queryParams['e'] && queryParams['c']) {
                    let character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.edition == queryParams['e'] && figure.name == queryParams['c']) as Character;
                    if (!character) {
                        const characterData = gameManager.charactersData(queryParams['e']).find((characterData) => characterData.edition == queryParams['e'] && characterData.name == queryParams['c']);
                        if (characterData) {
                            gameManager.stateManager.before("addChar", "data.character." + characterData.name);
                            gameManager.characterManager.addCharacter(characterData, 1);
                            gameManager.stateManager.after();
                            character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.edition == queryParams['e'] && figure.name == queryParams['c']) as Character;
                        }
                    }
                    if (!character) {
                        this.characterWarning = true;
                        console.warn("No character available for edition '" + queryParams['e'] + "' with name '" + queryParams['c'] + "'!")
                    } else {
                        this.activeDeckIndex = this.characters.indexOf(character) + 1;
                        this.updateQueryParams();
                    }
                } else if (queryParams['a'] != undefined) {
                    this.activeDeckIndex = 0;
                    this.updateQueryParams();
                }
                this.init = true;
            }
        })

        this.uiChangeSubscription = gameManager.uiChange.subscribe({
            next: () => {
                this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure as Character);
                if (this.activeDeckIndex > this.characters.length + 1) {
                    this.activeDeckIndex = -1;
                    this.updateQueryParams();
                }
            }
        })
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    vertical(): boolean {
        return window.innerWidth < 800;
    }

    selectMonsterDeck() {
        if (this.activeDeckIndex != -1) {
            this.activeDeckIndex = -1;
            this.updateQueryParams();
            gameManager.game.monsterAttackModifierDeck.active = false;
            setTimeout(() => {
                gameManager.game.monsterAttackModifierDeck.active = true;
            }, 1)
        }
    }

    selectAllyDeck() {
        if (this.activeDeckIndex != 0) {
            this.activeDeckIndex = 0;
            this.updateQueryParams();
            gameManager.game.allyAttackModifierDeck.active = false;
            setTimeout(() => {
                gameManager.game.allyAttackModifierDeck.active = true;
            }, 1)
        }
    }

    selectCharacterDeck(index: number) {
        if (this.activeDeckIndex != index + 1) {
            this.activeDeckIndex = index + 1;
            this.updateQueryParams();
            this.characters[index].attackModifierDeck.active = false;
            setTimeout(() => {
                this.characters[index].attackModifierDeck.active = true;
            }, 1)
        }
    }

    removeCharacter(index: number) {
        if (this.activeDeckIndex == index + 1) {
            this.activeDeckIndex--;
            this.updateQueryParams();
        }
        gameManager.stateManager.before("addChar", "data.character." + this.characters[index].name);
        gameManager.characterManager.removeCharacter(this.characters[index]);
        gameManager.stateManager.after();
    }

    addCharacter() {
        this.header.openMenu(SubMenu.character_add);
    }

    beforeAttackModifierDeck(change: AttackModiferDeckChange) {
        gameManager.stateManager.before("updateAttackModifierDeck." + change.type, this.activeDeckIndex > 0 ? gameManager.characterManager.characterName(this.characters[this.activeDeckIndex - 1]) : (this.activeDeckIndex == 0 ? "ally" : "monster"), ...change.values);
    }

    afterAttackModifierDeck(change: AttackModiferDeckChange) {
        if (this.activeDeckIndex > 0) {
            this.characters[this.activeDeckIndex - 1].attackModifierDeck = change.deck;
        } else if (this.activeDeckIndex == 0) {
            gameManager.game.allyAttackModifierDeck = change.deck;
        } else {
            gameManager.game.monsterAttackModifierDeck = change.deck;
        }
        gameManager.stateManager.after();
    }

    next() {
        gameManager.stateManager.before("draw");
        if (gameManager.game.state == GameState.next) {
            gameManager.roundManager.nextGameState(true);
        }
        gameManager.roundManager.nextGameState(true);
        gameManager.game.figures.forEach((figure) => figure.active = false);
        gameManager.stateManager.after();
    }

    openCharacterSheet(): void {
        gameManager.stateManager.updatePermissions();
        this.dialog.open(CharacterSheetDialog, {
            panelClass: ['dialog-invert'],
            data: { character: this.characters[this.activeDeckIndex - 1], forceEdit: true }
        });
    }

    updateQueryParams() {
        let a = undefined;
        let e = undefined;
        let c = undefined;

        if (this.activeDeckIndex == 0) {
            a = true;
        } else if (this.activeDeckIndex > 0) {
            e = this.characters[this.activeDeckIndex - 1].edition;
            c = this.characters[this.activeDeckIndex - 1].name;
        }

        this.router.navigate(
            [],
            {
                relativeTo: this.route,
                queryParams: { a: a, e: e, c: c },
                queryParamsHandling: 'merge'
            });
    }
}

