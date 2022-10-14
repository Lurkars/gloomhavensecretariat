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
  styleUrls: ['../editor.scss', './monster.scss']
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
  level: number = 1;
  deckData: DeckData;
  monsterError: any;
  deckError: any;

  constructor(private dialog: Dialog) {
    this.monsterData = JSON.parse(newMonsterJson);
    this.deckData = new DeckData(this.monsterData.name, [], this.monsterData.edition);
    this.deckData.abilities.push(new Ability());
    this.updateType(false);
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

    this.monsterData.stats.sort((a, b) => {
      if (a.level - b.level != 0) {
        return a.level - b.level;
      }

      if (a.type == MonsterType.normal && b.type == MonsterType.elite) {
        return -1;
      }

      return 1;
    })

    let compactData: any = JSON.parse(JSON.stringify(this.monsterData));



    compactData.baseStat.actions = compactData.baseStat.actions || [];
    compactData.baseStat.immunities = compactData.baseStat.immunities || [];
    compactData.baseStat.special = compactData.baseStat.special || [];

    Object.keys(compactData.stats[0]).forEach((key) => {
      if (compactData.stats.every((stat: any) => JSON.stringify(stat[key]) == JSON.stringify(compactData.stats[0][key]))) {
        compactData.baseStat[key] = compactData.stats[0][key];
        compactData.stats.forEach((stat: any) => {
          stat[key] = undefined;
        })
      }
    });

    if (!compactData.boss) {
      compactData.baseStat.type = 'normal';
      compactData.stats.filter((stat: any) => stat.type == 'normal').forEach((stat: any) => {
        stat.type = undefined;
      })

      let normalBaseStats: string[] = [];
      const normalStat = compactData.stats.filter((stat: any) => !stat.type)[0];
      if (normalStat) {
        Object.keys(normalStat).forEach((key) => {
          if (normalStat[key] && compactData.stats.filter((stat: any) => !stat.type).every((stat: any) => JSON.stringify(stat[key]) == JSON.stringify(normalStat[key])) && key != 'type') {
            compactData.baseStat[key] = normalStat[key];
            normalBaseStats.push(key);
            compactData.stats.filter((stat: any) => !stat.type).forEach((stat: any) => {
              stat[key] = undefined;
            })
          }
        });
      }

      const eliteStat = compactData.stats.filter((stat: any) => stat.type == 'elite')[0];
      if (eliteStat) {
        Object.keys(eliteStat).forEach((key) => {
          if (eliteStat[key] && compactData.stats.filter((stat: any) => stat.type == 'elite').every((stat: any) => JSON.stringify(stat[key]) == JSON.stringify(eliteStat[key])) && normalBaseStats.indexOf(key) == -1 && key != 'type') {
            compactData.baseStat[key] = eliteStat[key];
            compactData.stats.filter((stat: any) => stat.type == 'elite').forEach((stat: any) => {
              stat[key] = undefined;
            })
          }
        });
      }
    }


    Object.keys(compactData).forEach((key) => {
      if (!compactData[key]) {
        compactData[key] = undefined;
      }
    })

    compactData.stats.forEach((stat: any) => {
      Object.keys(stat).forEach((key) => {
        if (!stat[key] && key != 'level') {
          stat[key] = undefined;
        }
      })

      if (stat.immunities && stat.immunities.length == 0) {
        stat.immunities = undefined;
      }

      if (stat.actions && stat.actions.length == 0) {
        stat.actions = undefined;
      } else if (stat.actions) {
        stat.actions.forEach((action: any) => this.compactAction(action));
      }

      if (stat.special && stat.special.length == 0) {
        stat.special = undefined;
      } else if (stat.special) {
        stat.special.forEach((special: any) => {
          special.forEach((action: any) => this.compactAction(action));
        })
      }
    })

    Object.keys(compactData.baseStat).forEach((key) => {
      if (!compactData.baseStat[key]) {
        compactData.baseStat[key] = undefined;
      }
    })

    if (compactData.baseStat.actions && compactData.baseStat.actions.length == 0) {
      compactData.baseStat.actions = undefined;
    } else if (compactData.baseStat.actions) {
      compactData.baseStat.actions.forEach((action: any) => this.compactAction(action));
    }

    if (compactData.baseStat.special) {
      compactData.baseStat.special.forEach((special: any) => {
        special.forEach((action: any) => this.compactAction(action));
      })
    }

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
        if (ability.actions && ability.actions.length == 0) {
          ability.actions = undefined;
        } else if (ability.actions) {
          ability.actions.forEach((action: any) => {
            this.compactAction(action);
          })
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

    if (!action.value) {
      action.value = undefined;
    }
  }

  valueChange(value: string): number | string {
    if (!isNaN(+value)) {
      return +value;
    }
    return value;
  }

  statsForType(type: MonsterType, level: number): MonsterStat {
    let stat = this.monsterData.stats.find((monsterStat) => {
      return this.monsterData && monsterStat.level == level && monsterStat.type == type;
    });

    if (!stat) {
      this.monsterData.errors = this.monsterData.errors || [];
      if (!this.monsterData.errors.find((figureError) => figureError.type == FigureErrorType.unknown) && !this.monsterData.errors.find((figureError) => figureError.type == FigureErrorType.stat)) {
        console.error("Could not find '" + type + "' stats for monster: " + this.monsterData.name + " level: " + level);
        this.monsterData.errors.push(new FigureError(FigureErrorType.stat, "monster", this.monsterData.name, this.monsterData.edition, type, "" + level));
      }

      stat = new MonsterStat(type, level, 0, 0, 0, 0);
      this.monsterData.stats.push(stat);
    }
    return stat;
  }

  setLevel(level: number) {
    this.monsterStats.setLevel(level);
  }

  getMonsterForLevel(level: number): Monster {
    let monster: Monster = new Monster(this.monsterData);
    monster.level = level != -1 ? level : 1;
    return monster;
  }

  applyToAllLevel(level: number) {
    this.monsterData.stats = this.monsterData.stats.filter((stat) => stat.level == level);
    for (let l of this.levels) {
      if (l != level) {
        if (this.monsterData.boss) {
          let stat = JSON.parse(JSON.stringify(this.statsForType(MonsterType.boss, level)));
          stat.level = l;
          this.monsterData.stats.push(stat);
        } else {
          let stat = JSON.parse(JSON.stringify(this.statsForType(MonsterType.normal, level)));
          stat.level = l;
          this.monsterData.stats.push(stat);

          stat = JSON.parse(JSON.stringify(this.statsForType(MonsterType.elite, level)));
          stat.level = l;
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
    }

    if (toJson) {
      this.monsterDataToJson();
    }
  }

  addMonsterAction(type: MonsterType, level: number) {
    let action = new Action(ActionType.attack);

    const stat = this.statsForType(type, level);
    stat.actions.push(action);
    const dialog = this.dialog.open(MonsterEditorActionDialogComponent, {
      panelClass: 'dialog',
      data: { action: action, monster: this.getMonsterForLevel(level) }
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

  editMonsterAction(type: MonsterType, action: Action, level: number) {
    const dialog = this.dialog.open(MonsterEditorActionDialogComponent, {
      panelClass: 'dialog',
      data: { action: action, monster: this.getMonsterForLevel(level) }
    });

    dialog.closed.subscribe({
      next: (value) => {
        if (value == false) {
          const stat = this.statsForType(type, level);
          stat.actions.splice(stat.actions.indexOf(action), 1);
        }
        this.monsterDataToJson();
      }
    })
  }

  addSpecialAction(type: MonsterType, index: number, level: number) {
    let action = new Action(ActionType.attack);

    const stat = this.statsForType(type, level);

    if (!stat.special) {
      stat.special = [];
    }

    if (stat.special.length <= index) {
      stat.special[index] = [];
    }

    stat.special[index].push(action);
    const dialog = this.dialog.open(MonsterEditorActionDialogComponent, {
      panelClass: 'dialog',
      data: { action: action, monster: this.getMonsterForLevel(level) }
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

  editSpecialAction(type: MonsterType, index: number, action: Action, level: number) {
    const dialog = this.dialog.open(MonsterEditorActionDialogComponent, {
      panelClass: 'dialog',
      data: { action: action, monster: this.getMonsterForLevel(level) }
    });

    dialog.closed.subscribe({
      next: (value) => {
        if (value == false) {
          const stat = this.statsForType(type, level);

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
    if (!ability.initiative || ability.initiative < 10) {
      event.target.value = '0' + (ability.initiative ? ability.initiative : '0');
    }
    this.deckDataToJson();
  }

  updateDeck() {
    if (this.deckData.name != this.monsterData.name && this.deckData.name != this.monsterData.deck) {
      this.monsterData.deck = this.deckData.name;
      this.monsterDataToJson();
    } else if (this.monsterData.deck == this.monsterData.name || this.monsterData.name == this.deckData.name) {
      this.monsterData.deck = "";
      this.monsterDataToJson();
    }
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
    const dialog = this.dialog.open(MonsterEditorActionDialogComponent, {
      panelClass: 'dialog',
      data: { action: action, monster: this.getMonsterForLevel(this.level) }
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
      data: { action: action, monster: this.getMonsterForLevel(this.level) }
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

  abilityPlaceholder(name: string | undefined): string {
    let label = 'data.monster.' + this.monsterData.name;
    if (name) {
      label = 'data.ability.' + name;
    } else if (this.monsterData.deck && this.monsterData.deck != this.monsterData.name) {
      label = 'data.deck.' + this.monsterData.deck;
      if (label.split('.')[label.split('.').length - 1] === applyPlaceholder(settingsManager.getLabel(label)) && this.monsterData.deck) {
        label = 'data.monster.' + this.monsterData.deck;
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

  loadMonsterData(event: any) {
    const index = +event.target.value;
    this.monsterData = index != -1 ? gameManager.monstersData(true)[index] : JSON.parse(newMonsterJson);
    this.updateType();
    this.monsterDataToJson();
  }

  loadDeckData(event: any) {
    const index = +event.target.value;
    this.deckData = index != -1 ? gameManager.decksData(true)[index] : new DeckData(this.monsterData.name, [], this.monsterData.edition);
    this.deckDataToJson();
  }
}