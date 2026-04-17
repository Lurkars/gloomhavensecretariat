import { Dialog } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Condition, ConditionName, ConditionType } from 'src/app/game/model/data/Condition';
import { GameState } from 'src/app/game/model/Game';
import { Party } from 'src/app/game/model/Party';
import { BattleGoalSetupDialog } from 'src/app/ui/figures/battlegoal/setup/battlegoal-setup';
import { CharacterSheetDialog } from 'src/app/ui/figures/character/dialogs/character-sheet-dialog';
import { EnhancementDialogComponent } from 'src/app/ui/figures/character/sheet/abilities/enhancements/enhancement-dialog';
import { EventCardDeckComponent } from 'src/app/ui/figures/event/deck/event-card-deck';
import { ItemsDialogComponent } from 'src/app/ui/figures/items/dialog/items-dialog';
import { PartySheetDialogComponent } from 'src/app/ui/figures/party/party-sheet-dialog';
import { PartyResourcesDialogComponent } from 'src/app/ui/figures/party/resources/resources';
import { ScenarioChartDialogComponent } from 'src/app/ui/figures/party/scenario-chart/scenario-chart';
import { WorldMapComponent } from 'src/app/ui/figures/party/world-map/world-map';
import { SettingMenuComponent } from 'src/app/ui/header/menu/settings/setting/setting';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TabClickDirective } from 'src/app/ui/helper/tabclick';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsTooltipDirective, TabClickDirective, TrackUUIDPipe, SettingMenuComponent],
  selector: 'ghs-campaign-menu',
  templateUrl: 'campaign.html',
  styleUrls: ['../menu.scss', 'campaign.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CampaignMenuComponent implements OnInit {
  @Output() closed = new EventEmitter();

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

  constructor(private dialog: Dialog) {}

  ngOnInit(): void {
    this.update();
  }

  update() {
    this.characters = gameManager.game.figures
      .filter((figure) => figure instanceof Character)
      .map((figure) => figure as Character)
      .sort((a, b) => {
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

    this.conditions = Object.values(ConditionName)
      .map((name) => new Condition(name))
      .filter((condition) => !condition.types.includes(ConditionType.hidden) && !condition.types.includes(ConditionType.special));
    this.amConditions = Object.values(ConditionName)
      .map((name) => new Condition(name))
      .filter((condition) => condition.types.includes(ConditionType.amDeck));
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
    gameManager.stateManager.before(edition ? 'setEdition' : 'setEditionAll', edition ? 'data.edition.' + edition : '');
    if (!!edition) {
      settingsManager.automaticTheme(edition, gameManager.game.edition);
    }
    gameManager.game.edition = edition;
    gameManager.game.party.edition = edition;
    this.update();
    gameManager.stateManager.after();
  }

  toggleCampaignMode() {
    gameManager.stateManager.before(gameManager.game.party.campaignMode ? 'disablePartyCampaignMode' : 'enablePartyCampaignMode');
    gameManager.game.party.campaignMode = !gameManager.game.party.campaignMode;
    gameManager.stateManager.after();
  }

  toggleCondition(condition: ConditionName) {
    if (!this.editionConditions.includes(condition)) {
      gameManager.stateManager.before(
        !gameManager.game.conditions.includes(condition) ? 'addGameCondition' : 'removeGameCondition',
        condition
      );
      if (!gameManager.game.conditions.includes(condition)) {
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
    this.closed.emit();
  }

  openPartySheet() {
    this.dialog.open(PartySheetDialogComponent, {
      panelClass: ['dialog-invert'],
      data: { partySheet: true }
    });
    this.closed.emit();
  }

  openCampaignSheet() {
    this.dialog.open(PartySheetDialogComponent, {
      panelClass: ['dialog-invert'],
      data: { campaign: true }
    });
    this.closed.emit();
  }

  openMap() {
    this.dialog.open(WorldMapComponent, {
      panelClass: ['fullscreen-panel'],
      backdropClass: ['fullscreen-backdrop'],
      data: { edition: gameManager.game.edition }
    });
    this.closed.emit();
  }

  openFlowChart() {
    this.dialog.open(ScenarioChartDialogComponent, {
      panelClass: ['fullscreen-panel'],
      backdropClass: ['fullscreen-backdrop'],
      data: {
        edition: gameManager.game.edition
      }
    });
    this.closed.emit();
  }

  openEnhancementDialog() {
    this.dialog.open(EnhancementDialogComponent, {
      panelClass: ['dialog']
    });
    this.closed.emit();
  }
  openEventDeckSetup() {
    this.dialog.open(EventCardDeckComponent, {
      panelClass: ['dialog'],
      data: {
        edition: gameManager.game.edition
      }
    });
    this.closed.emit();
  }

  openBattleGoalsSetup() {
    this.dialog.open(BattleGoalSetupDialog, {
      panelClass: ['dialog']
    });
    this.closed.emit();
  }

  openItems() {
    this.dialog.open(ItemsDialogComponent, {
      panelClass: ['dialog'],
      data: {
        edition: gameManager.game.edition
      }
    });
    this.closed.emit();
  }

  openResources() {
    this.dialog.open(PartyResourcesDialogComponent, {
      panelClass: ['dialog']
    });
    this.closed.emit();
  }

  addParty() {
    const party = new Party();
    let id = 0;
    while (gameManager.game.parties.some((party) => party.id == id)) {
      id++;
    }
    party.id = id;
    gameManager.stateManager.before('addParty', party.name || '%party% ' + party.id);
    gameManager.game.parties.push(party);
    gameManager.changeParty(party);
    this.update();
    gameManager.stateManager.after();
  }

  changeParty(party: Party) {
    gameManager.stateManager.before('changeParty', party.name || '%party% ' + party.id);
    gameManager.changeParty(party);
    this.update();
    gameManager.stateManager.after();
  }

  removeParty(party: Party) {
    if (gameManager.game.parties.length > 1) {
      if (this.confirmPartyDelete != party.id) {
        this.confirmPartyDelete = party.id;
      } else {
        gameManager.stateManager.before('removeParty', party.name || '%party% ' + party.id);
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
      gameManager.stateManager.before('setPartyName', event.target.value);
      gameManager.game.party.name = event.target.value;
      gameManager.stateManager.after();
    }
  }

  resetCampaign() {
    if (!this.confirmResetCampaign) {
      this.confirmResetCampaign = true;
    } else {
      gameManager.stateManager.before('resetCampaign');
      gameManager.resetCampaign();
      gameManager.stateManager.after();
      this.closed.emit();
    }
  }

  cancelResetCampaign() {
    this.confirmResetCampaign = false;
  }
}
