import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { AfterViewInit, Component, ElementRef, Inject, Input, OnInit, ViewChild, ViewEncapsulation } from "@angular/core";
import { CharacterManager } from "src/app/game/businesslogic/CharacterManager";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Action, ActionType } from "src/app/game/model/Action";
import { AttackModifier, AttackModifierValueType } from "src/app/game/model/AttackModifier";

import { Character, GameCharacterModel } from "src/app/game/model/Character";
import { CharacterProgress } from "src/app/game/model/CharacterProgress";
import { ItemData } from "src/app/game/model/data/ItemData";
import { GameState } from "src/app/game/model/Game";
import { Identifier } from "src/app/game/model/Identifier";
import { Perk, PerkType } from "src/app/game/model/Perks";
import { ghsValueSign } from "src/app/ui/helper/Static";


@Component({
  selector: 'ghs-character-sheet',
  templateUrl: 'character-sheet.html',
  styleUrls: [ './character-sheet.scss' ],
  encapsulation: ViewEncapsulation.None
})
export class CharacterSheetDialog implements OnInit, AfterViewInit {

  @ViewChild('charactertitle', { static: false }) titleInput!: ElementRef;
  @ViewChild('itemName', { static: false }) itemName!: ElementRef;
  @ViewChild('itemEdition', { static: false }) itemEdition!: ElementRef;

  gameManager: GameManager = gameManager;
  GameState = GameState;
  characterManager: CharacterManager = gameManager.characterManager;
  PerkType = PerkType;
  availablePerks: number = 0;
  perksWip: boolean = true;
  items: ItemData[] = [];
  item: ItemData | undefined;
  itemCanAdd: boolean = false;
  doubleClickPerk: any = null;
  priceModifier: number = 0;

  goldTimeout: any = null;
  xpTimeout: any = null;

  constructor(@Inject(DIALOG_DATA) public character: Character, private dialogRef: DialogRef) {

    this.dialogRef.closed.subscribe({
      next: (forced) => {
        if (!forced) {
          this.close();
        }
      }
    });
  }

  ngOnInit(): void {
    if (!this.character.progress) {
      this.character.progress = new CharacterProgress();
    }

    this.character.progress.perks = this.character.progress.perks || [];

    for (let i = 0; i < 15; i++) {
      if (!this.character.progress.perks[ i ]) {
        this.character.progress.perks[ i ] = 0;
      }
    }

    if (this.character.progress.experience < this.characterManager.xpMap[ this.character.level - 1 ]) {
      this.character.progress.experience = this.characterManager.xpMap[ this.character.level - 1 ];
    }

    this.availablePerks = this.character.level + Math.floor(this.character.progress.battleGoals / 3) - (this.character.progress.perks && this.character.progress.perks.length > 0 ? this.character.progress.perks.reduce((a, b) => a + b) : 0) - 1 + this.character.progress.retirements;

    this.perksWip = this.character.perks.length == 0 || this.character.perks.map((perk) => perk.count).reduce((a, b) => a + b) != 15;

    this.updateItems();
    this.itemChange();

    gameManager.uiChange.subscribe({
      next: () => {
        this.availablePerks = this.character.level + Math.floor(this.character.progress.battleGoals / 3) - (this.character.progress.perks && this.character.progress.perks.length > 0 ? this.character.progress.perks.reduce((a, b) => a + b) : 0) - 1 + this.character.progress.retirements;

        for (let i = 0; i < 15; i++) {
          if (!this.character.progress.perks[ i ]) {
            this.character.progress.perks[ i ] = 0;
          }
        }

        this.updateItems();
      }
    })
  }


  ngAfterViewInit(): void {
    this.titleInput.nativeElement.value = this.character.title || settingsManager.getLabel('data.character.' + this.character.name.toLowerCase());
    this.itemEdition.nativeElement.value = this.character.edition;
    this.itemName.nativeElement.value = "1";
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
    this.gameManager.stateManager.after();
  }

  setXP(event: any) {
    if (!isNaN(+event.target.value) && this.character.progress.experience != +event.target.value) {
      if (this.xpTimeout) {
        clearTimeout(this.xpTimeout);
        this.xpTimeout = null;
      }
      this.xpTimeout = setTimeout(() => {
        gameManager.stateManager.before("setXP", "data.character." + this.character.name, ghsValueSign(+event.target.value - this.character.progress.experience));
        this.characterManager.addXP(this.character, event.target.value - this.character.progress.experience);
        this.gameManager.stateManager.after();
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
        this.gameManager.stateManager.after();
        this.goldTimeout = null;
      }, 500);
    }
  }

