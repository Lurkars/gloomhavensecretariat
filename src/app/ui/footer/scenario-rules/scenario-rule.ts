import { Component, input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { gameManager, labelManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Condition } from 'src/app/game/model/data/Condition';
import { RoomData } from 'src/app/game/model/data/RoomData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import {
  ScenarioFigureRule,
  ScenarioFigureRuleIdentifier,
  ScenarioRule,
  ScenarioRuleIdentifier
} from 'src/app/game/model/data/ScenarioRule';
import { Entity, EntityValueFunction } from 'src/app/game/model/Entity';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ElementIconComponent } from 'src/app/ui/header/element/element-icon';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

function randomDungeonCardLabels(cardIds: string[] | undefined, group: string): string[] {
  const scenario = gameManager.game.scenario;
  return (cardIds || [])
    .filter((cardId) => !scenario || !scenario.additionalSections || !scenario.additionalSections.includes(cardId))
    .map((cardId) => {
      const section = scenario
        ? gameManager.editionManager
            .sectionData(scenario.edition, true)
            .find((sectionData) => sectionData.index === cardId && sectionData.group === group)
        : undefined;
      return section
        ? '&nbsp%' + gameManager.scenarioManager.scenarioTitle(section, true) + '% (#' + section.index + ')'
        : '&nbsp' + cardId;
    });
}

@Component({
  imports: [FormsModule, GhsLabelDirective, TrackUUIDPipe, ElementIconComponent],
  selector: 'ghs-scenario-rule',
  templateUrl: './scenario-rule.html',
  styleUrls: ['./scenario-rule.scss']
})
export class ScenarioRuleComponent implements OnInit {
  readonly inputRule = input.required<ScenarioRule>({ alias: 'rule' });
  get rule(): ScenarioRule {
    return this.inputRule();
  }

  readonly inputIdentifier = input.required<ScenarioRuleIdentifier>({ alias: 'identifier' });
  get identifier(): ScenarioRuleIdentifier {
    return this.inputIdentifier();
  }

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  EntityValueFunction = EntityValueFunction;

  ngOnInit(): void {
    if (this.rule.figures) {
      this.rule.figures.forEach((figureRule) => {
        if (figureRule.value) {
          figureRule.value = '' + figureRule.value;
        }
      });
    }
  }

  randomDungeonsMonsterLabel(rule: ScenarioRule): string[] {
    return randomDungeonCardLabels(rule.randomDungeon?.monsterCards, 'randomMonsterCard');
  }

  randomDungeonsDungeonLabel(): string[] {
    return randomDungeonCardLabels(this.rule.randomDungeon?.dungeonCards, 'randomDungeonCard');
  }

  prevent(event: any) {
    event.preventDefault();
    event.stopPropagation();
  }

  sections(): ScenarioData[] {
    return gameManager.scenarioRulesManager.ruleSections(this.rule, this.identifier);
  }

  rooms(): RoomData[] {
    return gameManager.scenarioRulesManager.ruleRooms(this.rule, this.identifier);
  }

  figureRules(): ScenarioFigureRule[] {
    return gameManager.scenarioRulesManager.pendingFigureRules(this.rule);
  }

  figureNames(figureRule: ScenarioFigureRule): string {
    let names = '';
    if (figureRule.identifier) {
      if (figureRule.identifier.type === 'all') {
        names = labelManager.getLabel('scenario.rules.figures.all');
      } else {
        names = gameManager.scenarioRulesManager
          .figuresByFigureRule(figureRule, this.rule)
          .filter((figure) => {
            if (figureRule.type === 'gainCondition') {
              const entities: Entity[] = gameManager.entityManager.entities(figure);
              const gainCondition = new Condition(('' + figureRule.value).split(':')[0]);
              if (entities.every((entity) => gameManager.conditionManager.hasCondition(entity, gainCondition))) {
                return false;
              }
            } else if (figureRule.type === 'permanentCondition') {
              const entities: Entity[] = gameManager.entityManager.entities(figure);
              const gainCondition = new Condition(('' + figureRule.value).split(':')[0]);
              if (entities.every((entity) => gameManager.conditionManager.hasCondition(entity, gainCondition, true))) {
                return false;
              }
            } else if (figureRule.type === 'loseCondition') {
              const entities: Entity[] = gameManager.entityManager.entities(figure);
              const loseCondition = new Condition(('' + figureRule.value).split(':')[0]);
              if (entities.every((entity) => !gameManager.conditionManager.hasCondition(entity, loseCondition))) {
                return false;
              }
            } else if (figureRule.type === 'losePermanentCondition') {
              const entities: Entity[] = gameManager.entityManager.entities(figure);
              const losePermanentCondition = new Condition(('' + figureRule.value).split(':')[0]);
              if (entities.every((entity) => !gameManager.conditionManager.hasCondition(entity, losePermanentCondition, true))) {
                return false;
              }
            } else if (figureRule.type === 'toggleOn' || figureRule.type === 'toggleOff') {
              return figure.off === (figureRule.type === 'toggleOn');
            }

            return true;
          })
          .map((figure) => {
            if (figure instanceof Character) {
              return (
                labelManager.getLabel('%game.characterIconColored.' + figure.name + '%') +
                gameManager.characterManager.characterName(figure)
              );
            }
            if (figure instanceof ObjectiveContainer) {
              return (
                (figure.title || labelManager.getLabel('data.objective.' + figure.name)) +
                (figure.marker ? ' %game.mapMarker.' + figure.marker + '%' : '') +
                (figureRule.identifier && figureRule.identifier.marker ? ' %game.mapMarker.' + figureRule.identifier.marker + '%' : '')
              );
            }
            if (figure instanceof Monster) {
              const name = figure.statEffect && figure.statEffect.name ? figure.statEffect.name : figure.name;
              if (figureRule.type === 'removeEntity') {
                return (
                  labelManager.getLabel('data.monster.' + name) +
                  ' [' +
                  gameManager.scenarioRulesManager
                    .entitiesByFigureRule(figureRule, this.rule)
                    .filter((entity) => entity instanceof MonsterEntity && figure.entities.includes(entity))
                    .map((entity) => '' + entity.number)
                    .join(', ') +
                  ']'
                );
              }
              return labelManager.getLabel('data.monster.' + name);
            }

            return figure.name;
          })
          .join(', ');
      }
    }

    return names;
  }

  figureNamesByIdenfifier(identifier: ScenarioFigureRuleIdentifier): string {
    return gameManager.entityManager
      .figuresByIdentifier(identifier)
      .map((figure) => {
        if (figure instanceof Character) {
          return (
            labelManager.getLabel('%game.characterIconColored.' + figure.name + '%') + gameManager.characterManager.characterName(figure)
          );
        }
        if (figure instanceof ObjectiveContainer) {
          return (
            (figure.title || labelManager.getLabel('data.objective.' + figure.name)) +
            (figure.marker ? ' %game.mapMarker.' + figure.marker + '%' : '') +
            (identifier.marker ? ' %game.mapMarker.' + identifier.marker + '%' : '')
          );
        }
        if (figure instanceof Monster) {
          const name = figure.statEffect && figure.statEffect.name ? figure.statEffect.name : figure.name;
          return labelManager.getLabel('data.monster.' + name);
        }

        return figure.name;
      })
      .join(', ');
  }
}
