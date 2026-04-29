import { Entity, EntityValueFunction } from 'src/app/game/model/Entity';

import { Character } from 'src/app/game/model/Character';
import { Game } from 'src/app/game/model/Game';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/data/Action';
import { ConditionName, ConditionType, EntityCondition, EntityConditionState } from 'src/app/game/model/data/Condition';

import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Figure } from 'src/app/game/model/Figure';
import { Monster } from 'src/app/game/model/Monster';

export class SpecialActionsManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  beforeTurn(entity: Entity) {
    entity.extraActions = entity.extraActions.filter(
      (action) =>
        action.type !== ActionType.extra &&
        (!action.subActions || !action.subActions.some((subAction) => subAction.hidden && subAction.value === 'banner-of-strength'))
    );

    entity.entityConditions = entity.entityConditions.filter(
      (entityCondition) => !entityCondition.highlight || entityCondition.state !== EntityConditionState.new
    );
  }

  turn(entity: Entity, figure: Figure) {
    if (
      (figure instanceof Character || (figure instanceof Monster && figure.isAlly)) &&
      this.game.figures.find(
        (f) =>
          f instanceof Character &&
          gameManager.entityManager.isAlive(f) &&
          f.name === 'banner-spear' &&
          f.tags.includes('banner-of-strength')
      )
    ) {
      const attackAction = new Action(ActionType.extra, '', ActionValueType.fixed, [
        new Action(ActionType.attack, 1, ActionValueType.plus, [
          new Action(ActionType.custom, 'banner-of-strength', ActionValueType.fixed, [], false, true)
        ])
      ]);
      entity.extraActions.push(attackAction);
    }

    if (
      (figure instanceof Character || (figure instanceof Monster && figure.isAlly)) &&
      (entity.health < EntityValueFunction(entity.maxHealth) ||
        entity.entityConditions.find(
          (entityCondition) => !entityCondition.expired && entityCondition.types.includes(ConditionType.clearHeal)
        )) &&
      this.game.figures.find(
        (f) =>
          f instanceof Character && gameManager.entityManager.isAlive(f) && f.name === 'banner-spear' && f.tags.includes('banner-of-hope')
      )
    ) {
      const healCondition = new EntityCondition(ConditionName.heal, 1);
      healCondition.highlight = true;
      healCondition.state = EntityConditionState.new;
      entity.entityConditions.push(healCondition);
    }
  }

  afterTurn(entity: Entity) {
    this.beforeTurn(entity);
  }
}
