import { DialogRef } from "@angular/cdk/dialog";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character, GameCharacterModel } from "src/app/game/model/Character";
import { CampaignData, TownGuardPerk } from "src/app/game/model/data/EditionData";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { Identifier } from "src/app/game/model/Identifier";
import { LootType } from "src/app/game/model/Loot";

import { Party } from "src/app/game/model/Party";
import { GameScenarioModel, Scenario } from "src/app/game/model/Scenario";
import { ghsInputFullScreenCheck } from "../../helper/Static";

@Component({
  selector: 'ghs-party-sheet-dialog',
  templateUrl: 'party-sheet-dialog.html',
  styleUrls: ['./party-sheet-dialog.scss']
})
export class PartySheetDialogComponent implements OnInit {

  gameManager: GameManager = gameManager;
  ghsInputFullScreenCheck = ghsInputFullScreenCheck;
  party: Party;
  prosperitySteps = [3, 8, 14, 21, 29, 38, 49, 63];
  priceModifier: number = 0;
  campaign: boolean = false;
  doubleClickAddSuccess: any = null;

  scenarioEditions: string[] = [];
  scenarios: Record<string, ScenarioData[]> = {};

  fhSheet: boolean = false;
  csSheet: boolean = false;

  LootType = LootType;

  @ViewChild('treasureIndex') treasureIndex!: ElementRef;

  constructor(private dialogRef: DialogRef) {
    this.party = gameManager.game.party;
    this.update();
    gameManager.uiChange.subscribe({
      next: () => {
        if (this.party != gameManager.game.party) {
          this.party = gameManager.game.party;
          this.update();
        }
      }
    })
  }

  ngOnInit(): void {
    this.fhSheet = gameManager.fhRules();
    this.csSheet = !this.fhSheet && gameManager.editionRules('cs');
  }

  close() {
    this.dialogRef.close();
  }

  toggleCampaignMode() {
    gameManager.stateManager.before(this.party.campaignMode ? "disablePartyCampaignMode" : "enablePartyCampaignMode");
    this.party.campaignMode = !this.party.campaignMode;
    if (this.party.campaignMode) {
      gameManager.game.edition = this.party.edition;
    }
    gameManager.stateManager.after();
    this.update();
  }

  setName(event: any) {
    if (this.party.name != event.target.value) {
      gameManager.stateManager.before("setPartyName", event.target.value);
      this.party.name = event.target.value;
      gameManager.stateManager.after();
    }
  }

  setLocation(event: any) {
    if (this.party.location != event.target.value) {
      gameManager.stateManager.before("setPartyLocation", event.target.value);;
      this.party.location = event.target.value;
      gameManager.stateManager.after();
    }
  }

  setNotes(event: any) {
    if (this.party.notes != event.target.value) {
      gameManager.stateManager.before("setPartyNotes", event.target.value);
      this.party.notes = event.target.value;
      gameManager.stateManager.after();
    }
  }

  setAchievements(event: any) {
    if (this.party.achievements != event.target.value) {
      gameManager.stateManager.before("setPartyAchievements", event.target.value);
      this.party.achievements = event.target.value;
      gameManager.stateManager.after();
    }
  }

  setGlobalAchievements(event: any) {
    if (this.party.globalAchievements != event.target.value) {
      gameManager.stateManager.before("setGlobalAchievements", event.target.value);
      this.party.globalAchievements = event.target.value;
      gameManager.stateManager.after();
    }
  }

  setReputation(value: number) {
    if (this.party.reputation != value) {
      gameManager.stateManager.before("setPartyReputation", "" + value);
      if (value > 20) {
        value = 20
      } else if (value < -20) {
        value = -20;
      }
      this.party.reputation = value;
      gameManager.stateManager.after();
      this.update();
    }
  }

  characterPerks(characterModel: GameCharacterModel): number {
    if (characterModel.progress && characterModel.progress.perks && characterModel.progress.perks.length > 0) {
      return characterModel.progress.perks.reduce((a, b) => a + b);
    }

    return 0;
  }

  reactivateCharacter(characterModel: GameCharacterModel) {
    gameManager.stateManager.before("setRetired", "data.character." + characterModel.name, "" + false);
    let character = new Character(gameManager.getCharacterData(characterModel.name, characterModel.edition), characterModel.level);
    character.fromModel(characterModel);
    character.progress.retired = false;
    gameManager.game.figures.push(character);
    this.party.retirements.splice(this.party.retirements.indexOf(characterModel), 1);
    this.gameManager.stateManager.after();
  }

