import { Character } from "../model/Character";
import { MonsterData } from "../model/data/MonsterData";
import { ScenarioObjectiveIdentifier } from "../model/data/ObjectiveData";
import { RoomData } from "../model/data/RoomData";
import { ScenarioData } from "../model/data/ScenarioData";
import { ScenarioRewards } from "../model/data/ScenarioRule";
import { EntityValueFunction } from "../model/Entity";
import { Game, GameState } from "../model/Game";
import { Identifier } from "src/app/game/model/data/Identifier";
import { LootDeckConfig } from "../model/data/Loot";
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
      gameManager.scenarioRulesManager.addScenarioRules(true);
    } else if (!scenario) {
      gameManager.roundManager.resetScenario();
    }
    
    gameManager.stateManager.standeeDialogCanceled = false;
  }

  finishScenario(success: boolean = true, conclusionSection: ScenarioData | undefined, restart: boolean = false, linkedScenario: Scenario | undefined = undefined, casual: boolean = false) {
    const scenario = this.game.scenario;

    const rewards: ScenarioRewards | undefined = scenario && scenario.rewards || conclusionSection && conclusionSection.rewards || undefined;

    if (scenario) {
      if (!gameManager.fhRules() || !casual) {
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

            if (figure.treasures) {
              figure.treasures.forEach((treasure) => {
                if (typeof treasure === 'number') {
                  gameManager.game.party.treasures.push(new Identifier('' + treasure, scenario.edition));
                }
              })
            }
          }
        })
      }

      if (success && !casual) {
        if (rewards) {
          this.game.figures.forEach((figure) => {
            if (figure instanceof Character && !figure.absent) {
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
            }
          })

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

          if (rewards.globalAchievements) {
            this.game.party.globalAchievementsList.push(...rewards.globalAchievements);
          }

          if (rewards.partyAchievements) {
            this.game.party.achievementsList.push(...rewards.partyAchievements);
          }

          if (rewards.lostPartyAchievements) {
            this.game.party.achievementsList = this.game.party.achievementsList.filter((achivement) => rewards && rewards.lostPartyAchievements.indexOf(achivement) == -1);
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
                  this.game.party.unlockedItems.push(new Identifier(i + '', scenario.edition));
                }
              } else {
                this.game.party.unlockedItems.push(new Identifier(item, scenario.edition));
              }
            })
          }
        }

        if (conclusionSection) {
          this.game.party.conclusions.push(new GameScenarioModel(conclusionSection.index, conclusionSection.edition, conclusionSection.group, false, "", []));
        }

        if (gameManager.game.party.campaignMode && !casual) {
          this.game.party.scenarios.push(new GameScenarioModel(scenario.index, scenario.edition, scenario.group, scenario.custom, scenario.custom ? scenario.name : "", scenario.revealedRooms));
          this.game.party.manualScenarios = this.game.party.manualScenarios.filter((identifier) => scenario && (scenario.index != identifier.index || scenario.edition != identifier.edition || scenario.group != identifier.group));
        }
      }
    }

    if (restart) {
      gameManager.scenarioManager.setScenario(scenario);
    } else {
      if (!casual && scenario && gameManager.fhRules() && !linkedScenario) {
        this.game.party.weeks++;
      }

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

  addSection(section: ScenarioData) {
    if (!this.game.sections.some((value) => value.edition == section.edition && value.index == section.index && value.group == section.group)) {
      this.applyScenarioData(section, true);
      if (section.rules) {
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
            monster.isConfederated = scenarioData.confederates && scenarioData.confederates.indexOf(monsterName) != -1 || section && gameManager.game.scenario && gameManager.game.scenario.confederates && gameManager.game.scenario.confederates.indexOf(monsterName) != -1 || false;
            monster.drawExtra = scenarioData.drawExtra && scenarioData.drawExtra.indexOf(monsterName) != -1 || section && gameManager.game.scenario && gameManager.game.scenario.drawExtra && gameManager.game.scenario.drawExtra.indexOf(monsterName) != -1 || false;
          }
        });
      }

      if (scenarioData.objectives) {
        scenarioData.objectives.forEach((objectiveData, index) => {
          const objectiveIdentifier: ScenarioObjectiveIdentifier = { "edition": scenarioData.edition, "scenario": scenarioData.index, "group": scenarioData.group, "section": section, "index": index };
          if (objectiveData.count) {
            const count = EntityValueFunction(objectiveData.count);
            if (typeof count == 'number') {
              for (let i = 0; i < count; i++) {
                gameManager.characterManager.addObjective(objectiveData, undefined, objectiveIdentifier);
              }
            } else {
              gameManager.characterManager.addObjective(objectiveData, undefined, objectiveIdentifier);
            }
          } else {
            gameManager.characterManager.addObjective(objectiveData, undefined, objectiveIdentifier);
          }
        })
      }
    } else {
      scenarioData.rooms.filter((roomData) => roomData.initial).forEach((roomData) => {
        this.openRoom(roomData, scenarioData, section);
      })

      if (!settingsManager.settings.automaticStandees && scenarioData.monsters) {
        scenarioData.monsters.forEach((name) => {
          const monsterName = name.split(':')[0];
          if (!scenarioData.rooms || !scenarioData.rooms.some((roomData) => roomData.monster && roomData.monster.some((standee) => standee.name.split(':')[0] == monsterName))) {
            let monster = gameManager.monsterManager.addMonsterByName(name, scenarioData.edition);
            if (monster) {
              monster.isAlly = scenarioData.allies && scenarioData.allies.indexOf(monsterName) != -1 || section && gameManager.game.scenario && gameManager.game.scenario.allies && gameManager.game.scenario.allies.indexOf(monsterName) != -1 || false;
              monster.isConfederated = scenarioData.confederates && scenarioData.confederates.indexOf(monsterName) != -1 || section && gameManager.game.scenario && gameManager.game.scenario.confederates && gameManager.game.scenario.confederates.indexOf(monsterName) != -1 || false;
              monster.drawExtra = scenarioData.drawExtra && scenarioData.drawExtra.indexOf(monsterName) != -1 || section && gameManager.game.scenario && gameManager.game.scenario.drawExtra && gameManager.game.scenario.drawExtra.indexOf(monsterName) != -1 || false;
            }
          }
        })
      }
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
          gameManager.characterManager.addCharacter(characterData, 1);
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
      if (scenarioData.resetRound == "visible") {
        this.game.roundResets.push(this.game.round + (this.game.state == GameState.draw ? 0 : -1));
      } else {
        this.game.roundResetsHidden.push(this.game.round + (this.game.state == GameState.draw ? 0 : -1));
      }
      this.game.round = this.game.state == GameState.draw ? 0 : 1;
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
          if (settingsManager.settings.disableStandees) {
            gameManager.monsterManager.addMonsterByName(monsterStandeeData.name, scenarioData.edition);
          } else {
            const monsterName = monsterStandeeData.name.split(':')[0];
            const isAlly = scenarioData.allies && scenarioData.allies.indexOf(monsterName) != -1 || section && gameManager.game.scenario && gameManager.game.scenario.allies && gameManager.game.scenario.allies.indexOf(monsterName) != -1 || false;
            const isConfederated = scenarioData.confederates && scenarioData.confederates.indexOf(monsterName) != -1 || section && gameManager.game.scenario && gameManager.game.scenario.confederates && gameManager.game.scenario.confederates.indexOf(monsterName) != -1 || false;
            const drawExtra = scenarioData.drawExtra && scenarioData.drawExtra.indexOf(monsterName) != -1 || section && gameManager.game.scenario && gameManager.game.scenario.drawExtra && gameManager.game.scenario.drawExtra.indexOf(monsterName) != -1 || false;

            const monster = gameManager.monsterManager.addMonsterByName(monsterStandeeData.name, scenarioData.edition);
            if (monster) {
              const entity = gameManager.monsterManager.spawnMonsterEntity(monster, type, isAlly, isConfederated, drawExtra);
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
            gameManager.characterManager.addObjective(objective, undefined, objectiveIdentifier);
          }
        } else if (typeof index == 'string' && index.indexOf(':') != -1) {
          let split = index.split(':');
          const id = +(split.splice(0, 1));
          const count = EntityValueFunction(split.join(':'));
          if (id > 0 && count > 0) {
            const objectiveIdentifier: ScenarioObjectiveIdentifier = { "edition": scenarioData.edition, "scenario": scenarioData.index, "group": scenarioData.group, "section": section, "index": id - 1 };
            const objective = gameManager.objectiveDataByScenarioObjectiveIdentifier(objectiveIdentifier);
            if (objective) {
              for (let i = 0; i < count; i++) {
                gameManager.characterManager.addObjective(objective, undefined, objectiveIdentifier);
              }
            }
          }
        }
      })
    }

    gameManager.scenarioRulesManager.addScenarioRulesRooms();
    gameManager.scenarioRulesManager.addScenarioRulesAlways();
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

      if (scenarioData.initial) {
        return true;
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
        requires = scenarioData.requires.some((requires) => requires.every((require) => this.game.party.scenarios.find((identifier) => identifier.index == require && identifier.group == scenarioData.group && identifier.edition == scenarioData.edition)));
      }

      return unlocked && requires;
    });
  }

  isBlocked(scenarioData: ScenarioData): boolean {
    let blocked = false;
    const editionData = gameManager.editionData.find((editionData) => editionData.edition == scenarioData.edition);
    if (editionData) {
      this.game.party.scenarios.forEach((identifier) => {
        const scenario = editionData.scenarios.find((value) => value.index == identifier.index && value.edition == identifier.edition && value.group == identifier.group);
        if (scenario) {
          if (scenario.blocks && scenario.blocks.indexOf(scenarioData.index) != -1) {
            blocked = true;
          }
        }
      })
    }
    return blocked && this.game.party.campaignMode;
  }

  isLocked(scenarioData: ScenarioData): boolean {
    return this.game.party.campaignMode && scenarioData.requiredAchievements &&
      scenarioData.requiredAchievements && scenarioData.requiredAchievements.every((achivements) =>
        achivements.global && achivements.global.some((achivement) => {
          if (achivement.startsWith('!')) {
            return this.game.party.globalAchievementsList.find((globalAchievement) => globalAchievement.toLowerCase().trim() == achivement.substring(1, achivement.length).toLowerCase().trim());
          } else if (achivement.indexOf(':') != -1) {
            let count = +achivement.split(':')[1];
            this.game.party.globalAchievementsList.forEach((globalAchievement) => {
              if (globalAchievement.toLowerCase().trim() == achivement.split(':')[0].toLowerCase().trim()) {
                count--;
              }
            })
            return count > 0;
          } else {
            return !this.game.party.globalAchievementsList.find((globalAchievement) => globalAchievement.toLowerCase().trim() == achivement.toLowerCase().trim())
          }
        })
        ||
        achivements.party && achivements.party.some((achivement) => {
          if (achivement.startsWith('!')) {
            return this.game.party.achievementsList.find((partyAchievement) => partyAchievement.toLowerCase().trim() == achivement.substring(1, achivement.length).toLowerCase().trim());
          } else if (achivement.indexOf(':') != 0) {
            let count = +achivement.split(':')[1];
            this.game.party.achievementsList.forEach((partyAchievement) => {
              if (partyAchievement.toLowerCase().trim() == achivement.split(':')[0].toLowerCase().trim()) {
                count--;
              }
            })
            return count > 0;
          } else {
            return !this.game.party.achievementsList.find((partyAchievement) => partyAchievement.toLowerCase().trim() == achivement.toLowerCase().trim())
          }
        })) || false;
  }

  availableSections(): ScenarioData[] {
    if (!this.game.scenario) {
      return [];
    }

    return gameManager.sectionData().filter((sectionData) =>
      // match parent
      this.game.scenario && sectionData.edition == this.game.scenario.edition && sectionData.parent == this.game.scenario.index && sectionData.group == this.game.scenario.group
      // filter already active
      && !this.game.sections.find((active) => active.edition == sectionData.edition && active.index == sectionData.index && active.parent == sectionData.parent)
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

  getMonsters(scenarioData: ScenarioData): MonsterData[] {
    let monsters: MonsterData[] = [];
    let data: ScenarioData[] = [];

    data.push(scenarioData);
    data.push(...gameManager.sectionData(scenarioData.edition).filter((sectionData) => sectionData.group == scenarioData.group && sectionData.parent == scenarioData.index));

    data.forEach((scenario) => {
      if (scenario.monsters) {
        scenario.monsters.forEach((name) => {
          const monster = gameManager.monstersData().find((monsterData) => monsterData.name == name.split(':')[0] && (monsterData.edition == scenario.edition || gameManager.editionExtensions(scenario.edition).indexOf(monsterData.edition) != -1));
          if (monster && monsters.indexOf(monster) == -1) {
            monsters.push(monster);
          }
        })
      }

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

    monsters.forEach((monster) => {
      gameManager.monsterManager.getMonsterSpawns(monster).forEach((summon) => {
        if (monsters.indexOf(summon) == -1) {
          monsters.push(summon);
        }
      })
    })

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
