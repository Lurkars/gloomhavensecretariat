import { Component, Input, OnChanges, OnDestroy } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Action } from "src/app/game/model/data/Action";
import { MonsterStandeeData } from "src/app/game/model/data/RoomData";
import { MonsterSpawnData } from "src/app/game/model/data/ScenarioRule";
import { SummonData } from "src/app/game/model/data/SummonData";
import { Entity, EntityValueFunction } from "src/app/game/model/Entity";
import { Monster } from "src/app/game/model/Monster";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";
import { MonsterType } from "src/app/game/model/data/MonsterType";
import { Objective } from "src/app/game/model/Objective";
import { Summon, SummonColor } from "src/app/game/model/Summon";
import { Subscription } from "rxjs";

@Component({
  selector: 'ghs-action-summon',
  templateUrl: './action-summon.html',
  styleUrls: ['./action-summon.scss']
})
export class ActionSummonComponent implements OnChanges, OnDestroy {

  @Input() monster: Monster | undefined;
  @Input() monsterType: MonsterType | undefined;
  @Input() objective: Objective | undefined;
  @Input() action!: Action;
  @Input() right: boolean = false;
  @Input('spawn') isSpawn: boolean = false;
  @Input() additional: boolean = false;
  @Input() highlight: boolean = true;
  @Input('index') actionIndex: string = "";
  @Input() style: 'gh' | 'fh' | false = false;
  spawners: Entity[] = [];
  monsters: MonsterSpawnData[] = [];
  type: MonsterType | undefined;
  summonData: SummonData | undefined;
  count: number | undefined;
  tags: string[] = [];

  settingsManager: SettingsManager = settingsManager;
  MonsterType = MonsterType;

