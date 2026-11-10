import { DIALOG_DATA } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { DamageStats, ScenarioStats } from 'src/app/game/model/CharacterProgress';
import { herbResourceLootTypes, LootType, materialResourceLootTypes } from 'src/app/game/model/data/Loot';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TabClickDirective } from 'src/app/ui/helper/tabclick';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

export type ScenarioAttempt = {
  key: string;
  timestamp: number | undefined;
  success: boolean;
  // missing on records synced through ghs-server before its 'difficutly' typo fix
  difficulty: number | undefined;
  stats: Map<Character, ScenarioStats>;
};

@Component({
  imports: [DatePipe, GhsLabelDirective, GhsTooltipDirective, TabClickDirective, TrackUUIDPipe],
  selector: 'ghs-statistics-dialog',
  templateUrl: 'statistics-dialog.html',
  styleUrls: ['./statistics-dialog.scss']
})
export class StatisticsDialogComponent implements OnInit {
  character: Character | undefined;
  scenario: ScenarioData | undefined;
  characters: Character[] = [];
  scenarios: number[][] = [];
  overall: ScenarioStats = new ScenarioStats();
  retired: boolean = false;
  available: boolean = false;
  materials: LootType[] = [...materialResourceLootTypes];
  herbs: LootType[] = [...herbResourceLootTypes];
  otherLoot: LootType[] = [LootType.money, LootType.random_item];
  attempts: ScenarioAttempt[] = [];
  // index of the selected attempt in scenario mode, -1 selects the latest
  selectedAttempt: number = -1;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  private data: { character: Character | undefined; scenario: ScenarioData | undefined } = inject(DIALOG_DATA);

  constructor() {
    this.character = (!!this.data && this.data.character) || undefined;
    this.scenario = (!!this.data && this.data.scenario) || undefined;
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    if (this.character) {
      this.characters = [this.copyCharacter(this.character)];
    } else {
      this.characters = gameManager.game.figures
        .filter((figure) => figure instanceof Character)
        .map((character) => this.copyCharacter(character));

      // a specific scenario may have been played by characters that are retired or inactive by now
      if (this.retired || this.scenario) {
        this.characters.push(
          ...gameManager.game.party.retirements.map((characterModel) => {
            const character = new Character(
              gameManager.getCharacterData(characterModel.name, characterModel.edition),
              characterModel.level
            );
            character.fromModel(characterModel);
            return character;
          })
        );
      }

      if (this.available || this.scenario) {
        this.characters.push(
          ...gameManager.game.party.availableCharacters.map((characterModel) => {
            const character = new Character(
              gameManager.getCharacterData(characterModel.name, characterModel.edition),
              characterModel.level
            );
            character.fromModel(characterModel);
            return character;
          })
        );
      }
    }

    if (this.scenario) {
      this.characters = this.characters.filter((character) =>
        character.progress.scenarioStats.some((stat) => this.matchesScenario(stat, this.scenario))
      );
    }

    this.attempts = [];
    if (this.scenario) {
      this.attempts = this.scenarioAttempts(this.characters, this.scenario);
      if (this.selectedAttempt < 0 || this.selectedAttempt >= this.attempts.length) {
        this.selectedAttempt = this.attempts.length - 1;
      }
      const attempt = this.attempts[this.selectedAttempt];
      this.characters = this.characters.filter((character) => attempt && attempt.stats.has(character));
      this.characters.forEach((character) => {
        const stat = attempt.stats.get(character)!;
        character.scenarioStats = Object.assign(new ScenarioStats(), stat, {
          level: stat.level ?? undefined,
          loot: { ...(stat.loot || {}) },
          summons: Object.assign(new DamageStats(), stat.summons)
        });
      });
    }

    this.scenarios = [];
    this.characters.forEach((character, index) => {
      const stats = character.progress.scenarioStats;
      if (!this.scenario) {
        character.scenarioStats = this.scenarioStatisticsSum(stats);
      }
      this.scenarios[index] = [stats.length, stats.filter((stat) => stat.success).length, stats.filter((stat) => !stat.success).length];
    });

    this.overall = this.scenarioStatisticsSum(this.characters.map((character) => character.scenarioStats));

    const scenarioKeyMap = this.characters.reduce((map, character) => {
      const charMap = character.progress.scenarioStats
        .filter((stat) => stat.scenario)
        .reduce((m, stat) => {
          const key = `${stat.scenario!.index}_${stat.scenario!.edition}_${stat.scenario!.group ?? ''}`;
          const e = m.get(key) ?? { total: 0, success: 0, failure: 0 };
          m.set(key, { total: e.total + 1, success: e.success + (stat.success ? 1 : 0), failure: e.failure + (stat.success ? 0 : 1) });
          return m;
        }, new Map<string, { total: number; success: number; failure: number }>());

      charMap.forEach((counts, key) => {
        const existing = map.get(key);
        if (!existing || counts.total > existing.total) map.set(key, counts);
      });
      return map;
    }, new Map<string, { total: number; success: number; failure: number }>());

    this.scenarios[this.characters.length] = [...scenarioKeyMap.values()].reduce(
      ([t, s, f], c) => [t + c.total, s + c.success, f + c.failure],
      [0, 0, 0]
    );
  }

