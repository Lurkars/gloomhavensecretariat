import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { ActionType } from 'src/app/game/model/data/Action';
import { AdditionalIdentifier } from 'src/app/game/model/data/Identifier';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { ObjectiveData, ScenarioObjectiveIdentifier } from 'src/app/game/model/data/ObjectiveData';
import { ObjectiveSpawnData } from 'src/app/game/model/data/ScenarioRule';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { Game, GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { OBJECTIVE_MARKERS, ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';

export class ObjectiveManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  objectiveName(objective: ObjectiveContainer) {
    return objective.title || (objective.name && 'data.objective.' + objective.name) || (objective.escort ? 'escort' : 'objective');
  }

  addObjective(
    objectiveData: ObjectiveData | undefined = undefined,
    name: string | undefined = undefined,
    objectiveId: AdditionalIdentifier | ScenarioObjectiveIdentifier | undefined = undefined
  ): ObjectiveContainer {
    let objectiveContainer = this.game.figures.find(
      (figure) =>
        figure instanceof ObjectiveContainer &&
        ((!objectiveId &&
          objectiveData &&
          !figure.objectiveId &&
          figure.name === objectiveData.name &&
          figure.health === EntityValueFunction('' + objectiveData.health) &&
          figure.escort === objectiveData.escort &&
          figure.initiative === (objectiveData.initiative || 99)) ||
          (objectiveId &&
            figure.objectiveId &&
            this.objectiveDataByObjectiveIdentifier(objectiveId) === this.objectiveDataByObjectiveIdentifier(figure.objectiveId)))
    ) as ObjectiveContainer;

    if (!objectiveContainer) {
      objectiveContainer = new ObjectiveContainer(gameManager.randomManager.uuid(), objectiveId);
      if (objectiveData) {
        objectiveContainer.marker = objectiveData.marker;
        objectiveContainer.name = objectiveData.name;
        if (name) {
          objectiveContainer.name = name;
        }
        objectiveContainer.health = EntityValueFunction('' + objectiveData.health);
        objectiveContainer.escort = objectiveData.escort;
        if (objectiveData.initiative) {
          objectiveContainer.initiative = objectiveData.initiative;
        }

        if (objectiveContainer.escort) {
          objectiveContainer.amDeck =
            settingsManager.settings.allyAttackModifierDeck && (objectiveData.allyDeck || gameManager.fhRules(true)) ? 'A' : 'M';
        }

        if (objectiveData.actions) {
          objectiveContainer.actions = objectiveData.actions;
        }
      }
      objectiveContainer.edition = objectiveContainer.escort ? 'escort' : 'objective';
      this.game.figures.push(objectiveContainer);
    }
    gameManager.entityCounterManager.addEntityCount(objectiveContainer);
    this.setInitiativeShare(objectiveContainer);
    gameManager.roundManager.sortFigures(objectiveContainer);
    return objectiveContainer;
  }

  removeAllObjectives() {
    this.game.figures = this.game.figures.filter((figure) => !(figure instanceof ObjectiveContainer));
  }

  canSetAmDeck(objectiveContainer: ObjectiveContainer, deck: string): boolean {
    return (
      typeof deck === 'string' &&
      (deck === '' || objectiveContainer.amDeck === deck || gameManager.attackModifierManager.objectiveAmDecks().includes(deck))
    );
  }

  setAmDeck(objectiveContainer: ObjectiveContainer, deck: string): boolean {
    if (!this.canSetAmDeck(objectiveContainer, deck)) {
      return false;
    }
    objectiveContainer.amDeck = deck || undefined;
    return true;
  }

  canSetObjectiveNumber(objectiveContainer: ObjectiveContainer, objectiveEntity: ObjectiveEntity, number: number): boolean {
    return (
      objectiveContainer.entities.includes(objectiveEntity) &&
      Number.isInteger(number) &&
      number > 0 &&
      number <= 12 &&
      !objectiveContainer.entities.some((other) => other !== objectiveEntity && other.number === number)
    );
  }

  setObjectiveNumber(objectiveContainer: ObjectiveContainer, objectiveEntity: ObjectiveEntity, number: number): boolean {
    if (!this.canSetObjectiveNumber(objectiveContainer, objectiveEntity, number)) {
      return false;
    }
    objectiveEntity.number = number;
    return true;
  }

  canSetObjectiveMarker(objectiveContainer: ObjectiveContainer, objectiveEntity: ObjectiveEntity | undefined, marker: string): boolean {
    return OBJECTIVE_MARKERS.includes(marker) && (!objectiveEntity || objectiveContainer.entities.includes(objectiveEntity));
  }

  setObjectiveMarker(objectiveContainer: ObjectiveContainer, objectiveEntity: ObjectiveEntity | undefined, marker: string): boolean {
    if (!this.canSetObjectiveMarker(objectiveContainer, objectiveEntity, marker)) {
      return false;
    }
    if (objectiveEntity) {
      objectiveEntity.marker = marker;
    } else {
      objectiveContainer.marker = marker;
      objectiveContainer.entities.forEach((entity) => (entity.marker = marker));
    }
    return true;
  }

  removeObjective(objectiveContainer: ObjectiveContainer) {
    const index = this.game.figures.indexOf(objectiveContainer);
    if (index !== -1) {
      this.game.figures.splice(index, 1);
    }
  }

  // zero based, the entity gets this number + 1
  nextObjectiveNumber(objectiveContainer: ObjectiveContainer): number {
    const objectiveCount = objectiveContainer.entities.filter((entity) => gameManager.entityManager.isAlive(entity)).length;
    let number = objectiveCount % 12;
    if (objectiveCount < 12) {
      while (objectiveContainer.entities.find((objectiveEntity) => objectiveEntity.number - 1 === number)) {
        number++;
      }
    }
    return number;
  }

  addObjectiveEntity(
    objectiveContainer: ObjectiveContainer,
    number: number | undefined = undefined,
    objectiveData: ObjectiveData | undefined = undefined,
    marker: string = ''
  ): ObjectiveEntity {
    if (!number || objectiveContainer.entities.find((objectiveEntity) => objectiveEntity.number === number)) {
      number = this.nextObjectiveNumber(objectiveContainer);
    }

    const entity: ObjectiveEntity = new ObjectiveEntity(
      gameManager.randomManager.uuid(),
      number + 1,
      objectiveContainer,
      marker || (objectiveData && objectiveData.marker) || objectiveContainer.marker
    );

    if (objectiveData) {
      entity.tags = objectiveData.tags;
    }

    objectiveContainer.entities.push(entity);

    if (objectiveContainer.off) {
      objectiveContainer.off = false;
    }

    return entity;
  }

  removeObjectiveEntity(objectiveCOntainer: ObjectiveContainer, objectiveEntity: ObjectiveEntity) {
    const index = objectiveCOntainer.entities.indexOf(objectiveEntity);
    if (index === -1) {
      return;
    }
    objectiveCOntainer.entities.splice(index, 1);
    if (
      objectiveCOntainer.entities.length === 0 ||
      objectiveCOntainer.entities.every((entity) => !gameManager.entityManager.isAlive(entity))
    ) {
      if (!objectiveCOntainer.off && this.game.state === GameState.next) {
        if (objectiveCOntainer.active) {
          gameManager.turnManager.toggleFigure(objectiveCOntainer);
        } else {
          this.removeObjective(objectiveCOntainer);
        }
      } else {
        this.removeObjective(objectiveCOntainer);
      }
    }
  }

  objectiveEntityCountIdentifier(objective: ObjectiveContainer, identifier: AdditionalIdentifier): number {
    if (
      identifier.type !== 'all' &&
      (identifier.type !== 'objective' || identifier.name !== objective.name || identifier.edition !== objective.edition)
    ) {
      return 0;
    }

    return objective.entities.filter(
      (entity) =>
        gameManager.entityManager.isAlive(entity) &&
        (!identifier.marker || identifier.marker === entity.marker) &&
        (!identifier.tags || identifier.tags.length === 0 || identifier.tags.every((tag) => entity.tags.includes(tag)))
    ).length;
  }

  skipObjective(figure: Figure): boolean {
    if (figure instanceof ObjectiveContainer) {
      if (!figure.escort) {
        if (!!figure.actions && figure.actions.length > 0) {
          return false;
        } else if (!figure.objectiveId) {
          return true;
        } else {
          const objectiveData = this.objectiveDataByObjectiveIdentifier(figure.objectiveId);
          if (!objectiveData || !objectiveData.actions || objectiveData.actions.length === 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  objectiveDataByObjectiveIdentifier(objectiveIdentifier: AdditionalIdentifier | ScenarioObjectiveIdentifier): ObjectiveData | undefined {
    if (!('scenario' in objectiveIdentifier)) {
      // TODO: generalize code, now specialized for Elder Drake
      const figures = gameManager.entityManager.figuresByIdentifier(objectiveIdentifier);
      if (figures.length === 1) {
        let result: ObjectiveData | undefined = undefined;
        const figure: Figure = figures[0];
        if (figure instanceof Monster && figure.boss) {
          const bossStats = gameManager.monsterManager.getStat(figure, MonsterType.boss);
          bossStats.special.forEach((special) => {
            special.forEach((action) => {
              if (!result && (action.type === ActionType.summon || action.type === ActionType.spawn) && action.value === 'objectiveSpawn') {
                result = (action.valueObject as ObjectiveSpawnData[])[0].objective as ObjectiveData;
              }
            });
          });
        }
        return result;
      }
    } else {
      const scenarioData = objectiveIdentifier.section
        ? gameManager.editionManager
            .sectionData(objectiveIdentifier.edition)
            .find((sectionData) => sectionData.index === objectiveIdentifier.scenario && sectionData.group === objectiveIdentifier.group)
        : gameManager.editionManager
            .scenarioData(objectiveIdentifier.edition)
            .find(
              (scenarioData) => scenarioData.index === objectiveIdentifier.scenario && scenarioData.group === objectiveIdentifier.group
            );
      if (scenarioData) {
        if (objectiveIdentifier.section && !scenarioData.objectives) {
          const parent = gameManager.editionManager
            .scenarioData(objectiveIdentifier.edition)
            .find((scenario) => scenario.index === scenarioData.parent && scenario.group === scenarioData.group);
          if (parent && parent.objectives && parent.objectives.length > objectiveIdentifier.index) {
            return parent.objectives[objectiveIdentifier.index];
          }
        } else if (scenarioData.objectives.length > objectiveIdentifier.index) {
          return scenarioData.objectives[objectiveIdentifier.index];
        }
      }
    }

    return undefined;
  }

  next() {
    this.game.figures.forEach((figure) => {
      if (figure instanceof ObjectiveContainer) {
        const entitiesToRemove = figure.entities.filter((entity) => !gameManager.entityManager.isAlive(entity) && !entity.dormant);
        entitiesToRemove.forEach((entity) => this.removeObjectiveEntity(figure, entity));

        figure.off = false;
        this.setInitiativeShare(figure);
      }
    });
  }

  setInitiativeShare(figure: ObjectiveContainer) {
    if (figure.objectiveId) {
      const objectiveData = gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(figure.objectiveId);

      if (objectiveData && objectiveData.initiativeShare) {
        let offset = 0;
        const name = objectiveData.initiativeShare.split(':')[0];
        if (objectiveData.initiativeShare.split(':').length > 0) {
          offset = +objectiveData.initiativeShare.split(':')[1];
        }

        const monster = this.game.figures.find((figure) => figure instanceof Monster && figure.name === name);
        if (monster) {
          figure.initiative =
            this.game.state === GameState.next && monster.getInitiative() && monster.getInitiative() < 100
              ? offset < 0
                ? Math.ceil(monster.getInitiative() + offset)
                : Math.floor(monster.getInitiative() + offset)
              : 0;
        }
      }
    }
  }

  draw() {
    this.game.figures.forEach((figure) => {
      if (figure instanceof ObjectiveContainer) {
        if (figure.entities.some((objectiveEntity) => gameManager.entityManager.isAlive(objectiveEntity))) {
          figure.off = false;
        }
        this.setInitiativeShare(figure);
      }
    });
  }
}
