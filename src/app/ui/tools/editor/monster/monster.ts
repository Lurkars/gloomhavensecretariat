import { Dialog } from "@angular/cdk/dialog";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Ability } from "src/app/game/model/Ability";
import { Action, ActionType, ActionValueType } from "src/app/game/model/Action";
import { DeckData } from "src/app/game/model/data/DeckData";
import { MonsterData } from "src/app/game/model/data/MonsterData";
import { FigureError, FigureErrorType } from "src/app/game/model/FigureError";
import { Monster } from "src/app/game/model/Monster";
import { MonsterStat } from "src/app/game/model/MonsterStat";
import { MonsterType } from "src/app/game/model/MonsterType";
import { MonsterStatsComponent } from "src/app/ui/figures/monster/cards/stats";
import { applyPlaceholder } from "src/app/ui/helper/i18n";
import { MonsterEditorActionDialogComponent } from "./action/action";


export const newMonsterJson: string = '{"name": "new-monster", "thumbnail" : "", "edition": "", "deck": "", "boss": false, "flying" : false, "hidden":false, "count": 10, "baseStat" : {}, "stats": []}';

@Component({
  selector: 'ghs-monster-editor',
  templateUrl: './monster.html',
  styleUrls: ['./monster.scss']
})
export class MonsterEditorComponent implements OnInit {

  @ViewChild('inputMonsterData', { static: true }) inputMonsterData!: ElementRef;
  @ViewChild('inputDeckData', { static: true }) inputDeckData!: ElementRef;
  @ViewChild('monsterStats') monsterStats!: MonsterStatsComponent;

  gameManager: GameManager = gameManager;
  MonsterType = MonsterType;
  monsterData: MonsterData;
  ActionType = ActionType;
  ActionValueType = ActionValueType;
  encodeURIComponent = encodeURIComponent;
  levels: number[] = [0, 1, 2, 3, 4, 5, 6, 7];
  monster: Monster;
  deckData: DeckData;
  monsterError: any;
  deckError: any;

  constructor(private dialog: Dialog) {
    this.monsterData = JSON.parse(newMonsterJson);
    this.deckData = new DeckData(this.monsterData.name, [], this.monsterData.edition);
    this.deckData.abilities.push(new Ability());
    this.updateType(false);
    this.monster = new Monster(this.monsterData);
  }

  async ngOnInit() {
    await settingsManager.init();
    this.monsterDataToJson();
    this.deckDataToJson();
    this.inputMonsterData.nativeElement.addEventListener('change', (event: any) => {
      this.monsterDataFromJson();
    });

    this.inputDeckData.nativeElement.addEventListener('change', (event: any) => {
      this.deckDataFromJson();
    });
  }

  monsterDataToJson() {
    this.monster.deck = this.monsterData.deck;
    let compactData: any = JSON.parse(JSON.stringify(this.monsterData));

    if (!compactData.boss) {
      compactData.baseStat.type = 'normal';
      compactData.stats.filter((stat: any) => stat.type == 'normal').forEach((stat: any) => {
        stat.type = undefined;
      })
    }

    Object.keys(compactData.stats[0]).forEach((key) => {
      if (compactData.stats.every((stat: any) => JSON.stringify(stat[key]) == JSON.stringify(compactData.stats[0][key]))) {
        compactData.baseStat[key] = compactData.stats[0][key];
        compactData.stats.forEach((stat: any) => {
          stat[key] = undefined;
        })
      }
    });


    Object.keys(compactData).forEach((key) => {
      if (!compactData[key]) {
        compactData[key] = undefined;
      }
    })

    compactData.stats.forEach((stat: any) => {
      Object.keys(stat).forEach((key) => {
        if (!stat[key]) {
          stat[key] = undefined;
        }
      })
    })

    this.inputMonsterData.nativeElement.value = JSON.stringify(compactData, null, 2);
  }

  monsterDataFromJson() {
    this.monsterError = "";
    if (this.inputMonsterData.nativeElement.value) {
      try {
        this.monsterData = JSON.parse(this.inputMonsterData.nativeElement.value);
        if (this.monsterData) {
          this.updateType(false);
        }
        return;
      } catch (e) {
        this.monsterData = JSON.parse(newMonsterJson);
        this.monsterError = e;
      }
    }
  }


