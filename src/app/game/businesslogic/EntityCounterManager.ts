import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { AdditionalIdentifier } from 'src/app/game/model/data/Identifier';
import { Entity, EntityCounter } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { Game } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';

export class EntityCounterManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  entityCounter(identifier: AdditionalIdentifier): EntityCounter | undefined {
    return this.entityCounters(identifier)[0] || undefined;
  }

  entityCounters(identifier: AdditionalIdentifier): EntityCounter[] {
    const name = new RegExp('^' + identifier.name + '$');
    return this.game.entitiesCounter.filter(
      (entityCounter) =>
        // match type
        (!identifier.type || identifier.type === entityCounter.identifier.type) &&
        // match name
        entityCounter.identifier.name.match(name) &&
        // match edition
        (!identifier.edition || identifier.edition === entityCounter.identifier.edition) &&
        // match marker
        (!identifier.marker || identifier.marker === entityCounter.identifier.marker) &&
        // match tags
        (!identifier.tags ||
          identifier.tags.length === 0 ||
          identifier.tags.every((tag) => entityCounter.identifier.tags && entityCounter.identifier.tags.includes(tag)))
    );
  }

  addEntityCount(figure: Figure, entity: Entity | undefined = undefined) {
    const identifier = gameManager.entityManager.additionalIdentifier(figure, entity);
    let counter = this.entityCounter(identifier);

    if (!counter) {
      counter = { identifier: identifier, total: 0, killed: 0 };
      this.game.entitiesCounter.push(counter);
    }

    counter.total++;
  }

  checkEntitiesKilled() {
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        if (!this.entityCounter(gameManager.entityManager.additionalIdentifier(figure))) {
          this.addEntityCount(figure);
        }
      } else if (figure instanceof Monster || figure instanceof ObjectiveContainer) {
        const uncounted = figure.entities.filter(
          (entity) =>
            gameManager.entityManager.isAlive(entity) && !this.entityCounter(gameManager.entityManager.additionalIdentifier(figure, entity))
        );
        uncounted.forEach((entity) => this.addEntityCount(figure, entity));
      }
    });

    this.game.entitiesCounter.forEach((entityCounter) => {
      let figures = gameManager.entityManager.figuresByIdentifier(entityCounter.identifier);
      if (figures.length === 0 && entityCounter.total > entityCounter.killed) {
        entityCounter.killed = entityCounter.total;
      } else {
        if (figures.every((figure) => figure instanceof Character)) {
          figures = figures.filter((figure) => figure instanceof Character && gameManager.entityManager.isAlive(figure));
          if (figures.length + entityCounter.killed < entityCounter.total) {
            entityCounter.killed = entityCounter.total - figures.length;
          } else if (figures.length + entityCounter.killed > entityCounter.total) {
            console.warn(
              'More killed then figures counted',
              entityCounter.identifier,
              'total: ' + entityCounter.total,
              'killed: ' + entityCounter.killed,
              'current: ' + figures.length
            );
            entityCounter.total = figures.length + entityCounter.killed;
          }
        } else if (figures.every((figure) => figure instanceof Monster)) {
          const count = figures
            .map((figure) => gameManager.monsterManager.monsterEntityCountIdentifier(figure as Monster, entityCounter.identifier))
            .reduce((a, b) => a + b);
          if (count + entityCounter.killed < entityCounter.total) {
            entityCounter.killed = entityCounter.total - count;
          } else if (count + entityCounter.killed > entityCounter.total) {
            console.warn(
              'More killed then figures counted',
              entityCounter.identifier,
              'total: ' + entityCounter.total,
              'killed: ' + entityCounter.killed,
              'current: ' + count
            );
            entityCounter.total = count + entityCounter.killed;
          }
        } else if (figures.every((figure) => figure instanceof ObjectiveContainer)) {
          const count = figures
            .map((figure) =>
              gameManager.objectiveManager.objectiveEntityCountIdentifier(figure as ObjectiveContainer, entityCounter.identifier)
            )
            .reduce((a, b) => a + b);
          if (count + entityCounter.killed < entityCounter.total) {
            entityCounter.killed = entityCounter.total - count;
          } else if (count + entityCounter.killed > entityCounter.total) {
            console.warn(
              'More killed then figures counted',
              entityCounter.identifier,
              'total: ' + entityCounter.total,
              'killed: ' + entityCounter.killed,
              'current: ' + count
            );
            entityCounter.total = count + entityCounter.killed;
          }
        }
      }
    });
  }
}
