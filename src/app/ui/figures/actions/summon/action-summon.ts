import { Component, Input, OnChanges } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Action } from "src/app/game/model/Action";
import { MonsterStandeeData } from "src/app/game/model/data/RoomData";
import { MonsterSpawnData } from "src/app/game/model/data/ScenarioRule";
import { SummonData } from "src/app/game/model/data/SummonData";
import { EntityValueFunction } from "src/app/game/model/Entity";
import { Monster } from "src/app/game/model/Monster";
import { MonsterType } from "src/app/game/model/MonsterType";
import { Summon, SummonColor } from "src/app/game/model/Summon";

@Component({
  selector: 'ghs-action-summon',
  templateUrl: './action-summon.html',
  styleUrls: ['./action-summon.scss']
})
export class ActionSummonComponent implements OnChanges {

  @Input() monster: Monster | undefined;
  @Input() action!: Action;
  @Input() right: boolean = false;
  @Input() spawn: boolean = false;
  @Input() additional: boolean = false;
  monsters: MonsterSpawnData[] = [];
  type: MonsterType | undefined;
  summonData: SummonData | undefined;
  count: number | undefined;
  tags: string[] = [];

  settingsManager: SettingsManager = settingsManager;

  constructor() {
    gameManager.uiChange.subscribe({
      next: () => {
        this.update();
      }
    })
  }

  ngOnChanges(changes: any) {
    this.update();
  }

  update() {
    this.summonData = undefined;
    this.monsters = [];
    this.tags = [];
    this.count = undefined;
    this.type = undefined;
    if (this.action.value == 'summonData') {
      this.summonData = this.action.valueObject as SummonData;
    } if (this.action.value == 'monsterStandee') {
      this.monsters = JSON.parse(JSON.stringify(this.action.valueObject)) as MonsterSpawnData[];
      const charCount = Math.max(2, gameManager.characterManager.characterCount());
      this.monsters = this.monsters.filter((spawn) => {
        if (spawn.monster.type) {
          return true;
        } else if (charCount < 3 && spawn.monster.player2) {
          return true;
        } else if (charCount == 3 && spawn.monster.player3) {
          return true;
        } else if (charCount > 3 && spawn.monster.player4) {
          return true;
        }

        return !settingsManager.settings.calculate;
      })
      this.monsters.forEach((spawn) => {
        if (!spawn.monster.type) {
          if (charCount < 3 && spawn.monster.player2) {
            spawn.monster.type = spawn.monster.player2;
          } else if (charCount == 3 && spawn.monster.player3) {
            spawn.monster.type = spawn.monster.player3;
          } else if (charCount > 3 && spawn.monster.player4) {
            spawn.monster.type = spawn.monster.player4;
          }
        }
      })
    } else {
      ('' + this.action.value).split('|').forEach((value) => {
        const summonValue = value.split(':');
        let monsterStandee = new MonsterStandeeData(summonValue[0]);
        monsterStandee.type = MonsterType.normal;
        let monsterSpawn = new MonsterSpawnData(monsterStandee);

        if (summonValue.length > 1) {
          if (!isNaN(+summonValue[1])) {
            monsterSpawn.count = +summonValue[1];
          } else {
            monsterStandee.type = summonValue[1] as unknown as MonsterType;
          }
        }

        if (summonValue.length > 2) {
          if (!isNaN(+summonValue[2])) {
            monsterSpawn.count = +summonValue[2];
          }
        }

        this.monsters.push(monsterSpawn);
      });
    }

    if (this.monster) {
      gameManager.game.figures.forEach((figure) => {
        if (figure instanceof Monster) {
          figure.entities.forEach((entity) => {
            if (this.monster && entity.tags) {
              entity.tags.forEach((tag) => {
                if (this.monster && tag.startsWith("summon-" + this.monster.name + "-" + this.getSpawnId())) {
                  this.tags.push(tag);
                }
              })
            }
          })
        }
      })
    }
  }

  getSummonLabel(monsterSpawnData: MonsterSpawnData): string {
    if (monsterSpawnData.monster.player2 == monsterSpawnData.monster.player3 && monsterSpawnData.monster.player3 == monsterSpawnData.monster.player4) {
      return settingsManager.getLabel('game.summon.playerAll', ['' + monsterSpawnData.monster.type]) + (monsterSpawnData.monster.health ? ('(' + EntityValueFunction(monsterSpawnData.monster.health) + ' ' + settingsManager.getLabel('figure.health') + ')') : '');
    } else if (monsterSpawnData.monster.player2 == monsterSpawnData.monster.player3) {
      return settingsManager.getLabel('game.summon.player2-3', ['' + monsterSpawnData.monster.player2, '' + monsterSpawnData.monster.player4]) + (monsterSpawnData.monster.health ? ('(' + EntityValueFunction(monsterSpawnData.monster.health) + ' ' + settingsManager.getLabel('figure.health') + ')') : '');
    } else if (monsterSpawnData.monster.player3 == monsterSpawnData.monster.player4) {
      return settingsManager.getLabel('game.summon.player3-4', ['' + monsterSpawnData.monster.player2, '' + monsterSpawnData.monster.player4]) + (monsterSpawnData.monster.health ? ('(' + EntityValueFunction(monsterSpawnData.monster.health) + ' ' + settingsManager.getLabel('figure.health') + ')') : '');
    } else {
      console.warn('Incorrect summon data', monsterSpawnData);
    }
    return "";
  }

  getSummon(): Summon {
    if (this.summonData) {
      return new Summon(this.summonData.name, this.summonData.cardId, this.summonData.level || 0, this.summonData.count, SummonColor.custom, this.summonData);
    }
    return new Summon("", "", 0, 0, SummonColor.custom);
  }

  getSpawnId(): number {
    if (this.monster) {
      const ability = gameManager.monsterManager.getAbility(this.monster);
      if (ability) {
        return ability.cardId || gameManager.deckData(this.monster).abilities.indexOf(ability);
      }
    }
    return -1;
  }

  getTag(index: number): string {
    if (this.monster) {
      return "summon-" + this.monster.name + "-" + this.getSpawnId() + "-" + index;
    }
    return "";
  }

  spawnHightlight(spawn: MonsterSpawnData, index: number): boolean {
    const entities = this.monster && gameManager.monsterManager.monsterEntityCount(this.monster) || 0;
    return entities > 0 && this.monster && this.monster.active && this.tags.filter((tag) => tag == this.getTag(index)).length < entities || false;
  }

  spawnSummons(event: any, spawn: MonsterSpawnData, index: number) {
    if (this.monster && spawn.monster && spawn.monster.type && gameManager.game.scenario) {
      const count = EntityValueFunction(spawn.count || 1);
      gameManager.stateManager.before("summonAction", "data.monster." + spawn.monster.name, "game.monsterType." + spawn.monster.type, '' + count);
      for (let i = 0; i < count; i++) {
        const entity = gameManager.monsterManager.spawnMonsterEntity(spawn.monster.name, spawn.monster.type, this.monster.edition, this.monster.isAlly, false, !this.spawn);
        if (entity) {
          const tag = this.getTag(index);
          entity.tags = entity.tags || [];
          entity.tags.push(tag);
          this.tags.push(tag);
          if (spawn.monster.health) {
            entity.health = EntityValueFunction(spawn.monster.health);
          }
        }
      }
      this.update();
      gameManager.stateManager.after();
    }
    event.preventDefault();
  }
}