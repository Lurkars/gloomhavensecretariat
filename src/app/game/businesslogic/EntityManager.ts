import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { ConditionName, ConditionType, EntityConditionState } from 'src/app/game/model/data/Condition';
import { AdditionalIdentifier } from 'src/app/game/model/data/Identifier';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { PersonalQuestAutotrackType } from 'src/app/game/model/data/PersonalQuest';
import { Entity, EntityValueFunction } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { Game, GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import { Summon, SummonState } from 'src/app/game/model/Summon';

export class EntityManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  entities(figure: Figure, acting: boolean = false): Entity[] {
    let entities: Entity[] = [];
    if (figure instanceof Character) {
      if (this.isAlive(figure, acting)) {
        entities.push(figure);
      }
    } else if (figure instanceof Monster) {
      entities = figure.entities.filter((entity) => this.isAlive(entity, acting) || (!acting && entity.dormant));
    } else if (figure instanceof ObjectiveContainer) {
      entities = figure.entities.filter((entity) => this.isAlive(entity, acting) || (!acting && entity.dormant));
    }
    return entities;
  }

  entitiesAll(figure: Figure, alive: boolean = true, acting: boolean = false): Entity[] {
    const entities: Entity[] = [];
    if (figure instanceof Character && (!alive || this.isAlive(figure, acting))) {
      entities.push(figure);
      entities.push(...figure.summons.filter((summon) => !alive || this.isAlive(summon, acting)));
    } else if (figure instanceof Monster) {
      entities.push(...figure.entities.filter((entity) => !alive || this.isAlive(entity, acting)));
    } else if (figure instanceof ObjectiveContainer) {
      entities.push(...figure.entities.filter((entity) => !alive || this.isAlive(entity, acting)));
    }
    return entities;
  }

  getIndexedEntities(sort: boolean = false): { entity: Entity; figure: Figure }[] {
    const result: { entity: Entity; figure: Figure }[] = [];

    const figures: Figure[] = Object.assign([], this.game.figures);

    figures
      .sort((a, b) => {
        if (sort) {
          return gameManager.roundManager.sortFiguresByTypeAndName(a, b);
        } else {
          return 0;
        }
      })
      .forEach((figure) => {
        if (figure instanceof Character) {
          result.push({ entity: figure, figure: figure });
          figure.summons.forEach((summon) => {
            result.push({ entity: summon, figure: figure });
          });
        } else if (figure instanceof Monster) {
          figure.entities.forEach((monsterEntity) => {
            result.push({ entity: monsterEntity, figure: figure });
          });
        } else if (figure instanceof ObjectiveContainer) {
          figure.entities.forEach((objectiveEntity) => {
            result.push({ entity: objectiveEntity, figure: figure });
          });
        }
      });

    return result;
  }

  getIndexForEntity(entity: Entity, sort: boolean = false): number {
    let index = -1;
    this.getIndexedEntities(sort).forEach((value, i) => {
      if (value.entity === entity) {
        index = i;
        return;
      }
    });

    return index;
  }

  isAlive(entity: Entity, acting: boolean = false): boolean {
    if (
      (entity.health <= 0 &&
        EntityValueFunction(entity.maxHealth) > 0 &&
        !entity.entityConditions.find((condition) => condition.highlight && condition.types.includes(ConditionType.apply))) ||
      (acting &&
        entity.entityConditions.find(
          (entityCondition) =>
            entityCondition.name === ConditionName.stun &&
            entityCondition.state !== EntityConditionState.new &&
            entityCondition.lastState !== EntityConditionState.new &&
            entityCondition.state !== EntityConditionState.removed
        ))
    ) {
      return false;
    }

    const cast =
      !(entity instanceof Character) &&
      !(entity instanceof MonsterEntity) &&
      !(entity instanceof Summon) &&
      !(entity instanceof ObjectiveEntity);

    if (entity instanceof Character || (cast && 'progress' in entity)) {
      const character = entity as Character;
      return !character.exhausted && !character.absent;
    }

    if (entity instanceof MonsterEntity || (cast && 'number' in entity && 'type' in entity)) {
      const monsterEntity = entity as MonsterEntity;
      return !monsterEntity.dead && !monsterEntity.dormant && (!acting || monsterEntity.summon !== SummonState.new);
    }

    if (
      entity instanceof Summon ||
      (cast && 'name' in entity && ('attack' in entity || 'move' in entity || 'range' in entity || 'action' in entity))
    ) {
      const summon = entity as Summon;
      return (
        !summon.dead &&
        !summon.dormant &&
        (!acting ||
          ((!summon.passive || !settingsManager.settings.passiveSummons || !settingsManager.settings.activeSummons) &&
            summon.state !== SummonState.new))
      );
    }

    if (entity instanceof ObjectiveEntity || (cast && 'uuid' in entity && 'marker' in entity)) {
      const objectiveEntity = entity as ObjectiveEntity;
      return !objectiveEntity.dead && !objectiveEntity.dormant;
    }

    return false;
  }

  checkHealth(entity: Entity, figure: Figure) {
    const maxHealth = gameManager.specialActionsManager.maxHealth(entity);

    if (maxHealth > 0 && entity.health > maxHealth) {
      entity.health = maxHealth;
    }

    if (
      maxHealth > 0 &&
      entity.health <= 0 &&
      !entity.entityConditions.find(
        (condition) =>
          settingsManager.settings.applyConditions &&
          settingsManager.settings.activeApplyConditions &&
          condition.highlight &&
          condition.types.includes(ConditionType.apply) &&
          !settingsManager.settings.activeApplyConditionsExcludes.includes(condition.name) &&
          !settingsManager.settings.activeApplyConditionsAuto.includes(condition.name)
      )
    ) {
      entity.health = 0;
      if (entity instanceof Character && (!entity.off || !entity.exhausted)) {
        const wasExhausted = entity.exhausted;
        entity.off = true;
        entity.exhausted = true;
        if (!wasExhausted) {
          this.trackExhaustion(entity);
          if (settingsManager.settings.scenarioStats) {
            gameManager.scenarioStatsManager.changeExhausts(entity, figure, true);
          }
        }
      } else if ((entity instanceof MonsterEntity || entity instanceof Summon || entity instanceof ObjectiveEntity) && !entity.dead) {
        entity.dead = true;
        if (entity instanceof Summon && settingsManager.settings.scenarioStats) {
          gameManager.scenarioStatsManager.changeExhausts(entity, figure, true);
        } else if (entity instanceof MonsterEntity && figure instanceof Monster) {
          gameManager.monsterManager.monsterEntityKilled(figure, entity);
        }
      }
    }

    if (entity.health > 0) {
      if (entity instanceof Character && entity.exhausted) {
        entity.off = false;
        entity.exhausted = false;
        if (settingsManager.settings.scenarioStats) {
          gameManager.scenarioStatsManager.changeExhausts(entity, figure, false);
        }
      } else if ((entity instanceof MonsterEntity || entity instanceof Summon || entity instanceof ObjectiveEntity) && entity.dead) {
        entity.dead = false;
        if (entity instanceof Summon && settingsManager.settings.scenarioStats) {
          gameManager.scenarioStatsManager.changeExhausts(entity, figure, false);
        } else if (entity instanceof MonsterEntity && figure instanceof Monster) {
          gameManager.monsterManager.monsterEntityRevived(figure, entity);
        }
      }
    }

    if (entity instanceof ObjectiveEntity && figure instanceof ObjectiveContainer && figure.objectiveId) {
      const objectiveData = gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(figure.objectiveId);
      if (!!objectiveData && objectiveData.trackDamage && entity.health <= 0) {
        entity.health = 0;
      }
    }
  }

  private trackExhaustion(character: Character) {
    gameManager.personalQuestManager.trackPersonalQuestProgress(character, PersonalQuestAutotrackType.exhaustedSelf);

    const ownTurn = character.active;
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character && figure !== character) {
        gameManager.personalQuestManager.trackPersonalQuestProgress(figure, PersonalQuestAutotrackType.exhaustedChars);
        if (ownTurn) {
          gameManager.personalQuestManager.trackPersonalQuestProgress(figure, PersonalQuestAutotrackType.exhaustedCharsTurn);
        }
      }
    });
  }

  changeHealth(entity: Entity, figure: Figure, value: number, damageOnly: boolean = false, trackStats: boolean = true) {
    gameManager.conditionManager.changeHealthHighlightConditions(entity, figure, value, damageOnly);
    entity.health += value;
    this.checkHealth(entity, figure);
    if (trackStats && settingsManager.settings.scenarioStats && value !== 0) {
      if (value > 0) {
        gameManager.scenarioStatsManager.applyHeal(entity, figure, value);
      } else {
        gameManager.scenarioStatsManager.applyDamage(entity, figure, value * -1);
      }
    }

    if (
      value < 1 &&
      entity instanceof Character &&
      !entity.absent &&
      gameManager.trialsManager.apply &&
      gameManager.trialsManager.trialsEnabled &&
      entity.progress.trial &&
      entity.progress.trial.edition === 'fh' &&
      entity.progress.trial.name === '356' &&
      !entity.tags.includes('trial-fh-356')
    ) {
      entity.tags.push('trial-fh-356');
    }
  }

  canSetMarker(marker: string): boolean {
    return typeof marker === 'string' && marker.split('-').length > 1;
  }

  setMarker(entities: Entity[], marker: string, value: boolean): boolean {
    if (!this.canSetMarker(marker)) {
      return false;
    }
    entities.forEach((entity) => {
      entity.markers = entity.markers.filter((existing) => existing !== marker);
      if (value) {
        entity.markers.push(marker);
      }
    });
    return true;
  }

  canChangeMaxHealth(entities: Entity[], value: number): boolean {
    return (
      Number.isInteger(value) &&
      value !== 0 &&
      entities.length > 0 &&
      entities.every((entity) => EntityValueFunction(entity.maxHealth) + value >= 1)
    );
  }

  changeMaxHealth(entities: Entity[], value: number): boolean {
    if (!this.canChangeMaxHealth(entities, value)) {
      return false;
    }
    entities.forEach((entity) => {
      if (entity.health === EntityValueFunction(entity.maxHealth)) {
        entity.health += value;
      }
      entity.maxHealth = EntityValueFunction(entity.maxHealth) + value;
      if (entity.health > entity.maxHealth) {
        entity.health = entity.maxHealth;
      }
    });
    return true;
  }

  setTitle(titled: Character | Summon | ObjectiveContainer, title: string): boolean {
    if (typeof title !== 'string') {
      return false;
    }
    titled.title = title;
    return true;
  }

  killEntity(entity: Entity, figure: Figure) {
    if (entity instanceof MonsterEntity || entity instanceof Summon || entity instanceof ObjectiveEntity) {
      if (entity instanceof Summon && !entity.dead && settingsManager.settings.scenarioStats) {
        gameManager.scenarioStatsManager.changeExhausts(entity, figure, true);
      }
      entity.dead = true;
      if (entity instanceof MonsterEntity && figure instanceof Monster) {
        gameManager.monsterManager.monsterEntityKilled(figure, entity);
      }
    }
  }

  setExhausted(character: Character, exhausted: boolean) {
    if (exhausted !== character.exhausted && settingsManager.settings.scenarioStats) {
      gameManager.scenarioStatsManager.changeExhausts(character, character, exhausted);
    }
    character.exhausted = exhausted;
  }

  // dead entities with pending turn or apply conditions stay until those are resolved
  deadRemovable(entity: Entity): boolean {
    return (
      this.game.state === GameState.draw ||
      entity.entityConditions.every(
        (entityCondition) => !entityCondition.types.includes(ConditionType.turn) && !entityCondition.types.includes(ConditionType.apply)
      )
    );
  }

  deactivateDeadFigure(figure: Figure) {
    if (
      (figure instanceof Monster || figure instanceof ObjectiveContainer) &&
      figure.active &&
      figure.entities.every((entity) => !this.isAlive(entity))
    ) {
      gameManager.turnManager.toggleFigure(figure);
    }
  }

  deadEntities(entities: { entity: Entity; figure: Figure }[]): { entity: Entity; figure: Figure }[] {
    return entities.filter(
      ({ entity, figure }) =>
        (figure instanceof Monster && entity instanceof MonsterEntity && entity.dead && figure.entities.includes(entity)) ||
        (figure instanceof Character && entity instanceof Summon && entity.dead && figure.summons.includes(entity)) ||
        (figure instanceof ObjectiveContainer && entity instanceof ObjectiveEntity && entity.dead && figure.entities.includes(entity))
    );
  }

  removeDeadEntities(entities: { entity: Entity; figure: Figure }[]) {
    this.deadEntities(entities).forEach(({ entity, figure }) => {
      if (figure instanceof Monster && entity instanceof MonsterEntity) {
        gameManager.monsterManager.removeMonsterEntity(figure, entity);
      } else if (figure instanceof Character && entity instanceof Summon) {
        gameManager.summonManager.removeSummon(figure, entity);
      } else if (figure instanceof ObjectiveContainer && entity instanceof ObjectiveEntity) {
        gameManager.objectiveManager.removeObjectiveEntity(figure, entity);
      }
    });
  }

  hasMarker(entity: Entity, marker: string) {
    return entity.markers && entity.markers.includes(marker);
  }

  toggleMarker(entity: Entity, marker: string) {
    if (this.hasMarker(entity, marker)) {
      entity.markers.splice(entity.markers.indexOf(marker), 1);
    } else {
      entity.markers.push(marker);
    }
  }

  canSetEntityActive(figure: Figure, entity: Entity, active: boolean): boolean {
    if (this.game.state !== GameState.next || entity instanceof Character || typeof active !== 'boolean' || !!entity.active === active) {
      return false;
    }
    if (figure instanceof Character) {
      return entity instanceof Summon && figure.summons.includes(entity);
    }
    return (figure instanceof Monster || figure instanceof ObjectiveContainer) && (figure.entities as Entity[]).includes(entity);
  }

  setEntityActive(figure: Figure, entity: Entity, active: boolean): boolean {
    if (!this.canSetEntityActive(figure, entity, active)) {
      return false;
    }
    if (figure instanceof Character && entity instanceof Summon) {
      gameManager.summonManager.toggleSummonActive(figure, entity);
    } else {
      this.toggleActive(figure, entity);
    }
    return true;
  }

  toggleActive(figure: Figure, entity: Entity) {
    if (this.game.state === GameState.next) {
      if (figure.active) {
        entity.active = !entity.active;
        if (this.entities(figure).every((entity) => !this.isAlive(entity) || !entity.active)) {
          gameManager.turnManager.toggleFigure(figure);
        }
      } else if (entity.active) {
        entity.active = false;
        if (this.entities(figure).every((entity) => !this.isAlive(entity, true) || !entity.active)) {
          figure.off = true;
        }
      } else {
        figure.off = false;
        entity.active = true;
      }

      if (entity.active) {
        entity.off = false;
        if (!figure.active && this.game.figures.every((figure) => !figure.active)) {
          figure.active = true;
        }
      } else {
        entity.off = true;
      }
    }
  }

  figureForEntity(entity: Entity): Figure {
    let result: Figure | undefined;
    if (entity instanceof Character) {
      result = entity;
    } else if (entity instanceof Summon) {
      result = this.game.figures.find((figure) => figure instanceof Character && figure.summons.includes(entity));
    } else if (entity instanceof MonsterEntity) {
      result = this.game.figures.find((figure) => figure instanceof Monster && figure.entities.includes(entity));
    } else if (entity instanceof ObjectiveEntity) {
      result = this.game.figures.find((figure) => figure instanceof ObjectiveContainer && figure.entities.includes(entity));
    }

    if (!result) {
      console.warn('No figure found for entity:', entity);
      return new Monster(new MonsterData());
    }
    return result;
  }

  before(entity: Entity | undefined, figure: Figure | undefined, info: string, ...values: (string | number | boolean)[]) {
    this.beforeEntities(entity, figure, [], info, ...values);
  }

  beforeEntities(
    entity: Entity | undefined,
    figure: Figure | undefined,
    entities: Entity[],
    info: string,
    ...values: (string | number | boolean)[]
  ) {
    let type = '';
    if (entity instanceof MonsterEntity) {
      type = '.monsterEntity';
    } else if (entity instanceof Character) {
      type = '.character';
    } else if (entity instanceof Summon) {
      type = '.summon';
    } else if (entity instanceof ObjectiveEntity) {
      type = '.objectiveEntity';
    } else if (figure instanceof Monster) {
      type = '.monsters';
    } else if (figure instanceof Character) {
      type = '.summons';
    } else if (figure instanceof ObjectiveContainer && entities.length > 1) {
      type = '.objectives';
    } else if (figure instanceof ObjectiveContainer) {
      type = '.objective';
    }

    gameManager.stateManager.before(
      'entities.' + info + type,
      ...values,
      ...this.titleInfo(entity, figure),
      entities.map((entity) => this.titleInfo(entity, undefined)).join(', ')
    );
  }

  undoInfos(entity: Entity | undefined, figure: Figure, prefix: string): (string | number | boolean)[] {
    const infos: (string | number | boolean)[] = [];
    if (entity instanceof Character && figure instanceof Character) {
      infos.push(prefix + '.char');
    } else if (entity instanceof Summon && figure instanceof Character) {
      infos.push(prefix + '.summon');
    } else if (figure instanceof ObjectiveContainer && entity instanceof ObjectiveEntity) {
      infos.push(prefix + '.objectiveContainer');
    } else if (figure instanceof Monster && entity instanceof MonsterEntity) {
      infos.push(prefix + '.monster');
    } else if (figure instanceof Monster) {
      infos.push(prefix + '.monsterEntities');
    }

    infos.push(...this.titleInfo(entity, figure));

    return infos;
  }

  titleInfo(entity: Entity | undefined = undefined, figure: Figure | undefined = undefined): (string | number | boolean)[] {
    const statEffect = figure instanceof Monster && !!figure.statEffect && figure.statEffect.name;
    if (entity instanceof Character) {
      return [gameManager.characterManager.characterName(entity, true, true)];
    } else if (entity instanceof Summon && figure instanceof Character) {
      return [
        gameManager.characterManager.characterName(figure, true, true),
        entity.name ? '%data.summon.' + entity.name + '%' : entity.number
      ];
    } else if (entity instanceof Summon) {
      return ['%data.summon.' + entity.name + '%'];
    } else if (figure instanceof ObjectiveContainer && entity instanceof ObjectiveEntity) {
      return [
        '%game.objectiveIcon.' +
          (figure.escort ? 'escort' : 'objective') +
          '% ' +
          (figure.title || (figure.name && '%data.objective.' + figure.name + '%') || (figure.escort ? '%escort%' : '%objective%')),
        '%game.objectiveMarker.' + entity.number + '%'
      ];
    } else if (entity instanceof ObjectiveEntity) {
      return ['%game.objectiveMarker.' + entity.number + '%'];
    } else if (figure instanceof Monster && entity instanceof MonsterEntity) {
      return [
        (statEffect ? '%data.monster.' + statEffect + '%&nbsp(' : '') + '%data.monster.' + figure.name + '%' + (statEffect ? ')' : ''),
        '%game.monsterType.' + entity.type + '.' + entity.number + '%'
      ];
    }
    if (entity instanceof MonsterEntity) {
      return ['%game.monsterType.' + entity.type + '.' + entity.number + '%'];
    } else if (figure instanceof Character) {
      return [gameManager.characterManager.characterName(figure, true, true)];
    } else if (figure instanceof Monster) {
      return [
        (statEffect ? '%data.monster.' + statEffect + '%&nbsp(' : '') + '%data.monster.' + figure.name + '%' + (statEffect ? ')' : '')
      ];
    } else if (figure instanceof ObjectiveContainer) {
      return [
        '%game.objectiveIcon.' +
          (figure.escort ? 'escort' : 'objective') +
          '% ' +
          (figure.title || (figure.name && '%data.objective.' + figure.name + '%') || (figure.escort ? '%escort%' : '%objective%'))
      ];
    }

    return [];
  }

  next() {
    this.game.figures.forEach((figure) => {
      this.entitiesAll(figure).forEach((entity) => {
        if (settingsManager.settings.expireConditions) {
          entity.entityConditions.forEach((entityCondition) => {
            if (entityCondition.state === EntityConditionState.roundExpire && !entityCondition.permanent) {
              entityCondition.expired = true;
            }
          });

          entity.entityConditions = entity.entityConditions.filter((entityCondition) => !entityCondition.expired);
          entity.entityConditions.forEach((entityCondition) => {
            if (entityCondition.types.includes(ConditionType.expire) && !entityCondition.permanent) {
              if (entityCondition.state === EntityConditionState.normal) {
                entityCondition.lastState = entityCondition.state;
                entityCondition.state = EntityConditionState.expire;
              }
            }
          });
        }

        if (settingsManager.settings.applyConditions) {
          entity.entityConditions
            .filter(
              (entityCondition) =>
                entityCondition.types.includes(ConditionType.turn) ||
                (entityCondition.types.includes(ConditionType.afterTurn) &&
                  !gameManager.conditionManager.isImmune(entity, figure, entityCondition.name))
            )
            .forEach((entityCondition) => {
              entityCondition.lastState = entityCondition.state;
              entityCondition.state = EntityConditionState.normal;
            });
        }

        entity.extraActions = [];
      });
    });
  }

  markers(): string[] {
    return this.game.figures
      .filter(
        (figure) =>
          figure instanceof Character && !figure.absent && (figure.marker || (this.game.state === GameState.next && figure.active))
      )
      .map((figure) => figure as Character)
      .sort((a, b) => {
        if (a.marker && !b.marker) {
          return -1;
        } else if (!a.marker && b.marker) {
          return 1;
        }

        return 0;
      })
      .map((figure) => (figure as Character).edition + '-' + figure.name);
  }

  gameplayFigure(figure: Figure) {
    return (
      ((figure instanceof Monster || figure instanceof ObjectiveContainer) && this.entitiesAll(figure, true).length > 0) ||
      (figure instanceof Character && this.isAlive(figure))
    );
  }

  figuresByIdentifier(identifier: AdditionalIdentifier | undefined, scenarioEffect: boolean = false, figures: Figure[] = []): Figure[] {
    let result: Figure[] = figures;

    if (result.length === 0) {
      result = this.game.figures;
    }

    result = result.filter(
      (figure) =>
        !(figure instanceof Character) ||
        (!figure.absent && (!scenarioEffect || !gameManager.characterManager.ignoreNegativeScenarioffects(figure)))
    );

    if (identifier && identifier.type) {
      const type = identifier.type;
      switch (type) {
        case 'monster':
          result = result.filter((figure) => figure instanceof Monster);
          break;
        case 'character':
        case 'characterWithSummon':
          result = result.filter((figure) => figure instanceof Character);
          break;
        case 'objective':
          result = result.filter((figure) => figure instanceof ObjectiveContainer);
          break;
        case 'allies':
          result = result.filter(
            (figure) =>
              figure instanceof Character ||
              (figure instanceof Monster && figure.isAlly) ||
              (figure instanceof ObjectiveContainer && figure.escort)
          );
          break;
        case 'enemies':
          result = result.filter(
            (figure) => (figure instanceof Monster && !figure.isAlly) || (figure instanceof ObjectiveContainer && !figure.escort)
          );
          break;
      }

      if (identifier.edition) {
        result = result.filter((figure) => figure.edition === identifier.edition);
      }

      if (identifier.marker) {
        result = result.filter(
          (figure) =>
            (figure instanceof Monster || figure instanceof ObjectiveContainer) &&
            figure.entities.some((entity) => entity.marker === identifier.marker)
        );
      }

      if (identifier.tags && identifier.tags.length > 0) {
        result = result.filter(
          (figure) =>
            ((figure instanceof Monster || figure instanceof ObjectiveContainer) &&
              figure.entities.some(
                (entity) => !!identifier.tags && identifier.tags.every((tag) => entity.tags && entity.tags.includes(tag))
              )) ||
            (figure instanceof Character && !!identifier.tags && identifier.tags.every((tag) => figure.tags && figure.tags.includes(tag)))
        );
      }

      if (identifier.name) {
        const name = new RegExp('^' + identifier.name + '$');
        result = result.filter((figure) => figure.name.match(name));
      }
    }

    return result;
  }

  entitiesByIdentifier(identifier: AdditionalIdentifier | undefined, scenarioEffect: boolean): Entity[] {
    const figures = this.figuresByIdentifier(identifier, scenarioEffect);
    return figures
      .map((figure) => {
        if (figure instanceof Monster || figure instanceof ObjectiveContainer) {
          return figure.entities;
        } else if (figure instanceof Character) {
          if (identifier && (identifier.type === 'characterWithSummon' || identifier.type === 'all' || identifier.type === 'allies')) {
            return [figure as Entity, ...figure.summons];
          }
          return figure as Entity;
        } else {
          return undefined;
        }
      })
      .flat()
      .filter((value) => value !== undefined)
      .map((value) => value as Entity)
      .filter(
        (entity) =>
          !identifier ||
          ((!identifier.marker ||
            (!(entity instanceof MonsterEntity) && !(entity instanceof ObjectiveEntity)) ||
            entity.marker === identifier.marker) &&
            (!identifier.tags || identifier.tags.length === 0 || identifier.tags.every((tag) => entity.tags.includes(tag))))
      );
  }

  additionalIdentifier(figure: Figure, entity: Entity | undefined = undefined): AdditionalIdentifier {
    if (figure instanceof Character) {
      return new AdditionalIdentifier(figure.name, figure.edition, 'character', undefined, figure.tags);
    } else if (figure instanceof Monster) {
      if (entity instanceof MonsterEntity) {
        return new AdditionalIdentifier(figure.name, figure.edition, 'monster', entity.marker, entity.tags);
      }
      return new AdditionalIdentifier(figure.name, figure.edition, 'monster', undefined, figure.tags);
    } else if (figure instanceof ObjectiveContainer) {
      if (entity instanceof ObjectiveEntity) {
        return new AdditionalIdentifier(figure.name, figure.escort ? 'escort' : 'objective', 'objective', entity.marker, entity.tags);
      }
      return new AdditionalIdentifier(figure.name, figure.escort ? 'escort' : 'objective', 'objective', undefined, []);
    }

    return new AdditionalIdentifier(figure.name, figure.edition, undefined, undefined, (entity && entity.tags) || []);
  }
}
