import { Dialog } from "@angular/cdk/dialog";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Ability } from "src/app/game/model/Ability";
import { Action, ActionType, ActionValueType } from "src/app/game/model/Action";
import { Character } from "src/app/game/model/Character";
import { CharacterStat } from "src/app/game/model/CharacterStat";
import { CharacterData } from "src/app/game/model/data/CharacterData";
import { DeckData } from "src/app/game/model/data/DeckData";
import { EditorActionDialogComponent } from "../action/action";

@Component({
  selector: 'ghs-character-editor',
  templateUrl: './character.html',
  styleUrls: ['../editor.scss', './character.scss']
})
export class CharacterEditorComponent implements OnInit {

  @ViewChild('inputCharacterData', { static: true }) inputCharacterData!: ElementRef;
  @ViewChild('inputDeckData', { static: true }) inputDeckData!: ElementRef;

  gameManager: GameManager = gameManager;
  ActionType = ActionType;
  ActionValueType = ActionValueType;
  encodeURIComponent = encodeURIComponent;
  characterData: CharacterData;
  deckData: DeckData;
  characterError: any;
  deckError: any;

  constructor(private dialog: Dialog) {
    this.characterData = new CharacterData();
    for (let i = 0; i < 9; i++) {
      this.characterData.stats.push(new CharacterStat(i, i));
    }
    this.deckData = new DeckData("", [], "");
    this.deckData.abilities.push(new Ability());
  }

  async ngOnInit() {
    await settingsManager.init();
    this.characterDataToJson();
    this.deckDataToJson();
    this.inputCharacterData.nativeElement.addEventListener('change', (event: any) => {
      this.characterDataFromJson();
    });
    this.inputDeckData.nativeElement.addEventListener('change', (event: any) => {
      this.deckDataFromJson();
    });
  }

  getCharacter(): Character {
    return new Character(this.characterData, 1);
  }

  characterDataToJson() {
    this.characterData.stats.sort((a, b) => {
      return a.level - b.level;
    })

    let compactData: any = JSON.parse(JSON.stringify(this.characterData));

    this.inputCharacterData.nativeElement.value = JSON.stringify(compactData, null, 2);
  }

  characterDataFromJson() {
    this.characterError = "";
    if (this.inputCharacterData.nativeElement.value) {
      try {
        this.characterData = JSON.parse(this.inputCharacterData.nativeElement.value);
        return;
      } catch (e) {
        this.characterData = new CharacterData();
        for (let i = 0; i < 9; i++) {
          this.characterData.stats.push(new CharacterStat(i, i));
        }
        this.characterError = e;
      }
    }
  }

  deckDataToJson() {
    let compactData: any = JSON.parse(JSON.stringify(this.deckData));

    Object.keys(compactData).forEach((key) => {
      if (!compactData[key] || compactData[key] == false) {
        compactData[key] = undefined;
      }
    })

    compactData.abilities.forEach((ability: any) => {
      Object.keys(ability).forEach((key) => {
        if (!ability[key] && ability[key] != 0 || typeof ability[key] == 'boolean' && ability[key] == false) {
          ability[key] = undefined;
        }

        if (ability.actions && ability.actions.length == 0) {
          ability.actions = undefined;
        } else if (ability.actions) {
          ability.actions.forEach((action: any) => {
            this.compactAction(action);
          })
        }

        if (ability.bottomActions && ability.bottomActions.length == 0) {
          ability.bottomActions = undefined;
        } else if (ability.bottomActions) {
          ability.bottomActions.forEach((action: any) => {
            this.compactAction(action);
          })
        }
      })
    })

    this.inputDeckData.nativeElement.value = JSON.stringify(compactData, null, 2);
  }

  deckDataFromJson() {
    this.deckError = "";
    if (this.inputDeckData.nativeElement.value) {
      try {
        this.deckData = JSON.parse(this.inputDeckData.nativeElement.value);
        return;
      } catch (e) {
        this.deckData = new DeckData("", [], "");
        this.deckData.abilities.push(new Ability());
        this.deckError = e;
      }
    }
  }