  constructor() {
    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => {
        this.update();
      }
    })
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  ngOnChanges(changes: any) {
    this.update();
  }

  update() {
    this.summonData = undefined;
    this.spawners = [];
    if (this.monster) {
      this.spawners = gameManager.entityManager.entities(this.monster, true).map((entity) => entity as MonsterEntity).filter((entity) => (!this.monsterType || entity.type == this.monsterType));
    } else if (this.objective) {
      this.spawners = [this.objective];
    }
    this.monsters = [];
    this.tags = [];
    this.count = undefined;
    this.type = undefined;
    if (this.action.value == 'summonData' || this.action.value == 'summonDataItem') {
      this.summonData = this.action.valueObject as SummonData;
    } else if (this.action.value == 'monsterStandee') {
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

        if (summonValue.length > 2 && summonValue[2]) {
          monsterSpawn.count = summonValue[2];
        }

        if (summonValue.length > 3 && summonValue[3]) {
          monsterStandee.health = summonValue[3];
        }

        this.monsters.push(monsterSpawn);
      });
    }

    if (this.monster || this.objective) {
      gameManager.game.figures.forEach((figure) => {
        if (figure instanceof Monster) {
          figure.entities.forEach((entity) => {
            if (entity.tags) {
              entity.tags.forEach((tag) => {
                if (this.monster && tag.startsWith('roundAction-summon-' + this.monster.name + '-' + (this.actionIndex ? this.actionIndex + '-' : '') + this.getSpawnId())) {
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
    const health = typeof monsterSpawnData.monster.health === 'string' && monsterSpawnData.monster.health.indexOf('H') != -1 ? monsterSpawnData.monster.health : (monsterSpawnData.monster.health ? EntityValueFunction(monsterSpawnData.monster.health) : '');

    if (monsterSpawnData.monster.player2 == monsterSpawnData.monster.player3 && monsterSpawnData.monster.player3 == monsterSpawnData.monster.player4) {
      return settingsManager.getLabel('game.summon.playerAll', ['' + monsterSpawnData.monster.type]) + (health ? ('(' + health + ' ' + settingsManager.getLabel('game.hp') + ')') : '');
    } else if (monsterSpawnData.monster.player2 == monsterSpawnData.monster.player3) {
      return settingsManager.getLabel('game.summon.player2-3', ['' + monsterSpawnData.monster.player2, '' + monsterSpawnData.monster.player4]) + (health ? ('(' + health + ' ' + settingsManager.getLabel('game.hp') + ')') : '');
    } else if (monsterSpawnData.monster.player3 == monsterSpawnData.monster.player4) {
      return settingsManager.getLabel('game.summon.player3-4', ['' + monsterSpawnData.monster.player2, '' + monsterSpawnData.monster.player4]) + (health ? ('(' + health + ' ' + settingsManager.getLabel('game.hp') + ')') : '');
    } else {
      console.warn('Incorrect summon data', monsterSpawnData);
    }
    return "";
  }

  getSummon(): Summon {
    if (this.summonData) {
      return new Summon("", this.summonData.name, this.summonData.cardId, this.summonData.level || 0, this.summonData.count, SummonColor.custom, this.summonData);
    }
    return new Summon("", "", "", 0, 0, SummonColor.custom);
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

  getTag(index: number, spawner: boolean = false): string {
    if (this.monster) {
      return (spawner ? 'roundAction-spawner-' : 'roundAction-summon-') + this.monster.name + "-" + (this.actionIndex ? this.actionIndex + '-' : '') + this.getSpawnId() + "-" + index;
    }
    if (this.objective) {
      return (spawner ? 'roundAction-spawner-' : 'roundAction-summon-') + this.objective.id + "-" + (this.actionIndex ? this.actionIndex + '-' : '') + index;
    }
    return "";
  }

  spawnHightlight(spawn: MonsterSpawnData, index: number): boolean {
    if (this.monster) {
      const spawnMonster = gameManager.game.figures.find((figure) => figure instanceof Monster && figure.name == spawn.monster.name);
      const spawns = spawnMonster && gameManager.monsterManager.monsterEntityCountAll(spawnMonster as Monster) || 0;
      return this.highlight && (this.spawners.length > 0 && this.monster.active && this.tags.filter((tag) => tag == this.getTag(index)).length < this.spawners.length && (!spawnMonster || spawns < EntityValueFunction((spawnMonster as Monster).count, (spawnMonster as Monster).level)) || false);
    }

    return this.highlight && this.objective != undefined || false;
  }

  spawnSummons(event: TouchEvent | MouseEvent, spawn: MonsterSpawnData, index: number) {
    if (this.spawnHightlight(spawn, index) || this.objective) {
      const spawnerTag = this.getTag(index, true);
      const spawners = this.spawners.filter((entity) => entity instanceof Objective || entity.tags.indexOf(spawnerTag) == -1).filter((entity, index) => settingsManager.settings.combineSummonAction || index == 0);

      if (spawn.monster && spawn.monster.type) {
        const count = EntityValueFunction(spawn.count || 1);
        gameManager.stateManager.before("summonAction", "data.monster." + spawn.monster.name, "game.monsterType." + spawn.monster.type, '' + count * spawners.length);
        spawners.forEach((spawner) => {
          if (spawn.monster && spawn.monster.type) {
            const monster = gameManager.monsterManager.addMonsterByName(spawn.monster.name, this.monster && this.monster.edition || gameManager.currentEdition());
            if (monster) {
              for (let i = 0; i < count; i++) {
                const entity = gameManager.monsterManager.spawnMonsterEntity(monster, spawn.monster.type, monster.isAlly, monster.isAllied, monster.drawExtra, !this.isSpawn);
                if (entity) {
                  const tag = this.getTag(index);
                  entity.tags = entity.tags || [];
                  entity.tags.push(tag);
                  this.tags.push(tag);
                  if (spawn.monster.marker) {
                    entity.marker = spawn.monster.marker;
                  }
                  if (spawn.monster.health) {
                    let health = spawn.monster.health;
                    if (typeof health === 'string') {
                      health = health.replaceAll('H', '' + spawner.health);
                    }

                    entity.health = EntityValueFunction(health);

                    if (entity.health > entity.maxHealth) {
                      entity.health = entity.maxHealth;
                    }
                  }
                  if (entity.marker || entity.tags.length > 0) {
                    gameManager.addEntityCount(monster, entity);
                  }
                }
              }
              spawner.tags.push(spawnerTag);
            }
          }
        })
        this.update();
        gameManager.stateManager.after();
      }
      event.stopPropagation();
      event.preventDefault();
    }
  }

}