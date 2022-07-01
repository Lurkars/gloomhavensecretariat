import { Character } from "../model/Character";
import { Condition, RoundCondition } from "../model/Condition";
import { CharacterData } from "../model/data/CharacterData";
import { ObjectiveData } from "../model/data/ObjectiveData";
import { SectionData } from "../model/data/SectionData";
import { EntityValueFunction } from "../model/Entity";
import { Figure } from "../model/Figure";
import { Game } from "../model/Game";
import { Monster } from "../model/Monster";
import { MonsterEntity } from "../model/MonsterEntity";
import { Objective } from "../model/Objective";
import { Summon, SummonState } from "../model/Summon";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class CharacterManager {

  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  characterIcon(characterData: CharacterData) {
    if (characterData.icon) {
      return characterData.icon;
    }
    return './assets/images/character/icons/' + characterData.edition + '-' + characterData.name + '.svg';
  }

  characterThumbnail(characterData: CharacterData) {
    if (characterData.thumbnail) {
      return characterData.thumbnail;
    }
    return './assets/images/character/thumbnail/' + characterData.edition + '-' + characterData.name + '.png';
  }

  addCharacter(characterData: CharacterData) {
    if (!this.game.figures.some((figure: Figure) => {
      return figure instanceof CharacterData && figure.name == characterData.name && figure.edition == characterData.edition;
    })) {
      let entity: Character = new Character(characterData, this.game.level);
      this.game.figures.push(entity);
      gameManager.sortFigures();
    }
  }

  removeCharacter(character: Character) {
    this.game.figures.splice(this.game.figures.indexOf(character), 1);

    if (character.marker) {
      // remove marker
      const marker = character.edition + '-' + character.name;
      this.game.figures.forEach((figure: Figure) => {
        if (figure instanceof Character) {
          figure.markers.splice(figure.markers.indexOf(marker), 1);
          if (figure.summons) {
            figure.summons.forEach((summon: Summon) => {
              summon.markers.splice(summon.markers.indexOf(marker), 1);
            })
          }
        } else if (figure instanceof Objective) {
          figure.markers.splice(figure.markers.indexOf(marker), 1);
        } else if (figure instanceof Monster) {
          figure.entities.forEach((entity: MonsterEntity) => {
            entity.markers.splice(entity.markers.indexOf(marker), 1);
          })
        }
      })
    }

  }

  addSummon(character: Character, summon: Summon) {
    character.summons.push(summon);
  }

  removeSummon(character: Character, summon: Summon) {
    character.summons.splice(character.summons.indexOf(summon), 1);
  }


  addObjective(objectiveData: ObjectiveData | undefined = undefined) {
    let id = 0;
    while (this.game.figures.some((figure: Figure) => figure instanceof Objective && figure.id == id)) {
      id++;
    }

    let objective = new Objective(id);

    if (objectiveData) {
      objective.name = objectiveData.name;
      objective.maxHealth = objectiveData.maxHealth;
      objective.health = EntityValueFunction("" + objective.maxHealth);
      objective.escort = objectiveData.escort;
    }

    this.game.figures.push(objective);
    gameManager.sortFigures();
  }



  removeObjective(objective: Objective) {
    if (this.game.sections.some((sectionData: SectionData) => sectionData.objectives && sectionData.objectives.length > 0)) {
      this.game.sections = [];
    }
    this.game.figures.splice(this.game.figures.indexOf(objective), 1);
  }

  draw() {
    this.game.figures.forEach((figure: Figure) => {
      if (figure instanceof Character) {
        figure.initiative = 0;
        figure.off = false;
        if (settingsManager.settings.expireConditions) {
          figure.expiredConditions = [];
          figure.summons.forEach((summon: Summon) => {
            summon.expiredConditions = [];
          });
        }

      } else if (figure instanceof Objective) {
        figure.off = false;

        if (settingsManager.settings.expireConditions) {
          figure.expiredConditions = [];
        }
      }
    })
  }

  next() {
    this.game.figures.forEach((figure: Figure) => {
      if (figure instanceof Character || figure instanceof Objective) {
        if (!figure.exhausted && figure.health <= 0) {
          figure.off = false;
        }
      }
    })
  }

}