  compactAction(action: any) {
    if (action.valueType && action.valueType == ActionValueType.fixed) {
      action.valueType = undefined;
    }

    if (action.subActions && action.subActions.length == 0) {
      action.subActions = undefined;
    } else if (action.subActions) {
      action.subActions.forEach((action: any) => {
        this.compactAction(action);
      })
    }

    if (!action.value && action.value != 0) {
      action.value = undefined;
    }
  }

  valueChange(value: string): number | string {
    if (value && !isNaN(+value)) {
      return +value;
    }
    return value;
  }

  changeInitiative(event: any, ability: Ability) {
    if (event.target.value) {
      ability.initiative = +event.target.value;
    } else {
      ability.initiative = 0;
    }
    event.target.value = (ability.initiative < 10 ? '0' : '') + ability.initiative;
    this.deckDataToJson();
  }

  changeCardId(event: any, ability: Ability) {
    if (event.target.value) {
      ability.cardId = +event.target.value;
      event.target.value = (ability.cardId < 100 ? '0' : '') + (ability.cardId < 10 ? '0' : '') + ability.cardId;
    } else {
      ability.cardId = undefined;
    }
    this.deckDataToJson();
  }

  addAbility() {
    this.deckData.abilities.push(new Ability());
    this.deckDataToJson();
  }

  removeAbility(ability: Ability) {
    this.deckData.abilities.splice(this.deckData.abilities.indexOf(ability), 1);
    this.deckDataToJson();
  }

  addAbilityAction(ability: Ability) {
    let action = new Action(ActionType.attack);
    if (!ability.actions) {
      ability.actions = [];
    }
    ability.actions.push(action);
    const dialog = this.dialog.open(EditorActionDialogComponent, {
      panelClass: 'dialog',
      data: { action: action }
    });

    dialog.closed.subscribe({
      next: (value) => {
        if (value == false) {
          ability.actions.splice(ability.actions.indexOf(action), 1);
        }
        this.deckDataToJson();
      }
    })
  }

  editAbilityAction(ability: Ability, action: Action) {
    const dialog = this.dialog.open(EditorActionDialogComponent, {
      panelClass: 'dialog',
      data: { action: action }
    });

    dialog.closed.subscribe({
      next: (value) => {
        if (value == false) {
          ability.actions.splice(ability.actions.indexOf(action), 1);
        }
        this.deckDataToJson();
      }
    })
  }

  addAbilityActionBottom(ability: Ability) {
    let action = new Action(ActionType.move);
    if (!ability.bottomActions) {
      ability.bottomActions = [];
    }
    ability.bottomActions.push(action);
    const dialog = this.dialog.open(EditorActionDialogComponent, {
      panelClass: 'dialog',
      data: { action: action }
    });

    dialog.closed.subscribe({
      next: (value) => {
        if (value == false) {
          ability.bottomActions.splice(ability.bottomActions.indexOf(action), 1);
        }
        this.deckDataToJson();
      }
    })
  }

  editAbilityActionBottom(ability: Ability, action: Action) {
    const dialog = this.dialog.open(EditorActionDialogComponent, {
      panelClass: 'dialog',
      data: { action: action }
    });

    dialog.closed.subscribe({
      next: (value) => {
        if (value == false) {
          ability.bottomActions.splice(ability.actions.indexOf(action), 1);
        }
        this.deckDataToJson();
      }
    })
  }

  loadCharacterData(event: any) {
    const index = +event.target.value;
    if (index != -1) {
      this.characterData = gameManager.charactersData(true)[index];
    } else {
      this.characterData = new CharacterData();
      for (let i = 0; i < 9; i++) {
        this.characterData.stats.push(new CharacterStat(i, i));
      }
    }
    this.characterDataToJson();
  }

  loadDeckData(event: any) {
    const index = +event.target.value;
    this.deckData = index != -1 ? gameManager.decksData(true)[index] : new DeckData("", [], "");
    this.deckDataToJson();
  }
} 