  setPersonalQuest(event: any) {
    if (!isNaN(+event.target.value) && this.character.progress.personalQuest != +event.target.value) {
      gameManager.stateManager.before("setPQ", "data.character." + this.character.name, event.target.value);
      this.character.progress.personalQuest = +event.target.value;
      this.gameManager.stateManager.after();
    }
  }

  setRetirements(event: any) {
    if (!isNaN(+event.target.value) && this.character.progress.retirements != +event.target.value) {
      gameManager.stateManager.before("setRetirements", "data.character." + this.character.name, event.target.value);
      this.character.progress.retirements = +event.target.value;
      this.gameManager.stateManager.after();
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
      this.gameManager.stateManager.after();
    }
  }

  setNotes(event: any) {
    if (this.character.progress.notes != event.target.value) {
      gameManager.stateManager.before("setNotes", "data.character." + this.character.name, event.target.value);
      this.character.progress.notes = event.target.value;
      this.gameManager.stateManager.after();
    }
  }

  toggleRetired() {
    gameManager.stateManager.before("setRetired", "data.character." + this.character.name, "" + !this.character.progress.retired);
    this.character.progress.retired = !this.character.progress.retired;
    this.gameManager.stateManager.after();
  }


  close(): void {
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

    this.itemEdition.nativeElement.value = this.character.edition;
  }