  selectAttempt(index: number) {
    this.selectedAttempt = index;
    this.update();
  }

  /**
   * Group the records of all characters into attempts of the given scenario.
   * Records of the same attempt share a timestamp; legacy records without one are matched by their order.
   */
  private scenarioAttempts(characters: Character[], scenario: ScenarioData): ScenarioAttempt[] {
    const attempts = new Map<string, ScenarioAttempt>();
    characters.forEach((character) => {
      character.progress.scenarioStats
        .filter((stat) => this.matchesScenario(stat, scenario))
        .forEach((stat, index) => {
          const key = stat.timestamp ? 't' + stat.timestamp : 'i' + index;
          let attempt = attempts.get(key);
          if (!attempt) {
            attempt = { key, timestamp: stat.timestamp, success: stat.success, difficulty: stat.difficulty ?? undefined, stats: new Map() };
            attempts.set(key, attempt);
          }
          attempt.stats.set(character, stat);
        });
    });
    // legacy attempts first (keeping their order), then by timestamp
    return [...attempts.values()].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }

  /** work on copies so the live (in-scenario) stats of a character are never overwritten */
  private copyCharacter(character: Character): Character {
    const characterCopy = new Character(character, character.level);
    characterCopy.fromModel(character.toModel());
    return characterCopy;
  }

  private matchesScenario(stat: ScenarioStats, scenario: ScenarioData | undefined): boolean {
    return (
      !!scenario &&
      !!stat.scenario &&
      stat.scenario.index === scenario.index &&
      stat.scenario.edition === scenario.edition &&
      (stat.scenario.group ?? '') === (scenario.group ?? '')
    );
  }

  scenarioStatisticsSum(stats: ScenarioStats[]): ScenarioStats {
    const scenarioStats = new ScenarioStats();

    const damageStats = this.damageStatisticsSum(stats);

    scenarioStats.dealtDamage = damageStats.dealtDamage;
    scenarioStats.monsterDamage = damageStats.monsterDamage;
    scenarioStats.otherDamage = damageStats.otherDamage;
    scenarioStats.healedDamage = damageStats.healedDamage;
    scenarioStats.heals = damageStats.heals;
    scenarioStats.normalKills = damageStats.normalKills;
    scenarioStats.eliteKills = damageStats.eliteKills;
    scenarioStats.bossKills = damageStats.bossKills;
    scenarioStats.exhausts = damageStats.exhausts;
    scenarioStats.maxDealtDamage = damageStats.maxDealtDamage;
    scenarioStats.maxDamage = damageStats.maxDamage;

    if (stats.length) {
      scenarioStats.gold = stats.map((stat) => stat.gold || 0).reduce((a, b) => a + b);
      scenarioStats.xp = stats.map((stat) => stat.xp || 0).reduce((a, b) => a + b);
      scenarioStats.treasures = stats.map((stat) => stat.treasures || 0).reduce((a, b) => a + b);

      scenarioStats.loot = {};
      stats.forEach((stat) => {
        Object.entries(stat.loot || {}).forEach(([type, value]) => {
          const lootType = type as LootType;
          scenarioStats.loot[lootType] = (scenarioStats.loot[lootType] || 0) + (value || 0);
        });
      });

      scenarioStats.summons = this.damageStatisticsSum(stats.filter((stat) => stat.summons).map((stat) => stat.summons));
    }

    return scenarioStats;
  }

  damageStatisticsSum(stats: DamageStats[]): DamageStats {
    const damageStats = new DamageStats();

    if (stats.length) {
      damageStats.dealtDamage = stats.map((stat) => stat.dealtDamage).reduce((a, b) => a + b);
      damageStats.monsterDamage = stats.map((stat) => stat.monsterDamage).reduce((a, b) => a + b);
      damageStats.otherDamage = stats.map((stat) => stat.otherDamage).reduce((a, b) => a + b);
      damageStats.healedDamage = stats.map((stat) => stat.healedDamage).reduce((a, b) => a + b);
      damageStats.heals = stats.map((stat) => stat.heals).reduce((a, b) => a + b);
      damageStats.normalKills = stats.map((stat) => stat.normalKills).reduce((a, b) => a + b);
      damageStats.eliteKills = stats.map((stat) => stat.eliteKills).reduce((a, b) => a + b);
      damageStats.bossKills = stats.map((stat) => stat.bossKills).reduce((a, b) => a + b);
      damageStats.exhausts = stats.map((stat) => stat.exhausts).reduce((a, b) => a + b);
      damageStats.maxDealtDamage = Math.max(...stats.map((stat) => stat.maxDealtDamage));
      damageStats.maxDamage = Math.max(...stats.map((stat) => stat.maxDamage));
    }

    return damageStats;
  }
}
