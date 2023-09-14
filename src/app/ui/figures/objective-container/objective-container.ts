import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CharacterManager } from 'src/app/game/businesslogic/CharacterManager';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ConditionType, EntityCondition } from 'src/app/game/model/data/Condition';
import { ObjectiveData } from 'src/app/game/model/data/ObjectiveData';
import { GameState } from 'src/app/game/model/Game';
import { ghsDefaultDialogPositions, ghsValueSign } from '../../helper/Static';
import { CharacterInitiativeDialogComponent } from '../character/cards/initiative-dialog';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { Subscription } from 'rxjs';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { EntityMenuDialogComponent } from '../entity-menu/entity-menu-dialog';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import { EntitiesMenuDialogComponent } from '../entities-menu/entities-menu-dialog';

@Component({
  selector: 'ghs-objective-container',
  templateUrl: './objective-container.html',
  styleUrls: ['./objective-container.scss']
})
export class ObjectiveContainerComponent implements OnInit, OnDestroy {

  @Input() objective!: ObjectiveContainer;

  @ViewChild('objectiveTitle', { static: false }) titleInput!: ElementRef;
  @ViewChild('objectiveName') objectiveName!: ElementRef;

  characterManager: CharacterManager = gameManager.characterManager;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  ConditionType = ConditionType;
  objectiveData: ObjectiveData | undefined;
  entity: ObjectiveEntity | undefined;
  activeConditions: EntityCondition[] = [];
  initiative: number = -1;
  health: number = 0;
  marker: string = "";

  nonDead: number = 0;

  constructor(private dialog: Dialog, private overlay: Overlay) { }

  ngOnInit(): void {
    if (this.objective && this.objective.objectiveId) {
      this.objectiveData = gameManager.objectiveDataByScenarioObjectiveIdentifier(this.objective.objectiveId);
    }
    this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() });
    this.update();
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  update() {
    this.nonDead = this.objective.entities.filter((entity) => gameManager.entityManager.isAlive(entity)).length;
    this.activeConditions = [];
    this.entity = undefined;
    this.marker = "";
    if (this.nonDead == 1) {
      this.entity = this.objective.entities.find((entity) => gameManager.entityManager.isAlive(entity));
      if (this.entity) {
        this.activeConditions = gameManager.entityManager.activeConditions(this.entity);
        this.entity.immunities.forEach((immunity) => {
          if (!this.activeConditions.find((entityCondition) => entityCondition.name == immunity)) {
            this.activeConditions.push(new EntityCondition(immunity));
          }
        })
      }
    } else if (this.objective.entities.flatMap((entity) => entity.marker).every((marker, index, self) => self.indexOf(marker) == 0)) {
      this.marker = this.objective.entities.flatMap((entity) => entity.marker)[0];
    }
  }

  toggleFigure(event: any): void {
    if ((gameManager.game.state == GameState.draw || settingsManager.settings.initiativeRequired && this.objective.initiative <= 0)) {
      this.openInitiativeDialog(event);
    } else {
      gameManager.stateManager.before(this.objective.active ? "unsetActive" : "setActive", this.objective.title || this.objective.name);
      gameManager.roundManager.toggleFigure(this.objective);
      gameManager.stateManager.after();
    }
  }

  openInitiativeDialog(event: any) {
    this.dialog.open(CharacterInitiativeDialogComponent, {
      panelClass: 'dialog',
      data: this.objective,
      positionStrategy: this.overlay.position().flexibleConnectedTo(event.target).withPositions(ghsDefaultDialogPositions())
    });
  }

  dragInitiativeMove(value: number) {
    if (value > 99) {
      value = 99;
    } else if (value < 0) {
      value = 0;
    }

    if (value == 0 && settingsManager.settings.initiativeRequired) {
      value = 1;
    }

    if (this.initiative == -1) {
      this.initiative = this.objective.initiative;
    }

    this.objective.initiative = value;
  }

  dragInitiativeEnd(value: number) {
    if (value > 99) {
      value = 99;
    } else if (value < 0) {
      value = 0;
    }

    if (value == 0 && settingsManager.settings.initiativeRequired) {
      value = 1;
    }

    if (this.objective.initiative != this.initiative) {
      this.objective.initiative = this.initiative;
      gameManager.stateManager.before("setObjectiveInitiative", this.objective.title || this.objective.name, "" + value);
      this.objective.initiative = value;
      this.initiative = -1;
      if (gameManager.game.state == GameState.next) {
        gameManager.sortFigures(this.objective);
      }
      gameManager.stateManager.after();
    }
  }

  dragHpMove(value: number) {
    this.health = value;
    if (this.entity && this.entity.health + this.health > EntityValueFunction(this.entity.maxHealth)) {
      this.health = EntityValueFunction(this.entity.maxHealth) - this.entity.health;
    }
  }

  dragHpEnd(value: number) {
    if (this.health != 0 && this.entity) {
      gameManager.stateManager.before("changeObjectiveEntityHP", this.objective.title || this.objective.name, ghsValueSign(this.health), '' + this.entity.number);
      gameManager.entityManager.changeHealth(this.entity, this.objective, this.health);
      if (this.entity.health <= 0 && this.entity.maxHealth > 0) {
        gameManager.objectiveManager.removeObjective(this.objective)
      }
      this.health = 0;
      gameManager.stateManager.after();
    }
  }

  openEntityMenu(event: any): void {
    if (this.entity) {
      this.dialog.open(EntityMenuDialogComponent, {
        panelClass: 'dialog', data: {
          entity: this.entity,
          figure: this.objective
        },
        positionStrategy: this.overlay.position().flexibleConnectedTo(this.objectiveName).withPositions(ghsDefaultDialogPositions())
      });
    }
  }

  openEntitiesMenu(event: any) {
    this.dialog.open(EntitiesMenuDialogComponent, {
      panelClass: 'dialog',
      data: {
        objective: this.objective
      },
      positionStrategy: this.overlay.position().flexibleConnectedTo(event.target).withPositions(ghsDefaultDialogPositions())
    });
  }

  addEntity() {
    gameManager.stateManager.before('addObjectiveEntity');
    gameManager.objectiveManager.addObjectiveEntity(this.objective);
    gameManager.stateManager.after();
  }

  removeCondition(entityCondition: EntityCondition) {
    if (this.entity) {
      gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.objective, "removeCondition"), entityCondition.name);
      gameManager.entityManager.removeCondition(this.entity, entityCondition, entityCondition.permanent);
      gameManager.stateManager.after();
    }
  }

}