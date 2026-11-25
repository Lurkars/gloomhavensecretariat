import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Game } from 'src/app/game/model/Game';
import { ScenarioMissingRequirements } from 'src/app/game/model/Scenario';

export class ScenarioRequirementsManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  isCurrent(scenarioData: ScenarioData): boolean {
    return (
      this.game.scenario !== undefined &&
      this.game.scenario.edition === scenarioData.edition &&
      this.game.scenario.index === scenarioData.index &&
      this.game.scenario.group === scenarioData.group &&
      this.game.scenario.solo === scenarioData.solo
    );
  }

  isSuccess(scenarioData: ScenarioData): boolean {
    return (
      this.game.party.scenarios &&
      this.game.party.scenarios.find(
        (scenarioModel) =>
          scenarioModel.edition === scenarioData.edition &&
          scenarioModel.group === scenarioData.group &&
          scenarioModel.index === scenarioData.index
      ) !== undefined
    );
  }

  isBlocked(scenarioData: ScenarioData): boolean {
    const finishedScenarios = this.game.party.scenarios
      .filter((model) => model.edition === scenarioData.edition && model.group === scenarioData.group)
      .map((model) => gameManager.scenarioManager.getScenario(model.index, model.edition, model.group));

    const finishedConclusions = this.game.party.conclusions
      .filter((model) => model.edition === scenarioData.edition && model.group === scenarioData.group)
      .map((model) => gameManager.scenarioManager.getSection(model.index, model.edition, model.group, true));

    return (
      finishedScenarios.some((other) => other && other.blocks && other.blocks.includes(scenarioData.index) && this.isSuccess(other)) ||
      finishedConclusions.some((other) => other && other.blocks && other.blocks.includes(scenarioData.index))
    );
  }

  // whether any present character has the given trait (or class, e.g. 'human')
  hasTrait(trait: string): boolean {
    trait = trait.toLowerCase();
    return this.game.figures.some(
      (figure) =>
        figure instanceof Character &&
        !figure.absent &&
        (figure.traits.some((value) => value.toLowerCase() === trait) || ('' + figure.characterClass).toLowerCase() === trait)
    );
  }

  // scenario requirement: scenario is completed, or not completed if prefixed with '!'
  scenarioRequirementMet(index: string, scenarioData: ScenarioData): boolean {
    const negate = index.startsWith('!');
    if (negate) {
      index = index.substring(1, index.length);
    }
    const completed = this.game.party.scenarios.some(
      (model) => model.index === index && model.edition === scenarioData.edition && model.group === scenarioData.group
    );
    return negate ? !completed : completed;
  }

  isLocked(scenarioData: ScenarioData): boolean {
    return (
      (this.game.party.campaignMode &&
        scenarioData.requirements &&
        scenarioData.requirements.length > 0 &&
        scenarioData.requirements.every(
          (requirement) =>
            (requirement.global &&
              requirement.global.some((achievement) => {
                if (achievement.startsWith('!')) {
                  return this.game.party.globalAchievementsList.find(
                    (globalAchievement) =>
                      globalAchievement.toLowerCase().trim() === achievement.substring(1, achievement.length).toLowerCase().trim()
                  );
                } else if (achievement.includes(':') && !isNaN(+achievement.split(':')[1])) {
                  let count = +achievement.split(':')[1];
                  this.game.party.globalAchievementsList.forEach((globalAchievement) => {
                    if (globalAchievement.toLowerCase().trim() === achievement.split(':')[0].toLowerCase().trim()) {
                      count--;
                    }
                  });
                  return count > 0;
                } else {
                  return !this.game.party.globalAchievementsList.find(
                    (globalAchievement) => globalAchievement.toLowerCase().trim() === achievement.toLowerCase().trim()
                  );
                }
              })) ||
            (requirement.party &&
              requirement.party.some((achievement) => {
                if (achievement.startsWith('!')) {
                  return this.game.party.achievementsList.find(
                    (partyAchievement) =>
                      partyAchievement.toLowerCase().trim() === achievement.substring(1, achievement.length).toLowerCase().trim()
                  );
                } else if (achievement.includes(':') && !isNaN(+achievement.split(':')[1])) {
                  let count = +achievement.split(':')[1];
                  this.game.party.achievementsList.forEach((partyAchievement) => {
                    if (partyAchievement.toLowerCase().trim() === achievement.split(':')[0].toLowerCase().trim()) {
                      count--;
                    }
                  });
                  return count > 0;
                } else {
                  return !this.game.party.achievementsList.find(
                    (partyAchievement) => partyAchievement.toLowerCase().trim() === achievement.toLowerCase().trim()
                  );
                }
              })) ||
            (requirement.campaignSticker &&
              requirement.campaignSticker.some((achievement) => {
                if (achievement.startsWith('!')) {
                  return this.game.party.campaignStickers.find(
                    (campaignSticker) =>
                      campaignSticker.toLowerCase().replaceAll(' ', '-').trim() ==
                      achievement.substring(1, achievement.length).toLowerCase().trim()
                  );
                } else if (achievement.includes(':') && !isNaN(+achievement.split(':')[1])) {
                  let count = +achievement.split(':')[1];
                  this.game.party.campaignStickers.forEach((campaignSticker) => {
                    if (campaignSticker.toLowerCase().replaceAll(' ', '-').trim() === achievement.split(':')[0].toLowerCase().trim()) {
                      count--;
                    }
                  });
                  return count > 0;
                } else {
                  return !this.game.party.campaignStickers.find(
                    (campaignSticker) => campaignSticker.toLowerCase().replaceAll(' ', '-').trim() === achievement.toLowerCase().trim()
                  );
                }
              })) ||
            (requirement.buildings &&
              requirement.buildings.some((achievement) => {
                if (achievement.startsWith('!')) {
                  return this.game.party.buildings.find(
                    (buildingModel) =>
                      buildingModel.name.toLowerCase().trim() === achievement.substring(1, achievement.length).toLowerCase().trim() &&
                      buildingModel.level > 0
                  );
                } else if (achievement.includes(':') && !isNaN(+achievement.split(':')[1])) {
                  const level = +achievement.split(':')[1];
                  return !this.game.party.buildings.find(
                    (buildingModel) =>
                      buildingModel.name.toLowerCase().trim() === achievement.substring(1, achievement.length).toLowerCase().trim() &&
                      buildingModel.level >= level
                  );
                } else {
                  return !this.game.party.buildings.find(
                    (buildingModel) =>
                      buildingModel.name.toLowerCase().trim() === achievement.toLowerCase().trim() && buildingModel.level > 0
                  );
                }
              })) ||
            (requirement.characters &&
              requirement.characters.some((character) => {
                if (character.startsWith('!')) {
                  return this.game.figures.find(
                    (figure) =>
                      figure instanceof Character &&
                      figure.name.toLowerCase().trim() === character.substring(1, character.length).toLowerCase().trim()
                  );
                } else {
                  return !this.game.figures.find(
                    (figure) => figure instanceof Character && figure.name.toLowerCase().trim() === character.toLowerCase().trim()
                  );
                }
              })) ||
            (requirement.traits &&
              requirement.traits.some((trait) =>
                trait.startsWith('!') ? this.hasTrait(trait.substring(1, trait.length)) : !this.hasTrait(trait)
              )) ||
            (requirement.scenarios &&
              requirement.scenarios.every((scenarios) => scenarios.some((index) => !this.scenarioRequirementMet(index, scenarioData))))
        )) ||
      (scenarioData.solo &&
        !this.game.figures.find(
          (figure) => figure instanceof Character && figure.name === scenarioData.solo && (gameManager.bbRules() || figure.level >= 5)
        )) ||
      false
    );
  }

  getRequirements(scenarioData: ScenarioData, all: boolean = false): ScenarioMissingRequirements[] {
    const missingRequirements: ScenarioMissingRequirements[] = [];
    if (scenarioData.requirements) {
      scenarioData.requirements.forEach((requirement) => {
        let add: boolean = false;
        const missingRequirement = new ScenarioMissingRequirements();
        if (requirement.global) {
          requirement.global.forEach((achievement) => {
            if (achievement.startsWith('!')) {
              achievement = achievement.substring(1, achievement.length);
              if (
                all ||
                this.game.party.globalAchievementsList.find(
                  (globalAchievement) => globalAchievement.toLowerCase().trim() === achievement.toLowerCase().trim()
                )
              ) {
                missingRequirement.globalAchievementsMissing.push(achievement);
                add = true;
              }
            } else if (achievement.includes(':') && !isNaN(+achievement.split(':')[1])) {
              let count = +achievement.split(':')[1];
              this.game.party.globalAchievementsList.forEach((partyAchievement) => {
                if (partyAchievement.toLowerCase().trim() === achievement.split(':')[0].toLowerCase().trim()) {
                  count--;
                }
              });
              if (all || count > 0) {
                missingRequirement.globalAchievementsCount.push({
                  name: achievement.split(':')[0],
                  count: count,
                  required: +achievement.split(':')[1]
                });
                add = true;
              }
            } else if (
              all ||
              !this.game.party.globalAchievementsList.find(
                (globalAchievement) => globalAchievement.toLowerCase().trim() === achievement.toLowerCase().trim()
              )
            ) {
              missingRequirement.globalAchievements.push(achievement);
              add = true;
            }
          });
        }

        if (requirement.party) {
          requirement.party.forEach((achievement) => {
            if (achievement.startsWith('!')) {
              achievement = achievement.substring(1, achievement.length);
              if (
                all ||
                this.game.party.achievementsList.find(
                  (partyAchievement) => partyAchievement.toLowerCase().trim() === achievement.toLowerCase().trim()
                )
              ) {
                missingRequirement.partyAchievementsMissing.push(achievement);
                add = true;
              }
            } else if (achievement.includes(':') && !isNaN(+achievement.split(':')[1])) {
              let count = +achievement.split(':')[1];
              this.game.party.achievementsList.forEach((partyAchievement) => {
                if (partyAchievement.toLowerCase().trim() === achievement.split(':')[0].toLowerCase().trim()) {
                  count--;
                }
              });
              if (count > 0) {
                missingRequirement.partyAchievementsCount.push({
                  name: achievement.split(':')[0],
                  count: count,
                  required: +achievement.split(':')[1]
                });
                add = true;
              }
            } else if (
              all ||
              !this.game.party.achievementsList.find(
                (partyAchievement) => partyAchievement.toLowerCase().trim() === achievement.toLowerCase().trim()
              )
            ) {
              missingRequirement.partyAchievements.push(achievement);
              add = true;
            }
          });
        }

        if (requirement.campaignSticker) {
          requirement.campaignSticker.forEach((achievement) => {
            if (achievement.startsWith('!')) {
              achievement = achievement.substring(1, achievement.length);
              if (
                all ||
                this.game.party.campaignStickers.find(
                  (campaignSticker) => campaignSticker.toLowerCase().trim() === achievement.toLowerCase().trim()
                )
              ) {
                missingRequirement.campaignStickersMissing.push(achievement);
                add = true;
              }
            } else if (achievement.includes(':') && !isNaN(+achievement.split(':')[1])) {
              let count = +achievement.split(':')[1];
              this.game.party.campaignStickers.forEach((campaignSticker) => {
                if (campaignSticker.toLowerCase().trim() === achievement.split(':')[0].toLowerCase().trim()) {
                  count--;
                }
              });
              if (count > 0) {
                missingRequirement.campaignStickersCount.push({
                  name: achievement.split(':')[0],
                  count: count,
                  required: +achievement.split(':')[1]
                });
                add = true;
              }
            } else if (
              all ||
              !this.game.party.campaignStickers.find(
                (campaignSticker) => campaignSticker.toLowerCase().trim() === achievement.toLowerCase().trim()
              )
            ) {
              missingRequirement.campaignStickers.push(achievement);
              add = true;
            }
          });
        }

        if (requirement.buildings) {
          requirement.buildings.forEach((building) => {
            if (building.startsWith('!')) {
              building = building.substring(1, building.length);
              if (building.includes(':')) {
                const level = +building.split(':')[1];
                if (
                  all ||
                  this.game.party.buildings.find(
                    (buildingModel) =>
                      buildingModel.name.toLowerCase().trim() === building.split(':')[0].toLowerCase().trim() &&
                      buildingModel.level >= level
                  )
                ) {
                  missingRequirement.buildingsLevel.push({ name: building.split(':')[0], level: level });
                  add = true;
                }
              } else if (
                all ||
                this.game.party.buildings.find(
                  (buildingModel) => buildingModel.name.toLowerCase().trim() === building.toLowerCase().trim() && buildingModel.level > 0
                )
              ) {
                missingRequirement.buildingsMissing.push(building);
                add = true;
              }
            } else if (building.includes(':')) {
              const level = +building.split(':')[1];
              if (
                all ||
                !this.game.party.buildings.find(
                  (buildingModel) =>
                    buildingModel.name.toLowerCase().trim() === building.split(':')[0].toLowerCase().trim() && buildingModel.level >= level
                )
              ) {
                missingRequirement.buildingsLevel.push({ name: building.split(':')[0], level: level });
                add = true;
              }
            } else if (
              all ||
              !this.game.party.buildings.find(
                (buildingModel) => buildingModel.name.toLowerCase().trim() === building.toLowerCase().trim() && buildingModel.level > 0
              )
            ) {
              missingRequirement.buildings.push(building);
              add = true;
            }
          });
        }

        if (requirement.characters) {
          requirement.characters.forEach((character) => {
            if (character.startsWith('!')) {
              character = character.substring(1, character.length);
              if (
                all ||
                this.game.figures.find(
                  (figure) => figure instanceof Character && figure.name.toLowerCase().trim() === character.toLowerCase().trim()
                )
              ) {
                missingRequirement.charactersMissing.push(character);
                add = true;
              }
            } else if (
              all ||
              !this.game.figures.find(
                (figure) => figure instanceof Character && figure.name.toLowerCase().trim() === character.toLowerCase().trim()
              )
            ) {
              missingRequirement.characters.push(character);
              add = true;
            }
          });
        }

        if (requirement.traits) {
          requirement.traits.forEach((trait) => {
            if (trait.startsWith('!')) {
              trait = trait.substring(1, trait.length);
              if (all || this.hasTrait(trait)) {
                missingRequirement.traitsMissing.push(trait);
                add = true;
              }
            } else if (all || !this.hasTrait(trait)) {
              missingRequirement.traits.push(trait);
              add = true;
            }
          });
        }

        if (requirement.scenarios && requirement.scenarios.length) {
          const missingScenarios: string[][] = [];
          requirement.scenarios.forEach((scenarios, i) => {
            missingScenarios[i] = [];
            scenarios.forEach((index) => {
              if (all || !this.scenarioRequirementMet(index, scenarioData)) {
                missingScenarios[i].push(index);
              }
            });
          });

          if (all || missingScenarios.every((value) => value.length)) {
            missingRequirement.scenarios = missingScenarios;
            add = true;
          }
        }

        if (add) {
          missingRequirements.push(missingRequirement);
        }
      });
    }

    return missingRequirements;
  }

  getPredecessors(scenario: ScenarioData, all: boolean = false): ScenarioData[] {
    const predecessors: ScenarioData[] = [];
    const campaignMode = this.game.party.campaignMode && !all;
    let predecessor = this.getPredecessor(scenario, campaignMode);

    while (predecessor) {
      predecessors.unshift(predecessor);
      const newPredecessor = this.getPredecessor(predecessor, campaignMode);
      predecessor = newPredecessor;
      if (predecessor && predecessors.includes(predecessor)) {
        predecessor = undefined;
      }
    }

    return predecessors;
  }

  getPredecessor(scenarioData: ScenarioData, all: boolean): ScenarioData | undefined {
    let predecessor: ScenarioData | undefined = gameManager.scenarioManager
      .scenarioData(scenarioData.edition, all)
      .find(
        (other) =>
          other.group === scenarioData.group &&
          other.unlocks &&
          other.unlocks.includes(scenarioData.index) &&
          (!all || this.isSuccess(other))
      );

    if (!predecessor) {
      const conclusion = gameManager.editionManager
        .sectionData(scenarioData.edition)
        .find(
          (sectionData) =>
            sectionData.conclusion &&
            sectionData.group === scenarioData.group &&
            sectionData.unlocks &&
            sectionData.unlocks.includes(scenarioData.index) &&
            (!all ||
              this.game.party.conclusions.find(
                (conclusion) =>
                  conclusion.edition === sectionData.edition &&
                  conclusion.group === sectionData.group &&
                  conclusion.index === sectionData.index
              ))
        );
      if (conclusion) {
        predecessor = this.findScenarioPredecessorForSection(conclusion, scenarioData.edition, all);
      }
    }

    if (!predecessor && scenarioData.requires && scenarioData.requires.length > 0) {
      for (const requireGroup of scenarioData.requires) {
        if (requireGroup.length === 1) {
          const requiredScenario = gameManager.scenarioManager
            .scenarioData(scenarioData.edition, all)
            .find((other) => other.index === requireGroup[0] && (!all || this.isSuccess(other)));
          if (requiredScenario) {
            predecessor = requiredScenario;
            break;
          }
        }
      }
    }

    return predecessor;
  }

  findScenarioPredecessorForSection(
    section: ScenarioData,
    edition: string,
    all: boolean,
    visited: Set<string> = new Set()
  ): ScenarioData | undefined {
    const key = section.index;
    if (visited.has(key)) {
      return undefined;
    }
    visited.add(key);

    if (section.parent) {
      const parentScenario = gameManager.scenarioManager
        .scenarioData(edition, all)
        .find((other) => other.index === section.parent && other.group === section.group && (!all || this.isSuccess(other)));
      if (parentScenario) {
        return parentScenario;
      }
    }

    const predecessorViaScenario = gameManager.scenarioManager
      .scenarioData(edition, all)
      .find(
        (other) =>
          other.rewards &&
          ((other.rewards.calendarSection && other.rewards.calendarSection.some((value) => section.index === value.split('-')[0])) ||
            (other.rewards.calendarSectionManual &&
              other.rewards.calendarSectionManual.some((value) => section.index === value.section))) &&
          (!all || this.isSuccess(other))
      );

    if (predecessorViaScenario) {
      return predecessorViaScenario;
    }

    const predecessorSection = gameManager.editionManager
      .sectionData(edition)
      .find(
        (sectionData) =>
          sectionData.rewards &&
          ((sectionData.rewards.calendarSection &&
            sectionData.rewards.calendarSection.some((value) => section.index === value.split('-')[0])) ||
            (sectionData.rewards.calendarSectionManual &&
              sectionData.rewards.calendarSectionManual.some((value) => section.index === value.section)))
      );

    if (predecessorSection) {
      return this.findScenarioPredecessorForSection(predecessorSection, edition, all, visited);
    }

    if (section.parentSections && section.parentSections.length > 0) {
      for (const parentSectionGroup of section.parentSections) {
        for (const parentSectionIndex of parentSectionGroup) {
          const parentSection = gameManager.editionManager.sectionData(edition).find((s) => s.index === parentSectionIndex);
          if (parentSection) {
            const result = this.findScenarioPredecessorForSection(parentSection, edition, all, visited);
            if (result) {
              return result;
            }
          }
        }
      }
    }

    return undefined;
  }
}
