import { gameManager } from 'src/app/game/businesslogic/GameManager';
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
    const additional = type === AttackModifierType.empower || type === AttackModifierType.enfeeble;
    const sourceCharacter = findCharacter(source);
    return (
      ATTACK_MODIFIER_CONDITIONS.includes(type) &&
      typeof value === 'number' &&
      value !== 0 &&
      (!additional ||
        value < 0 ||
        (!!sourceCharacter &&
          sourceCharacter.additionalModifier &&
          sourceCharacter.additionalModifier.some((perk) => perk.attackModifier && perk.attackModifier.type === type))) &&
      findEntities(findFigure(figureId), entityId).length > 0
    );
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
      entities.forEach((entity) => {
        if (value > 0) {
          gameManager.entityManager.addCondition(entity, figure, new Condition(type as string, value), false, false, sourceCharacter);
        } else {
          const idPrefix =
            type === AttackModifierType.empower || type === AttackModifierType.enfeeble
              ? 'additional-' + (sourceCharacter ? sourceCharacter.name : '')
              : undefined;
          for (let i = 0; i < -value; i++) {
            const card = amDeck.cards.find(
              (attackModifier, index) =>
                index > amDeck.current &&
                attackModifier.type === type &&
                (!idPrefix || (attackModifier.id && attackModifier.id.startsWith(idPrefix)))
            );
            if (card) {
              amDeck.cards.splice(amDeck.cards.indexOf(card), 1);
            }
          }
        }
      });
    } else {
      this.executionError('entity not found');
    }
  }
}
