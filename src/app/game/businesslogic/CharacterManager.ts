import { CharacterEntity } from "../model/CharacterEntity";
import { Condition, RoundCondition } from "../model/Condition";
import { CharacterData } from "../model/data/CharacterData";
import { Figure } from "../model/Figure";
import { Game } from "../model/Game";
import { Summon, SummonColor, SummonState } from "../model/Summon";

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
    if (this.game.figures.some((element: Figure) => {
      return element.name == characterData.name;
    })) {
      return;
    }

    let entity: CharacterEntity = new CharacterEntity(characterData, this.game.level);
    this.game.figures.push(entity);
  }

  removeCharacter(character: CharacterEntity) {
    if (!this.game.figures.some((element: Figure) => {
      return element.name == character.name;
    })) {
      return;
    }

    this.game.figures.splice(this.game.figures.indexOf(character), 1);
  }

  addSummon(character: CharacterEntity, summon: Summon) {
    character.summons.push(summon);
  }

  removeSummon(character: CharacterEntity, summon: Summon) {
    character.summons.splice(character.summons.indexOf(summon), 1);
  }

  draw() {
    this.game.figures.forEach((figure: Figure) => {
      if (figure instanceof CharacterEntity) {
        figure.initiative = 0;
        figure.off = false;
        for (let roundCondition in RoundCondition) {
          if (figure.conditions.indexOf(roundCondition as Condition) != -1) {
            figure.turnConditions.push(roundCondition as Condition);
          } else if (figure.turnConditions.indexOf(roundCondition as Condition) != -1) {
            figure.conditions.splice(figure.conditions.indexOf(roundCondition as Condition), 1);
            figure.turnConditions.splice(figure.turnConditions.indexOf(roundCondition as Condition), 1);
          }
        }

        for (let summon of figure.summons) {
          if (summon.state == SummonState.new) {
            summon.state = SummonState.true;
          }
        }
      }
    })
  }

  next() {
    this.game.figures.forEach((figure: Figure) => {
      if (figure instanceof CharacterEntity) {
        if (!figure.exhausted && figure.health <= 0) {
          figure.off = false;
        }
      }
    })
  }

}
