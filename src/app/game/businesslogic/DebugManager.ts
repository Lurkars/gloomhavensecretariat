import { gameManager, labelManager } from 'src/app/game/businesslogic/Managers';
import { EntityValueFunction } from 'src/app/game/model/Entity';

export class DebugManager {
  checkDuplicates() {
    // check for duplicates
    gameManager.editionManager.charactersData().forEach((characterData, index, self) => {
      if (
        self.find(
          (other) =>
            !characterData.replace &&
            !other.replace &&
            self.indexOf(other) !== self.indexOf(characterData) &&
            characterData.name === other.name &&
            characterData.edition === other.edition
        )
      ) {
        console.warn('Duplicate Character: ' + characterData.name + ' (Edition: ' + characterData.edition + ')');
      }
    });

    gameManager.editionManager.decksData().forEach((deckData, index, self) => {
      if (
        self.find(
          (other) => self.indexOf(other) !== self.indexOf(deckData) && deckData.name === other.name && deckData.edition === other.edition
        )
      ) {
        console.warn('Duplicate Deck: ' + deckData.name + ' (Edition: ' + deckData.edition + ')');
      }
    });

    gameManager.editionManager.scenarioData().forEach((scenarioData, index, self) => {
      if (
        self.find(
          (other) =>
            self.indexOf(other) !== self.indexOf(scenarioData) &&
            scenarioData.index === other.index &&
            scenarioData.edition === other.edition &&
            scenarioData.group === other.group
        )
      ) {
        console.warn('Duplicate Scenario: ' + scenarioData.index + ' (Edition: ' + scenarioData.edition + ')');
      }
    });

    gameManager.editionManager.sectionData().forEach((sectionData, index, self) => {
      if (
        self.find(
          (other) =>
            self.indexOf(other) !== self.indexOf(sectionData) &&
            sectionData.index === other.index &&
            sectionData.edition === other.edition &&
            sectionData.group === other.group
        )
      ) {
        console.warn('Duplicate Section: ' + sectionData.index + ' (Edition: ' + sectionData.edition + ')');
      }
    });

    gameManager.editionManager.itemData().forEach((itemData, index, self) => {
      if (
        self.find(
          (other) => self.indexOf(other) !== self.indexOf(itemData) && itemData.id === other.id && itemData.edition === other.edition
        )
      ) {
        console.warn('Duplicate Item: ' + itemData.id + ' (Edition: ' + itemData.edition + ')');
      }
    });

    gameManager.editionManager.monstersData().forEach((monsterData, index, self) => {
      if (
        self.find(
          (other) =>
            !monsterData.replace &&
            !other.replace &&
            self.indexOf(other) !== self.indexOf(monsterData) &&
            monsterData.name === other.name &&
            monsterData.edition === other.edition
        )
      ) {
        console.warn('Duplicate Monster: ' + monsterData.name + ' (Edition: ' + monsterData.edition + ')');
      }
    });

    gameManager.battleGoalManager.getBattleGoals(undefined, true).forEach((battleGoal, index, self) => {
      if (!battleGoal.alias) {
        const others = self.filter(
          (other, otherIndex) =>
            otherIndex !== index &&
            (other.name === battleGoal.name ||
              labelManager.getLabel('data.battleGoals.' + other.cardId) == labelManager.getLabel('data.battleGoals.' + battleGoal.cardId))
        );
        if (others.length > 0 && others.find((other) => !other.alias)) {
          console.warn(
            'BattleGoal doubles:',
            battleGoal.edition + ' - ' + battleGoal.name,
            others.map((other) => other.edition + ' - ' + other.name)
          );
        }
      }
    });
  }

  checkScenarioMonster() {
    gameManager.editionManager.scenarioData().forEach((scenarioData) => {
      if (scenarioData.monsters) {
        scenarioData.monsters.forEach((name) => {
          if (
            !gameManager.editionManager
              .monstersData()
              .find(
                (monsterData) =>
                  gameManager.editionManager.isEditionRelevant(monsterData.edition, scenarioData.edition) &&
                  monsterData.name === name.split(':')[0]
              )
          ) {
            console.warn('Invalid monster: ' + name + ' | scenario', scenarioData.edition, scenarioData.group || '', scenarioData.index);
          }
        });
      }

      if (scenarioData.rooms) {
        scenarioData.rooms.forEach((roomData) => {
          if (roomData.monster) {
            roomData.monster.forEach((monsterStandeeData) => {
              if (
                !gameManager.editionManager
                  .monstersData()
                  .find(
                    (monsterData) =>
                      gameManager.editionManager.isEditionRelevant(monsterData.edition, scenarioData.edition) &&
                      monsterData.name === monsterStandeeData.name.split(':')[0]
                  )
              ) {
                console.warn(
                  'Invalid monster: ' + monsterStandeeData.name + ' | scenario',
                  scenarioData.edition,
                  scenarioData.group || '',
                  scenarioData.index
                );
              }
            });
          }
        });
      }
    });
  }

