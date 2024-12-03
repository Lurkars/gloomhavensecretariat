import { Dialog } from "@angular/cdk/dialog";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Action, ActionType, ActionValueType } from "src/app/game/model/data/Action";
import { MonsterData } from "src/app/game/model/data/MonsterData";
import { FigureError, FigureErrorType } from "src/app/game/model/data/FigureError";
import { Monster } from "src/app/game/model/Monster";
import { MonsterStat } from "src/app/game/model/data/MonsterStat";
import { MonsterType } from "src/app/game/model/data/MonsterType";
import { MonsterStatsComponent } from "src/app/ui/figures/monster/stats/stats";
import { environment } from "src/environments/environment";
import { EditorActionDialogComponent } from "../action/action";
import { compactAction, DeckEditorComponent } from "../deck/deck";


export const newMonsterJson: string = '{"name": "new-monster", "thumbnail" : "", "edition": "", "deck": "", "boss": false, "flying" : false, "hidden":false, "count": 10, "baseStat" : {}, "stats": []}';

@Component({
	standalone: false,
  selector: 'ghs-monster-editor',
  templateUrl: './monster.html',
  styleUrls: ['../editor.scss', './monster.scss']
})
export class MonsterEditorComponent implements OnInit {

  @ViewChild('inputMonsterData', { static: true }) inputMonsterData!: ElementRef;
  @ViewChild('monsterStats') monsterStats!: MonsterStatsComponent;
  @ViewChild('deckEditor') deckEditor!: DeckEditorComponent;

  gameManager: GameManager = gameManager;
  MonsterType = MonsterType;
  monsterData: MonsterData;
  ActionType = ActionType;
  ActionValueType = ActionValueType;
  encodeURIComponent = encodeURIComponent;
  levels: number[] = [0, 1, 2, 3, 4, 5, 6, 7];
  level: number = -1;
  monsterError: any;
  edition: string | undefined;
  init: boolean = false;

  constructor(private dialog: Dialog, private route: ActivatedRoute, private router: Router) {
    this.monsterData = JSON.parse(newMonsterJson);
    this.updateType(false);
  }

  async ngOnInit() {
    await settingsManager.init(!environment.production);
    this.monsterDataToJson();
    this.inputMonsterData.nativeElement.addEventListener('change', (event: any) => {
      this.monsterDataFromJson();
    });

    this.route.queryParams.subscribe({
      next: (queryParams) => {
        if (queryParams['edition']) {
          this.edition = queryParams['edition'];
          if (this.edition && gameManager.editions(true).indexOf(this.edition) == -1) {
            this.edition == undefined;
          }
        }

        if (queryParams['monster']) {
          const monsterData = gameManager.monstersData(this.edition).find((monsterData) => monsterData.name == queryParams['monster']);
          if (monsterData) {
            this.monsterData = monsterData;
            this.monsterDataToJson();
          }
        }

        if (queryParams['level']) {
          this.level = +queryParams['level'];
          if (this.level != -1 && this.levels.indexOf(this.level) == -1) {
            this.level = 1;
          }
        }

        if (!this.monsterData.edition && this.edition) {
          this.monsterData.edition = this.edition;
        }
      }
    })

    this.init = true;
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

    compactData.baseStat.actions = compactData.baseStat.actions || undefined;
    compactData.baseStat.immunities = compactData.baseStat.immunities || undefined;
    compactData.baseStat.special = compactData.baseStat.special || undefined;

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
        stat.actions.forEach((action: any) => compactAction(action));
      }

      if (stat.special && stat.special.length == 0) {
        stat.special = undefined;
      } else if (stat.special) {
        stat.special.forEach((special: any) => {
          special.forEach((action: any) => compactAction(action));
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
      compactData.baseStat.actions.forEach((action: any) => compactAction(action));
    }

    if (compactData.baseStat.special) {
      compactData.baseStat.special.forEach((special: any) => {
        special.forEach((action: any) => compactAction(action));
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

  valueChange(value: string): number | string {
    if (value && !isNaN(+value)) {
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

      stat = new MonsterStat(type, level);
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
        this.monsterData.stats = this.monsterData.stats.filter((stat) => !stat.type || stat.type == MonsterType.boss);

        for (let level of this.levels) {
          if (!this.monsterData.stats.some((stat) => stat.level == level)) {
            this.monsterData.stats.push(new MonsterStat(MonsterType.boss, level));
          }
        }
      } else {
        this.monsterData.stats = this.monsterData.stats.filter((stat) => stat.type != MonsterType.boss);
        for (let level of this.levels) {
          if (!this.monsterData.stats.some((stat) => stat.level == level && (!stat.type || stat.type == MonsterType.normal))) {
            this.monsterData.stats.push(new MonsterStat(MonsterType.normal, level));
          }

          if (!this.monsterData.stats.some((stat) => stat.level == level && stat.type == MonsterType.elite)) {
            this.monsterData.stats.push(new MonsterStat(MonsterType.elite, level));
          }
        }
      }
    }

    if (toJson) {
      this.monsterDataToJson();
    }
  }

  toggleBoss() {
    if (this.monsterData.boss) {
      this.monsterData.count = 1;
    } else {
      this.monsterData.count = 10;
    }
    this.updateType();
  }

  addMonsterAction(type: MonsterType, level: number) {
    let action = new Action(ActionType.attack);

    const stat = this.statsForType(type, level);
    stat.actions.push(action);
    const dialog = this.dialog.open(EditorActionDialogComponent, {
      panelClass: ['dialog'],
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
    const dialog = this.dialog.open(EditorActionDialogComponent, {
      panelClass: ['dialog'],
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

  dropMonsterAction(type: MonsterType, level: number, event: CdkDragDrop<number>) {
    const stat = this.statsForType(type, level);
    moveItemInArray(stat.actions, event.previousIndex, event.currentIndex);
    gameManager.uiChange.emit();
    this.monsterDataToJson();
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
    const dialog = this.dialog.open(EditorActionDialogComponent, {
      panelClass: ['dialog'],
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
    const dialog = this.dialog.open(EditorActionDialogComponent, {
      panelClass: ['dialog'],
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

  loadMonsterData(event: any) {
    const index = +event.target.value;
    this.monsterData = index != -1 ? gameManager.monstersData(this.edition)[index] : JSON.parse(newMonsterJson);
    this.updateType();
    this.monsterDataToJson();
    this.updateQueryParams();
  }

  updateQueryParams() {
    if (!this.monsterData.edition && this.edition) {
      this.monsterData.edition = this.edition;
    }
    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: { edition: this.edition || undefined, monster: this.monsterData && this.monsterData.name || undefined, level: this.level != 1 ? this.level : undefined },
        queryParamsHandling: 'merge'
      });
  }

}