  deckDataToJson() {
    this.updateDeck();
    let compactData: any = JSON.parse(JSON.stringify(this.deckData));

    Object.keys(compactData).forEach((key) => {
      if (!compactData[key]) {
        compactData[key] = undefined;
      }
    })

    compactData.abilities.forEach((ability: any) => {
      Object.keys(ability).forEach((key) => {
        if (!ability[key]) {
          ability[key] = undefined;
        }
        if (ability.types && ability.types.length == 0) {
          ability.types = undefined;
        }
        if (ability.bottomTypes && ability.bottomTypes.length == 0) {
          ability.bottomTypes = undefined;
        }
        if (ability.bottomActions && ability.bottomActions.length == 0) {
          ability.bottomActions = undefined;
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
        this.updateDeck();
        return;
      } catch (e) {
        this.deckData = new DeckData(this.monsterData.name, [], this.monsterData.edition);
        this.deckData.abilities.push(new Ability());
        this.deckError = e;
      }
    }
  }

  valueChange(value: string): number | string {
    if (!isNaN(+value)) {
      return +value;
    }
    return value;
  }

  statsForType(type: MonsterType): MonsterStat {
    let stat = this.monster.stats.find((monsterStat) => {
      return this.monster && monsterStat.level == this.monster.level && monsterStat.type == type;
    });

    if (!stat) {
      this.monster.errors = this.monster.errors || [];
      if (!this.monster.errors.find((figureError) => figureError.type == FigureErrorType.unknown) && !this.monster.errors.find((figureError) => figureError.type == FigureErrorType.stat)) {
        console.error("Could not find '" + type + "' stats for monster: " + this.monster.name + " level: " + this.monster.level);
        this.monster.errors.push(new FigureError(FigureErrorType.stat, "monster", this.monster.name, this.monster.edition, type, "" + this.monster.level));
      }

      stat = new MonsterStat(type, this.monster.level, 0, 0, 0, 0);
      this.monster.stats.push(stat);
    }
    return stat;
  }

  setLevel(level: number) {
    this.monsterStats.setLevel(level);
  }

  applyToAllLevel() {
    this.monsterData.stats = this.monsterData.stats.filter((stat) => stat.level == this.monster.level);
    for (let level of this.levels) {
      if (level != this.monster.level) {
        if (this.monsterData.boss) {
          let stat = JSON.parse(JSON.stringify(this.statsForType(MonsterType.boss)));
          stat.level = level;
          this.monsterData.stats.push(stat);
        } else {
          let stat = JSON.parse(JSON.stringify(this.statsForType(MonsterType.normal)));
          stat.level = level;
          this.monsterData.stats.push(stat);

          stat = JSON.parse(JSON.stringify(this.statsForType(MonsterType.elite)));
          stat.level = level;
          this.monsterData.stats.push(stat);
        }
      }
    }
    this.monsterDataToJson();
  }

  updateType(toJson: boolean = true) {
    if (this.monsterData) {
      if (this.monsterData.boss) {
        if (!this.monsterData.deck) {
          this.monsterData.deck = 'boss';
        }
        this.monsterData.stats = this.monsterData.stats.filter((stat) => !stat.type || stat.type == MonsterType.boss);

        for (let level of this.levels) {
          if (!this.monsterData.stats.some((stat) => stat.level == level)) {
            this.monsterData.stats.push(new MonsterStat(MonsterType.boss, level, 0, 0, 0, 0));
          }
        }
      } else {
        this.monsterData.stats = this.monsterData.stats.filter((stat) => stat.type != MonsterType.boss);
        for (let level of this.levels) {
          if (!this.monsterData.stats.some((stat) => stat.level == level && (!stat.type || stat.type == MonsterType.normal))) {
            this.monsterData.stats.push(new MonsterStat(MonsterType.normal, level, 0, 0, 0, 0));
          }

          if (!this.monsterData.stats.some((stat) => stat.level == level && stat.type == MonsterType.elite)) {
            this.monsterData.stats.push(new MonsterStat(MonsterType.elite, level, 0, 0, 0, 0));
          }
        }
      }

      this.monster = new Monster(this.monsterData);
    }

    if (toJson) {
      this.monsterDataToJson();
    }
  }

  addMonsterAction(type: MonsterType) {
    let action = new Action(ActionType.attack);

    const stat = this.statsForType(type);
    stat.actions.push(action);
    const dialog = this.dialog.open(MonsterEditorActionDialogComponent, {
      panelClass: 'dialog',
      data: { action: action, monster: this.monster }
    });

    dialog.closed.subscribe({
      next: (value) => {
        if (value == false) {
          stat.actions.splice(stat.actions.indexOf(action), 1);
        }
        this.monsterDataToJson();
      }
    })
  }

  editMonsterAction(type: MonsterType, action: Action) {
    const dialog = this.dialog.open(MonsterEditorActionDialogComponent, {
      panelClass: 'dialog',
      data: { action: action, monster: this.monster }
    });

    dialog.closed.subscribe({
      next: (value) => {
        if (value == false) {
          const stat = this.statsForType(type);
          stat.actions.splice(stat.actions.indexOf(action), 1);
        }
        this.monsterDataToJson();
      }
    })
  }

  addSpecialAction(type: MonsterType, index: number) {
    let action = new Action(ActionType.attack);

    const stat = this.statsForType(type);

    if (!stat.special) {
      stat.special = [];
    }

    if (stat.special.length <= index) {
      stat.special[index] = [];
    }

    stat.special[index].push(action);
    const dialog = this.dialog.open(MonsterEditorActionDialogComponent, {
      panelClass: 'dialog',
      data: { action: action, monster: this.monster }
    });

    dialog.closed.subscribe({
      next: (value) => {
        if (value == false) {
          stat.special[index].splice(stat.special[index].indexOf(action), 1);

          if (stat.special[index].length == 0) {
            stat.special.splice(index, 1);
          }
        }
        this.monsterDataToJson();
      }
    })
  }

  editSpecialAction(type: MonsterType, index: number, action: Action) {
    const dialog = this.dialog.open(MonsterEditorActionDialogComponent, {
      panelClass: 'dialog',
      data: { action: action, monster: this.monster }
    });

    dialog.closed.subscribe({
      next: (value) => {
        if (value == false) {
          const stat = this.statsForType(type);

          if (!stat.special) {
            stat.special = [];
          }

          if (stat.special.length <= index) {
            stat.special[index] = [];
          }
          stat.special[index].splice(stat.special[index].indexOf(action), 1);

          if (stat.special[index].length == 0) {
            stat.special.splice(index, 1);
          }
        }
        this.monsterDataToJson();
      }
    })
  }

  changeInitiative(event: any, ability: Ability) {
    if (event.target.value) {
      ability.initiative = +event.target.value;
    } else {
      ability.initiative = 0;
    }
    if (ability.initiative < 10) {
      event.target.value = '0' + (ability.initiative ? ability.initiative : '0');
    }
    this.deckDataToJson();
  }

  updateDeck() {
    if (this.deckData.name != this.monster.name && this.deckData.name != this.monster.deck) {
      this.monsterData.deck = this.deckData.name;
      this.monsterDataToJson();
    } else if (this.monsterData.deck == this.monsterData.name || this.monster.name == this.deckData.name) {
      this.monsterData.deck = "";
      this.monsterDataToJson();
    }
    this.monster.deck = this.monsterData.deck;
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

    ability.actions.push(action);
    const dialog = this.dialog.open(MonsterEditorActionDialogComponent, {
      panelClass: 'dialog',
      data: { action: action, monster: this.monster }
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
    const dialog = this.dialog.open(MonsterEditorActionDialogComponent, {
      panelClass: 'dialog',
      data: { action: action, monster: this.monster }
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

  abilitykPlaceholder(name: string | undefined): string {
    let label = 'data.monster.' + this.monster.name;
    if (name) {
      label = 'data.ability.' + name;
    } else if (this.monster.deck != this.monster.name) {
      label = 'data.deck.' + this.monster.deck;
      if (label.split('.')[label.split('.').length - 1] === applyPlaceholder(settingsManager.getLabel(label)) && this.monster.deck) {
        label = 'data.monster.' + this.monster.deck;
      }
    }

    return applyPlaceholder(settingsManager.getLabel(label));
  }

  deckPlaceholder(name: string): string {
    let label = 'data.deck.' + name;
    if (applyPlaceholder(settingsManager.getLabel(label)) == name) {
      label = 'data.monster.' + name;
    }
    return applyPlaceholder(settingsManager.getLabel(label));
  }


  loadMonsterData(monsterData: MonsterData | undefined) {
    this.monsterData = monsterData || JSON.parse(newMonsterJson);
    this.updateType();
    this.monsterDataToJson();
  }

  loadDeckData(deckData: DeckData | undefined) {
    this.deckData = deckData || new DeckData(this.monsterData.name, [], this.monsterData.edition);
    this.deckDataToJson();
  }
}