  checkSectionMonster() {
    gameManager.editionManager.sectionData().forEach((sectionData) => {
      if (sectionData.monsters) {
        sectionData.monsters.forEach((name) => {
          if (
            !gameManager.editionManager
              .monstersData()
              .find(
                (monsterData) =>
                  gameManager.editionManager.isEditionRelevant(monsterData.edition, sectionData.edition) &&
                  monsterData.name === name.split(':')[0]
              )
          ) {
            console.warn('Invalid monster: ' + name + ' | section', sectionData.edition, sectionData.group || '', sectionData.index);
          }
        });
      }

      if (sectionData.rooms) {
        sectionData.rooms.forEach((roomData) => {
          if (roomData.monster) {
            roomData.monster.forEach((monsterStandeeData) => {
              if (
                !gameManager.editionManager
                  .monstersData()
                  .find(
                    (monsterData) =>
                      gameManager.editionManager.isEditionRelevant(monsterData.edition, sectionData.edition) &&
                      monsterData.name === monsterStandeeData.name.split(':')[0]
                  )
              ) {
                console.warn(
                  'Invalid monster: ' + monsterStandeeData.name + ' | section',
                  sectionData.edition,
                  sectionData.group || '',
                  sectionData.index
                );
              }
            });
          }
        });
      }
    });
  }

  checkMissingScenarioMonster() {
    gameManager.editionManager.scenarioData().forEach((scenarioData) => {
      if (scenarioData.rooms) {
        scenarioData.rooms.forEach((roomData) => {
          if (roomData.monster) {
            roomData.monster.forEach((monsterStandeeData) => {
              if (
                !scenarioData.monsters ||
                !scenarioData.monsters.find((name) => name === monsterStandeeData.name || name.split(':')[0] === monsterStandeeData.name)
              ) {
                console.debug(
                  "Missing monster '" + monsterStandeeData.name + "' from room '" + roomData.roomNumber + "' in monsters",
                  scenarioData.edition,
                  scenarioData.group || '',
                  scenarioData.index
                );
              }
            });
          }
        });
      }
    });
  }

  checkMissingSectionMonster() {
    gameManager.editionManager.sectionData().forEach((sectionData) => {
      if (sectionData.rooms) {
        sectionData.rooms.forEach((roomData) => {
          if (roomData.monster) {
            roomData.monster.forEach((monsterStandeeData) => {
              if (
                !sectionData.monsters ||
                !sectionData.monsters.find((name) => name === monsterStandeeData.name || name.split(':')[0] === monsterStandeeData.name)
              ) {
                console.debug(
                  "Missing monster '" + monsterStandeeData.name + "' from room '" + roomData.roomNumber + "' in monsters | section",
                  sectionData.edition,
                  sectionData.group || '',
                  sectionData.index
                );
              }
            });
          }
        });
      }
    });
  }

  checkMonsterUsage() {
    gameManager.editionManager.monstersData().forEach((monsterData) => {
      let found: boolean = false;

      gameManager.editionManager.scenarioData().forEach((scenarioData) => {
        if (scenarioData.monsters && scenarioData.monsters.some((name) => name.split(':')[0] === monsterData.name)) {
          found = true;
        }

        if (!found && scenarioData.rooms) {
          scenarioData.rooms.forEach((roomData) => {
            if (roomData.monster && roomData.monster.some((standee) => standee.name.split(':')[0] === monsterData.name)) {
              found = true;
            }
          });
        }
      });

      if (!found) {
        gameManager.editionManager.sectionData().forEach((sectionData) => {
          if (sectionData.monsters && sectionData.monsters.find((name) => name.split(':')[0] === monsterData.name)) {
            found = true;
          }

          if (!found && sectionData.rooms) {
            sectionData.rooms.forEach((roomData) => {
              if (roomData.monster && roomData.monster.some((standee) => standee.name.split(':')[0] === monsterData.name)) {
                found = true;
              }
            });
          }
        });
      }

      if (!found) {
        console.warn("Could not find usage of '" + monsterData.name + "'", monsterData.edition);
      }
    });
  }

  checkMonsterBossCount() {
    gameManager.editionManager.monstersData().forEach((monsterData) => {
      // boss hints
      if (monsterData.boss && EntityValueFunction(monsterData.count) > 1) {
        console.warn('Boss count check: ' + monsterData.name + ' (Edition: ' + monsterData.edition + ')');
      }
    });
  }

  checkCharacterCardIds() {
    gameManager.editionManager.decksData().filter((deckData) => {
      if (deckData.character) {
        for (let i = 0; i < deckData.abilities.length - 1; i++) {
          const a = deckData.abilities[i];
          const b = deckData.abilities[i + 1];
          if (a.cardId === undefined) {
            console.warn(deckData.edition, deckData.name, i, a.name);
          } else if (a.cardId !== undefined && b.cardId !== undefined && a.cardId + 1 !== b.cardId) {
            console.warn(deckData.edition, deckData.name, i, a.cardId, a.name, i + 1, b.cardId, b.name);
            break;
          }
        }
      }
    });
  }

  entityValueFunction(value: string | number): number {
    return EntityValueFunction(value);
  }
}
