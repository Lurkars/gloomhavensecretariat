import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findEntity, findFigure } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';
import { Summon } from 'src/app/game/model/Summon';

export class EntityActiveCommand extends CommandImpl {
  id: string = 'entity.active';
  requiredParameters: number = 3;

  validParameters(figureId: string | number, entityId: string | number, active: boolean): boolean {
    const figure = findFigure(figureId);
    const entity = findEntity(figure, entityId);
    return gameManager.game.state === GameState.next && !!entity && !(entity instanceof Character) && typeof active === 'boolean';
  }

  executeWithParameters(figureId: string | number, entityId: string | number, active: boolean) {
    const figure = findFigure(figureId);
    const entity = findEntity(figure, entityId);
    if (entity && !!entity.active === active) {
      return;
    }
    if (figure instanceof Character && entity instanceof Summon) {
      if (entity.active) {
        if (settingsManager.settings.activeSummons && figure.active) {
          gameManager.roundManager.toggleFigure(figure);
        } else {
          entity.active = false;
        }
      } else {
        const activeSummon = figure.summons.find((summon) => summon.active);
        if (
          settingsManager.settings.activeSummons &&
          figure.active &&
          gameManager.entityManager.isAlive(entity, true) &&
          (!activeSummon || figure.summons.indexOf(activeSummon) < figure.summons.indexOf(entity))
        ) {
          while (!entity.active && figure.active) {
            gameManager.roundManager.toggleFigure(figure);
          }
        } else {
          figure.summons.forEach((summon) => (summon.active = false));
          entity.active = true;
        }
      }
    } else if (figure && entity) {
      gameManager.entityManager.toggleActive(figure, entity);
    } else {
      this.executionError('entity not found');
    }
  }
}
