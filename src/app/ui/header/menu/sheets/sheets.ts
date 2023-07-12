import { Dialog } from "@angular/cdk/dialog";
import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { CharacterSheetDialog } from "src/app/ui/figures/character/dialogs/character-sheet-dialog";
import { PartySheetDialogComponent } from "../../party/party-sheet-dialog";


@Component({
    selector: 'ghs-sheets-menu',
    templateUrl: 'sheets.html',
    styleUrls: ['../menu.scss', 'sheets.scss']
})
export class SheetsMenuComponent implements OnInit {

    @Output() close = new EventEmitter();

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;

    characters: Character[] = [];

    constructor(private dialog: Dialog) { }

    ngOnInit(): void {
        this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure as Character).sort((a, b) => {
            const aName = a.title.toLowerCase() || settingsManager.getLabel('data.character.' + a.name).toLowerCase();
            const bName = b.title.toLowerCase() || settingsManager.getLabel('data.character.' + b.name).toLowerCase();
            if (aName > bName) {
                return 1;
            }
            if (aName < bName) {
                return -1;
            }
            return 0;
        });
    }

    openCharacterSheet(character: Character) {
        this.dialog.open(CharacterSheetDialog, {
            panelClass: ['dialog-invert'],
            data: character
        });
        this.close.emit();
    }

    openPartySheet() {
        this.dialog.open(PartySheetDialogComponent, {
            panelClass: ['dialog-invert']
        });
        this.close.emit();
    }

    openCampaignSheet() {
        this.dialog.open(PartySheetDialogComponent, {
            panelClass: ['dialog-invert'],
            data: { campaign: true }
        });
        this.close.emit();
    }

}