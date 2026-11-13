import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { DamageStats } from 'src/app/game/model/CharacterProgress';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Entity } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { Game } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { GameScenarioModel, Scenario } from 'src/app/game/model/Scenario';
import { Summon } from 'src/app/game/model/Summon';

export type MonsterKiller = { character: Character; summon: boolean };

export class ScenarioStatsManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  applyDamage(entity: Entity, figure: Figure, value: number) {
    const activeFigure: Figure | undefined = this.game.figures.find((figure) => figure.active);

    if (figure instanceof Character) {
      if (entity instanceof Character) {
        if (activeFigure && activeFigure instanceof Monster) {
          entity.scenarioStats.monsterDamage += value;
        } else {
          entity.scenarioStats.otherDamage += value;
        }
        entity.scenarioStats.maxDamage = Math.max(entity.scenarioStats.maxDamage, value);
      } else if (entity instanceof Summon) {
        if (activeFigure && activeFigure instanceof Monster) {
          figure.scenarioStats.summons.monsterDamage += value;
        } else {
          figure.scenarioStats.summons.otherDamage += value;
        }
        figure.scenarioStats.summons.maxDamage = Math.max(figure.scenarioStats.summons.maxDamage, value);
      }
    } else if (activeFigure instanceof Character) {
      if (activeFigure.summons.find((summon) => summon.active)) {
        activeFigure.scenarioStats.summons.dealtDamage += value;
        activeFigure.scenarioStats.summons.maxDealtDamage = Math.max(activeFigure.scenarioStats.summons.maxDealtDamage, value);
      } else {
        activeFigure.scenarioStats.dealtDamage += value;
        activeFigure.scenarioStats.maxDealtDamage = Math.max(activeFigure.scenarioStats.maxDealtDamage, value);
      }
    }
  }

  applyHeal(entity: Entity, figure: Figure, value: number) {
    const activeFigure: Figure | undefined = this.game.figures.find((figure) => figure.active);
    if (figure instanceof Character && activeFigure instanceof Character) {
      if (entity instanceof Character) {
        entity.scenarioStats.healedDamage += value;
      } else if (entity instanceof Summon) {
        figure.scenarioStats.summons.healedDamage += value;
      }

      if (activeFigure.summons.find((summon) => summon.active)) {
        activeFigure.scenarioStats.summons.heals += value;
      } else {
        activeFigure.scenarioStats.heals += value;
      }
    }
  }

  /**
   * Track a change of the exhausted (character) or dead (summon) state.
   * Un-exhausting/reviving is treated as a correction and reverts the count.
   */
  changeExhausts(entity: Entity, figure: Figure, exhausted: boolean) {
    let stats: DamageStats | undefined;
    if (entity instanceof Character) {
      stats = entity.scenarioStats;
    } else if (entity instanceof Summon && figure instanceof Character) {
      stats = figure.scenarioStats.summons;
    }
    if (stats) {
      stats.exhausts = Math.max(0, stats.exhausts + (exhausted ? 1 : -1));
    }
  }

  /** the character (or its active summon) acting right now */
  activeKiller(): MonsterKiller | undefined {
    const activeFigure: Figure | undefined = this.game.figures.find((figure) => figure.active);
    if (activeFigure instanceof Character) {
      return { character: activeFigure, summon: activeFigure.summons.some((summon) => summon.active) };
    }
    return undefined;
  }

  killMonsterEntity(
    entity: MonsterEntity,
    monster: Monster | undefined = undefined,
    killer: MonsterKiller | undefined = this.activeKiller(),
    revert: boolean = false
  ) {
    if (!killer || (!revert && !entity.dead) || entity.tags.includes('ignore-kill') || (monster && (monster.isAlly || monster.isAllied))) {
      return;
    }
    const stats: DamageStats = killer.summon ? killer.character.scenarioStats.summons : killer.character.scenarioStats;
    const value = revert ? -1 : 1;
    switch (entity.type) {
      case MonsterType.normal:
        stats.normalKills = Math.max(0, stats.normalKills + value);
        break;
      case MonsterType.elite:
        stats.eliteKills = Math.max(0, stats.eliteKills + value);
        break;
      case MonsterType.boss:
        stats.bossKills = Math.max(0, stats.bossKills + value);
        break;
    }
  }

  /** whether any character (active, available or retired) has recorded statistics for the scenario */
  hasScenarioStats(scenario: { index: string; edition: string; group?: string | undefined }): boolean {
    const progresses = [
      ...this.game.figures.filter((figure) => figure instanceof Character).map((character) => character.progress),
      ...this.game.party.availableCharacters.map((model) => model.progress),
      ...this.game.party.retirements.map((model) => model.progress)
    ];
    return progresses.some(
      (progress) =>
        !!progress &&
        !!progress.scenarioStats &&
        progress.scenarioStats.some(
          (stat) =>
            !!stat.scenario &&
            stat.scenario.index === scenario.index &&
            stat.scenario.edition === scenario.edition &&
            (stat.scenario.group ?? '') === (scenario.group ?? '')
        )
    );
  }

  applyScenarioStats(character: Character, scenario: Scenario, success: boolean) {
    character.scenarioStats.scenario = new GameScenarioModel(scenario.index, scenario.edition, scenario.group);
    character.scenarioStats.success = success;
    character.scenarioStats.level = character.level;
    character.scenarioStats.difficulty = this.game.level;

    character.scenarioStats.gold = character.loot;
    character.scenarioStats.xp = character.experience;

    character.scenarioStats.treasures = character.treasures.length;
    character.scenarioStats.rounds = this.game.round;

    character.scenarioStats.loot = {};
    if (character.lootCards) {
      character.lootCards.forEach((index) => {
        const loot = this.game.lootDeck.cards[index];
        if (loot) {
          character.scenarioStats.loot[loot.type] = (character.scenarioStats.loot[loot.type] || 0) + gameManager.lootManager.getValue(loot);
        }
      });
    }
  }
}
