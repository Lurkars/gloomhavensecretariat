import { Dialog } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CharacterManager } from 'src/app/game/businesslogic/CharacterManager';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ConditionType, EntityCondition } from 'src/app/game/model/data/Condition';
import { ObjectiveData } from 'src/app/game/model/data/ObjectiveData';
import { GameState } from 'src/app/game/model/Game';
import { ghsDefaultDialogPositions } from '../../helper/Static';
import { CharacterInitiativeDialogComponent } from '../character/cards/initiative-dialog';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { Subscription } from 'rxjs';

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
  activeConditions: EntityCondition[] = [];
  initiative: number = -1;

  nonDead: number = 0;

  constructor(private dialog: Dialog, private overlay: Overlay) { }

  ngOnInit(): void {
    if (this.objective && this.objective.objectiveId) {
      this.objectiveData = gameManager.objectiveDataByScenarioObjectiveIdentifier(this.objective.objectiveId);
    }
    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => {
        this.nonDead = this.objective.entities.filter((entity) => gameManager.entityManager.isAlive(entity)).length;
      }
    })
    this.nonDead = this.objective.entities.filter((entity) => gameManager.entityManager.isAlive(entity)).length;
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
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

  addEntity() {
    gameManager.stateManager.before('addObjectiveEntity');
    gameManager.objectiveManager.addObjectiveEntity(this.objective);
    gameManager.stateManager.after();
  }
}