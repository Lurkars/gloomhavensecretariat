import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from "@angular/core";
import { Subscription } from "rxjs";
import { InteractiveAction } from "src/app/game/businesslogic/ActionsManager";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Entity, EntityValueFunction } from "src/app/game/model/Entity";
import { Monster } from "src/app/game/model/Monster";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";
import { ObjectiveContainer } from "src/app/game/model/ObjectiveContainer";
import { ObjectiveEntity } from "src/app/game/model/ObjectiveEntity";
import { Summon, SummonColor } from "src/app/game/model/Summon";
import { Action } from "src/app/game/model/data/Action";
import { MonsterType } from "src/app/game/model/data/MonsterType";
import { MonsterSpawnData, ObjectiveSpawnData } from "src/app/game/model/data/ScenarioRule";
import { SummonData } from "src/app/game/model/data/SummonData";

@Component({
	standalone: false,
  selector: 'ghs-action-summon',
  templateUrl: './action-summon.html',
  styleUrls: ['./action-summon.scss']
})
export class ActionSummonComponent implements OnChanges, OnDestroy {

  @Input() monster: Monster | undefined;
  @Input() monsterType: MonsterType | undefined;
  @Input() objective: ObjectiveContainer | undefined;
  @Input() action!: Action;
  @Input() textBlack: boolean = false;
  @Input() right: boolean = false;
  @Input('spawn') isSpawn: boolean = false;
  @Input() additional: boolean = false;
  @Input() interactiveAbilities: boolean = false;
  @Input() interactiveActions: InteractiveAction[] = [];
  @Output() interactiveActionsChange = new EventEmitter<InteractiveAction[]>();
  @Input('index') actionIndex: string = "";
  @Input() style: 'gh' | 'fh' | false = false;
  spawners: Entity[] = [];
  monsters: MonsterSpawnData[] = [];
  objectives: ObjectiveSpawnData[] = [];
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
    } else if (this.objective instanceof ObjectiveContainer) {
      this.spawners = gameManager.entityManager.entities(this.objective, true).map((entity) => entity as ObjectiveEntity)
    }
    this.monsters = gameManager.actionsManager.getMonsterSpawnData(this.action).map((value) => {
      const spawn = new MonsterSpawnData(value);
      if (settingsManager.settings.calculate && !settingsManager.settings.combineInteractiveAbilities && this.isInteractiveApplicableAction() && typeof spawn.count === 'string' && this.spawners.length) {
        const spawner = this.spawners.find((entity) => gameManager.actionsManager.isInteractiveApplicableAction(entity, this.action, this.actionIndex));
        if (spawner) {
          spawn.count = EntityValueFunction(spawn.count.replaceAll('HP', '' + spawner.health).replaceAll('H', '' + EntityValueFunction(spawner.maxHealth)), spawner.level);
        }
      }
      return spawn;
    });
    this.objectives = gameManager.actionsManager.getObjectiveSpawnData(this.action);
    this.count = undefined;
    this.type = undefined;
    if (this.action.value == 'summonData' || this.action.value == 'summonDataItem') {
      this.summonData = this.action.valueObject as SummonData;
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

  highlightAction(): boolean {
    return this.interactiveActions.find((interactiveAction) => interactiveAction.index == this.actionIndex) != undefined || false;
  }

  isInteractiveApplicableAction(): boolean {
    return this.interactiveAbilities && this.monster && this.monster.entities.some((entity) => this.action && gameManager.actionsManager.isInteractiveApplicableAction(entity, this.action, this.actionIndex)) || this.objective && this.objective.entities.some((entity) => this.action && gameManager.actionsManager.isInteractiveApplicableAction(entity, this.action, this.actionIndex)) || false;
  }

  toggleHighlight(event: MouseEvent | TouchEvent) {
    if (this.isInteractiveApplicableAction()) {
      if (this.highlightAction()) {
        this.interactiveActions = this.interactiveActions.filter((interactiveAction) => interactiveAction.index != this.actionIndex);
      } else if (this.action) {
        this.interactiveActions.push({ action: this.action, index: this.actionIndex });
      };
      this.interactiveActionsChange.emit(this.interactiveActions);
      event.preventDefault();
      event.stopPropagation();
    }
  }

}