import { Character } from "../model/Character";
import { MonsterData } from "../model/data/MonsterData";
import { ScenarioObjectiveIdentifier } from "../model/data/ObjectiveData";
import { RoomData } from "../model/data/RoomData";
import { ScenarioData, ScenarioRewards } from "../model/data/ScenarioData";
import { EntityValueFunction } from "../model/Entity";
import { Game, GameState } from "../model/Game";
import { CountIdentifier } from "src/app/game/model/data/Identifier";
import { LootDeckConfig, LootType, fullLootDeck } from "../model/data/Loot";
import { Monster } from "../model/Monster";
import { MonsterEntity } from "../model/MonsterEntity";
import { MonsterType } from "../model/data/MonsterType";
import { GameScenarioModel, Scenario } from "../model/Scenario";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class ScenarioManager {

  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  createScenario(): Scenario {
    return new Scenario(new ScenarioData(), [], true);
  }

  getScenario(index: string, edition: string, group: string | undefined): ScenarioData | undefined {
    return gameManager.scenarioData().find((scenarioData) => scenarioData.index == index && scenarioData.edition == edition && scenarioData.group == group);
  }

  setScenario(scenario: Scenario | undefined) {
    this.game.scenario = scenario ? new Scenario(scenario, scenario.revealedRooms, scenario.custom) : undefined;
    if (scenario && !scenario.custom) {
      const scenarioData = gameManager.scenarioData().find((scenarioData) => scenarioData.index == scenario.index && scenarioData.edition == scenario.edition && scenarioData.group == scenario.group);
      if (!scenarioData) {
        console.error("Could not find scenario data!");
        return;
      }
      gameManager.roundManager.resetScenario();
      this.applyScenarioData(scenarioData);

      if (settingsManager.settings.scenarioRules) {
        gameManager.scenarioRulesManager.addScenarioRules(true);
      }
    } else if (!scenario) {
      gameManager.roundManager.resetScenario();
    }

    gameManager.stateManager.standeeDialogCanceled = false;
  }

  finishScenario(scenario: Scenario | undefined, success: boolean = true, conclusionSection: ScenarioData | undefined, restart: boolean = false, linkedScenario: Scenario | undefined = undefined, characterProgress: boolean = true, gainRewards: boolean = true, internal: boolean = false) {
    gameManager.game.finish = undefined;
    if (scenario) {
      let rewards: ScenarioRewards | undefined = scenario.rewards || undefined;
      if (conclusionSection && conclusionSection.rewards) {
        if (!rewards) {
          rewards = conclusionSection.rewards;
        } else {
          Object.assign(rewards, conclusionSection.rewards);
        }
      }
      if (!internal && characterProgress && settingsManager.settings.characterSheet) {
        this.game.figures.forEach((figure) => {
          if (figure instanceof Character && !figure.absent) {
            const scnearioXP: number = success && (!rewards || !rewards.ignoredBonus || rewards.ignoredBonus.indexOf('experience') == -1) ? gameManager.levelManager.experience() : 0;

            gameManager.characterManager.addXP(figure, scnearioXP + figure.experience, !restart && !linkedScenario);

            if ((!rewards || !rewards.ignoredBonus || rewards.ignoredBonus.indexOf('gold') == -1)) {
              figure.progress.gold += figure.loot * gameManager.levelManager.loot();
              if (!restart && figure.lootCards) {
                figure.lootCards.forEach((index) => {
                  gameManager.lootManager.addCharacterLoot(figure, this.game.lootDeck.cards[index]);
                })
              }
            }
          }
        })
      }

      if (success) {
        if (rewards && gainRewards) {
          if (!internal && settingsManager.settings.characterSheet) {
            this.game.figures.forEach((figure) => {
              if (rewards && figure instanceof Character && !figure.absent && settingsManager.settings.scenarioRewards) {
                if (rewards.experience) {
                  gameManager.characterManager.addXP(figure, rewards.experience, !restart && !linkedScenario);
                }

                if (rewards.gold) {
                  figure.progress.gold += rewards.gold;
                }

                if (rewards.perks) {
                  figure.progress.extraPerks += rewards.perks;
                  if (figure.progress.extraPerks < 0) {
                    figure.progress.extraPerks = 0;
                  }
                }

                if (rewards.battleGoals) {
                  figure.progress.battleGoals += rewards.battleGoals;
                  if (figure.progress.battleGoals > 18) {
                    figure.progress.battleGoals = 18;
                  } else if (figure.progress.battleGoals < 0) {
                    figure.progress.battleGoals = 0;
                  }
                }

                if (rewards.resources) {
                  rewards.resources.forEach((item) => {
                    figure.progress.loot[item.type] = (figure.progress.loot[item.type] || 0) + EntityValueFunction(item.value);

                    if ((figure.progress.loot[item.type] || 0) < 0) {
                      figure.progress.loot[item.type] = 0;
                    }
                  })
                }
              }
            })
          }

          if (settingsManager.settings.partySheet) {

            if (rewards.reputation) {
              this.game.party.reputation += rewards.reputation;
              if (this.game.party.reputation > 20) {
                this.game.party.reputation = 20;
              } else if (this.game.party.reputation < -20) {
                this.game.party.reputation = -20;
              }
            }

            if (rewards.prosperity) {
              this.game.party.prosperity += rewards.prosperity;
              if (this.game.party.prosperity > (gameManager.fhRules() ? 132 : 64)) {
                this.game.party.prosperity = (gameManager.fhRules() ? 132 : 64);
              } else if (this.game.party.prosperity < 0) {
                this.game.party.prosperity = 0;
              }
            }

            if (rewards.morale) {
              // TODO: replace Town Guards Placeholder
              this.game.party.morale += EntityValueFunction(rewards.morale);
              if (this.game.party.morale > 20) {
                this.game.party.morale = 20;
              } else if (this.game.party.morale < 0) {
                this.game.party.morale = 0;
              }
            }

            if (rewards.inspiration) {
              this.game.party.inspiration += EntityValueFunction(rewards.inspiration);
              if (this.game.party.inspiration < 0) {
                this.game.party.inspiration = 0;
              }
            }

            if (rewards.reputation) {
              this.game.party.reputation += rewards.reputation;
              if (this.game.party.reputation > 20) {
                this.game.party.reputation = 20;
              } else if (this.game.party.reputation < -20) {
                this.game.party.reputation = -20;
              }
            }

            if (rewards.globalAchievements) {
              this.game.party.globalAchievementsList.push(...rewards.globalAchievements);
            }

            if (rewards.partyAchievements) {
              this.game.party.achievementsList.push(...rewards.partyAchievements);
            }

            if (rewards.lostPartyAchievements) {
              this.game.party.achievementsList = this.game.party.achievementsList.filter((achievement) => rewards && rewards.lostPartyAchievements.indexOf(achievement) == -1);
            }

            if (rewards.campaignSticker) {
              this.game.party.campaignStickers.push(...rewards.campaignSticker.map((sticker) => sticker.toLowerCase().replaceAll(' ', '-')));
            }

            if (rewards.itemDesigns) {
              rewards.itemDesigns.forEach((item) => {
                if (item.indexOf('-') != -1) {
                  const from = +item.split('-')[0];
                  const to = +item.split('-')[1];
                  for (let i = from; i <= to; i++) {
                    const itemData = gameManager.itemManager.getItem(i, scenario.edition, true);
                    if (itemData && (!itemData.unlockScenario || itemData.unlockScenario.edition != scenario.edition || itemData.unlockScenario.name != scenario.index)) {
                      this.game.party.unlockedItems.push(new CountIdentifier(itemData.id + '', scenario.edition));
                    }
                  }
                } else {
                  let itemEdition = scenario.edition;
                  if (item.indexOf(':') != -1) {
                    itemEdition = item.split(':')[1];
                  }
                  const itemData = gameManager.itemManager.getItem(+(item.split(':')[0]), itemEdition, true);
                  if (itemData && (!itemData.unlockScenario || itemData.unlockScenario.edition != scenario.edition || itemData.unlockScenario.name != scenario.index)) {
                    this.game.party.unlockedItems.push(new CountIdentifier(itemData.id + '', itemData.edition));
                  }
                }
              })
            }

            if (rewards.itemBlueprints) {
              rewards.itemBlueprints.forEach((item) => {
                if (item.indexOf('-') != -1) {
                  const from = +item.split('-')[0];
                  const to = +item.split('-')[1];
                  for (let i = from; i <= to; i++) {
                    this.game.party.unlockedItems.push(new CountIdentifier(i + '', scenario.edition));
                  }
                } else {
                  let itemEdition = scenario.edition;
                  if (item.indexOf(':') != -1) {
                    itemEdition = item.split(':')[1];
                  }
                  this.game.party.unlockedItems.push(new CountIdentifier(item, itemEdition));
                }
              })
            }

            if (rewards.collectiveResources) {
              rewards.collectiveResources.forEach((item) => {
                this.game.party.loot[item.type] = (this.game.party.loot[item.type] || 0) + EntityValueFunction(item.value);

                if ((this.game.party.loot[item.type] || 0) < 0) {
                  this.game.party.loot[item.type] = 0;
                }
              })
            }

            if (rewards.calendarSection) {
              rewards.calendarSection.forEach((calendarSection) => {
                if (calendarSection.split('-').length > 1) {
                  const section = calendarSection.split('-')[0];
                  let week = -1;
                  if (!isNaN(+calendarSection.split('-')[1])) {
                    week = gameManager.game.party.weeks + (+calendarSection.split('-')[1]);
                  } else if (calendarSection.split('-')[1].length > 1) {
                    const season = calendarSection.split('-')[1].split(':')[0];
                    const seasonWeek = +calendarSection.split('-')[1].split(':')[1];
                    week = Math.max(gameManager.game.party.weeks - 1, 0) - (Math.max(gameManager.game.party.weeks - 1, 0) % 20) + (season == 'summer' ? 20 : 10) + seasonWeek;
                  }

                  if (week != -1) {
                    if (!gameManager.game.party.weekSections[week]) {
                      gameManager.game.party.weekSections[week] = [];
                    }
                    gameManager.game.party.weekSections[week]?.push(section);
                  }
                }
              })
            }
          }

          if (settingsManager.settings.automaticUnlocking && rewards.unlockCharacter && this.game.unlockedCharacters.indexOf(rewards.unlockCharacter) == -1) {
            this.game.unlockedCharacters.push(rewards.unlockCharacter);
          }

          if (rewards.lootDeckCards) {
            rewards.lootDeckCards.forEach((lootDeckCard) => {
              const loot = fullLootDeck.find((loot) => loot.cardId == lootDeckCard);
              if (loot && (loot.type != LootType.special1 && loot.type != LootType.special2 || gameManager.game.lootDeckFixed.indexOf(loot.type) == -1)) {
                gameManager.game.lootDeckFixed.push(loot.type);
              }

            })
          }
        }

        if (gameManager.characterManager.characterCount() < 4 && !internal && !scenario.solo && gainRewards) {
          this.game.party.inspiration += 4 - gameManager.characterManager.characterCount();
        }

        if (conclusionSection && !this.game.party.conclusions.find((conclusion) => conclusion.index == conclusionSection.index && conclusion.edition == conclusionSection.edition && conclusion.group == conclusionSection.group)) {
          this.game.party.conclusions.push(new GameScenarioModel(conclusionSection.index, conclusionSection.edition, conclusionSection.group));
        }

        if (gameManager.game.party.campaignMode && gainRewards) {
          if (scenario.conclusion) {
            if (!this.game.party.conclusions.find((conclusion) => conclusion.index == scenario.index && conclusion.edition == scenario.edition && conclusion.group == scenario.group)) {
              this.game.party.conclusions.push(new GameScenarioModel(scenario.index, scenario.edition, scenario.group));
            }
          } else {
            this.game.party.scenarios.push(new GameScenarioModel(scenario.index, scenario.edition, scenario.group, scenario.custom, scenario.custom ? scenario.name : "", scenario.revealedRooms));
          }

          if (rewards && settingsManager.settings.partySheet && rewards.townGuardAm && rewards.townGuardAm.length > 0) {
            const townGuardDeck = gameManager.attackModifierManager.buildTownGuardAttackModifierDeck(this.game.party, gameManager.campaignData());
            gameManager.attackModifierManager.shuffleModifiers(townGuardDeck);
            townGuardDeck.active = false;
            this.game.party.townGuardDeck = townGuardDeck.toModel();
          }
        }
      }

      if (restart) {
        gameManager.scenarioManager.setScenario(scenario);
      } else {
        if (scenario && !scenario.conclusion && gameManager.fhRules() && !linkedScenario && settingsManager.settings.partySheet && !internal && gainRewards) {

          if (!scenario.solo) {
            this.game.party.weeks++;
          }

          const editionData = gameManager.editionData.find((editionData) => editionData.edition == scenario.edition);
          let weekSections: string[] = [];
          if (editionData && editionData.campaign) {
            weekSections.push(...editionData.campaign.weeks && editionData.campaign.weeks[this.game.party.weeks] || []);
          }

          weekSections.push(...this.game.party.weekSections[this.game.party.weeks] || []);

          weekSections.forEach((section) => {
            const sectionData = gameManager.sectionData(scenario.edition).find((sectionData) => sectionData.index == section && sectionData.group == scenario.group && sectionData.conclusion);
            if (sectionData) {
              const conclusion = new Scenario(sectionData);
              this.finishScenario(conclusion, true, conclusion, false, undefined, false, gainRewards, true);
            }
          })
        }

        if (success && (!gameManager.game.party.campaignMode || !gainRewards && !conclusionSection)) {
          this.game.party.casualScenarios.push(new GameScenarioModel(scenario.index, scenario.edition, scenario.group, scenario.custom, scenario.custom ? scenario.name : "", scenario.revealedRooms));
        }

        if (!internal) {
          this.game.scenario = undefined;
          this.game.sections = [];
          gameManager.roundManager.resetScenario();


          if (linkedScenario) {
            this.setScenario(linkedScenario);
          } else {
            this.game.figures.forEach((figure) => {
              if (figure instanceof Character) {
                figure.absent = false;
              }
            });
          }
        }
      }
    }
  }

  addSection(section: ScenarioData) {
    if (!this.game.sections.some((value) => value.edition == section.edition && value.index == section.index && value.group == section.group)) {
      this.applyScenarioData(section, true);
      if (settingsManager.settings.scenarioRules && section.rules) {
        section.rules.forEach((rule, index) => {
          if (rule.always) {
            gameManager.scenarioRulesManager.addScenarioRule(section, rule, index, true);
          }
        })

        gameManager.scenarioRulesManager.filterDisabledScenarioRules();
      }
      this.game.sections.push(new Scenario(section, []));

      gameManager.stateManager.standeeDialogCanceled = false;
    }
  }

  applyScenarioData(scenarioData: ScenarioData, section: boolean = false) {
    gameManager.stateManager.standeeDialogCanceled = true;
    if (!settingsManager.settings.scenarioRooms || !scenarioData.rooms || scenarioData.rooms.length == 0) {
      if (scenarioData.monsters) {
        scenarioData.monsters.forEach((name) => {
          const monsterName = name.split(':')[0];
          let monster = gameManager.monsterManager.addMonsterByName(name, scenarioData.edition);
          if (monster) {
            monster.isAlly = scenarioData.allies && scenarioData.allies.indexOf(monsterName) != -1 || section && gameManager.game.scenario && gameManager.game.scenario.allies && gameManager.game.scenario.allies.indexOf(monsterName) != -1 || false;
            monster.isAllied = scenarioData.allied && scenarioData.allied.indexOf(monsterName) != -1 || section && gameManager.game.scenario && gameManager.game.scenario.allied && gameManager.game.scenario.allied.indexOf(monsterName) != -1 || false;
            monster.drawExtra = scenarioData.drawExtra && scenarioData.drawExtra.indexOf(monsterName) != -1 || section && gameManager.game.scenario && gameManager.game.scenario.drawExtra && gameManager.game.scenario.drawExtra.indexOf(monsterName) != -1 || false;
          }
        });
      }

      if (scenarioData.objectives) {
        scenarioData.objectives.forEach((objectiveData, index) => {
          const objectiveIdentifier: ScenarioObjectiveIdentifier = { "edition": scenarioData.edition, "scenario": scenarioData.index, "group": scenarioData.group, "section": section, "index": index };
          gameManager.objectiveManager.addObjective(objectiveData, undefined, objectiveIdentifier);
        })
      }
    } else {
      scenarioData.rooms.filter((roomData) => roomData.initial).forEach((roomData) => {
        this.openRoom(roomData, scenarioData, section);
      })

      if (scenarioData.monsters) {
        let monsters = gameManager.game.figures.filter((figure) => figure instanceof Monster).map((figure) => figure as Monster);
        scenarioData.monsters.forEach((name) => {
          const monsterName = name.split(':')[0];
          const monsterData = gameManager.monstersData(scenarioData.edition).find((monsterData) => monsterData.name == monsterName);
          if (monsterData && !monsters.find((existing) => existing.name == monsterData.name)) {
            monsters.push(new Monster(monsterData));
          }
        });

        scenarioData.monsters.forEach((name) => {
          const monsterName = name.split(':')[0];
          const isRoom = settingsManager.settings.automaticStandees && scenarioData.rooms && scenarioData.rooms.some((roomData) => roomData.monster && roomData.monster.some((standee) => standee.name.split(':')[0] == monsterName));

          const spawns = gameManager.monsterManager.getSpawnMonsters(monsters);

          const isSpawn = settingsManager.settings.interactiveAbilities && spawns.find((monsterData) => monsterData.name == monsterName);

          const isRule = settingsManager.settings.scenarioRules && this.getRuleMonster(scenarioData).find((monsterData) => monsterData.name == monsterName);

          if (!isRoom && !isSpawn && !isRule) {
            let monster = gameManager.monsterManager.addMonsterByName(name, scenarioData.edition);
            if (monster) {
              monster.isAlly = scenarioData.allies && scenarioData.allies.indexOf(monsterName) != -1 || section && gameManager.game.scenario && gameManager.game.scenario.allies && gameManager.game.scenario.allies.indexOf(monsterName) != -1 || false;
              monster.isAllied = scenarioData.allied && scenarioData.allied.indexOf(monsterName) != -1 || section && gameManager.game.scenario && gameManager.game.scenario.allied && gameManager.game.scenario.allied.indexOf(monsterName) != -1 || false;
              monster.drawExtra = scenarioData.drawExtra && scenarioData.drawExtra.indexOf(monsterName) != -1 || section && gameManager.game.scenario && gameManager.game.scenario.drawExtra && gameManager.game.scenario.drawExtra.indexOf(monsterName) != -1 || false;
            }
          }
        })
      }
    }

    if (settingsManager.settings.addAllMonsters) {
      this.getMonsters(scenarioData).forEach((monster) => {
        if (!this.game.figures.find((figure) =>
          figure instanceof MonsterData && figure.name == monster.name && figure.edition == monster.edition)) {
          gameManager.monsterManager.addMonster(monster, this.game.level);
        }
      })
    }

    if (scenarioData.solo) {
      gameManager.game.figures.forEach((figure) => {
        if (figure instanceof Character) {
          if ((figure.name != scenarioData.solo || figure.edition != scenarioData.edition)) {
            figure.absent = true;
          } else {
            figure.absent = false;
          }
        }
      });

      if (!gameManager.game.figures.some((figure) => figure instanceof Character && figure.name == scenarioData.solo && figure.edition == scenarioData.edition)) {
        const characterData = gameManager.charactersData().find((characterData) => characterData.name == scenarioData.solo && characterData.edition == scenarioData.edition);
        if (characterData) {
          gameManager.characterManager.addCharacter(characterData, 5);
        } else {
          console.error("Solo Scenario Character not found: '" + scenarioData.solo + "' (" + scenarioData.name + ")");
        }
      }
    }

    if (scenarioData.lootDeckConfig) {
      let lootDeckConfig: LootDeckConfig = JSON.parse(JSON.stringify(scenarioData.lootDeckConfig));
      this.game.lootDeckFixed.forEach((lootType) => {
        lootDeckConfig[lootType] = 1;
      })
      gameManager.lootManager.apply(this.game.lootDeck, lootDeckConfig);
    }

    if (scenarioData.resetRound) {
      const offset = scenarioData.resetRound.endsWith("Keep") && (this.game.state == GameState.next && this.game.round % 2 == 0 || this.game.state == GameState.draw && this.game.round % 2 == 1) ? 1 : 0;
      if (scenarioData.resetRound == "visible" || scenarioData.resetRound == "visibleKeep") {
        this.game.roundResets.push(this.game.round + (this.game.state == GameState.draw ? 0 : -1) - offset);
      } else {
        this.game.roundResetsHidden.push(this.game.round + (this.game.state == GameState.draw ? 0 : -1) - offset);
      }
      this.game.round = (this.game.state == GameState.draw ? 0 : 1) + offset;
    }
  }

  openRoom(roomData: RoomData, scenarioData: ScenarioData, section: boolean) {
    if (this.game.scenario) {
      this.game.scenario.revealedRooms = this.game.scenario.revealedRooms || [];
      this.game.scenario.revealedRooms.push(roomData.roomNumber);
    }

    if (roomData.monster) {
      let entities: MonsterEntity[] = [];
      roomData.monster.forEach((monsterStandeeData) => {
        let type: MonsterType | undefined = monsterStandeeData.type;

        if (!type) {
          const charCount = gameManager.characterManager.characterCount();
          if (charCount < 3) {
            type = monsterStandeeData.player2;
          } else if (charCount == 3) {
            type = monsterStandeeData.player3;
          } else {
            type = monsterStandeeData.player4;
          }
        }

        if (type) {
          const monsterName = monsterStandeeData.name.split(':')[0];
          const isAlly = scenarioData.allies && scenarioData.allies.indexOf(monsterName) != -1 || section && gameManager.game.scenario && gameManager.game.scenario.allies && gameManager.game.scenario.allies.indexOf(monsterName) != -1 || false;
          const isAllied = scenarioData.allied && scenarioData.allied.indexOf(monsterName) != -1 || section && gameManager.game.scenario && gameManager.game.scenario.allied && gameManager.game.scenario.allied.indexOf(monsterName) != -1 || false;
          const drawExtra = scenarioData.drawExtra && scenarioData.drawExtra.indexOf(monsterName) != -1 || section && gameManager.game.scenario && gameManager.game.scenario.drawExtra && gameManager.game.scenario.drawExtra.indexOf(monsterName) != -1 || false;
          const monster = gameManager.monsterManager.addMonsterByName(monsterStandeeData.name, scenarioData.edition);
          if (monster) {
            if (settingsManager.settings.standees || !monster.entities.find((entity) => entity.type == type)) {
              const entity = gameManager.monsterManager.spawnMonsterEntity(monster, type, isAlly, isAllied, drawExtra);
              if (entity) {
                if (monsterStandeeData.marker) {
                  entity.marker = monsterStandeeData.marker;
                }
                if (monsterStandeeData.tags) {
                  entity.tags = monsterStandeeData.tags;
                }
                if (monsterStandeeData.health) {
                  entity.health = EntityValueFunction(monsterStandeeData.health)
                }
                entities.push(entity);
                if (entity.marker || entity.tags.length > 0) {
                  gameManager.addEntityCount(monster, entity);
                }
              }
            }
          }
        }
      })

      if (this.game.state == GameState.next) {
        this.game.figures.forEach((figure) => {
          if (figure instanceof Monster && (figure.edition == scenarioData.edition || gameManager.editionExtensions(scenarioData.edition).indexOf(figure.edition) != -1) && figure.entities.some((entity) => entities.indexOf(entity) != -1)) {
            figure.active = figure.active || !this.game.figures.some((other) => other.active);
            figure.entities.forEach((entity) => {
              if (entities.indexOf(entity) != -1) {
                entity.active = figure.active || gameManager.game.figures.some((other, index, self) => other.active && index > self.indexOf(figure));
                entity.revealed = true;
              }
            })
          }
        })
      }
    }

    if (roomData.objectives) {
      roomData.objectives.forEach((index) => {
        if (typeof index == 'number' && index > 0) {
          const objectiveIdentifier: ScenarioObjectiveIdentifier = { "edition": scenarioData.edition, "scenario": scenarioData.index, "group": scenarioData.group, "section": section, "index": index - 1 };
          const objective = gameManager.objectiveDataByScenarioObjectiveIdentifier(objectiveIdentifier);
          if (objective) {
            gameManager.objectiveManager.addObjective(objective, undefined, objectiveIdentifier);
          }
        } else if (typeof index == 'string' && index.indexOf(':') != -1) {
          let split = index.split(':');
          const id = +(split.splice(0, 1));
          const count = EntityValueFunction(split.join(':'));
          if (id > 0 && count > 0) {
            const objectiveIdentifier: ScenarioObjectiveIdentifier = { "edition": scenarioData.edition, "scenario": scenarioData.index, "group": scenarioData.group, "section": section, "index": id - 1 };
            const objective = gameManager.objectiveDataByScenarioObjectiveIdentifier(objectiveIdentifier);
            if (objective) {
              const objectiveContainer = gameManager.objectiveManager.addObjective(objective, undefined, objectiveIdentifier);
              for (let i = 0; i < count - 1; i++) {
                gameManager.objectiveManager.addObjectiveEntity(objectiveContainer);
              }
            }
          }
        }
      })
    }
  }

  scenarioData(edition: string | undefined, all: boolean = false): ScenarioData[] {
    const scenarios = gameManager.editionData.filter((editionData) => settingsManager.settings.editions.indexOf(editionData.edition) != -1).map((editionData) => editionData.scenarios).flat();

    if (!edition) {
      return scenarios;
    }

    if (all || !this.game.party.campaignMode || !scenarios.some((scenarioData) => scenarioData.initial)) {
      return scenarios.filter((scenarioData) => scenarioData.edition == edition);
    }

    return scenarios.filter((scenarioData) => {

      if (scenarioData.edition != edition) {
        return false;
      }

      if (this.game.party.scenarios.find((identifier) => scenarioData.index == identifier.index && scenarioData.edition == identifier.edition && scenarioData.group == identifier.group)) {
        return true;
      }

      if (this.game.party.manualScenarios.find((identifier) => scenarioData.index == identifier.index && scenarioData.edition == identifier.edition && scenarioData.group == identifier.group)) {
        return true;
      }

      let unlocked: boolean = false;
      let requires: boolean = !scenarioData.requires || scenarioData.requires.length == 0;

      this.game.party.scenarios.forEach((identifier) => {
        const scenario = scenarios.find((scenarioData) => scenarioData.index == identifier.index && scenarioData.edition == identifier.edition && scenarioData.group == identifier.group);

        if (scenario && scenario.edition == scenarioData.edition && scenario.group == scenarioData.group && scenario.unlocks && scenario.unlocks.indexOf(scenarioData.index) != -1) {
          unlocked = true;
        }
      })

      this.game.party.conclusions.forEach((identifier) => {
        const conclusionSection = gameManager.sectionData(identifier.edition).find((sectionData) => sectionData.index == identifier.index && sectionData.edition == identifier.edition && sectionData.group == identifier.group);

        if (conclusionSection && conclusionSection.edition == scenarioData.edition && conclusionSection.group == scenarioData.group && conclusionSection.unlocks && conclusionSection.unlocks.indexOf(scenarioData.index) != -1) {
          unlocked = true;
        }
      })

      if (!requires) {
        requires = scenarioData.requires.some((requires) => requires.every((index) => {
          let finishedScenarios = this.game.party.scenarios.filter((model) => model.index == index && (model.edition == scenarioData.edition || gameManager.editionExtensions(scenarioData.edition).indexOf(model.edition) != -1));

          if (finishedScenarios.length > 1) {
            finishedScenarios.filter((model) => model.group == scenarioData.group);
          }

          if (finishedScenarios.length > 1) {
            finishedScenarios.filter((model) => model.edition == scenarioData.edition);
          }

          return finishedScenarios.length > 0;
        }));
      }

      return (unlocked || scenarioData.initial) && requires;
    });
  }

  isBlocked(scenarioData: ScenarioData): boolean {
    let blocked = false;

    let finishedScenarios = gameManager.scenarioData().filter((other) => (scenarioData.edition == other.edition || gameManager.editionExtensions(scenarioData.edition).indexOf(other.edition)) && other.group == scenarioData.group && other.blocks && other.blocks.indexOf(scenarioData.index) != -1 && this.game.party.scenarios.find((finishedScenario) => finishedScenario.edition == other.edition && finishedScenario.group == other.group && finishedScenario.index == other.index));

    if (finishedScenarios.length > 1) {
      finishedScenarios.filter((model) => model.group == scenarioData.group);
    }

    if (finishedScenarios.length > 1) {
      finishedScenarios.filter((model) => model.edition == scenarioData.edition);
    }

    blocked = finishedScenarios.length > 0;

    return blocked && this.game.party.campaignMode;
  }

  isLocked(scenarioData: ScenarioData): boolean {
    return this.game.party.campaignMode && scenarioData.requirements &&
      scenarioData.requirements.length > 0 && scenarioData.requirements.every((requirement) =>
        requirement.global && requirement.global.some((achievement) => {
          if (achievement.startsWith('!')) {
            return this.game.party.globalAchievementsList.find((globalAchievement) => globalAchievement.toLowerCase().trim() == achievement.substring(1, achievement.length).toLowerCase().trim());
          } else if (achievement.indexOf(':') != -1 && (!isNaN(+achievement.split(':')[1]))) {
            let count = +achievement.split(':')[1];
            this.game.party.globalAchievementsList.forEach((globalAchievement) => {
              if (globalAchievement.toLowerCase().trim() == achievement.split(':')[0].toLowerCase().trim()) {
                count--;
              }
            })
            return count > 0;
          } else {
            return !this.game.party.globalAchievementsList.find((globalAchievement) => globalAchievement.toLowerCase().trim() == achievement.toLowerCase().trim())
          }
        })
        ||
        requirement.party && requirement.party.some((achievement) => {
          if (achievement.startsWith('!')) {
            return this.game.party.achievementsList.find((partyAchievement) => partyAchievement.toLowerCase().trim() == achievement.substring(1, achievement.length).toLowerCase().trim());
          } else if (achievement.indexOf(':') != -1 && (!isNaN(+achievement.split(':')[1]))) {
            let count = +achievement.split(':')[1];
            this.game.party.achievementsList.forEach((partyAchievement) => {
              if (partyAchievement.toLowerCase().trim() == achievement.split(':')[0].toLowerCase().trim()) {
                count--;
              }
            })
            return count > 0;
          } else {
            return !this.game.party.achievementsList.find((partyAchievement) => partyAchievement.toLowerCase().trim() == achievement.toLowerCase().trim())
          }
        })
        ||
        requirement.campaignSticker && requirement.campaignSticker.some((achievement) => {
          if (achievement.startsWith('!')) {
            return this.game.party.campaignStickers.find((campaignSticker) => campaignSticker.toLowerCase().replaceAll(' ', '-').trim() == achievement.substring(1, achievement.length).toLowerCase().trim());
          } else if (achievement.indexOf(':') != -1 && (!isNaN(+achievement.split(':')[1]))) {
            let count = +achievement.split(':')[1];
            this.game.party.campaignStickers.forEach((campaignSticker) => {
              if (campaignSticker.toLowerCase().replaceAll(' ', '-').trim() == achievement.split(':')[0].toLowerCase().trim()) {
                count--;
              }
            })
            return count > 0;
          } else {
            return !this.game.party.campaignStickers.find((campaignSticker) => campaignSticker.toLowerCase().replaceAll(' ', '-').trim() == achievement.toLowerCase().trim())
          }
        })
        ||
        requirement.buildings && requirement.buildings.some((achievement) => {
          if (achievement.startsWith('!')) {
            return this.game.party.buildings.find((buildingModel) => buildingModel.name.toLowerCase().trim() == achievement.substring(1, achievement.length).toLowerCase().trim() && buildingModel.level > 0);
          } else if (achievement.indexOf(':') != -1 && (!isNaN(+achievement.split(':')[1]))) {
            let level = +achievement.split(':')[1];
            return !this.game.party.buildings.find((buildingModel) => buildingModel.name.toLowerCase().trim() == achievement.substring(1, achievement.length).toLowerCase().trim() && buildingModel.level >= level)
          } else {
            return !this.game.party.buildings.find((buildingModel) => buildingModel.name.toLowerCase().trim() == achievement.toLowerCase().trim() && buildingModel.level > 0)
          }
        })) ||
      scenarioData.solo && !this.game.figures.find((figure) => figure instanceof Character && figure.name == scenarioData.solo && figure.level >= 5) || false;
  }

  getSections(scenario: ScenarioData): ScenarioData[] {
    return gameManager.sectionData().filter((sectionData) => sectionData.edition == scenario.edition && sectionData.parent == scenario.index && sectionData.group == scenario.group)
  }

  availableSections(includeConclusions: boolean = false, includeActive: boolean = false): ScenarioData[] {
    if (!this.game.scenario) {
      return [];
    }

    return this.getSections(this.game.scenario).filter((sectionData) =>
      // filter conclusion
      (!sectionData.conclusion || includeConclusions)
      // filter already active
      && (includeActive || !this.game.sections.find((active) => active.edition == sectionData.edition && active.index == sectionData.index && active.parent == sectionData.parent))
      // match parent sections
      && (!sectionData.parentSections || sectionData.parentSections.some((parentSections) => parentSections.every((parentSection) => this.game.sections.find((active) => active.index == parentSection))))
      // filter blocked
      && !this.game.sections.find((active) => active.edition == sectionData.edition && sectionData.blockedSections && sectionData.blockedSections.indexOf(active.index) != -1)).sort(this.sortScenarios);
  }

  getTreasures(scenario: Scenario, sections: Scenario[], unlooted: boolean = false): ('G' | number)[] {
    let treasures: ('G' | number)[] = [];
    if (scenario.rooms && scenario.revealedRooms) {
      scenario.revealedRooms.forEach((roomNumber) => {
        const room = scenario.rooms.find((room) => room.roomNumber == roomNumber);
        if (room && room.treasures) {
          treasures.push(...room.treasures);
        }
      })
    }

    sections.forEach((section) => {
      if (section.rooms && section.revealedRooms) {
        section.revealedRooms.forEach((roomNumber) => {
          const room = section.rooms.find((room) => room.roomNumber == roomNumber)
          if (room && room.treasures) {
            treasures.push(...room.treasures);
          }
        })
      }
    })

    treasures = treasures.filter((treasure, index) => !unlooted || !gameManager.game.figures.some((figure) => figure instanceof Character &&
      gameManager.lootManager.hasTreasure(figure, treasure, index)));

    if (unlooted) {
      treasures = treasures.filter((treasure) => !gameManager.game.party.treasures.find((identifier) => identifier.name == '' + treasure && identifier.edition == scenario.edition));
    }

    return treasures;
  }

  getAllTreasures(scenario: ScenarioData): ('G' | number)[] {
    let treasures: ('G' | number)[] = [];
    if (scenario.rooms) {
      scenario.rooms.forEach((room) => {
        if (room.treasures) {
          treasures.push(...room.treasures);
        }
      })
    }

    this.getSections(scenario).forEach((section) => {
      if (section.rooms) {
        section.rooms.forEach((room) => {
          if (room.treasures) {
            treasures.push(...room.treasures);
          }
        })
      }
    })

    return treasures;
  }

  getMonsters(scenarioData: ScenarioData, custom: boolean = false): MonsterData[] {
    let monsters: MonsterData[] = [];
    if (custom) {
      monsters.push(...gameManager.game.figures.filter((figure) => figure instanceof Monster).map((figure) => new MonsterData(figure as Monster)));
    } else {
      monsters.push(...this.getScenarioMonster(scenarioData, true));
      monsters.push(...this.getRuleMonster(scenarioData, true));
    }
    monsters.push(...gameManager.monsterManager.getSpawnMonsters(monsters));
    return monsters;
  }

  getScenarioMonster(scenarioData: ScenarioData, sections: boolean = false): MonsterData[] {
    let data: ScenarioData[] = [];

    data.push(scenarioData);
    if (sections) {
      data.push(...gameManager.sectionData(scenarioData.edition).filter((sectionData) => sectionData.group == scenarioData.group && sectionData.parent == scenarioData.index));
    }

    let monsters: MonsterData[] = [];
    data.forEach((scenario) => {
      if (scenario.monsters) {
        scenario.monsters.forEach((name) => {
          const monster = gameManager.monstersData().find((monsterData) => monsterData.name == name.split(':')[0] && (monsterData.edition == scenario.edition || gameManager.editionExtensions(scenario.edition).indexOf(monsterData.edition) != -1));
          if (monster && monsters.indexOf(monster) == -1) {
            monsters.push(monster);
          }
        })
      }
    });

    return monsters;
  }

  getRuleMonster(scenarioData: ScenarioData, sections: boolean = false): MonsterData[] {
    let data: ScenarioData[] = [];

    data.push(scenarioData);
    if (sections) {
      data.push(...gameManager.sectionData(scenarioData.edition).filter((sectionData) => sectionData.group == scenarioData.group && sectionData.parent == scenarioData.index));
    }

    let monsters: MonsterData[] = [];
    data.forEach((scenario) => {
      if (scenario.rules) {
        scenario.rules.forEach((rule) => {
          if (rule.spawns) {
            rule.spawns.forEach((spawn) => {
              const monster = gameManager.monstersData().find((monsterData) => monsterData.name == spawn.monster.name.split(':')[0] && (monsterData.edition == scenario.edition || gameManager.editionExtensions(scenario.edition).indexOf(monsterData.edition) != -1));
              if (monster && monsters.indexOf(monster) == -1) {
                monsters.push(monster);
              }
            })
          }
        })
      }
    });

    return monsters;
  }

  sortScenarios(a: ScenarioData, b: ScenarioData): number {
    if (a.conclusion != b.conclusion) {
      return a.conclusion ? 1 : -1;
    }

    if (!isNaN(+a.index) && !isNaN(+b.index)) {
      return +a.index - +b.index;
    }

    const aMatch = a.index.match(/(\d+)/);
    const bMatch = b.index.match(/(\d+)/);

    if (aMatch && bMatch) {
      return +(aMatch[0]) - +(bMatch[0]);
    }

    return a.index.toLowerCase() < b.index.toLowerCase() ? -1 : 1
  }

  openRooms(initial: boolean = false): RoomData[] {
    if (!this.game.scenario || !this.game.scenario.rooms) {
      return [];
    }

    return this.game.scenario.rooms.filter((roomData) => this.game.scenario && this.game.scenario.revealedRooms.indexOf(roomData.roomNumber) != -1 && (initial || !roomData.initial));
  }

  closedRooms(): RoomData[] {
    if (!this.game.scenario || !this.game.scenario.rooms) {
      return [];
    }

    return this.game.scenario.rooms.filter((roomData) => this.game.scenario && this.game.scenario.revealedRooms.indexOf(roomData.roomNumber) == -1 && this.openRooms(true).some((openRoomData) => openRoomData.rooms && openRoomData.rooms.indexOf(roomData.roomNumber) != -1));
  }

  drawRandomScenario(edition: string): ScenarioData | undefined {
    let availableScenarios = gameManager.scenarioData(edition).filter((scenarioData) => scenarioData.random && !gameManager.game.party.manualScenarios.find((scenarioModel) => scenarioModel.index == scenarioData.index && scenarioModel.edition == scenarioData.edition && scenarioModel.group == scenarioData.group && !scenarioModel.custom) && !gameManager.game.party.scenarios.find((scenarioModel) => scenarioModel.index == scenarioData.index && scenarioModel.edition == scenarioData.edition && scenarioModel.group == scenarioData.group && !scenarioModel.custom));
    let scenarioData: ScenarioData | undefined = undefined;
    if (availableScenarios.length > 0) {
      scenarioData = availableScenarios[Math.floor(Math.random() * availableScenarios.length)];
    }
    return scenarioData;
  }

  drawRandomScenarioSection(edition: string): ScenarioData | undefined {
    let availableSections = gameManager.sectionData(edition).filter((scenarioData) => scenarioData.conclusion && scenarioData.random && !gameManager.game.party.conclusions.find((scenarioModel) => scenarioModel.index == scenarioData.index && scenarioModel.edition == scenarioData.edition && scenarioModel.group == scenarioData.group && !scenarioModel.custom) && !gameManager.game.party.scenarios.find((scenarioModel) => scenarioModel.index == scenarioData.index && scenarioModel.edition == scenarioData.edition && scenarioModel.group == scenarioData.group && !scenarioModel.custom));
    let scenarioData: ScenarioData | undefined = undefined;
    if (availableSections.length > 0) {
      scenarioData = availableSections[Math.floor(Math.random() * availableSections.length)];
    }
    return scenarioData;
  }

  scenarioUndoArgs(scenario: Scenario | undefined = undefined): string[] {
    scenario = scenario || gameManager.game.scenario;
    if (!scenario) {
      return ["", "", ""];
    }

    return [scenario.index, "data.scenario." + scenario.name, scenario.custom ? 'scenario.custom' : 'data.edition.' + scenario.edition];
  }

  scenarioDataForModel(model: GameScenarioModel): ScenarioData | undefined {
    if (model.isCustom) {
      const scenarioData = new ScenarioData();
      scenarioData.name = model.custom;
      return scenarioData;
    }

    const scenarioData = gameManager.scenarioData().find((scenarioData) => scenarioData.index == model.index && scenarioData.edition == model.edition && scenarioData.group == model.group);
    if (!scenarioData) {
      console.warn("Invalid scenario data:", model);
      return undefined;
    }

    return JSON.parse(JSON.stringify(scenarioData));
  }

  sectionDataForModel(model: GameScenarioModel): ScenarioData | undefined {
    const sectionData = gameManager.sectionData().find((sectionData) => sectionData.index == model.index && sectionData.edition == model.edition && sectionData.group == model.group);
    if (!sectionData) {
      console.warn("Invalid section data:", model);
      return undefined;
    }

    return JSON.parse(JSON.stringify(sectionData));
  }

  toModel(scenarioData: ScenarioData, revealedRooms: number[], custom: boolean = false, customName: string = ""): GameScenarioModel {
    return new GameScenarioModel(scenarioData.index, scenarioData.edition, scenarioData.group, custom, customName, JSON.parse(JSON.stringify(revealedRooms)));
  }
}
