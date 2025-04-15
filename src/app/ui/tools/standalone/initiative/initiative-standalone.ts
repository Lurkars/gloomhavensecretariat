import { Dialog } from "@angular/cdk/dialog";
import { Component, HostListener, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { storageManager } from "src/app/game/businesslogic/StorageManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { CharacterSheetDialog } from "src/app/ui/figures/character/dialogs/character-sheet-dialog";
import { ghsFilterInputFocus } from "src/app/ui/helper/Static";
import { environment } from "src/environments/environment";

@Component({
    standalone: false,
    selector: 'ghs-initiative-standalone',
    templateUrl: './initiative-standalone.html',
    styleUrls: ['./initiative-standalone.scss', '../../../../ui/figures/character/cards/initiative-dialog.scss']
})
export class InitiativeStandaloneComponent implements OnInit, OnDestroy {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    characters: Character[] = [];
    character: Character | undefined;
    value: string = "__";
    longRest: boolean = false;
    statusCode: number = 200;

    constructor(private dialog: Dialog) { }

    async ngOnInit() {
        try {
            await storageManager.init();
        } catch (e) {
            // continue
        }
        await settingsManager.init(!environment.production);
        await gameManager.stateManager.init(true);
        this.update();

        gameManager.uiChange.emit();
        this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() });

        window.addEventListener('focus', (event) => {
            if (settingsManager.settings.serverAutoconnect && gameManager.stateManager.wsState() != WebSocket.OPEN) {
                gameManager.stateManager.connect();
            }
        });

    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    update() {
        this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure as Character);
        this.character = this.characters.find((character) => character.fullview) || this.characters.length && this.characters[0] || undefined;
        this.statusCode = 200;
    }

    vertical(): boolean {
        return window.innerWidth < 800;
    }

    selectCharacter(character: Character) {
        if (this.character == character) {
            this.openCharacterSheet();
        } else {
            this.characters.forEach((char) => char.fullview = false);
            this.character = character;
            this.character.fullview = true;
            gameManager.stateManager.saveLocal();
        }
    }

    @HostListener('document:keydown', ['$event'])
    onKeyPress(event: KeyboardEvent) {
        if (settingsManager.settings.keyboardShortcuts && ghsFilterInputFocus(event) && this.dialog.openDialogs.length == 0) {
            if (event.key in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
                this.pickNumber(+event.key);
                event.preventDefault();
                event.stopPropagation();
            }
        }
    }

    pickNumber(number: number) {
        if (this.value.indexOf('_') == -1) {
            this.value = '__';
            this.longRest = false;
        }

        if (this.value == '__') {
            this.value = number + '_';
            this.longRest = false;
        } else {
            this.value = this.value[0] + number;
            if (settingsManager.settings.standaloneInitiativeAutomatic) {
                this.updateInitiative(+this.value);
            }
        }
    }

    updateInitiative(initiative: number) {
        if (this.character && (this.character.initiative != initiative || this.longRest != this.character.longRest)) {
            if (initiative >= 0 && initiative < 100) {
                this.setInitiative(initiative);
            } else if (gameManager.game.state == GameState.draw) {
                this.character.initiative = 0;
            }
        }
    }

    async setInitiative(initiative: number) {
        if (this.character && ((gameManager.game.state == GameState.draw || !settingsManager.settings.initiativeRequired) && initiative >= 0 || initiative >= 0) && initiative < 100 && (initiative != this.character.initiative || this.longRest != this.character.longRest)) {
            this.statusCode = 200;
            if (gameManager.stateManager.wsState() == WebSocket.OPEN && settingsManager.settings.serverUrl) {
                let url = settingsManager.settings.serverWss ? 'https://' : 'http://';
                const parts = settingsManager.settings.serverUrl.split('/');
                url += parts[0];
                if (settingsManager.settings.serverWss && settingsManager.settings.serverPort != 443 || !settingsManager.settings.serverWss && settingsManager.settings.serverPort != 80) {
                    url += ':' + settingsManager.settings.serverPort;
                }
                if (parts.length > 1) {
                    url += '/' + parts.slice(1).join('/');
                }
                url += '/game/initiative'
                const response = await fetch(url, {
                    method: 'POST',
                    body: JSON.stringify({
                        playerNumber: this.character.number,
                        initiative: initiative,
                        longRest: this.longRest,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': settingsManager.settings.serverCode || ''
                    },
                });

                this.statusCode = response.status;
            }

            if (this.statusCode == 200) {
                this.character.initiativeVisible = true;
                this.character.initiative = initiative;
                this.character.longRest = this.longRest;
                if (this.character.initiative != 99) {
                    this.character.longRest = false;
                }
                this.value = '__';
                this.longRest = false;
                gameManager.stateManager.saveLocal();
            }
        }
    }

    setLongRest() {
        if (this.character) {
            this.longRest = !this.longRest;
            this.value = '99';
            if (settingsManager.settings.standaloneInitiativeAutomatic) {
                this.updateInitiative(+this.value);
            }
        }
    }

    openCharacterSheet(): void {
        if (this.character) {
            gameManager.stateManager.updatePermissions();
            this.dialog.open(CharacterSheetDialog, {
                panelClass: ['dialog-invert'],
                data: { character: this.character }
            });
        }
    }

    setCurrentValue() {
        this.value = this.value.replaceAll('_', '');
        this.setInitiative(this.value && +this.value || 0);
    }
}