  itemChange() {
    this.itemCanAdd = false;
    this.item = gameManager.item(this.itemName && +this.itemName.nativeElement.value || 1, this.itemEdition && this.itemEdition.nativeElement.value || this.character.edition);

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
      gameManager.stateManager.before("addItem", "data.character." + this.character.name, this.itemName.nativeElement.value, this.itemEdition.nativeElement.value);
      this.character.progress.items.push(new Identifier(this.itemName.nativeElement.value, this.itemEdition.nativeElement.value));
      this.items.push(this.item);
      this.items.sort((a, b) => a.id - b.id);
      this.itemName.nativeElement.value = 1;
      gameManager.stateManager.after();
      this.itemChange();
    }
  }

  buyItem() {
    this.itemChange();
    if (this.item && this.item.cost <= this.character.progress.gold) {
      gameManager.stateManager.before("buyItem", "data.character." + this.character.name, this.itemName.nativeElement.value, this.itemEdition.nativeElement.value);
      this.character.progress.gold -= this.item.cost;
      this.character.progress.items.push(new Identifier(this.itemName.nativeElement.value, this.itemEdition.nativeElement.value));
      this.items.push(this.item);
      this.items.sort((a, b) => a.id - b.id);
      this.itemName.nativeElement.value = 1;
      gameManager.stateManager.after();
      this.itemChange();
    }
  }

  removeItem(itemData: ItemData) {
    const item = this.character.progress.items.find((item) => item.name == "" + itemData.id && item.edition == itemData.edition);
    if (item) {
      const index = this.character.progress.items.indexOf(item)
      gameManager.stateManager.before("removeItem", "data.character." + this.character.name, this.character.progress.items[ index ].name, this.character.progress.items[ index ].edition);
      this.character.progress.items.splice(index, 1);
      this.items.splice(index, 1);
      gameManager.stateManager.after();
      this.itemChange();
    }
  }

  sellItem(itemData: ItemData) {
    const item = this.character.progress.items.find((item) => item.name == "" + itemData.id && item.edition == itemData.edition);
    if (item) {
      const index = this.character.progress.items.indexOf(item)
      gameManager.stateManager.before("sellItem", "data.character." + this.character.name, this.character.progress.items[ index ].name, this.character.progress.items[ index ].edition);
      this.character.progress.gold += Math.ceil(itemData.cost / 2);
      this.character.progress.items.splice(index, 1);
      this.items.splice(index, 1);
      gameManager.stateManager.after();
      this.itemChange();
    }
  }

  addPerk(index: number, value: number) {

    const disabled: boolean = gameManager.game.state == GameState.next || this.character.progress.perks[ index ] < value && this.availablePerks < value - this.character.progress.perks[ index ];

    if (!disabled || this.doubleClickPerk) {
      clearTimeout(this.doubleClickPerk);
      this.doubleClickPerk = null;
      gameManager.stateManager.before("setPerk", "data.character." + this.character.name, "" + index, "" + value);
      if (this.character.progress.perks[ index ] && this.character.progress.perks[ index ] == value) {
        this.character.progress.perks[ index ]--;
      } else {
        this.character.progress.perks[ index ] = value;
      }
      this.character.mergeAttackModifierDeck(gameManager.attackModifierManager.buildCharacterAttackModifierDeck(this.character));
      gameManager.attackModifierManager.shuffleModifiers(this.character.attackModifierDeck);
      gameManager.stateManager.after();
    } else {
      this.doubleClickPerk = setTimeout(() => {
        if (this.doubleClickPerk) {
          this.doubleClickPerk = null;
        }
      }, 200)
    }
  }

  perkLabel(perk: Perk): string[] {
    let label: string[] = [];
    if (perk.cards) {
      perk.cards.forEach((card, index) => {
        if (index == 0 || perk.type == PerkType.replace && index < 2) {
          label.push('character.progress.perks.cards.' + card.count);
          label.push(this.attackModifierHtml(card.attackModifier));
          label.push(card.count > 1 ? 'character.progress.perks.cards' : 'character.progress.perks.card');
        } else {
          label[ label.length - 1 ] += settingsManager.getLabel('character.progress.perks.additional', [ 'character.progress.perks.cards.' + card.count, this.attackModifierHtml(card.attackModifier), card.count > 1 ? 'character.progress.perks.cards' : 'character.progress.perks.card' ]);
        }
      });
    }

    return label;
  }

  attackModifierHtml(attackModifier: AttackModifier): string {
    let html = "";
    attackModifier = new AttackModifier(attackModifier.type, attackModifier.id, attackModifier.actions, attackModifier.rolling);

    if (attackModifier.rolling) {
      html += '<span class="attack-modifier-action">&zwj;<img src="./assets/images/attackmodifier/icons/actions/rolling.svg"></span>';
    }


    if (!attackModifier.rolling || attackModifier.value != 0) {

      let valueSign = "+";
      if (attackModifier.valueType == AttackModifierValueType.minus) {
        valueSign = "-";
      } else if (attackModifier.valueType == AttackModifierValueType.multiply) {
        valueSign = "x";
      }

      html += '<span class="attack-modifier-icon">' + valueSign + attackModifier.value + '</span>';
    }

    if (attackModifier.actions) {
      attackModifier.actions.forEach((action) => {
        html += this.attackModifierActionHtml(action);
      })
    }

    return html;
  }

  attackModifierActionHtml(action: Action): string {
    let html = "";

    switch (action.type) {
      case ActionType.condition:
        html += '<span class="attack-modifier-action condition">' + settingsManager.getLabel('game.condition.' + action.value) + '<img src="./assets/images/attackmodifier/icons/actions/' + action.value + '.svg"></span>';
        break;
      case ActionType.element:
        html += '<span class="attack-modifier-action element">&zwj;<img src="./assets/images/attackmodifier/icons/actions/' + action.value + '.svg"></span>';
        break;
      case ActionType.target:
        html += '<span class="placeholder attack-modifier-action target">' + settingsManager.getLabel(action.value <= 1 ? 'game.custom.perks.addTarget' : 'game.custom.perks.addTargets', [ action.value + "" ]) + '<img src="./assets/images/attackmodifier/icons/actions/target.svg"></span>';
        break;
      case ActionType.specialTarget:
        html += '<span class="placeholder attack-modifier-action special-target">' + settingsManager.getLabel('game.specialTarget.' + action.value) + '</span>';
        break;
      case ActionType.refreshItem:
        html += '<span class="placeholder attack-modifier-action special-target">' + settingsManager.getLabel('game.action.' + action.type) + '</span>';
        break;
      case ActionType.custom:
        html += '<span class="placeholder attack-modifier-action custom">' + settingsManager.getLabel('' + action.value) + '</span>';
        break;
      default:
        html += '<span class="placeholder attack-modifier-action ' + action.type + '">' + settingsManager.getLabel('game.action.' + action.type) + '<img src="./assets/images/attackmodifier/icons/actions/' + action.type + '.svg"><span class="value">' + action.value + '</span></span>';
        break;
    }

    if (action.subActions) {
      action.subActions.forEach((subAction) => {
        html += "," + this.attackModifierActionHtml(subAction);
      })
    }

    return html;
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

      reader.readAsText(event.target.files[ 0 ]);
    } catch (e: any) {
      console.warn(e);
      parent.classList.add("error");
    }
  }
}