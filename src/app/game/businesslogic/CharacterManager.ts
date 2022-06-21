import { Character } from "../model/Character";
import { Condition, RoundCondition } from "../model/Condition";
import { CharacterData } from "../model/data/CharacterData";
import { Figure } from "../model/Figure";
import { Game } from "../model/Game";
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
  }

  addSummon(character: Character, summon: Summon) {
    character.summons.push(summon);
  }

  removeSummon(character: Character, summon: Summon) {
    character.summons.splice(character.summons.indexOf(summon), 1);
  }


  addObjective() {
    let id = 0;
    while (this.game.figures.some((figure: Figure) => figure instanceof Objective && figure.id == id)) {
      id++;
    }
    this.game.figures.push(new Objective(id));
    gameManager.sortFigures();
  }

  removeObjective(objective: Objective) {
    this.game.figures.splice(this.game.figures.indexOf(objective), 1);
  }

  draw() {
    this.game.figures.forEach((figure: Figure) => {
      if (figure instanceof Character) {
        figure.initiative = 0;
        figure.off = false;
        if (settingsManager.settings.expireConditions) {
          for (let roundCondition in RoundCondition) {
            if (figure.conditions.indexOf(roundCondition as Condition) != -1) {
              figure.turnConditions.push(roundCondition as Condition);
            } else if (figure.turnConditions.indexOf(roundCondition as Condition) != -1) {
              figure.conditions.splice(figure.conditions.indexOf(roundCondition as Condition), 1);
              figure.turnConditions.splice(figure.turnConditions.indexOf(roundCondition as Condition), 1);
            }
          }
        }

        for (let summon of figure.summons) {
          if (summon.state == SummonState.new) {
            summon.state = SummonState.true;
          }
        }
      } else if (figure instanceof Objective) {
        figure.off = false;
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
