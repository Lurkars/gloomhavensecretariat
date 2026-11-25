import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findFigure } from 'src/app/game/commands/CommandHelper';
import { Action } from 'src/app/game/model/data/Action';
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
      const abilityCard = gameManager.monsterAbilityManager.getAbilityCard(figure);
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
    return figure instanceof Monster || figure instanceof ObjectiveContainer
      ? gameManager.actionsManager.interactiveEntities(figure, this.actions(figure, bottom), this.preIndex(bottom))
      : [];
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
      gameManager.actionsManager.applyInteractiveActions(
        figure,
        this.entities(figure, bottom),
        this.actions(figure, bottom),
        this.preIndex(bottom),
        elements
      );
    } else {
      this.executionError('figure not found');
    }
  }
}
