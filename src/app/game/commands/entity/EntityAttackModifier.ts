import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter, findEntities, findFigure, validSeed } from 'src/app/game/commands/CommandHelper';
import { Character } from 'src/app/game/model/Character';
import { AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { Condition } from 'src/app/game/model/data/Condition';

const ATTACK_MODIFIER_CONDITIONS: string[] = [
  AttackModifierType.bless,
  AttackModifierType.curse,
  AttackModifierType.empower,
  AttackModifierType.enfeeble
];

export class EntityAttackModifierCommand extends CommandImpl {
  id: string = 'entity.attackModifier';
  requiredParameters: number = 5;

  validParameters(
    figureId: string | number,
    entityId: string | number,
    type: string,
    value: number,
    seed: number,
    source: number = -1
  ): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    const figure = findFigure(figureId);
    const entities = findEntities(figure, entityId);
    if (!figure || !entities.length || !ATTACK_MODIFIER_CONDITIONS.includes(type) || typeof value !== 'number' || value === 0) {
      return false;
    }
    const sourceCharacter = findCharacter(source);
    if (value > 0) {
      return gameManager.conditionManager.canAddDeckConditions(
        entities.map((entity) => ({ entity, figure })),
        new Condition(type, value),
        sourceCharacter
      );
    }
    const amDeck = gameManager.attackModifierManager.byFigure(figure);
    return type === AttackModifierType.empower || type === AttackModifierType.enfeeble
      ? gameManager.attackModifierManager.canChangeAdditionalCount(amDeck, sourceCharacter, type, value)
      : gameManager.attackModifierManager.canChangeModifierCount(amDeck, type as AttackModifierType, value, false);
  }

  executeWithParameters(
    figureId: string | number,
    entityId: string | number,
    type: AttackModifierType,
    value: number,
    seed: number,
    source: number = -1
  ) {
    gameManager.game.seed = seed;
    const figure = findFigure(figureId);
    const entities = findEntities(figure, entityId);
    const sourceCharacter: Character | undefined = findCharacter(source);
    if (figure && entities.length) {
      const amDeck = gameManager.attackModifierManager.byFigure(figure);
      if (value > 0) {
        gameManager.conditionManager.addDeckConditions(
          entities.map((entity) => ({ entity, figure })),
          new Condition(type as string, value),
          sourceCharacter
        );
        return;
      }
      entities.forEach(() => {
        if (type === AttackModifierType.empower || type === AttackModifierType.enfeeble) {
          gameManager.attackModifierManager.changeAdditionalCount(amDeck, sourceCharacter, type, value);
        } else {
          gameManager.attackModifierManager.changeModifierCount(amDeck, type, value, false);
        }
      });
    } else {
      this.executionError('entity not found');
    }
  }
}