  removeParty() {
    if (gameManager.game.parties.length > 1) {
      gameManager.stateManager.before("removeParty", this.party.name || '%party% ' + this.party.id);
      gameManager.game.parties.splice(gameManager.game.parties.indexOf(this.party), 1);
      this.changeParty(gameManager.game.parties[0]);
      gameManager.stateManager.after();
    }
  }

  newParty() {
    let party = new Party();
    let id = 0;
    while (gameManager.game.parties.some((party) => party.id == id)) {
      id++;
    }
    party.id = id;
    gameManager.stateManager.before("addParty", party.name || '%party% ' + party.id);
    gameManager.game.parties.push(party);
    this.changeParty(party);
    gameManager.stateManager.after();
  }

  selectParty(event: any) {
    const party = gameManager.game.parties.find((party) => party.id == event.target.value);
    if (party) {
      gameManager.stateManager.before("changeParty", party.name || '%party% ' + party.id);
      this.changeParty(party);
      gameManager.stateManager.after();
    }
  }

  changeParty(party: Party) {
    this.party.characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => ((figure as Character).toModel()));
    this.party = party;
    gameManager.game.party = this.party;
    if (this.party.edition) {
      gameManager.game.edition = this.party.edition;
    }
    gameManager.game.figures = gameManager.game.figures.filter((figure) => !(figure instanceof Character));
    gameManager.scenarioManager.setScenario(undefined);
    party.characters.forEach((value) => {
      let character = new Character(gameManager.getCharacterData(value.name, value.edition), value.level);
      character.fromModel(value);
      gameManager.game.figures.push(character);
    });
    this.update();
  }

  setDonations(value: number) {
    if (this.party.donations == value) {
      value--;
    }
    if (value < 0) {
      value = 0;
    }

    gameManager.stateManager.before("setPartyDonations", "" + value);
    this.party.donations = value;
    gameManager.stateManager.after();
  }

  setProsperity(value: number) {
    if (this.party.prosperity == value) {
      value--;
    }
    if (value > 64) {
      value = 64
    } else if (value < 0) {
      value = 0;
    }

    gameManager.stateManager.before("setPartyProsperity", "" + value);
    this.party.prosperity = value;
    gameManager.stateManager.after();
  }

  exportParty() {
    const downloadButton = document.createElement('a');
    downloadButton.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.party)));
    downloadButton.setAttribute('download', (this.party.name ? this.party.name + "_" : "") + "party-sheet.json");
    document.body.appendChild(downloadButton);
    downloadButton.click();
    document.body.removeChild(downloadButton);
  }

  importParty(event: any) {
    const parent = event.target.parentElement;
    parent.classList.remove("error");
    try {
      const reader = new FileReader();
      reader.addEventListener('load', (event: any) => {
        gameManager.stateManager.before("importParty");
        gameManager.game.party = Object.assign(new Party(), JSON.parse(event.target.result));
        if (!this.gameManager.game.party) {
          parent.classList.add("error");
        } else {
          this.party = gameManager.game.party;
        }
        gameManager.stateManager.after();
      });

      reader.readAsText(event.target.files[0]);
    } catch (e: any) {
      console.warn(e);
      parent.classList.add("error");
    }
  }

  countFinished(scenarioData: ScenarioData): number {
    return this.party.scenarios.filter((value) => scenarioData.index == value.index && scenarioData.edition == value.edition && scenarioData.group == value.group).length;
  }

  isManual(scenarioData: ScenarioData): boolean {
    return this.party.manualScenarios.find((value) => scenarioData.index == value.index && scenarioData.edition == value.edition && scenarioData.group == value.group) != undefined;
  }

  blocked(scenarioData: ScenarioData): boolean {
    return gameManager.scenarioManager.isBlocked(scenarioData);
  }

  addSuccess(scenarioData: ScenarioData) {
    if (!this.blocked(scenarioData) || this.doubleClickAddSuccess) {
      clearTimeout(this.doubleClickAddSuccess);
      this.doubleClickAddSuccess = null;
      this.addSuccessIntern(scenarioData);
    } else {
      this.doubleClickAddSuccess = setTimeout(() => {
        if (this.doubleClickAddSuccess) {
          this.doubleClickAddSuccess = null;
        }
      }, 200)
    }
  }

  addSuccessIntern(scenarioData: ScenarioData) {
    gameManager.stateManager.before("finishScenario.success", ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(scenarioData)));
    this.party.scenarios.push(new GameScenarioModel(scenarioData.index, scenarioData.edition, scenarioData.group, false, "", []));
    gameManager.stateManager.after();

    this.update();
  }

  removeSuccess(scenarioData: ScenarioData) {
    const value = this.party.scenarios.find((value) => value.index == scenarioData.index && value.edition == scenarioData.edition && value.group == scenarioData.group);
    if (value) {
      gameManager.stateManager.before("finishScenario.remove", ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(scenarioData)));
      this.party.scenarios.splice(this.party.scenarios.indexOf(value), 1);
      gameManager.stateManager.after();
    }
    this.update();
  }

  removeManual(scenarioData: ScenarioData) {
    const value = this.party.manualScenarios.find((value) => value.index == scenarioData.index && value.edition == scenarioData.edition && value.group == scenarioData.group);
    if (value) {
      gameManager.stateManager.before("removeManualScenario", ...gameManager.scenarioManager.scenarioUndoArgs(new Scenario(scenarioData)));
      this.party.manualScenarios.splice(this.party.manualScenarios.indexOf(value), 1);
      gameManager.stateManager.after();
    }
    this.update();
  }

  maxScenario(scenarios: ScenarioData[]) {
    return Math.max(...scenarios.map((scenarioData) => scenarioData.index.length));
  }

  changeEdition(event: any) {
    this.party.edition = event.target.value != 'undefined' && event.target.value || undefined;
    if (this.party.campaignMode) {
      gameManager.stateManager.before("setEdition", "data.edition." + this.party.edition);
      gameManager.game.edition = this.party.edition;
      gameManager.stateManager.after();
    }
    this.update();
  }

  update(): void {
    const editions = this.party.edition && [this.party.edition] || gameManager.editions();
    this.scenarioEditions = [];
    editions.forEach((edition) => {
      let scenarioData = gameManager.scenarioManager.scenarioData(edition).filter((scenarioData) => (!scenarioData.spoiler || settingsManager.settings.spoilers.indexOf(scenarioData.name) != -1 || scenarioData.solo && settingsManager.settings.spoilers.indexOf(scenarioData.solo) != -1));
      if (scenarioData.length > 0) {
        this.scenarios[edition] = scenarioData.sort((a, b) => {
          if (a.group && !b.group) {
            return 1;
          } else if (!a.group && b.group) {
            return -1;
          } else if (a.group && b.group) {
            return a.group < b.group ? -1 : 1;
          }

          if (!isNaN(+a.index) && !isNaN(+b.index)) {
            return +a.index - +b.index;
          }

          return a.index.toLowerCase() < b.index.toLowerCase() ? -1 : 1
        });
        this.scenarioEditions.push(edition);
      }
    });

    if (this.party.reputation >= 0) {
      this.priceModifier = Math.ceil((this.party.reputation - 2) / 4) * -1;
    } else {
      this.priceModifier = Math.floor((this.party.reputation + 2) / 4) * -1;
    }
  }

  characterIcon(name: string): string {
    const char = gameManager.charactersData().find((characterData) => characterData.name == name);
    if (char) {
      return gameManager.characterManager.characterIcon(char);
    }
    return "";
  }

  treasures(): Identifier[] {
    return this.party.treasures.filter((identifier) => !this.party.edition || identifier.edition == this.party.edition).sort((a, b) => {
      if (!this.party.edition && a.edition != b.edition) {
        return gameManager.editions().indexOf(a.edition) - gameManager.editions().indexOf(b.edition);
      }

      return +a.name - +b.name;
    });
  }

  addTreasure(treasure: string, edition: string) {
    gameManager.stateManager.before("addTreasure", edition, treasure);
    this.party.treasures = this.party.treasures || [];
    this.party.treasures.push(new Identifier(treasure, edition));
    this.treasureIndex.nativeElement.value = "0";
    gameManager.stateManager.after();
  }

  hasTreasure(treasure: string, edition: string): boolean {
    return this.party.treasures.some((identifier) => identifier.name == treasure && identifier.edition == edition);
  }

  removeTreasure(treasure: Identifier) {
    gameManager.stateManager.before("removeTreasure", treasure.edition, treasure.name);
    this.party.treasures.splice(this.party.treasures.indexOf(treasure), 1);
    gameManager.stateManager.after();
  }

  campaignData(): CampaignData | undefined {
    const editionData = gameManager.editionData.find((editionData) => editionData.edition == gameManager.currentEdition());

    if (editionData && editionData.campaign) {
      return editionData.campaign;
    }

    return undefined;
  }

  sectionsForWeek(week: number): string[] {
    const campaign = this.campaignData();
    if (campaign && campaign.weeks && campaign.weeks[week + 1]) {
      return campaign.weeks[week + 1] || [];
    }
    return [];
  }

  townGuardPerks(): TownGuardPerk[] {
    const campaign = this.campaignData();

    if (campaign && campaign.townGuardPerks) {
      return campaign.townGuardPerks;
    }

    return [];
  }

  setWeek(value: number) {
    if (this.party.weeks == value) {
      value--;
    }
    if (value < 0) {
      value = 0;
    }

    gameManager.stateManager.before("setPartyWeeks", "" + value);
    this.party.weeks = value;
    gameManager.stateManager.after();
  }

  setResource(type: LootType, event: any) {
    if (!isNaN(+event.target.value)) {
      gameManager.stateManager.before("setPartyResource", this.party.name, "game.loot." + type, event.target.value);
      this.party.loot[type] = +event.target.value;
      this.gameManager.stateManager.after();
    }
  }

  setInspiration(event: any) {
    if (!isNaN(+event.target.value) && this.party.inspiration != +event.target.value) {
      gameManager.stateManager.before("setPartyInspiration", this.party.name, event.target.value);
      this.party.inspiration = +event.target.value;
      this.gameManager.stateManager.after();
    }
  }

  setTotalDefense(event: any) {
    if (!isNaN(+event.target.value) && this.party.defense != +event.target.value) {
      gameManager.stateManager.before("setPartyTotalDefense", this.party.name, event.target.value);
      this.party.defense = +event.target.value;
      this.gameManager.stateManager.after();
    }
  }

  setSoldiers(value: number) {
    if (this.party.soldiers == value) {
      value--;
    }
    if (value < 0) {
      value = 0;
    }

    gameManager.stateManager.before("setPartySoldiers", "" + value);
    this.party.soldiers = value;
    gameManager.stateManager.after();
  }

  setMorale(value: number) {
    if (this.party.morale == value) {
      value--;
    }
    if (value < 0) {
      value = 0;
    }

    gameManager.stateManager.before("setPartyMorale", "" + value);
    this.party.morale = value;
    gameManager.stateManager.after();
  }

  setTownGuardPerks(value: number) {
    if (this.party.townGuardPerks == value) {
      value--;
    }
    if (value < 0) {
      value = 0;
    }

    gameManager.stateManager.before("setPartyTownGuardPerks", "" + value);
    this.party.townGuardPerks = value;
    gameManager.stateManager.after();
  }

  toggleTownGuardPerkSection(section: string, force: boolean = false) {
    this.party.townGuardPerkSections = this.party.townGuardPerkSections || [];
    const index = this.party.townGuardPerkSections.indexOf(section);
    if (index != -1 || this.party.townGuardPerkSections.length < Math.floor(this.party.townGuardPerks / 3) || force) {
      gameManager.stateManager.before(index == -1 ? "addPartyTownGuardPerkSection" : "removePartyTownGuardPerkSection", section);
      if (index == -1) {
        this.party.townGuardPerkSections.push(section);
      } else {
        this.party.townGuardPerkSections.splice(index, 1);
      }
      gameManager.stateManager.after();
    }
  }

  addCampaignSticker(campaignStickerElement: HTMLInputElement) {
    const sticker = campaignStickerElement.value;
    this.party.campaignStickers = this.party.campaignStickers || [];
    if (this.party.campaignStickers.indexOf(sticker) == -1) {
      gameManager.stateManager.before("addCampaignSticker", sticker);
      this.party.campaignStickers.push(sticker);
      campaignStickerElement.value = "";
      gameManager.stateManager.after();
    }
  }

  removeCampaignSticker(campaignSticker: string) {
    const index = this.party.campaignStickers.indexOf(campaignSticker);
    if (index != -1) {
      gameManager.stateManager.before("removeCampaignSticker", campaignSticker);
      this.party.campaignStickers.splice(index, 1);
      gameManager.stateManager.after();
    }
  }

  campaignStickerImage(campaignSticker: string): string | undefined {
    const campaign = this.campaignData();
    const sticker = campaignSticker.toLowerCase().replaceAll(' ', '-');
    if (campaign && campaign.campaignStickers && campaign.campaignStickers.indexOf(sticker) != -1) {
      return './assets/images/fh/party/campaign-stickers/' + sticker + '.png';
    }
    return undefined;
  }

}
