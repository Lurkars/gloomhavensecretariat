import { gameManager } from "../../businesslogic/GameManager";
import { Character } from "../../model/Character";
import { BASE_TYPE, CommandImpl } from "../Command";

export class CharacterLootCommand extends CommandImpl {
    id: string = 'character.loot';
    requiredParameters: number = 2;

    constructor(...parameters: BASE_TYPE[]) {
        super(...parameters);
    }

    validParameters(number: number, loot: number): boolean {
        return !gameManager.fhRules(false) && gameManager.game.figures.find((figure) => figure instanceof Character && figure.number == number) != undefined && loot != 0 || false;
    }

    executeWithParameters(number: number, loot: number) {
        const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.number == number) as Character;
        if (character) {
            character.loot += loot;
            if (character.loot < 0) {
                character.loot = 0;
            }
        } else {
            this.executionError("character not found or invalid");
        }
    }

    override before(): BASE_TYPE[] {
        const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.number == this.parameters[0]) as Character;
        if (character) {
            return ['command.' + this.id, gameManager.characterManager.characterName(character, true, true, false), this.parameters[1]];
        }

        return ['command.invalid.' + this.id, ...this.parameters];
    }
}