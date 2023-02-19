import { Dialog, DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { CharacterManager } from "src/app/game/businesslogic/CharacterManager";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";

import { Character, GameCharacterModel } from "src/app/game/model/Character";
import { CharacterProgress } from "src/app/game/model/CharacterProgress";
import { ItemData } from "src/app/game/model/data/ItemData";
import { GameState } from "src/app/game/model/Game";
import { Identifier } from "src/app/game/model/Identifier";
import { LootType } from "src/app/game/model/Loot";
import { PerkType } from "src/app/game/model/Perks";
import { ghsInputFullScreenCheck, ghsValueSign } from "src/app/ui/helper/Static";
import { CharacterMoveResourcesDialog } from "./move-resources";


@Component({
  selector: 'ghs-character-sheet',
  templateUrl: 'character-sheet.html',
  styleUrls: ['./character-sheet.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CharacterSheetDialog implements OnInit, AfterViewInit {

  @ViewChild('charactertitle', { static: false }) titleInput!: ElementRef;
  @ViewChild('itemEdition', { static: false }) itemEdition!: ElementRef;

  gameManager: GameManager = gameManager;
  ghsInputFullScreenCheck = ghsInputFullScreenCheck;
  GameState = GameState;
  characterManager: CharacterManager = gameManager.characterManager;
  PerkType = PerkType;
  LootType = LootType;
  availablePerks: number = 0;
  perksWip: boolean = true;
  items: ItemData[] = [];
  item: ItemData | undefined;
  itemCanAdd: boolean = false;
  priceModifier: number = 0;
  itemIndex: number = 1;
  retired: boolean = false;

  goldTimeout: any = null;
  xpTimeout: any = null;

  fhSheet: boolean = false;
  csSheet: boolean = false;

  constructor(@Inject(DIALOG_DATA) public character: Character, private dialogRef: DialogRef, private dialog: Dialog) {
    this.retired = character.progress.retired;
    this.dialogRef.closed.subscribe({
      next: () => {
        if (this.titleInput) {
          if (this.titleInput.nativeElement.value && this.titleInput.nativeElement.value != settingsManager.getLabel('data.character.' + this.character.name.toLowerCase())) {
            if (this.character.title != this.titleInput.nativeElement.value) {
              gameManager.stateManager.before("setTitle", "data.character." + this.character.name, this.titleInput.nativeElement.value);
              this.character.title = this.titleInput.nativeElement.value;
              gameManager.stateManager.after();
            }
          } else if (this.character.title != "") {
            gameManager.stateManager.before("unsetTitle", "data.character." + this.character.name, this.character.title);
            this.character.title = "";
            gameManager.stateManager.after();
          }
        }

        if (this.itemEdition) {
          this.itemEdition.nativeElement.value = this.character.edition;
        }

        if (this.retired != this.character.progress.retired) {
          gameManager.stateManager.before("setRetired", "data.character." + this.character.name, "" + !this.character.progress.retired);
          this.character.progress.retired = this.retired;
          if (this.retired && gameManager.game.party.campaignMode) {
            gameManager.game.party.retirements.push(this.character.toModel());
            gameManager.characterManager.removeCharacter(this.character);
          }
          gameManager.stateManager.after();
        }
      }
    });
  }

  ngOnInit(): void {
    if (!this.character.progress) {
      this.character.progress = new CharacterProgress();
    }

    this.character.progress.perks = this.character.progress.perks || [];

    this.fhSheet = gameManager.fhRules();
    this.csSheet = !this.fhSheet && gameManager.editionRules('cs');

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
    }

    if (this.character.progress.experience < this.characterManager.xpMap[this.character.level - 1]) {
      this.character.progress.experience = this.characterManager.xpMap[this.character.level - 1];
    }

    this.availablePerks = this.character.level + Math.floor(this.character.progress.battleGoals / 3) - (this.character.progress.perks && this.character.progress.perks.length > 0 ? this.character.progress.perks.reduce((a, b) => a + b) : 0) - 1 + this.character.progress.retirements + this.character.progress.masteries.length;

    this.perksWip = this.character.perks.length == 0 || this.character.perks.map((perk) => perk.count).reduce((a, b) => a + b) != (this.character.edition == 'fh' ? 18 : 15);

    this.updateItems();
    this.itemChange();

    gameManager.uiChange.subscribe({
      next: () => {
        this.availablePerks = this.character.level + Math.floor(this.character.progress.battleGoals / 3) - (this.character.progress.perks && this.character.progress.perks.length > 0 ? this.character.progress.perks.reduce((a, b) => a + b) : 0) - 1 + this.character.progress.retirements + this.character.progress.masteries.length;

        for (let i = 0; i < 15; i++) {
          if (!this.character.progress.perks[i]) {
            this.character.progress.perks[i] = 0;
          }
        }

        this.updateItems();
      }
    })
  }

  ngAfterViewInit(): void {
    this.titleInput.nativeElement.value = this.character.title || settingsManager.getLabel('data.character.' + this.character.name.toLowerCase());
    if (this.itemEdition) {
      this.itemEdition.nativeElement.value = this.character.edition;
    }
    this.itemIndex = 1;
  }

  close() {
    this.dialogRef.close();
  }

  updateItems() {
    this.items = [];
    if (this.character.progress.items) {
      this.character.progress.items.forEach((item) => {
        const itemData = gameManager.item(+item.name, item.edition);
        if (itemData) {
          this.items.push(itemData);
        } else {
          console.warn("Unknown Item for edition '" + item.edition + "': " + item.name);
        }
      });

      this.items.sort((a, b) => a.id - b.id);

      if (gameManager.game.party.reputation >= 0) {
        this.priceModifier = Math.ceil((gameManager.game.party.reputation - 2) / 4) * -1;
      } else {
        this.priceModifier = Math.floor((gameManager.game.party.reputation + 2) / 4) * -1;
      }
    }
  }

  toggleCharacterAbsent() {
    if (this.character.absent || gameManager.game.figures.filter((figure) => figure instanceof Character && !figure.absent).length > 1) {
      gameManager.stateManager.before(this.character.absent ? "unsetAbsent" : "setAbsent", "data.character." + this.character.name);
      this.character.absent = !this.character.absent;
      if (this.character.absent && this.character.active) {
        gameManager.roundManager.toggleFigure(this.character);
      }
      gameManager.stateManager.after();
    }
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
    this.characterManager.setLevel(this.character, level);
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
        this.characterManager.addXP(this.character, event.target.value - this.character.progress.experience, !gameManager.game.scenario && gameManager.game.round == 0);
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
      this.character.progress.gold -= 10;
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

  itemChange(itemIndexChange: number = 0) {

    if (itemIndexChange != 0) {
      this.itemIndex += itemIndexChange;
      this.item = gameManager.item(this.itemIndex, this.itemEdition && this.itemEdition.nativeElement.value || this.character.edition);
      while (!this.item && this.itemIndex > 0 && this.itemIndex < gameManager.maxItemIndex(this.itemEdition && this.itemEdition.nativeElement.value || this.character.edition)) {
        this.itemIndex += itemIndexChange;
        this.item = gameManager.item(this.itemIndex, this.itemEdition && this.itemEdition.nativeElement.value || this.character.edition);
      }
    } else {
      this.item = gameManager.item(this.itemIndex, this.itemEdition && this.itemEdition.nativeElement.value || this.character.edition);
    }

    this.itemCanAdd = false;
    if (this.item) {
      const soldItems = gameManager.game.figures.filter((figure) => figure instanceof Character && figure.progress && figure.progress.items).map((figure) => figure as Character).map((figure) => figure.progress && figure.progress.items).reduce((pre, cur): Identifier[] => {
        return pre && cur && pre.concat(cur);
      }).filter((item) => this.item && item.name == this.item.id + "" && item.edition == this.item.edition).length;
      if (this.item.count && soldItems < this.item.count) {
        this.itemCanAdd = true;
      }
    } else {
      this.itemCanAdd = true;
    }
  }

  addItem() {
    this.itemChange();
    if (this.item && this.itemCanAdd) {
      gameManager.stateManager.before("addItem", "data.character." + this.character.name, this.itemIndex + "", this.itemEdition.nativeElement.value);
      this.character.progress.items.push(new Identifier(this.itemIndex + "", this.itemEdition.nativeElement.value));
      this.items.push(this.item);
      this.items.sort((a, b) => a.id - b.id);
      this.itemIndex = 1;
      gameManager.stateManager.after();
      this.itemChange();
    }
  }

  buyItem() {
    this.itemChange();
    if (this.item && (this.item.cost + this.priceModifier) <= this.character.progress.gold) {
      gameManager.stateManager.before("buyItem", "data.character." + this.character.name, this.itemIndex + "", this.itemEdition.nativeElement.value);
      this.character.progress.gold -= (this.item.cost + this.priceModifier);
      this.character.progress.items.push(new Identifier(this.itemIndex + "", this.itemEdition.nativeElement.value));
      this.items.push(this.item);
      this.items.sort((a, b) => a.id - b.id);
      this.itemIndex = 1;
      gameManager.stateManager.after();
      this.itemChange();
    }
  }

  removeItem(itemData: ItemData) {
    const item = this.character.progress.items.find((item) => item.name == "" + itemData.id && item.edition == itemData.edition);
    if (item) {
      const index = this.character.progress.items.indexOf(item)
      gameManager.stateManager.before("removeItem", "data.character." + this.character.name, this.character.progress.items[index].name, this.character.progress.items[index].edition);
      this.character.progress.items.splice(index, 1);
      this.items.splice(index, 1);
      gameManager.stateManager.after();
      this.itemChange();
    }
  }

  sellItem(itemData: ItemData) {
    const item = this.character.progress.items.find((item) => item.name == "" + itemData.id && item.edition == itemData.edition);
    if (item && itemData.cost) {
      const index = this.character.progress.items.indexOf(item)
      gameManager.stateManager.before("sellItem", "data.character." + this.character.name, this.character.progress.items[index].name, this.character.progress.items[index].edition);
      this.character.progress.gold += Math.ceil(itemData.cost / 2);
      this.character.progress.items.splice(index, 1);
      this.items.splice(index, 1);
      gameManager.stateManager.after();
      this.itemChange();
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
    const disabled: boolean = gameManager.game.state == GameState.next || this.character.progress.perks[index] < value && this.availablePerks < value - this.character.progress.perks[index];

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