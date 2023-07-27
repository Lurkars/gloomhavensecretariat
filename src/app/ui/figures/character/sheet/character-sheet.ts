import { Dialog } from "@angular/cdk/dialog";
import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character, GameCharacterModel } from "src/app/game/model/Character";
import { CharacterProgress } from "src/app/game/model/CharacterProgress";
import { GameState } from "src/app/game/model/Game";
import { LootType } from "src/app/game/model/data/Loot";
import { PerkType } from "src/app/game/model/data/Perks";
import { ghsInputFullScreenCheck, ghsValueSign } from "src/app/ui/helper/Static";
import { CharacterMoveResourcesDialog } from "./move-resources";


@Component({
  selector: 'ghs-character-sheet',
  templateUrl: 'character-sheet.html',
  styleUrls: ['./character-sheet.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CharacterSheetComponent implements OnInit, AfterViewInit {

  @Input() character!: Character;
  @Input() standalone: boolean = false;

  @ViewChild('charactertitle', { static: false }) titleInput!: ElementRef;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  ghsInputFullScreenCheck = ghsInputFullScreenCheck;
  GameState = GameState;
  PerkType = PerkType;
  LootType = LootType;
  availablePerks: number = 0;
  perksWip: boolean = true;
  priceModifier: number = 0;
  retired: boolean = false;

  goldTimeout: any = null;
  xpTimeout: any = null;

  fhSheet: boolean = false;
  csSheet: boolean = false;

  donations: boolean = true;

  titles: string[] = [];

  constructor(private dialog: Dialog) { }

  ngOnInit(): void {
    this.retired = this.character.progress.retired;
    if (this.character.identities && this.character.identities.length > 1 && settingsManager.settings.characterIdentities) {
      this.titles = this.character.title.split('|');
      if (this.titles.length < this.character.identities.length) {
        for (let i = this.titles.length; i < this.character.identities.length; i++) {
          this.titles.push('');
        }
      }
      for (let i = 0; i < this.titles.length; i++) {
        if (!this.titles[i]) {
          this.titles[i] = settingsManager.getLabel('data.character.' + this.character.name.toLowerCase());
        }
      }
    }

    if (!this.character.progress) {
      this.character.progress = new CharacterProgress();
    }

    this.character.progress.perks = this.character.progress.perks || [];

    this.fhSheet = gameManager.fhRules();
    this.csSheet = !this.fhSheet && gameManager.editionRules('cs');

    this.donations = !this.fhSheet;

    for (let i = 0; i < 15; i++) {
      if (!this.character.progress.perks[i]) {
        this.character.progress.perks[i] = 0;
      }
    }

    if (this.fhSheet) {
      for (let value in LootType) {
        const lootType: LootType = value as LootType;
        this.character.progress.loot[lootType] = this.character.progress.loot[lootType] || 0;
      }

      if (gameManager.game.party.buildings.find((buildingModel) => buildingModel.name == 'temple' && buildingModel.level > 0 && buildingModel.state == 'normal')) {
        this.donations = true;
      }
    }

    if (this.character.progress.experience < gameManager.characterManager.xpMap[this.character.level - 1]) {
      this.character.progress.experience = gameManager.characterManager.xpMap[this.character.level - 1];
    }

    this.availablePerks = this.character.level + Math.floor(this.character.progress.battleGoals / 3) - (this.character.progress.perks && this.character.progress.perks.length > 0 ? this.character.progress.perks.reduce((a, b) => a + b) : 0) - 1 + this.character.progress.extraPerks + this.character.progress.retirements + this.character.progress.masteries.length;

    this.perksWip = this.character.perks.length == 0 || this.character.perks.map((perk) => perk.count).reduce((a, b) => a + b) != (this.character.edition == 'fh' ? 18 : 15);

    gameManager.uiChange.subscribe({
      next: () => {
        this.availablePerks = this.character.level + Math.floor(this.character.progress.battleGoals / 3) - (this.character.progress.perks && this.character.progress.perks.length > 0 ? this.character.progress.perks.reduce((a, b) => a + b) : 0) - 1 + this.character.progress.extraPerks + this.character.progress.retirements + this.character.progress.masteries.length;

        for (let i = 0; i < 15; i++) {
          if (!this.character.progress.perks[i]) {
            this.character.progress.perks[i] = 0;
          }
        }
      }
    })
  }

  applyValues() {
    let title = "";

    if (this.titleInput) {
      title = this.titleInput.nativeElement.value;
    }

    if (this.titles.length > 0) {
      for (let i = 0; i < this.titles.length; i++) {
        if (this.titles[i] == settingsManager.getLabel('data.character.' + this.character.name.toLowerCase())) {
          this.titles[i] = '';
        }
      }

      title = this.titles.join('|');
      while (title.endsWith('|')) {
        title = title.substring(0, title.length - 1);
      }
    }

    if (title != settingsManager.getLabel('data.character.' + this.character.name.toLowerCase())) {
      if (this.character.title != title) {
        gameManager.stateManager.before("setTitle", "data.character." + this.character.name, title);
        this.character.title = title;
        gameManager.stateManager.after();
      }
    } else if (this.character.title != "") {
      gameManager.stateManager.before("unsetTitle", "data.character." + this.character.name, this.character.title);
      this.character.title = "";
      gameManager.stateManager.after();
    }


    if (this.retired != this.character.progress.retired) {
      gameManager.stateManager.before("setRetired", "data.character." + this.character.name, "" + !this.character.progress.retired);
      this.character.progress.retired = this.retired;
      if (this.retired && gameManager.game.party.campaignMode) {
        gameManager.game.party.retirements.push(this.character.toModel());
        // add items to available pool (except solo)
        this.character.progress.items.forEach((item) => {
          const itemData = gameManager.itemManager.getItem(+item.name, item.edition, true);
          if (itemData && !itemData.solo && !gameManager.itemData(item.edition).find((available) => available.id == itemData.id && available.edition == itemData.edition)) {
            gameManager.game.party.unlockedItems.push(item);
          }
        })
        gameManager.characterManager.removeCharacter(this.character);
      }
      gameManager.stateManager.after();
    }
  }

  titleChange() {
    if (this.standalone) {
      this.applyValues();
    }
  }

  toggleRetired() {
    this.retired = !this.retired;
    if (this.standalone) {
      this.applyValues();
    }
  }

  ngAfterViewInit(): void {
    if (this.titleInput) {
      this.titleInput.nativeElement.value = this.character.title || settingsManager.getLabel('data.character.' + this.character.name.toLowerCase());
    }
  }

  toggleCharacterAbsent() {
    if (this.character.absent || gameManager.characterManager.characterCount() > 1) {
      gameManager.stateManager.before(this.character.absent ? "unsetAbsent" : "setAbsent", "data.character." + this.character.name);
      this.character.absent = !this.character.absent;
      if (this.character.absent && this.character.active) {
        gameManager.roundManager.toggleFigure(this.character);
      }
      gameManager.stateManager.after();
    }
  }

  setTitle(event: any, index: number) {
    this.titles[index] = event.target.value;
    this.titleChange();
  }

  setLevel(level: number) {
    if (this.character.level == level) {
      level--;
    }
    if (level < 1) {
      level = 1;
    } else if (level > 9) {
      level = 9;
    }
    gameManager.stateManager.before("setLevel", "data.character." + this.character.name, "" + level);
    gameManager.characterManager.setLevel(this.character, level);
    gameManager.stateManager.after();
  }

  setXP(event: any) {
    if (!isNaN(+event.target.value) && this.character.progress.experience != +event.target.value) {
      if (this.xpTimeout) {
        clearTimeout(this.xpTimeout);
        this.xpTimeout = null;
      }
      this.xpTimeout = setTimeout(() => {
        gameManager.stateManager.before("setXP", "data.character." + this.character.name, ghsValueSign(+event.target.value - this.character.progress.experience));
        gameManager.characterManager.addXP(this.character, event.target.value - this.character.progress.experience, !gameManager.game.scenario && gameManager.game.round == 0);
        gameManager.stateManager.after();
        this.xpTimeout = null;
      }, 500);
    }
  }

  setGold(event: any) {
    if (!isNaN(+event.target.value) && this.character.progress.gold != +event.target.value) {
      if (this.goldTimeout) {
        clearTimeout(this.goldTimeout);
        this.goldTimeout = null;
      }
      this.goldTimeout = setTimeout(() => {
        gameManager.stateManager.before("setGold", "data.character." + this.character.name, event.target.value);
        this.character.progress.gold = +event.target.value;
        gameManager.stateManager.after();
        this.goldTimeout = null;
      }, 500);
    }
  }

  setResource(type: LootType, event: any) {
    if (!isNaN(+event.target.value)) {
      gameManager.stateManager.before("setResource", "data.character." + this.character.name, "game.loot." + type, event.target.value);
      this.character.progress.loot[type] = +event.target.value;
      gameManager.stateManager.after();
    }
  }

  donate() {
    if (gameManager.game.round < 1 && this.character.progress.gold > 9) {
      gameManager.stateManager.before("donate", "data.character." + this.character.name);
      this.character.progress.donations += 1;
      this.character.donations += 1;
      gameManager.game.party.donations += 1;
      this.character.progress.gold -= this.fhSheet ? 5 : 10;
      gameManager.stateManager.after();
    }
  }

  setPersonalQuest(event: any) {
    if (!isNaN(+event.target.value) && this.character.progress.personalQuest != +event.target.value) {
      gameManager.stateManager.before("setPQ", "data.character." + this.character.name, event.target.value);
      this.character.progress.personalQuest = +event.target.value;
      gameManager.stateManager.after();
    }
  }

  setExtraPerks(event: any) {
    if (!isNaN(+event.target.value) && this.character.progress.extraPerks != +event.target.value) {
      gameManager.stateManager.before("setExtraPerks", "data.character." + this.character.name, event.target.value);
      this.character.progress.extraPerks = +event.target.value;
      gameManager.stateManager.after();
    }
  }

  setRetirements(event: any) {
    if (!isNaN(+event.target.value) && this.character.progress.retirements != +event.target.value) {
      gameManager.stateManager.before("setRetirements", "data.character." + this.character.name, event.target.value);
      this.character.progress.retirements = +event.target.value;
      gameManager.stateManager.after();
    }
  }

  setPlayerNumber(event: any) {
    if (!isNaN(+event.target.value) && this.character.number != +event.target.value && (+event.target.value > 0)) {
      gameManager.stateManager.before("setPlayerNumber", "data.character." + this.character.name, event.target.value);
      const existing = gameManager.game.figures.find((figure) => figure instanceof Character && figure.number == +event.target.value);
      if (existing) {
        (existing as Character).number = this.character.number;
      }
      this.character.number = +event.target.value;
      gameManager.stateManager.after();
    }
  }

  setBattleGoals(battleGoals: number) {
    if (this.character.progress.battleGoals == battleGoals) {
      battleGoals--;
    }
    if (battleGoals < 0) {
      battleGoals = 0;
    } else if (battleGoals > 18) {
      battleGoals = 18;
    }
    if (this.character.progress.battleGoals != battleGoals) {
      gameManager.stateManager.before("setBG", "data.character." + this.character.name, "" + battleGoals);
      this.character.progress.battleGoals = battleGoals;
      gameManager.stateManager.after();
    }
  }

  setNotes(event: any) {
    if (this.character.progress.notes != event.target.value) {
      gameManager.stateManager.before("setNotes", "data.character." + this.character.name, event.target.value);
      this.character.progress.notes = event.target.value;
      gameManager.stateManager.after();
    }
  }

  toggleMastery(index: number) {
    if (!this.character.progress.masteries) {
      this.character.progress.masteries = [];
    }

    if (this.character.progress.masteries.indexOf(index) == -1) {
      gameManager.stateManager.before("addMastery", "data.character." + this.character.name, "" + index);
      this.character.progress.masteries.push(index);
    } else {
      gameManager.stateManager.before("removeMastery", "data.character." + this.character.name, "" + index);
      this.character.progress.masteries.splice(this.character.progress.masteries.indexOf(index), 1);
    }
    gameManager.stateManager.after();
  }

  addPerk(index: number, value: number, force: boolean = false) {
    const disabled: boolean = gameManager.game.state != GameState.draw || gameManager.game.round > 0 || this.character.progress.perks[index] < value && this.availablePerks < value - this.character.progress.perks[index];

    if (!disabled || force) {
      gameManager.stateManager.before("setPerk", "data.character." + this.character.name, "" + index, "" + value);
      if (this.character.progress.perks[index] && this.character.progress.perks[index] == value) {
        this.character.progress.perks[index]--;
      } else {
        this.character.progress.perks[index] = value;
      }
      this.character.mergeAttackModifierDeck(gameManager.attackModifierManager.buildCharacterAttackModifierDeck(this.character));
      gameManager.attackModifierManager.shuffleModifiers(this.character.attackModifierDeck);
      gameManager.stateManager.after();
    }
  }

  moveResources() {
    this.dialog.open(CharacterMoveResourcesDialog, {
      panelClass: 'dialog',
      data: this.character
    });
  }

  exportCharacter() {
    const downloadButton = document.createElement('a');
    downloadButton.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.character.toModel())));
    downloadButton.setAttribute('download', (this.character.title ? this.character.title + "_" : "") + this.character.name + ".json");
    document.body.appendChild(downloadButton);
    downloadButton.click();
    document.body.removeChild(downloadButton);
  }

  importCharacter(event: any) {
    const parent = event.target.parentElement;
    parent.classList.remove("error");
    try {
      const reader = new FileReader();
      reader.addEventListener('load', (event: any) => {
        const characterModel: GameCharacterModel = Object.assign(new Character(this.character, this.character.level).toModel(), JSON.parse(event.target.result));
        if (characterModel.name != this.character.name || characterModel.edition != this.character.edition) {
          parent.classList.add("error");
        } else {
          gameManager.stateManager.before("importCharacter", "data.character." + this.character.name);
          this.character.fromModel(characterModel);
          gameManager.stateManager.after();
        }
      });

      reader.readAsText(event.target.files[0]);
    } catch (e: any) {
      console.warn(e);
      parent.classList.add("error");
    }
  }
}