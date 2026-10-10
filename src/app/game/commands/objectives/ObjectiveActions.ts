import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findObjectiveContainer } from 'src/app/game/commands/CommandHelper';
import { Action } from 'src/app/game/model/data/Action';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';

export class ObjectiveActionsCommand extends CommandImpl {
  id: string = 'objective.actions';
  requiredParameters: number = 2;

  actions(json: BASE_TYPE): Action[] | undefined {
    try {
      const actions = JSON.parse(json as string);
      return Array.isArray(actions) ? (actions as Action[]) : undefined;
    } catch {
      return undefined;
    }
  }

  validParameters(figureId: string, json: string): boolean {
    return !!findObjectiveContainer(figureId) && typeof json === 'string' && !!this.actions(json);
  }

  executeWithParameters(figureId: string, json: string) {
    const objectiveContainer = findObjectiveContainer(figureId);
    const actions = this.actions(json);
    if (objectiveContainer && actions) {
      objectiveContainer.actions = actions;
    } else {
      this.executionError('objective not found or invalid actions');
    }
  }
}

export class ObjectiveActionsRestoreCommand extends CommandImpl {
  id: string = 'objective.actions.restore';
  requiredParameters: number = 1;

  defaultActions(objectiveContainer: ObjectiveContainer): Action[] | undefined {
    const objectiveData =
      objectiveContainer.objectiveId && gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(objectiveContainer.objectiveId);
    return (objectiveData && objectiveData.actions) || undefined;
  }

  validParameters(figureId: string): boolean {
    const objectiveContainer = findObjectiveContainer(figureId);
    return !!objectiveContainer && !!this.defaultActions(objectiveContainer);
  }

  executeWithParameters(figureId: string) {
    const objectiveContainer = findObjectiveContainer(figureId);
    const actions = objectiveContainer && this.defaultActions(objectiveContainer);
    if (objectiveContainer && actions) {
      objectiveContainer.actions = JSON.parse(JSON.stringify(actions));
    } else {
      this.executionError('objective or default actions not found');
    }
  }
}
