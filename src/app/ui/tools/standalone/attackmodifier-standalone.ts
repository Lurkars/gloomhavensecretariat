import { Component, OnInit } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GameState } from "src/app/game/model/Game";
import { environment } from "src/environments/environment";
import { AttackModiferDeckChange } from "../../figures/attackmodifier/attackmodifierdeck";
import { Character } from "src/app/game/model/Character";
import { ActivatedRoute } from "@angular/router";
import { CharacterSheetDialog } from "../../figures/character/dialogs/character-sheet-dialog";
import { Dialog } from "@angular/cdk/dialog";
import { storageManager } from "src/app/game/businesslogic/StorageManager";

@Component({
    selector: 'ghs-attackmodifier-standalone',
    templateUrl: './attackmodifier-standalone.html',
    styleUrls: ['./attackmodifier-standalone.scss',]
})
export class AttackModifierStandaloneComponent implements OnInit {

    gameManager: GameManager = gameManager;
    ally: boolean = false;
    character: Character | undefined;
    characterWarning: boolean = false;
    init: boolean = false;

    constructor(private route: ActivatedRoute, private dialog: Dialog) { }

    async ngOnInit() {
        try {
            await storageManager.init();
        } catch {
            // continue
        }
        await settingsManager.init(!environment.production);
        await gameManager.stateManager.init(true);
        gameManager.game.figures.forEach((figure) => figure.active = false);
        gameManager.uiChange.emit();
        if (gameManager.game.state != GameState.next) {
            gameManager.roundManager.nextGameState(true);
        }

        this.route.queryParams.subscribe({
            next: (queryParams) => {
                this.characterWarning = false;
                if (queryParams['e'] && queryParams['c']) {
                    this.character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.edition == queryParams['e'] && figure.name == queryParams['c']) as Character;
                    if (!this.character) {
                        const characterData = gameManager.charactersData(queryParams['e']).find((characterData) => characterData.edition == queryParams['e'] && characterData.name == queryParams['c']);
                        if (characterData) {
                            gameManager.stateManager.before("addChar", "data.character." + characterData.name);
                            gameManager.characterManager.addCharacter(characterData, 1);
                            gameManager.stateManager.after();
                            this.character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.edition == queryParams['e'] && figure.name == queryParams['c']) as Character;
                            console.debug("Add character");
                        }
                    }
                    if (!this.character) {
                        this.characterWarning = true;
                        console.warn("No character available for edition '" + queryParams['e'] + "' with name '" + queryParams['c'] + "'!")
                    }
                } else {
                    this.ally = queryParams['a'] != undefined;
                }
                this.init = true;
            }
        })
    }

    vertical(): boolean {
        return window.innerWidth < 800;
    }

    beforeAttackModifierDeck(change: AttackModiferDeckChange) {
        gameManager.stateManager.before("updateAttackModifierDeck." + change.type, this.character ? gameManager.characterManager.characterName(this.character) : (this.ally ? "ally" : "monster"), ...change.values);
    }

    afterAttackModifierDeck(change: AttackModiferDeckChange) {
        if (this.character) {
            this.character.attackModifierDeck = change.deck;
        } else if (this.ally) {
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
            data: { character: this.character, forceEdit: true }
        });
    }
}

