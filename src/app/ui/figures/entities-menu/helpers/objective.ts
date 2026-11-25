import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { OBJECTIVE_MARKERS, ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import type { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';
import { ghsModulo } from 'src/app/ui/helper/Static';
import { EditorActionDialogComponent } from 'src/app/ui/tools/editor/action/action';

export class ObjectiveHelper {
  constructor(private component: EntitiesMenuDialogComponent) {}

  defaultActions: Action[] = [];

  update() {
    this.defaultActions = [];
    if (this.component.figure instanceof ObjectiveContainer) {
      if (this.component.figure.objectiveId) {
        this.component.objectiveData = gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(this.component.figure.objectiveId);
      } else {
        this.component.objectiveData = undefined;
      }

      this.component.objectiveActions = this.component.figure.actions || [];
      this.component.trackDamage = !!this.component.objectiveData && this.component.objectiveData.trackDamage;

      if (
        this.component.objectiveData &&
        this.component.objectiveData.actions &&
        JSON.stringify(this.component.objectiveData.actions) !== JSON.stringify(this.component.objectiveActions)
      ) {
        this.defaultActions = this.component.objectiveData.actions;
      }
    } else {
      this.component.objectiveData = undefined;
    }
  }

  addAction() {
    if (this.component.figure instanceof ObjectiveContainer) {
      const action = new Action(ActionType.attack);
      this.component.objectiveActions = [...this.component.objectiveActions, action];
      this.openActionDialog(action);
    }
  }

  editAction(action: Action) {
    this.openActionDialog(action);
  }

  dropAction(event: CdkDragDrop<number>) {
    moveItemInArray(this.component.objectiveActions, event.previousIndex, event.currentIndex);
    this.component.objectiveActions = [...this.component.objectiveActions];
    this.commitActions();
  }

  restoreDefaultActions() {
    if (!(this.component.figure instanceof ObjectiveContainer)) {
      return;
    }

    this.component.before('restoreObjectiveActions');
    this.component.figure.actions = JSON.parse(JSON.stringify(this.defaultActions));
    this.component.objectiveActions = this.component.figure.actions || [];
    gameManager.stateManager.after();
  }

  private openActionDialog(action: Action) {
    const dialog = this.component.dialog.open(EditorActionDialogComponent, {
      panelClass: ['dialog'],
      data: { action }
    });

    dialog.closed.subscribe({
      next: (value) => {
        if (value === false) {
          this.component.objectiveActions.splice(this.component.objectiveActions.indexOf(action), 1);
          this.component.objectiveActions = [...this.component.objectiveActions];
        }
        this.commitActions();
      }
    });
  }

  private commitActions() {
    if (!(this.component.figure instanceof ObjectiveContainer)) {
      return;
    }

    this.component.before(!this.component.objectiveActions.length ? 'unsetObjectiveActions' : 'setObjectiveActions');
    this.component.figure.actions = JSON.parse(JSON.stringify(this.component.objectiveActions));
    gameManager.stateManager.after();

    if (
      this.component.objectiveData &&
      this.component.objectiveData.actions &&
      JSON.stringify(this.component.objectiveData.actions) !== JSON.stringify(this.component.objectiveActions)
    ) {
      this.defaultActions = this.component.objectiveData.actions;
    }
  }

  showMaxHealth(): boolean {
    if (this.component.figure instanceof ObjectiveContainer) {
      return !isNaN(+this.component.figure.health) && EntityValueFunction(this.component.figure.health) > 0;
    }
    return false;
  }

  changeId(value: number) {
    if (this.component.figure instanceof ObjectiveContainer && this.component.entity instanceof ObjectiveEntity) {
      this.component.objectiveId += value;
      let newId = this.component.entity.number + this.component.objectiveId;
      if (newId < 1) {
        this.component.objectiveId = 12 - this.component.entity.number;
      } else if (newId > 12) {
        this.component.objectiveId = 1 - this.component.entity.number;
      }
      newId = this.component.entity.number + this.component.objectiveId;
      if (this.component.figure.entities.length < 12) {
        while (this.component.figure.entities.some((entity) => entity.number === newId && entity !== this.component.entity)) {
          this.component.objectiveId += value;
          newId = this.component.entity.number + this.component.objectiveId;
          if (newId < 1) {
            this.component.objectiveId = 12 - this.component.entity.number;
          } else if (newId > 12) {
            this.component.objectiveId = 1 - this.component.entity.number;
          }
          newId = this.component.entity.number + this.component.objectiveId;
        }
      }
    }
  }

  changeMarker(value: number) {
    if (this.component.figure instanceof ObjectiveContainer) {
      this.component.objectiveMarker = ghsModulo(this.component.objectiveMarker + value, OBJECTIVE_MARKERS.length);
    }
  }

  toggleAMDeck(deck: string) {
    if (this.component.figure instanceof ObjectiveContainer) {
      if (this.component.figure.amDeck === deck) {
        this.component.before('unsetObjectiveAmDeck', deck);
        gameManager.objectiveManager.setAmDeck(this.component.figure, '');
        gameManager.stateManager.after();
      } else if (gameManager.objectiveManager.canSetAmDeck(this.component.figure, deck)) {
        this.component.before('setObjectiveAmDeck', deck);
        gameManager.objectiveManager.setAmDeck(this.component.figure, deck);
        gameManager.stateManager.after();
      }
    }
  }

  close() {
    if (this.component.entity instanceof ObjectiveEntity && this.component.figure instanceof ObjectiveContainer) {
      this.closeObjectiveEntity();
    } else if (this.component.figure instanceof ObjectiveContainer) {
      this.closeObjectiveContainer();
    }
  }

  private closeObjectiveEntity() {
    const figure = this.component.figure as ObjectiveContainer;
    const entity = this.component.entity as ObjectiveEntity;

    const newId = entity.number + this.component.objectiveId;
    if (newId !== entity.number && gameManager.objectiveManager.canSetObjectiveNumber(figure, entity, newId)) {
      this.component.before('changeEntityNumber', entity.number, newId);
      gameManager.objectiveManager.setObjectiveNumber(figure, entity, newId);
      gameManager.stateManager.after();
    }
    this.component.objectiveId = 0;

    const currentMarker = entity.marker || '';
    const newMarker =
      OBJECTIVE_MARKERS[ghsModulo(this.component.objectiveMarker + OBJECTIVE_MARKERS.indexOf(currentMarker), OBJECTIVE_MARKERS.length)];

    if (newMarker !== currentMarker && gameManager.objectiveManager.canSetObjectiveMarker(figure, entity, newMarker)) {
      if (newMarker) {
        this.component.before('setObjectiveMarker', newMarker, currentMarker);
      } else {
        this.component.before('unsetObjectiveMarker', currentMarker);
      }
      gameManager.objectiveManager.setObjectiveMarker(figure, entity, newMarker);
      gameManager.stateManager.after();
    }
    this.component.objectiveMarker = 0;

    if (this.component.objectiveTitle !== undefined) {
      if (this.component.objectiveTitle && this.component.objectiveTitle !== figure.name) {
        if (figure.title !== this.component.objectiveTitle) {
          this.component.before('setTitle', this.component.objectiveTitle);
          gameManager.entityManager.setTitle(figure, this.component.objectiveTitle);
          gameManager.stateManager.after();
        }
      } else if (figure.title !== '') {
        this.component.before('unsetTitle', figure.title);
        gameManager.entityManager.setTitle(figure, '');
        gameManager.stateManager.after();
      }
    }
  }

  private closeObjectiveContainer() {
    const figure = this.component.figure as ObjectiveContainer;

    const currentMarker = figure.marker || '';
    const newMarker =
      OBJECTIVE_MARKERS[ghsModulo(this.component.objectiveMarker + OBJECTIVE_MARKERS.indexOf(currentMarker), OBJECTIVE_MARKERS.length)];

    if (newMarker !== currentMarker && gameManager.objectiveManager.canSetObjectiveMarker(figure, undefined, newMarker)) {
      if (newMarker) {
        this.component.before('setObjectiveMarker', newMarker);
      } else {
        this.component.before('unsetObjectiveMarker', currentMarker);
      }
      gameManager.objectiveManager.setObjectiveMarker(figure, undefined, newMarker);
      gameManager.stateManager.after();
    }
    this.component.objectiveMarker = 0;

    if (this.component.objectiveTitle !== undefined) {
      if (this.component.objectiveTitle && this.component.objectiveTitle !== figure.name) {
        if (figure.title !== this.component.objectiveTitle) {
          this.component.before('setTitle', this.component.objectiveTitle);
          gameManager.entityManager.setTitle(figure, this.component.objectiveTitle);
          gameManager.stateManager.after();
        }
      } else if (figure.title !== '') {
        this.component.before('unsetTitle', figure.title);
        gameManager.entityManager.setTitle(figure, '');
        gameManager.stateManager.after();
      }
    }
  }
}
