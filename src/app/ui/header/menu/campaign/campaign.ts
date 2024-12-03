import { Dialog } from "@angular/cdk/dialog";
import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { Party } from "src/app/game/model/Party";
import { Condition, ConditionName, ConditionType } from "src/app/game/model/data/Condition";
import { BattleGoalSetupDialog } from "src/app/ui/figures/battlegoal/setup/battlegoal-setup";
import { CharacterSheetDialog } from "src/app/ui/figures/character/dialogs/character-sheet-dialog";
import { ItemsDialogComponent } from "src/app/ui/figures/items/dialog/items-dialog";
import { PartySheetDialogComponent } from "src/app/ui/figures/party/party-sheet-dialog";
import { WorldMapComponent } from "src/app/ui/figures/party/world-map/world-map";
import { ScenarioChartDialogComponent } from "../../../figures/party/scenario-chart/scenario-chart";
import { PartyResourcesDialogComponent } from "src/app/ui/figures/party/resources/resources";


@Component({
	standalone: false,
    selector: 'ghs-campaign-menu',
    templateUrl: 'campaign.html',
    styleUrls: ['../menu.scss', 'campaign.scss']
})
export class CampaignMenuComponent implements OnInit {

    @Output() close = new EventEmitter();

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    GameState = GameState;
    conditions: Condition[] = [];
    amConditions: Condition[] = [];
    editionConditions: ConditionName[] = [];
    characters: Character[] = [];
    confirmPartyDelete: number = -1;
    confirmResetCampaign: boolean = false;
    worldMap: boolean = false;

    constructor(private dialog: Dialog) { }

    ngOnInit(): void {
        this.update();
    }

    update() {
        this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure as Character).sort((a, b) => {
            const aName = gameManager.characterManager.characterName(a).toLowerCase();
            const bName = gameManager.characterManager.characterName(b).toLowerCase();
            if (aName > bName) {
                return 1;
            }
            if (aName < bName) {
                return -1;
            }
            return 0;
        });

        this.conditions = Object.values(ConditionName).map((name) => new Condition(name)).filter((condition) => condition.types.indexOf(ConditionType.hidden) == -1);
        this.amConditions = Object.values(ConditionName).map((name) => new Condition(name)).filter((condition) => condition.types.indexOf(ConditionType.amDeck) != -1);
        this.editionConditions = gameManager.conditions(gameManager.game.edition, true).map((condition) => condition.name);
        this.worldMap = false;
        const editionData = gameManager.editionData.find((editionData) => editionData.edition == gameManager.game.edition);
        if (editionData) {
            if (editionData.worldMap || editionData.extendWorldMap) {
                this.worldMap = true;
            }
        }
    }

    setEdition(edition: string | undefined = undefined) {
        gameManager.stateManager.before(edition ? "setEdition" : "setEditionAll", edition ? "data.edition." + edition : '');
        if (settingsManager.settings.automaticTheme && settingsManager.settings.theme != 'modern') {
            if (edition == 'fh' || edition == 'bb') {
                settingsManager.set('theme', edition);
            } else {
                settingsManager.set('theme', 'default');
            }
        }
        gameManager.game.edition = edition;
        gameManager.game.party.edition = edition;
        this.update();
        gameManager.stateManager.after();
    }

    toggleCampaignMode() {
        gameManager.stateManager.before(gameManager.game.party.campaignMode ? "disablePartyCampaignMode" : "enablePartyCampaignMode");
        gameManager.game.party.campaignMode = !gameManager.game.party.campaignMode;
        gameManager.stateManager.after();
    }

    toggleCondition(condition: ConditionName) {
        if (this.editionConditions.indexOf(condition) == -1) {
            gameManager.stateManager.before(gameManager.game.conditions.indexOf(condition) == -1 ? 'addGameCondition' : 'removeGameCondition', condition);
            if (gameManager.game.conditions.indexOf(condition) == -1) {
                gameManager.game.conditions.push(condition);
            } else {
                gameManager.game.conditions = gameManager.game.conditions.filter((conditionName) => condition != conditionName);
            }
            gameManager.stateManager.after();
        }
    }

    openCharacterSheet(character: Character) {
        this.dialog.open(CharacterSheetDialog, {
            panelClass: ['dialog-invert'],
            data: { character: character }
        });
        this.close.emit();
    }

    openPartySheet() {
        this.dialog.open(PartySheetDialogComponent, {
            panelClass: ['dialog-invert'],
            data: { partySheet: true }
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

    openMap() {
        this.dialog.open(WorldMapComponent, {
            panelClass: ['fullscreen-panel'],
            backdropClass: ['fullscreen-backdrop'],
            data: gameManager.game.edition
        })
        this.close.emit();
    }

    openFlowChart() {
        this.dialog.open(ScenarioChartDialogComponent, {
            panelClass: ['fullscreen-panel'],
            backdropClass: ['fullscreen-backdrop'],
            data: {
                edition: gameManager.game.edition
            }
        })
        this.close.emit();
    }

    openBattleGoalsSetup() {
        this.dialog.open(BattleGoalSetupDialog, {
            panelClass: ['dialog']
        });
        this.close.emit();
    }

    openItems() {
        this.dialog.open(ItemsDialogComponent, {
            panelClass: ['dialog'],
            data: {
                edition: gameManager.game.edition
            }
        });
        this.close.emit();
    }

    openResources() {
        this.dialog.open(PartyResourcesDialogComponent, {
            panelClass: ['dialog']
        });
        this.close.emit();
    }

    addParty() {
        let party = new Party();
        let id = 0;
        while (gameManager.game.parties.some((party) => party.id == id)) {
            id++;
        }
        party.id = id;
        gameManager.stateManager.before("addParty", party.name || '%party% ' + party.id);
        gameManager.game.parties.push(party);
        gameManager.changeParty(party);
        this.update();
        gameManager.stateManager.after();
    }

    changeParty(party: Party) {
        gameManager.stateManager.before("changeParty", party.name || '%party% ' + party.id);
        gameManager.changeParty(party);
        this.update();
        gameManager.stateManager.after();
    }

    removeParty(party: Party) {
        if (gameManager.game.parties.length > 1) {
            if (this.confirmPartyDelete != party.id) {
                this.confirmPartyDelete = party.id;
            } else {
                gameManager.stateManager.before("removeParty", party.name || '%party% ' + party.id);
                gameManager.game.parties.splice(gameManager.game.parties.indexOf(party), 1);
                if (gameManager.game.party.id == party.id) {
                    gameManager.changeParty(gameManager.game.parties[0]);
                }
                this.update();
                gameManager.stateManager.after();
                this.cancelRemoveParty();
            }
        }
    }

    cancelRemoveParty() {
        this.confirmPartyDelete = -1;
    }

    setName(event: any) {
        if (gameManager.game.party.name != event.target.value) {
            gameManager.stateManager.before("setPartyName", event.target.value);
            gameManager.game.party.name = event.target.value;
            gameManager.stateManager.after();
        }
    }

    resetCampaign() {
        if (!this.confirmResetCampaign) {
            this.confirmResetCampaign = true;
        } else {
            gameManager.stateManager.before("resetCampaign");
            gameManager.resetCampaign();
            gameManager.stateManager.after();
            this.close.emit();
        }
    }

    cancelResetCampaign() {
        this.confirmResetCampaign = false;
    }
}