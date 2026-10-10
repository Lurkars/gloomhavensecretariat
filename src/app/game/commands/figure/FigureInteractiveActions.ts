import { InteractiveAction } from 'src/app/game/businesslogic/ActionsManager';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findFigure } from 'src/app/game/commands/CommandHelper';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { Element } from 'src/app/game/model/data/Element';
import { Figure } from 'src/app/game/model/Figure';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';

export class FigureInteractiveActionsCommand extends CommandImpl {
  id: string = 'figure.interactiveActions';
  requiredParameters: number = 1;

  actions(figure: Figure | undefined, bottom: boolean): Action[] {
    if (figure instanceof Monster) {
      const abilityCard = gameManager.monsterManager.getAbilityCard(figure);
      return (abilityCard && (bottom ? abilityCard.bottomActions : abilityCard.actions)) || [];
    } else if (figure instanceof ObjectiveContainer && !bottom) {
      return figure.actions || [];
    }
    return [];
  }

  preIndex(bottom: boolean): string {
    return bottom ? 'bottom' : '';
  }

  entities(figure: Figure | undefined, bottom: boolean): (MonsterEntity | ObjectiveEntity)[] {
    if (!(figure instanceof Monster || figure instanceof ObjectiveContainer)) {
      return [];
    }
    const actions = this.actions(figure, bottom);
    let entities: (MonsterEntity | ObjectiveEntity)[] = figure.entities.filter(
      (entity) => gameManager.actionsManager.getInteractiveActions(entity, figure, actions, this.preIndex(bottom)).length
    );
    if (figure instanceof Monster) {
      entities = entities.map((entity) => entity as MonsterEntity).sort(gameManager.monsterManager.sortEntities);
    }
    return entities.filter((entity, index) => settingsManager.settings.combineInteractiveAbilities || index === 0);
  }

  validParameters(figureId: string, bottom: boolean = false, ...elements: string[]): boolean {
    const figure = findFigure(figureId);
    return (
      settingsManager.settings.interactiveAbilities &&
      !!figure &&
      figure.active &&
      elements.every((element) => Object.values(Element).includes(element as Element) && element !== Element.wild) &&
      this.entities(figure, bottom).length > 0
    );
  }

  executeWithParameters(figureId: string, bottom: boolean = false, ...elements: string[]) {
    const figure = findFigure(figureId);
    if (figure instanceof Monster || figure instanceof ObjectiveContainer) {
      const actions = this.actions(figure, bottom);
      let chooseElementValues: string[] = [...elements];
      this.entities(figure, bottom).forEach((entity) => {
        let interactiveActions = gameManager.actionsManager.getInteractiveActions(entity, figure, actions, this.preIndex(bottom));
        let interactiveAction: InteractiveAction | undefined = interactiveActions[0];
        while (interactiveAction) {
          gameManager.actionsManager.applyInteractiveAction(entity, figure, interactiveAction, chooseElementValues);
          if (interactiveAction.action.type === ActionType.element) {
            chooseElementValues = [];
          }
          const processed: InteractiveAction = interactiveAction;
          interactiveActions = gameManager.actionsManager.getInteractiveActions(entity, figure, actions, this.preIndex(bottom));
          if (interactiveActions.some((newInteractiveAction) => newInteractiveAction.index === processed.index)) {
            console.warn('Interactive Action already processed, should not happen', processed);
            break;
          }
          interactiveAction = interactiveActions[0];
        }
      });
    } else {
      this.executionError('figure not found');
    }
  }
}
