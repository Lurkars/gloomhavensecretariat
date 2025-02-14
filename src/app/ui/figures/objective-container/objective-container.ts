import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { CharacterManager } from 'src/app/game/businesslogic/CharacterManager';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { GameState } from 'src/app/game/model/Game';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import { ConditionType, EntityCondition } from 'src/app/game/model/data/Condition';
import { ObjectiveData } from 'src/app/game/model/data/ObjectiveData';
import { ghsDefaultDialogPositions, ghsValueSign } from '../../helper/Static';
import { CharacterInitiativeDialogComponent } from '../character/cards/initiative-dialog';
import { EntitiesMenuDialogComponent } from '../entities-menu/entities-menu-dialog';
import { EntityMenuDialogComponent } from '../entity-menu/entity-menu-dialog';
import { Monster } from 'src/app/game/model/Monster';
import { InteractiveAction } from 'src/app/game/businesslogic/ActionsManager';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionType } from 'src/app/game/model/data/Action';

@Component({
	standalone: false,
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
  compact: boolean = false;

  nonDead: number = 0;

  interactiveActions: InteractiveAction[] = [];
  interactiveActionsChange = new EventEmitter<InteractiveAction[]>();

  constructor(private dialog: Dialog, private overlay: Overlay) { }

  ngOnInit(): void {
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
    if (this.objective && this.objective.objectiveId) {
      this.objectiveData = gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(this.objective.objectiveId);

      if (this.objectiveData && this.objectiveData.initiativeShare) {
        let offset = 0;
        const name = this.objectiveData.initiativeShare.split(':')[0];
        if (this.objectiveData.initiativeShare.split(':').length > 0) {
          offset = +this.objectiveData.initiativeShare.split(':')[1];
        }

        const monster = gameManager.game.figures.find((figure) => figure instanceof Monster && figure.name == name);
        if (monster) {
          this.objective.initiative = gameManager.game.state == GameState.next && monster.getInitiative() && monster.getInitiative() < 100 ? (offset < 0 ? Math.ceil(monster.getInitiative() + offset) : Math.floor(monster.getInitiative() + offset)) : 0;
          if (gameManager.game.state == GameState.next && this.objective.initiative && offset && settingsManager.settings.sortFigures) {
            setTimeout(() => {
              gameManager.sortFigures();
              gameManager.game.figures.sort((a, b) => {
                if (a == monster && b == this.objective) {
                  return offset < 0 ? 1 : -1;
                } else if (a == this.objective && b == monster) {
                  return offset < 0 ? -1 : 1;
                }
                return 0;
              })
            }, 1)
          }
        }
      }
    }
    this.compact = settingsManager.settings.characterCompact && settingsManager.settings.theme != 'modern';
  }

  toggleFigure(event: any): void {
    if ((gameManager.game.state == GameState.draw || settingsManager.settings.initiativeRequired && this.objective.initiative <= 0)) {
      this.openInitiativeDialog(event);
    } else {
      gameManager.stateManager.before(this.objective.active ? "unsetActive" : "setActive", gameManager.objectiveManager.objectiveName(this.objective));
      gameManager.roundManager.toggleFigure(this.objective);
      gameManager.stateManager.after();
    }
  }

  openInitiativeDialog(event: any) {
    this.dialog.open(CharacterInitiativeDialogComponent, {
      panelClass: ['dialog'],
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
      gameManager.stateManager.before("setObjectiveInitiative", gameManager.objectiveManager.objectiveName(this.objective), "" + value);
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
      gameManager.stateManager.before("changeObjectiveEntityHP", gameManager.objectiveManager.objectiveName(this.objective), ghsValueSign(this.health), this.entity.number);
      gameManager.entityManager.changeHealth(this.entity, this.objective, this.health);
      if (this.entity.health <= 0 && this.entity.maxHealth > 0) {
        gameManager.objectiveManager.removeObjective(this.objective)
      }
      this.health = 0;
      gameManager.stateManager.after();
    }
  }

  dragHpCancel(value: number) {
    this.health = 0;
  }

  openEntityMenu(event: any): void {
    this.dialog.open(EntityMenuDialogComponent, {
      panelClass: ['dialog'], data: {
        entity: this.entity,
        figure: this.objective
      },
      positionStrategy: this.overlay.position().flexibleConnectedTo(this.objectiveName).withPositions(ghsDefaultDialogPositions())
    });
  }

  toggleDamageHP() {
    settingsManager.toggle('damageHP');
  }

  openEntitiesMenu(event: any) {
    this.dialog.open(EntitiesMenuDialogComponent, {
      panelClass: ['dialog'],
      data: {
        objective: this.objective
      },
      positionStrategy: this.overlay.position().flexibleConnectedTo(event.target).withPositions(ghsDefaultDialogPositions())
    });
  }

  addEntity() {
    const objectiveCount = this.objective.entities.filter((entity) => gameManager.entityManager.isAlive(entity)).length;
    let number = objectiveCount % 12;
    if (this.objective.entities.find((objectiveEntity) => objectiveEntity.number == number)) {
      number = objectiveCount % 12;
      if (objectiveCount < 12) {
        while (this.objective.entities.find((objectiveEntity) => objectiveEntity.number - 1 == number)) {
          number++;
        }
      }
    }

    let name = this.objective.name;
    if (!name) {
      name = this.objective.title;
      if (!name) {
        name = this.objective.escort ? '%escort%' : '%objective%';
      }
    }

    gameManager.stateManager.before('addObjective.entity', (number + 1), name);
    gameManager.objectiveManager.addObjectiveEntity(this.objective, number);
    gameManager.stateManager.after();
  }

  removeCondition(entityCondition: EntityCondition) {
    if (this.entity) {
      gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.objective, "removeCondition"), entityCondition.name);
      gameManager.entityManager.removeCondition(this.entity, this.objective, entityCondition, entityCondition.permanent);
      gameManager.stateManager.after();
    }
  }

  removeMarker(marker: string) {
    if (this.entity) {
      const markerChar = new Character(gameManager.getCharacterData(marker), 1);
      const markerName = gameManager.characterManager.characterName(markerChar);
      const characterIcon = markerChar.name;
      gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.objective, "removeMarker"), markerName, characterIcon);
      this.entity.markers = this.entity.markers.filter((value) => value != marker);
      gameManager.stateManager.after();
    }
  }

  onInteractiveActionsChange(change: InteractiveAction[]) {
    this.interactiveActionsChange.emit(change);
    this.interactiveActions = change;
  }



  removeShield() {
    if (this.entity) {
      gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.objective, "removeEntityShield"));
      this.entity.shield = undefined;
      gameManager.stateManager.after();
    }
  }

  removeShieldPersistent() {
    if (this.entity) {
      gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.objective, "removeEntityShieldPersistent"));
      this.entity.shieldPersistent = undefined;
      gameManager.stateManager.after();
    }
  }

  removeRetaliate(index: number) {
    if (this.entity) {
      let retaliate: Action[] = JSON.parse(JSON.stringify(this.entity.retaliate));
      retaliate.splice(index, 1);
      if (retaliate.length > 0) {
        gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.objective, "setEntityRetaliate"), retaliate.map((action) => '%game.action.retaliate% ' + EntityValueFunction(action.value) + (action.subActions && action.subActions[0] && action.subActions[0].type == ActionType.range && EntityValueFunction(action.subActions[0].value) > 1 ? ' %game.action.range% ' + EntityValueFunction(action.subActions[0].value) + '' : '')).join(', '));

      } else {
        gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.objective, "removeEntityRetaliate"));
      }
      this.entity.retaliate = retaliate;
      gameManager.stateManager.after();
    }
  }

  removeRetaliatePersistent(index: number) {
    if (this.entity) {
      let retaliatePersistent: Action[] = JSON.parse(JSON.stringify(this.entity.retaliatePersistent));
      retaliatePersistent.splice(index, 1);
      if (retaliatePersistent.length > 0) {
        gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.objective, "setEntityRetaliatePersistent"), retaliatePersistent.map((action) => '%game.action.retaliate% ' + EntityValueFunction(action.value) + (action.subActions && action.subActions[0] && action.subActions[0].type == ActionType.range && EntityValueFunction(action.subActions[0].value) > 1 ? ' %game.action.range% ' + EntityValueFunction(action.subActions[0].value) + '' : '')).join(', '));
      } else {
        gameManager.stateManager.before(...gameManager.entityManager.undoInfos(this.entity, this.objective, "removeEntityRetaliatePersistent"));
      }
      this.entity.retaliatePersistent = retaliatePersistent;
      gameManager.stateManager.after();
    }
  }

}