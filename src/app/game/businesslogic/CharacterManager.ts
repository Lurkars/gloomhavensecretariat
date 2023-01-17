import { AttackModifier, AttackModifierType } from "../model/AttackModifier";
import { Character } from "../model/Character";
import { CharacterStat } from "../model/CharacterStat";
import { ConditionType, EntityConditionState } from "../model/Condition";
import { CharacterData } from "../model/data/CharacterData";
import { ObjectiveData } from "../model/data/ObjectiveData";
import { SummonData } from "../model/data/SummonData";
import { EntityValueFunction } from "../model/Entity";
import { FigureError, FigureErrorType } from "../model/FigureError";
import { Game, GameState } from "../model/Game";
import { Monster } from "../model/Monster";
import { Objective } from "../model/Objective";
import { Summon, SummonColor, SummonState } from "../model/Summon";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class CharacterManager {

  game: Game;
  xpMap: number[] = [0, 45, 95, 150, 210, 275, 345, 420, 500];

  constructor(game: Game) {
    this.game = game;
  }

  characterIcon(character: CharacterData | string): string {
    let characterData: CharacterData;
    if (typeof character !== 'string') {
      characterData = character;
    } else {
      characterData = gameManager.getCharacterData(character);
    }

    if (characterData.iconUrl) {
      return characterData.iconUrl;
    }
    return './assets/images/character/icons/' + characterData.edition + '-' + characterData.name + '.svg';
  }

  characterColor(character: CharacterData | string): string {
    let characterData: CharacterData;
    if (character instanceof CharacterData) {
      characterData = character;
    } else {
      characterData = gameManager.getCharacterData(character);
    }

    return characterData.color;
  }

  characterThumbnail(characterData: CharacterData) {
    if (characterData.thumbnailUrl) {
      return characterData.thumbnailUrl;
    }
    return './assets/images/character/thumbnail/' + characterData.edition + '-' + characterData.name + '.png';
  }

  addCharacter(characterData: CharacterData, level: number) {
    if (!this.game.figures.some((figure) => {
      return figure instanceof Character && figure.name == characterData.name && figure.edition == characterData.edition;
    })) {
      let character: Character = new Character(characterData, level);
      character.availableSummons.filter((summonData) => summonData.special).forEach((summonData) => this.createSpecialSummon(character, summonData));

      character.number = 1;
      while (gameManager.game.figures.some((figure) => figure instanceof Character && figure.number == character.number)) {
        character.number++;
      }

      this.game.figures.push(character);
      if (this.game.state == GameState.next) {
        gameManager.attackModifierManager.shuffleModifiers(character.attackModifierDeck);
      }
      gameManager.sortFigures();
    }
    if (this.game.levelCalculation) {
      gameManager.levelManager.calculateScenarioLevel();
    }
  }

  removeCharacter(character: Character) {
    this.game.figures.splice(this.game.figures.indexOf(character), 1);

    if (character.marker) {
      // remove marker
      const marker = character.edition + '-' + character.name;
      this.game.figures.forEach((figure) => {
        if (figure instanceof Character) {
          figure.markers.splice(figure.markers.indexOf(marker), 1);
          if (figure.summons) {
            figure.summons.forEach((summon) => {
              summon.markers.splice(summon.markers.indexOf(marker), 1);
            })
          }
        } else if (figure instanceof Objective) {
          figure.markers.splice(figure.markers.indexOf(marker), 1);
        } else if (figure instanceof Monster) {
          figure.entities.forEach((entity) => {
            entity.markers.splice(entity.markers.indexOf(marker), 1);
          })
        }
      })
    }
    if (this.game.levelCalculation) {
      gameManager.levelManager.calculateScenarioLevel();
    }
  }

  addSummon(character: Character, summon: Summon) {
    character.summons = character.summons.filter((value) => value.name != summon.name || value.number != summon.number || value.color != summon.color);
    character.summons.push(summon);
  }

  removeSummon(character: Character, summon: Summon) {
    character.summons.splice(character.summons.indexOf(summon), 1);
  }


  addObjective(objectiveData: ObjectiveData | undefined = undefined, name: string | undefined = undefined): Objective {
    const objectiveCount = gameManager.game.figures.filter((figure) => figure instanceof Objective).length;
    let id = objectiveCount % 12;
    if (objectiveCount < 12) {
      while (this.game.figures.some((figure) => figure instanceof Objective && figure.id == id)) {
        id++;
      }
    }

    let objective = new Objective(id);

    if (objectiveData) {
      if (objectiveData.id && objectiveData.id != -1) {
        objective.id = objectiveData.id;
      }
      objective.marker = objectiveData.marker;
      objective.name = objectiveData.name;
      if (name) {
        objective.name = name;
      }
      objective.maxHealth = objectiveData.health;
      objective.health = EntityValueFunction("" + objectiveData.health);
      objective.escort = objectiveData.escort;
      if (objectiveData.initiative) {
        objective.initiative = objectiveData.initiative;
      }
    }

    this.game.figures.push(objective);
    gameManager.sortFigures();
    return objective;
  }

  removeObjective(objective: Objective) {
    if (this.game.sections.some((sectionData) => sectionData.objectives && sectionData.objectives.length > 0)) {
      this.game.sections = [];
    }
    this.game.figures.splice(this.game.figures.indexOf(objective), 1);
  }

  next() {
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        figure.initiative = 0;
        figure.initiativeVisible = false;
        figure.off = false;
        figure.attackModifierDeckVisible = false;

        figure.summons = figure.summons.filter((summon) => !summon.dead && summon.health > 0);

        if (settingsManager.settings.expireConditions) {
          figure.entityConditions = figure.entityConditions.filter((entityCondition) => !entityCondition.expired);

          figure.summons.forEach((summon) => {
            summon.entityConditions = summon.entityConditions.filter((entityCondition) => !entityCondition.expired);
          });
        }

        if (settingsManager.settings.applyConditions) {
          figure.entityConditions.filter((entityCondition) => entityCondition.types.indexOf(ConditionType.turn) != -1).forEach((entityCondition) => entityCondition.state = EntityConditionState.normal);

          figure.summons.forEach((summon) => {
            summon.entityConditions.filter((entityCondition) => entityCondition.types.indexOf(ConditionType.turn) != -1).forEach((entityCondition) => entityCondition.state = EntityConditionState.normal);
          });
        }
      } else if (figure instanceof Objective) {
        figure.off = false;

        if (settingsManager.settings.expireConditions) {
          figure.entityConditions = figure.entityConditions.filter((entityCondition) => !entityCondition.expired);
        }


        if (settingsManager.settings.applyConditions) {
          figure.entityConditions.filter((entityCondition) => entityCondition.types.indexOf(ConditionType.turn) != -1).forEach((entityCondition) => entityCondition.state = EntityConditionState.normal);
        }
      }
    })
  }

  addXP(character: Character, value: number) {
    character.progress.experience += value;
    this.xpMap.forEach((value, index) => {
      if (character.progress.experience >= value && (index < this.xpMap.length - 1 && character.progress.experience < this.xpMap[index + 1] || index == this.xpMap.length - 1)) {
        this.setLevel(character, index + 1);
      }
    })
  }

  setLevel(character: Character, level: number) {
    const stat = character.stats.find((characterStat) => characterStat.level == level)
    if (!stat) {
      character.errors = character.errors || [];
      if (!character.errors.find((figureError) => figureError.type == FigureErrorType.unknown) && !character.errors.find((figureError) => figureError.type == FigureErrorType.stat)) {
        console.error("No character stat found for level: " + level);
        character.errors.push(new FigureError(FigureErrorType.stat, "character", character.name, character.edition, "", "" + level));
      }
      character.stat = new CharacterStat(level, 0);
    } else {
      character.stat = stat;
    }

    character.level = level;

    if (character.health == character.maxHealth) {
      character.health = character.stat.health;
    }

    character.maxHealth = character.stat.health;
    if (character.health > character.maxHealth) {
      character.health = character.maxHealth;
    }

    character.availableSummons.filter((summonData) => summonData.special).forEach((summonData) => this.createSpecialSummon(character, summonData));

    if (character.progress.experience < gameManager.characterManager.xpMap[level - 1] || character.progress.experience >= gameManager.characterManager.xpMap[level]) {
      character.progress.experience = gameManager.characterManager.xpMap[level - 1];
    }

    if (this.game.levelCalculation) {
      gameManager.levelManager.calculateScenarioLevel();
    }
  }

  createSpecialSummon(character: Character, summonData: SummonData) {
    character.summons = character.summons.filter((summon) => summon.name != summonData.name || summon.number != 0 || summon.color != SummonColor.custom);
    if (!summonData.level || summonData.level <= character.level) {
      let summon: Summon = new Summon(summonData.name, character.level, 0, SummonColor.custom, summonData);
      summon.state = SummonState.true;
      summon.init = false;
      this.addSummon(character, summon);
    }
  }

  applyDonations(character: Character) {
    for (let i = 0; i < character.donations; i++) {
      gameManager.attackModifierManager.addModifier(character.attackModifierDeck, new AttackModifier(AttackModifierType.bless));
      gameManager.attackModifierManager.addModifier(character.attackModifierDeck, new AttackModifier(AttackModifierType.bless));
    }

    character.donations = 0;
  }

  draw() {
    this.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        figure.initiativeVisible = true;
        this.applyDonations(figure);
        for (let summon of figure.summons) {
          if (summon.state == SummonState.new) {
            summon.state = SummonState.true;
          }
        }
      }

      if (figure instanceof Character || figure instanceof Objective) {
        if (!figure.exhausted && figure.health > 0) {
          figure.off = false;
        }
      }
    })
  }

}
