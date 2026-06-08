import { NgClass } from '@angular/common';
import { Component, forwardRef, inject, input, model, OnChanges } from '@angular/core';
import { InteractiveAction } from 'src/app/game/businesslogic/ActionsManager';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Action } from 'src/app/game/model/data/Action';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { MonsterSpawnData, ObjectiveSpawnData } from 'src/app/game/model/data/ScenarioRule';
import { SummonData } from 'src/app/game/model/data/SummonData';
import { Entity, EntityValueFunction } from 'src/app/game/model/Entity';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import { Summon, SummonColor } from 'src/app/game/model/Summon';
import { SummonSheetComponent } from 'src/app/ui/figures/standee/sheet/summon-sheet';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';
import { ValueCalcDirective } from 'src/app/ui/helper/valueCalc';

@Component({
  imports: [
    NgClass,
    GhsLabelDirective,
    PointerInputDirective,
    GhsTooltipDirective,
    ValueCalcDirective,
    TrackUUIDPipe,
    forwardRef(() => SummonSheetComponent)
  ],
  selector: 'ghs-action-summon',
  templateUrl: './action-summon.html',
  styleUrls: ['./action-summon.scss']
})
export class ActionSummonComponent implements OnChanges {
  private ghsManager = inject(GhsManager);

  readonly inputMonster = input<Monster>(undefined, { alias: 'monster' });
  get monster(): Monster | undefined {
    return this.inputMonster();
  }

  readonly inputCharacter = input<Character>(undefined, { alias: 'character' });
  get character(): Character | undefined {
    return this.inputCharacter();
  }

  readonly inputObjective = input<ObjectiveContainer>(undefined, { alias: 'objective' });
  get objective(): ObjectiveContainer | undefined {
    return this.inputObjective();
  }

  readonly inputAction = input.required<Action>({ alias: 'action' });
  get action(): Action {
    return this.inputAction();
  }

  readonly monsterType = input<MonsterType>();
  readonly textBlack = input<boolean>(false);
  readonly right = input<boolean>(false);
  readonly isSpawn = input<boolean>(false, { alias: 'spawn' });
  readonly additional = input<boolean>(false);
  readonly interactiveAbilities = input<boolean>(false);
  interactiveActions = model<InteractiveAction[]>([]);
  readonly actionIndex = input<string>('', { alias: 'index' });
  readonly style = input<'gh' | 'fh' | false>(false);
  readonly cardId = input<number>();
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
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnChanges() {
    this.update();
  }

  update() {
    this.summonData = undefined;
    this.spawners = [];
    if (this.monster) {
      this.spawners = gameManager.entityManager
        .entities(this.monster, true)
        .map((entity) => entity as MonsterEntity)
        .filter((entity) => {
          const monsterType = this.monsterType();
          return !monsterType || entity.type === monsterType;
        });
    } else if (this.objective instanceof ObjectiveContainer) {
      this.spawners = gameManager.entityManager.entities(this.objective, true).map((entity) => entity as ObjectiveEntity);
    }
    this.monsters = gameManager.actionsManager.getMonsterSpawnData(this.action).map((value) => {
      const spawn = new MonsterSpawnData(value);
      if (
        settingsManager.settings.calculate &&
        !settingsManager.settings.combineInteractiveAbilities &&
        this.isInteractiveApplicableAction() &&
        typeof spawn.count === 'string' &&
        this.spawners.length
      ) {
        const spawner = this.spawners.find((entity) =>
          gameManager.actionsManager.isInteractiveApplicableAction(entity, this.action, this.actionIndex())
        );
        if (spawner) {
          spawn.count = EntityValueFunction(
            spawn.count.replaceAll('HP', '' + spawner.health).replaceAll('H', '' + EntityValueFunction(spawner.maxHealth)),
            spawner.level
          );
        }
      }
      return spawn;
    });
    this.objectives = gameManager.actionsManager.getObjectiveSpawnData(this.action);
    this.count = undefined;
    this.type = undefined;
    if (this.action && (this.action.value === 'summonData' || this.action.value === 'summonDataItem')) {
      this.summonData = this.action.valueObject as SummonData;
      if (!this.summonData.edition) {
        if (this.character && this.cardId()) {
          this.summonData.edition = this.character.edition;
        } else if (this.monster) {
          this.summonData.edition = this.monster.edition;
        }
      }
      this.action.small = true;
    }
  }

  getSummonLabel(monsterSpawnData: MonsterSpawnData): string {
    const health =
      typeof monsterSpawnData.monster.health === 'string' && monsterSpawnData.monster.health.includes('H')
        ? monsterSpawnData.monster.health
        : monsterSpawnData.monster.health
          ? EntityValueFunction(monsterSpawnData.monster.health)
          : '';

    if (
      monsterSpawnData.monster.player2 === monsterSpawnData.monster.player3 &&
      monsterSpawnData.monster.player3 === monsterSpawnData.monster.player4
    ) {
      return (
        settingsManager.getLabel('game.summon.playerAll', ['' + monsterSpawnData.monster.type]) +
        (health ? '(' + health + ' ' + settingsManager.getLabel('game.hp') + ')' : '')
      );
    } else if (monsterSpawnData.monster.player2 === monsterSpawnData.monster.player3) {
      return (
        settingsManager.getLabel('game.summon.player2-3', ['' + monsterSpawnData.monster.player2, '' + monsterSpawnData.monster.player4]) +
        (health ? '(' + health + ' ' + settingsManager.getLabel('game.hp') + ')' : '')
      );
    } else if (monsterSpawnData.monster.player3 === monsterSpawnData.monster.player4) {
      return (
        settingsManager.getLabel('game.summon.player3-4', ['' + monsterSpawnData.monster.player2, '' + monsterSpawnData.monster.player4]) +
        (health ? '(' + health + ' ' + settingsManager.getLabel('game.hp') + ')' : '')
      );
    } else {
      console.warn('Incorrect summon data', monsterSpawnData);
    }
    return '';
  }

  getSummon(): Summon {
    if (this.summonData) {
      return new Summon(
        '',
        this.summonData.name,
        this.summonData.cardId,
        this.summonData.level || 0,
        this.summonData.count,
        SummonColor.custom,
        this.summonData
      );
    }
    return new Summon('', '', '', 0, 0, SummonColor.custom);
  }

  highlightAction(): boolean {
    return this.interactiveActions().find((interactiveAction) => interactiveAction.index === this.actionIndex()) !== undefined || false;
  }

  isInteractiveApplicableAction(): boolean {
    return (
      (this.interactiveAbilities() &&
        this.monster &&
        this.monster.entities.some(
          (entity) => this.action && gameManager.actionsManager.isInteractiveApplicableAction(entity, this.action, this.actionIndex())
        )) ||
      (this.objective &&
        this.objective.entities.some(
          (entity) => this.action && gameManager.actionsManager.isInteractiveApplicableAction(entity, this.action, this.actionIndex())
        )) ||
      false
    );
  }

  toggleHighlight(event: PointerEvent) {
    if (this.isInteractiveApplicableAction()) {
      if (this.highlightAction()) {
        this.interactiveActions.set(
          this.interactiveActions().filter((interactiveAction) => interactiveAction.index !== this.actionIndex())
        );
      } else if (this.action) {
        this.interactiveActions.update((arr) => [...arr, { action: this.action, index: this.actionIndex() }]);
      }
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
