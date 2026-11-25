import { gameManager, labelManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { LootDeckConfig } from 'src/app/game/model/data/Loot';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { ScenarioObjectiveIdentifier } from 'src/app/game/model/data/ObjectiveData';
import { MonsterStandeeData, RoomData } from 'src/app/game/model/data/RoomData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Game, GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { GameScenarioModel, Scenario } from 'src/app/game/model/Scenario';

export class ScenarioManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  createScenario(): Scenario {
    return new Scenario(new ScenarioData(), [], [], true);
  }

  randomScenarioSections(edition: string): ScenarioData[] {
    return gameManager.editionManager.sectionData(edition).filter((sectionData) => sectionData.group === 'randomMonsterCard');
  }

  setRandomScenario(edition: string) {
    const shuffledSections = gameManager.randomManager.shuffle(this.randomScenarioSections(edition));
    if (shuffledSections.length < 3) {
      return;
    }
    const scenario = this.createScenario();
    scenario.name = '%scenario.random%';
    scenario.additionalSections = shuffledSections.slice(0, 3).map((sectionData) => sectionData.index);
    this.setScenario(undefined);
    this.setScenario(scenario);
    this.addSection(shuffledSections[0]);
  }

  getScenario(index: string, edition: string, group: string | undefined): ScenarioData | undefined {
    return gameManager.editionManager
      .scenarioData(edition)
      .find((scenarioData) => scenarioData.index === index && scenarioData.edition === edition && scenarioData.group === group);
  }

  getSection(index: string, edition: string, group: string | undefined, conlusionOnly: boolean = false): ScenarioData | undefined {
    return gameManager.editionManager
      .sectionData(edition)
      .find(
        (sectionData) =>
          sectionData.index === index &&
          sectionData.edition === edition &&
          sectionData.group === group &&
          (!conlusionOnly || sectionData.conclusion)
      );
  }

  canSelectScenario(scenarioData: ScenarioData, force: boolean = false): boolean {
    return (
      !gameManager.scenarioRequirementsManager.isCurrent(scenarioData) &&
      (force || !gameManager.scenarioRequirementsManager.isLocked(scenarioData))
    );
  }

  selectScenario(scenarioData: ScenarioData, linked: boolean = false, force: boolean = false): boolean {
    if (!this.canSelectScenario(scenarioData, force)) {
      return false;
    }
    this.setScenario(new Scenario(scenarioData), linked);
    return true;
  }

  canSetCustomScenario(custom: boolean): boolean {
    return typeof custom === 'boolean' && custom !== (!!this.game.scenario && this.game.scenario.custom);
  }

  setCustomScenario(custom: boolean): boolean {
    if (!this.canSetCustomScenario(custom)) {
      return false;
    }
    this.setScenario(custom ? this.createScenario() : undefined);
    return true;
  }

  canSetCustomScenarioName(name: string): boolean {
    return typeof name === 'string' && !!this.game.scenario && this.game.scenario.custom;
  }

  setCustomScenarioName(name: string): boolean {
    if (!this.game.scenario || !this.canSetCustomScenarioName(name)) {
      return false;
    }
    this.game.scenario.name = name;
    return true;
  }

  canRevealRoom(roomData: RoomData): boolean {
    return !!this.game.scenario && !(this.game.scenario.revealedRooms || []).includes(roomData.roomNumber);
  }

  revealRoom(roomData: RoomData, scenarioData: ScenarioData, section: boolean = false): boolean {
    if (!this.canRevealRoom(roomData)) {
      return false;
    }
    this.openRoom(roomData, scenarioData, section);
    return true;
  }

  resetScenario() {
    gameManager.roundManager.resetScenario();
    if (this.game.scenario) {
      this.setScenario(this.game.scenario, true);
    }
  }

  setScenario(scenario: Scenario | undefined, linked: boolean = false) {
    this.game.scenario = scenario
      ? new Scenario(scenario, scenario.revealedRooms, scenario.additionalSections, scenario.custom)
      : undefined;
    if (scenario && !scenario.custom) {
      const scenarioData = gameManager.editionManager
        .scenarioData()
        .find(
          (scenarioData) =>
            scenarioData.index === scenario.index && scenarioData.edition === scenario.edition && scenarioData.group === scenario.group
        );
      if (!scenarioData) {
        console.error('Could not find scenario data!');
        return;
      }
      gameManager.roundManager.resetScenario();
      this.applyScenarioData(scenarioData, false, linked);

      if (settingsManager.settings.scenarioRules) {
        gameManager.scenarioRulesManager.addScenarioRules(true);
      }
    } else if (!scenario) {
      gameManager.roundManager.resetScenario();
    }

    gameManager.stateManager.standeeDialogCanceled = false;
  }

  addSection(section: ScenarioData) {
    if (
      !this.game.sections.some(
        (value) => value.edition === section.edition && value.index === section.index && value.group === section.group
      )
    ) {
      this.applyScenarioData(section, true);
      if (settingsManager.settings.scenarioRules && section.rules) {
        const roundStart = this.game.state === GameState.draw;
        section.rules.forEach((rule, index) => {
          if ((!rule.alwaysApply || !settingsManager.settings.scenarioRulesAutoapply) && (!rule.start || rule.always || roundStart)) {
            gameManager.scenarioRulesManager.addScenarioRule(section, rule, index, true, roundStart);
          }
        });

        gameManager.scenarioRulesManager.filterDisabledScenarioRules();
      }
      this.game.sections.push(new Scenario(section, []));

      gameManager.stateManager.standeeDialogCanceled = false;
    }
  }

  applyScenarioData(scenarioData: ScenarioData, section: boolean = false, linked: boolean = false) {
    gameManager.stateManager.standeeDialogCanceled = true;
    this.applyScenarioRooms(scenarioData, section);

    if (settingsManager.settings.addAllMonsters) {
      this.getMonsters(new Scenario(scenarioData), true).forEach((monster) => {
        if (
          !this.game.figures.find(
            (figure) => figure instanceof MonsterData && figure.name === monster.name && figure.edition === monster.edition
          )
        ) {
          gameManager.monsterManager.addMonster(monster, this.game.level);
        }
      });
    }

    this.applyScenarioSolo(scenarioData);

    if (scenarioData.lootDeckConfig) {
      const lootDeckConfig: LootDeckConfig = JSON.parse(JSON.stringify(scenarioData.lootDeckConfig));
      this.game.lootDeckFixed.forEach((lootType) => {
        lootDeckConfig[lootType] = 1;
      });
      gameManager.lootManager.apply(this.game.lootDeck, lootDeckConfig);
    }

    if (scenarioData.resetRound) {
      const offset =
        scenarioData.resetRound.endsWith('Keep') &&
        ((this.game.state === GameState.next && this.game.round % 2 === 0) ||
          (this.game.state === GameState.draw && this.game.round % 2 === 1))
          ? 1
          : 0;
      if (scenarioData.resetRound === 'visible' || scenarioData.resetRound === 'visibleKeep') {
        this.game.roundResets.push(this.game.round + (this.game.state === GameState.draw ? 0 : -1) - offset);
      } else {
        this.game.roundResetsHidden.push(this.game.round + (this.game.state === GameState.draw ? 0 : -1) - offset);
      }
      this.game.round = (this.game.state === GameState.draw ? 0 : 1) + offset;
    }

    if (gameManager.bbRules() && scenarioData.level) {
      this.game.figures.forEach((figure) => {
        if (figure instanceof Character && scenarioData.level) {
          gameManager.characterManager.setLevel(figure, scenarioData.level);
        }
      });
    }

    if (settingsManager.settings.partySheet && settingsManager.settings.events && scenarioData.eventType && !linked) {
      let type = scenarioData.eventType;

      if (scenarioData.edition === 'fh' && (type === 'road' || type === 'outpost')) {
        type = (Math.max(this.game.party.weeks, 0) % 20 < 10 ? 'summer-' : 'winter-') + type;
      }

      this.game.eventDraw = type;
    }

    this.applyScenarioEvents();

    if (settingsManager.settings.removeUnusedMonster) {
      this.game.figures
        .filter(
          (figure) => figure instanceof Monster && figure.off && figure.entities.length === 0 && !figure.tags.includes('addedManually')
        )
        .forEach((figure) => {
          gameManager.monsterManager.removeMonster(figure as Monster);
        });
    }
  }

  private applyScenarioRooms(scenarioData: ScenarioData, section: boolean) {
    if (!settingsManager.settings.scenarioRooms || !scenarioData.rooms || scenarioData.rooms.length === 0) {
      if (scenarioData.monsters) {
        scenarioData.monsters.forEach((name) => {
          const monsterName = name.split(':')[0];
          const monster = gameManager.monsterManager.addMonsterByName(name, scenarioData.edition);
          if (monster) {
            monster.isAlly =
              (scenarioData.allies && scenarioData.allies.includes(monsterName)) ||
              (section && this.game.scenario && this.game.scenario.allies && this.game.scenario.allies.includes(monsterName)) ||
              false;
            monster.isAllied =
              (scenarioData.allied && scenarioData.allied.includes(monsterName)) ||
              (section && this.game.scenario && this.game.scenario.allied && this.game.scenario.allied.includes(monsterName)) ||
              false;
            monster.drawExtra =
              (scenarioData.drawExtra && scenarioData.drawExtra.includes(monsterName)) ||
              (section && this.game.scenario && this.game.scenario.drawExtra && this.game.scenario.drawExtra.includes(monsterName)) ||
              false;
          }
        });
      }

      if (scenarioData.objectives) {
        scenarioData.objectives.forEach((objectiveData, index) => {
          const objectiveIdentifier: ScenarioObjectiveIdentifier = {
            edition: scenarioData.edition,
            scenario: scenarioData.index,
            group: scenarioData.group,
            section: section,
            index: index
          };
          const objectiveContainer = gameManager.objectiveManager.addObjective(objectiveData, undefined, objectiveIdentifier);
          gameManager.objectiveManager.addObjectiveEntity(objectiveContainer);
        });
      }
    } else {
      scenarioData.rooms
        .filter((roomData) => roomData.initial)
        .forEach((roomData) => {
          this.openRoom(roomData, scenarioData, section);
        });

      if (scenarioData.monsters) {
        const monsters = this.game.figures.filter((figure) => figure instanceof Monster).map((figure) => figure as Monster);
        scenarioData.monsters.forEach((name) => {
          const monsterName = name.split(':')[0];
          const monsterData = gameManager.editionManager
            .monstersData(scenarioData.edition)
            .find((monsterData) => monsterData.name === monsterName);
          if (monsterData && !monsters.find((existing) => existing.name === monsterData.name)) {
            monsters.push(new Monster(monsterData));
          }
        });

        scenarioData.monsters.forEach((name) => {
          const monsterName = name.split(':')[0];
          const isRoom =
            settingsManager.settings.automaticStandees &&
            scenarioData.rooms &&
            scenarioData.rooms.some(
              (roomData) => roomData.monster && roomData.monster.some((standee) => standee.name.split(':')[0] === monsterName)
            );

          const spawns = gameManager.monsterManager.getSpawnMonsters(monsters);

          const isSpawn = settingsManager.settings.interactiveAbilities && spawns.find((monsterData) => monsterData.name === monsterName);

          const isRule =
            settingsManager.settings.scenarioRules &&
            this.getRuleMonster(new Scenario(scenarioData)).find((monsterData) => monsterData.name === monsterName);

          if (!isRoom && !isSpawn && !isRule) {
            const monster = gameManager.monsterManager.addMonsterByName(name, scenarioData.edition);
            if (monster) {
              monster.isAlly =
                (scenarioData.allies && scenarioData.allies.includes(monsterName)) ||
                (section && this.game.scenario && this.game.scenario.allies && this.game.scenario.allies.includes(monsterName)) ||
                false;
              monster.isAllied =
                (scenarioData.allied && scenarioData.allied.includes(monsterName)) ||
                (section && this.game.scenario && this.game.scenario.allied && this.game.scenario.allied.includes(monsterName)) ||
                false;
              monster.drawExtra =
                (scenarioData.drawExtra && scenarioData.drawExtra.includes(monsterName)) ||
                (section && this.game.scenario && this.game.scenario.drawExtra && this.game.scenario.drawExtra.includes(monsterName)) ||
                false;
            }
          }
        });
      }
    }
  }

  private applyScenarioSolo(scenarioData: ScenarioData) {
    if (scenarioData.solo) {
      if (!scenarioData.spotlight) {
        this.game.figures.forEach((figure) => {
          if (figure instanceof Character) {
            if (figure.name !== scenarioData.solo || figure.edition !== scenarioData.edition) {
              figure.absent = true;
            } else {
              figure.absent = false;
            }
          }
        });
      }

      if (
        !this.game.figures.some(
          (figure) => figure instanceof Character && figure.name === scenarioData.solo && figure.edition === scenarioData.edition
        )
      ) {
        const characterData = gameManager.editionManager
          .charactersData()
          .find((characterData) => characterData.name === scenarioData.solo && characterData.edition === scenarioData.edition);
        if (characterData) {
          gameManager.characterManager.addCharacter(characterData, 5);
        } else {
          console.error("Solo Scenario Character not found: '" + scenarioData.solo + "' (" + scenarioData.name + ')');
        }
      }
    }
  }

  private applyScenarioEvents() {
    if (
      settingsManager.settings.partySheet &&
      settingsManager.settings.events &&
      settingsManager.settings.eventsApply &&
      this.game.party.eventCards
    ) {
      this.game.party.eventCards
        .filter((e) => e.scenarioApply)
        .forEach((e) => {
          const eventCard = gameManager.eventCardManager.getEventCardForEdition(e.edition, e.type, e.cardId);
          if (eventCard && e.selected !== -1) {
            const option = eventCard.options[e.selected];
            if (option && option.outcomes) {
              option.outcomes.forEach((outcome, i) => {
                if (outcome.effects && (!e.subSelections || e.subSelections.length === 0 || e.subSelections.includes(i))) {
                  gameManager.eventCardManager.applyEffects(
                    eventCard,
                    outcome.effects.filter((e) => typeof e !== 'string'),
                    e.checks,
                    true
                  );
                }
              });
            }

            if (e.attack) {
              const attackOption = eventCard.options.find(
                (option) => !!option.outcomes && option.outcomes.some((outcome) => !!outcome.attack && !!outcome.attack.effects)
              );
              if (attackOption) {
                const outcome = attackOption.outcomes.find((outcome) => !!outcome.attack && !!outcome.attack.effects);
                if (outcome && outcome.attack) {
                  gameManager.eventCardManager.applyEffects(
                    eventCard,
                    outcome.attack.effects.filter((e) => typeof e !== 'string'),
                    e.checks,
                    true
                  );
                }
              }
            }
          }
          e.scenarioApply = false;
        });
    }
  }

  openRoom(roomData: RoomData, scenarioData: ScenarioData, section: boolean) {
    gameManager.stateManager.standeeDialogCanceled = false;
    if (this.game.scenario) {
      this.game.scenario.revealedRooms = this.game.scenario.revealedRooms || [];
      this.game.scenario.revealedRooms.push(roomData.roomNumber);
    }

    this.openRoomMonsters(roomData, scenarioData, section);

    this.openRoomObjectives(roomData, scenarioData, section);
  }

  private openRoomMonsters(roomData: RoomData, scenarioData: ScenarioData, section: boolean) {
    if (roomData.monster) {
      const entities: MonsterEntity[] = [];
      // boss / elite first
      roomData.monster.forEach((monsterStandeeData) => {
        let type: MonsterType | undefined = monsterStandeeData.type;

        if (!type) {
          const charCount = gameManager.characterManager.characterCount();
          if (charCount < 3) {
            type = monsterStandeeData.player2;
          } else if (charCount === 3) {
            type = monsterStandeeData.player3;
          } else {
            type = monsterStandeeData.player4;
          }
        }

        if (!type && !monsterStandeeData.player2 && !monsterStandeeData.player3 && !monsterStandeeData.player4) {
          type = MonsterType.normal;
        }

        if (type === MonsterType.boss || type === MonsterType.elite) {
          entities.push(...this.applyRoomSpawn(scenarioData, monsterStandeeData, type, section));
        }
      });

      // normal
      roomData.monster.forEach((monsterStandeeData) => {
        let type: MonsterType | undefined = monsterStandeeData.type;

        if (!type) {
          const charCount = gameManager.characterManager.characterCount();
          if (charCount < 3) {
            type = monsterStandeeData.player2;
          } else if (charCount === 3) {
            type = monsterStandeeData.player3;
          } else {
            type = monsterStandeeData.player4;
          }
        }

        if (!type && !monsterStandeeData.player2 && !monsterStandeeData.player3 && !monsterStandeeData.player4) {
          type = MonsterType.normal;
        }

        if (type === MonsterType.normal) {
          entities.push(...this.applyRoomSpawn(scenarioData, monsterStandeeData, type, section));
        }
      });

      if (this.game.state === GameState.next) {
        this.game.figures.forEach((figure) => {
          if (
            figure instanceof Monster &&
            gameManager.editionManager.isEditionRelevant(scenarioData.edition, figure.edition) &&
            figure.entities.some((entity) => entities.includes(entity))
          ) {
            figure.active = figure.active || !this.game.figures.some((other) => other.active);
            figure.entities.forEach((entity) => {
              if (entities.includes(entity)) {
                entity.active =
                  figure.active || this.game.figures.some((other, index, self) => other.active && index > self.indexOf(figure));
                entity.revealed = true;
              }
            });
          }
        });
      }

      gameManager.specialActionsManager.revealMonsterEntities(entities);
    }
  }

  private openRoomObjectives(roomData: RoomData, scenarioData: ScenarioData, section: boolean) {
    if (roomData.objectives) {
      roomData.objectives.forEach((index) => {
        if (typeof index === 'number' && index > 0) {
          const objectiveIdentifier: ScenarioObjectiveIdentifier = {
            edition: scenarioData.edition,
            scenario: scenarioData.index,
            group: scenarioData.group,
            section: section,
            index: index - 1
          };
          const objective = gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(objectiveIdentifier);
          if (objective) {
            const objectiveContainer = gameManager.objectiveManager.addObjective(objective, undefined, objectiveIdentifier);
            gameManager.objectiveManager.addObjectiveEntity(objectiveContainer);
          }
        } else if (typeof index === 'string' && index.includes(':')) {
          const split = index.split(':');
          const id = +split.splice(0, 1);
          const count = EntityValueFunction(split.join(':'));
          if (id > 0 && count > 0) {
            const objectiveIdentifier: ScenarioObjectiveIdentifier = {
              edition: scenarioData.edition,
              scenario: scenarioData.index,
              group: scenarioData.group,
              section: section,
              index: id - 1
            };
            const objective = gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(objectiveIdentifier);
            if (objective) {
              const objectiveContainer = gameManager.objectiveManager.addObjective(objective, undefined, objectiveIdentifier);
              for (let i = 0; i < count; i++) {
                gameManager.objectiveManager.addObjectiveEntity(objectiveContainer);
              }
            }
          }
        } else if (typeof index === 'string' && index.includes('-')) {
          const split = index.split('-');
          const id = +split[0];
          const marker = split[1];
          if (id > 0 && marker) {
            const objectiveIdentifier: ScenarioObjectiveIdentifier = {
              edition: scenarioData.edition,
              scenario: scenarioData.index,
              group: scenarioData.group,
              section: section,
              index: id - 1
            };
            const objective = gameManager.objectiveManager.objectiveDataByObjectiveIdentifier(objectiveIdentifier);
            if (objective) {
              const objectiveContainer = gameManager.objectiveManager.addObjective(objective, undefined, objectiveIdentifier);
              gameManager.objectiveManager.addObjectiveEntity(objectiveContainer, undefined, undefined, marker);
            }
          }
        }
      });
    }
  }

  applyRoomSpawn(scenarioData: ScenarioData, monsterStandeeData: MonsterStandeeData, type: MonsterType, section: boolean): MonsterEntity[] {
    const entities: MonsterEntity[] = [];
    const monsterName = monsterStandeeData.name.split(':')[0];
    const isAlly =
      (scenarioData.allies && scenarioData.allies.includes(monsterName)) ||
      (section && this.game.scenario && this.game.scenario.allies && this.game.scenario.allies.includes(monsterName)) ||
      false;
    const isAllied =
      (scenarioData.allied && scenarioData.allied.includes(monsterName)) ||
      (section && this.game.scenario && this.game.scenario.allied && this.game.scenario.allied.includes(monsterName)) ||
      false;
    const drawExtra =
      (scenarioData.drawExtra && scenarioData.drawExtra.includes(monsterName)) ||
      (section && this.game.scenario && this.game.scenario.drawExtra && this.game.scenario.drawExtra.includes(monsterName)) ||
      false;
    const monster = gameManager.monsterManager.addMonsterByName(monsterStandeeData.name, scenarioData.edition);
    if (monster) {
      if (settingsManager.settings.standees || !monster.entities.find((entity) => entity.type === type)) {
        const entity = gameManager.monsterManager.spawnMonsterEntity(monster, type, isAlly, isAllied, drawExtra);
        if (entity) {
          if (monsterStandeeData.marker) {
            entity.marker = monsterStandeeData.marker;
          }
          if (monsterStandeeData.tags) {
            entity.tags = monsterStandeeData.tags;
          }
          if (monsterStandeeData.health) {
            entity.health = EntityValueFunction(monsterStandeeData.health);
          }
          if (monsterStandeeData.number) {
            entity.number = monsterStandeeData.number;
          }
          entities.push(entity);
          if (entity.marker || entity.tags.length > 0) {
            gameManager.entityCounterManager.addEntityCount(monster, entity);
          }
        }
      }
    }
    if (monster && monster.editionRules === 'bb') {
      if (entities.length && entities.every((entity) => entity.type === MonsterType.elite) && !monster.tags.includes('bb-elite')) {
        monster.tags.push('bb-elite');
      } else {
        monster.tags = monster.tags.filter((tag) => tag !== 'bb-elite');
      }
    }

    return entities;
  }

  scenarioRunning(): boolean {
    return this.game.state !== GameState.draw || this.game.round > 0;
  }

  hasScenarios(): boolean {
    const editions = this.game.edition
      ? gameManager.editionManager.relevantEditions(this.game.edition, true, false)
      : gameManager.editionManager.editionData.map((editionData) => editionData.edition);
    return editions.some((edition) => this.scenarioData(edition, true).length > 0);
  }

  hasSections(conclusions: boolean = false): boolean {
    const editions = this.game.edition
      ? gameManager.editionManager.relevantEditions(this.game.edition, true, false)
      : settingsManager.settings.editions;
    return gameManager.editionManager.editionData.some(
      (editionData) =>
        editions.includes(editionData.edition) &&
        settingsManager.settings.editions.includes(editionData.edition) &&
        editionData.sections &&
        editionData.sections.some((sectionData) => sectionData.edition === editionData.edition && (conclusions || !sectionData.conclusion))
    );
  }

  scenarioData(edition: string | undefined, all: boolean = false): ScenarioData[] {
    const scenarios = gameManager.editionManager.editionData
      .filter((editionData) => settingsManager.settings.editions.includes(editionData.edition))
      .map((editionData) => editionData.scenarios)
      .flat();

    if (!edition) {
      return scenarios;
    }

    if (all || !this.game.party.campaignMode || !scenarios.some((scenarioData) => scenarioData.initial)) {
      return scenarios.filter((scenarioData) => scenarioData.edition === edition);
    }

    const successSet = new Set(this.game.party.scenarios.map((m) => `${m.edition}:${m.group ?? ''}:${m.index}`));

    const scenarioMap = new Map<string, ScenarioData>();
    scenarios.forEach((s) => scenarioMap.set(`${s.edition}:${s.group ?? ''}:${s.index}`, s));

    const manualSet = new Set(this.game.party.manualScenarios.map((m) => `${m.edition}:${m.group ?? ''}:${m.index}`));

    const unlockedSet = new Set<string>();
    this.game.party.scenarios.forEach((identifier) => {
      const scenario = scenarioMap.get(`${identifier.edition}:${identifier.group ?? ''}:${identifier.index}`);
      if (scenario && scenario.edition === edition && scenario.unlocks) {
        scenario.unlocks.forEach((idx) => unlockedSet.add(`${scenario.group ?? ''}:${idx}`));
      }
    });

    const sectionDataByEdition = new Map<string, ScenarioData[]>();
    this.game.party.conclusions.forEach((identifier) => {
      if (!sectionDataByEdition.has(identifier.edition)) {
        sectionDataByEdition.set(identifier.edition, gameManager.editionManager.sectionData(identifier.edition));
      }
      const conclusionSection = sectionDataByEdition
        .get(identifier.edition)!
        .find(
          (sectionData) =>
            sectionData.index === identifier.index && sectionData.edition === identifier.edition && sectionData.group === identifier.group
        );
      if (conclusionSection && conclusionSection.edition === edition && conclusionSection.unlocks) {
        conclusionSection.unlocks.forEach((idx) => unlockedSet.add(`${conclusionSection.group ?? ''}:${idx}`));
      }
    });

    return scenarios.filter((scenarioData) => {
      if (scenarioData.edition !== edition) {
        return false;
      }

      if (successSet.has(`${scenarioData.edition}:${scenarioData.group ?? ''}:${scenarioData.index}`)) {
        return true;
      }

      if (manualSet.has(`${scenarioData.edition}:${scenarioData.group ?? ''}:${scenarioData.index}`)) {
        return true;
      }

      const unlocked = unlockedSet.has(`${scenarioData.group ?? ''}:${scenarioData.index}`);
      let requires: boolean = !scenarioData.requires || scenarioData.requires.length === 0;

      if (!requires) {
        requires = scenarioData.requires.some((requires) =>
          requires.every((index) => {
            const finishedScenarios = this.game.party.scenarios.filter(
              (model) => model.index === index && gameManager.editionManager.isEditionRelevant(scenarioData.edition, model.edition)
            );

            if (finishedScenarios.length > 1) {
              finishedScenarios.filter((model) => model.group === scenarioData.group);
            }

            if (finishedScenarios.length > 1) {
              finishedScenarios.filter((model) => model.edition === scenarioData.edition);
            }

            return finishedScenarios.length > 0;
          })
        );
      }

      return (unlocked || scenarioData.initial) && requires;
    });
  }

  getSections(scenario: ScenarioData): ScenarioData[] {
    return gameManager.editionManager
      .sectionData()
      .filter(
        (sectionData) =>
          sectionData.edition === scenario.edition && sectionData.parent === scenario.index && sectionData.group === scenario.group
      );
  }

  availableSections(includeConclusions: boolean = false, includeActive: boolean = false): ScenarioData[] {
    if (!this.game.scenario) {
      return [];
    }

    const sections = this.getSections(this.game.scenario)
      .filter(
        (sectionData) =>
          // filter conclusion
          (!sectionData.conclusion || includeConclusions) &&
          // filter already active
          (includeActive ||
            !this.game.sections.find(
              (active) =>
                active.edition === sectionData.edition && active.index === sectionData.index && active.parent === sectionData.parent
            )) &&
          // match parent sections
          (!sectionData.parentSections ||
            sectionData.parentSections.some((parentSections) =>
              parentSections.every((parentSection) => this.game.sections.find((active) => active.index === parentSection))
            )) &&
          // filter blocked
          !this.game.sections.find(
            (active) =>
              active.edition === sectionData.edition && sectionData.blockedSections && sectionData.blockedSections.includes(active.index)
          )
      )
      .sort(this.sortScenarios);

    const additionalSections = this.game.scenario.additionalSections
      .map(
        (index) =>
          this.game.scenario &&
          gameManager.editionManager
            .sectionData(this.game.scenario.edition, true)
            .find((sectionData) => sectionData.group === 'randomMonsterCard' && sectionData.index === index)
      )
      .filter(
        (sectionData) =>
          sectionData && !this.game.sections.find((active) => active.edition === sectionData.edition && active.index === sectionData.index)
      )
      .map((sectionData) => sectionData as ScenarioData);

    return [...additionalSections, ...sections];
  }

  getMonsters(scenario: Scenario, sections: boolean = false, custom: boolean = false): MonsterData[] {
    const monsters: MonsterData[] = [];
    if (custom) {
      monsters.push(...this.game.figures.filter((figure) => figure instanceof Monster).map((figure) => new MonsterData(figure as Monster)));
    } else {
      monsters.push(...this.getScenarioMonster(scenario, sections));
      monsters.push(...this.getRuleMonster(scenario, sections));
    }
    monsters.push(...gameManager.monsterManager.getSpawnMonsters(monsters));
    return monsters;
  }

  getScenarioMonster(scenario: Scenario, allSections: boolean = false): MonsterData[] {
    const data: ScenarioData[] = [];

    data.push(scenario);
    data.push(
      ...gameManager.editionManager
        .sectionData(scenario.edition)
        .filter(
          (sectionData) =>
            sectionData.group === scenario.group &&
            sectionData.parent === scenario.index &&
            (allSections ||
              this.game.sections.find(
                (section) =>
                  section.edition === sectionData.edition && section.group === sectionData.group && section.index === sectionData.index
              ) !== undefined)
        )
    );

    if (scenario.additionalSections) {
      data.push(
        ...gameManager.editionManager
          .sectionData(scenario.edition, true)
          .filter(
            (sectionData) =>
              scenario.additionalSections.includes(sectionData.index) &&
              (allSections ||
                this.game.sections.find(
                  (section) =>
                    section.edition === sectionData.edition && section.group === sectionData.group && section.index === sectionData.index
                ) !== undefined)
          )
      );
    }

    const monsters: MonsterData[] = [];
    data.forEach((scenario) => {
      if (scenario.monsters) {
        scenario.monsters.forEach((name) => {
          const monster = gameManager.editionManager
            .monstersData()
            .find(
              (monsterData) =>
                monsterData.name === name.split(':')[0] &&
                gameManager.editionManager.isEditionRelevant(scenario.edition, monsterData.edition)
            );
          if (monster && !monsters.includes(monster)) {
            monsters.push(monster);
          }
        });
      }
    });

    return monsters;
  }

  getRuleMonster(scenario: Scenario, sections: boolean = false): MonsterData[] {
    const data: ScenarioData[] = [];

    data.push(scenario);
    if (sections) {
      data.push(
        ...gameManager.editionManager
          .sectionData(scenario.edition)
          .filter((sectionData) => sectionData.group === scenario.group && sectionData.parent === scenario.index)
      );

      if (scenario.additionalSections) {
        data.push(
          ...gameManager.editionManager
            .sectionData(scenario.edition, true)
            .filter((sectionData) => scenario.additionalSections.includes(sectionData.index))
        );
      }
    }

    const monsters: MonsterData[] = [];
    data.forEach((scenario) => {
      if (scenario.rules) {
        scenario.rules.forEach((rule) => {
          if (rule.spawns) {
            rule.spawns.forEach((spawn) => {
              const monster = gameManager.editionManager
                .monstersData()
                .find(
                  (monsterData) =>
                    monsterData.name === spawn.monster.name.split(':')[0] &&
                    gameManager.editionManager.isEditionRelevant(scenario.edition, monsterData.edition)
                );
              if (monster && !monsters.includes(monster)) {
                monsters.push(monster);
              }
            });
          }
        });
      }
    });

    return monsters;
  }

  sortScenarios(a: ScenarioData, b: ScenarioData): number {
    if (a.conclusion !== b.conclusion) {
      return a.conclusion ? 1 : -1;
    }

    if (!isNaN(+a.index) && !isNaN(+b.index)) {
      return +a.index - +b.index;
    }

    const aMatch = a.index.match(/(\d+)/);
    const bMatch = b.index.match(/(\d+)/);

    if (aMatch && bMatch) {
      return +aMatch[0] - +bMatch[0];
    }

    return a.index.toLowerCase() < b.index.toLowerCase() ? -1 : 1;
  }

  openRooms(initial: boolean = false): RoomData[] {
    if (!this.game.scenario || !this.game.scenario.rooms) {
      return [];
    }

    return this.game.scenario.rooms.filter(
      (roomData) => this.game.scenario && this.game.scenario.revealedRooms.includes(roomData.roomNumber) && (initial || !roomData.initial)
    );
  }

  closedRooms(): RoomData[] {
    if (!this.game.scenario || !this.game.scenario.rooms) {
      return [];
    }

    return this.game.scenario.rooms.filter(
      (roomData) =>
        this.game.scenario &&
        !this.game.scenario.revealedRooms.includes(roomData.roomNumber) &&
        this.openRooms(true).some((openRoomData) => openRoomData.rooms && openRoomData.rooms.includes(roomData.roomNumber))
    );
  }

  drawRandomScenario(edition: string): ScenarioData | undefined {
    return this.drawRandomScenariosBatch(edition, 1)[0];
  }

  drawRandomScenariosBatch(edition: string, count: number): ScenarioData[] {
    return gameManager.randomManager
      .shuffle(
        gameManager.editionManager
          .scenarioData(edition)
          .filter(
            (scenarioData) =>
              scenarioData.random &&
              !this.game.party.manualScenarios.find(
                (scenarioModel) =>
                  scenarioModel.index === scenarioData.index &&
                  scenarioModel.edition === scenarioData.edition &&
                  scenarioModel.group === scenarioData.group &&
                  !scenarioModel.custom
              ) &&
              !gameManager.scenarioRequirementsManager.isSuccess(scenarioData)
          )
      )
      .slice(0, count);
  }

  drawRandomScenarioSection(edition: string): ScenarioData | undefined {
    return this.drawRandomScenarioSectionsBatch(edition, 1)[0];
  }

  drawRandomScenarioSectionsBatch(edition: string, count: number): ScenarioData[] {
    return gameManager.randomManager
      .shuffle(
        gameManager.editionManager
          .sectionData(edition)
          .filter(
            (scenarioData) =>
              scenarioData.conclusion &&
              scenarioData.random &&
              !this.game.party.conclusions.find(
                (scenarioModel) =>
                  scenarioModel.index === scenarioData.index &&
                  scenarioModel.edition === scenarioData.edition &&
                  scenarioModel.group === scenarioData.group &&
                  !scenarioModel.custom
              ) &&
              !this.game.party.scenarios.find(
                (scenarioModel) =>
                  scenarioModel.index === scenarioData.index &&
                  scenarioModel.edition === scenarioData.edition &&
                  scenarioModel.group === scenarioData.group &&
                  !scenarioModel.custom
              )
          )
      )
      .slice(0, count);
  }

  scenarioUndoArgs(scenario: Scenario | undefined = undefined): string[] {
    scenario = scenario || this.game.scenario;
    if (!scenario) {
      return ['', '', ''];
    }

    return [scenario.index, this.scenarioTitle(scenario), scenario.custom ? 'scenario.custom' : 'data.edition.' + scenario.edition];
  }

  addManualScenario(scenarioData: ScenarioData): boolean {
    const alreadyAvailable = this.scenarioData(scenarioData.edition, false).some(
      (available) =>
        available.edition === scenarioData.edition && available.group === scenarioData.group && available.index === scenarioData.index
    );

    if (alreadyAvailable) {
      return false;
    }

    gameManager.stateManager.before('addManualScenario', ...this.scenarioUndoArgs(new Scenario(scenarioData)));
    this.game.party.manualScenarios.push(new GameScenarioModel(scenarioData.index, scenarioData.edition, scenarioData.group));
    gameManager.stateManager.after();
    return true;
  }

  addManualScenarios(edition: string, group: string | undefined, indices: string[]): string[] {
    const scenarios = this.scenarioData(edition, true).filter((scenarioData) => scenarioData.group === group);
    const failed: string[] = [];

    indices
      .map((index) => index.trim())
      .filter((index) => index.length > 0)
      .forEach((index) => {
        const exact = scenarios.find((scenarioData) => scenarioData.index === index);
        if (exact) {
          this.addManualScenario(exact);
          return;
        }

        // expand plain indices (e.g. "23") into their lettered sub-scenario variants (e.g. "23A", "23B")
        const variants = scenarios.filter(
          (scenarioData) =>
            scenarioData.index.substring(0, scenarioData.index.length - 1) === index &&
            scenarioData.index.substring(scenarioData.index.length - 1).match(/[A-B]/)
        );

        if (variants.length === 0) {
          failed.push(index);
          return;
        }

        variants.forEach((scenarioData) => this.addManualScenario(scenarioData));
      });

    return failed;
  }

  scenarioTitle(scenarioData: ScenarioData | undefined, section: boolean = false): string {
    if (!scenarioData) {
      return section ? 'section' : 'scenario';
    }
    const label =
      'data.' +
      (section ? 'section.title.' : 'scenario.title.') +
      scenarioData.edition +
      '.' +
      (scenarioData.group ? scenarioData.group + '-' : '') +
      scenarioData.index.replaceAll('.', '-');

    if (labelManager.labelExists(label)) {
      return label;
    }

    return section ? '%game.section:' + scenarioData.index + '%' : '#' + scenarioData.index;
  }

  scenarioDataForModel(model: GameScenarioModel): ScenarioData | undefined {
    if (model.isCustom) {
      const scenarioData = new ScenarioData();
      scenarioData.name = model.custom;
      return scenarioData;
    }

    const scenarioData = gameManager.editionManager
      .scenarioData()
      .find(
        (scenarioData) => scenarioData.index === model.index && scenarioData.edition === model.edition && scenarioData.group === model.group
      );
    if (!scenarioData) {
      console.warn('Invalid scenario data:', model);
      return undefined;
    }

    return JSON.parse(JSON.stringify(scenarioData));
  }

  unresolvedScenarioData(model: GameScenarioModel): ScenarioData {
    return Object.assign(new ScenarioData(), { index: model.index, edition: model.edition, group: model.group });
  }

  sectionDataForModel(model: GameScenarioModel): ScenarioData | undefined {
    const sectionData = gameManager.editionManager
      .sectionData()
      .find(
        (sectionData) => sectionData.index === model.index && sectionData.edition === model.edition && sectionData.group === model.group
      );
    if (!sectionData) {
      console.warn('Invalid section data:', model);
      return undefined;
    }

    return JSON.parse(JSON.stringify(sectionData));
  }

  toModel(
    scenarioData: ScenarioData,
    revealedRooms: number[],
    additionalSections: string[],
    custom: boolean = false,
    customName: string = ''
  ): GameScenarioModel {
    return new GameScenarioModel(
      scenarioData.index,
      scenarioData.edition,
      scenarioData.group,
      custom,
      customName,
      JSON.parse(JSON.stringify(revealedRooms)),
      JSON.parse(JSON.stringify(additionalSections))
    );
  }
}
