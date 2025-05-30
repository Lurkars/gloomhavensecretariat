import { gameManager } from "../../businesslogic/GameManager";
import { CommandImpl } from "../Command";

export class CharacterAddCommand extends CommandImpl {
    id: string = 'character.add';
    requiredParameters: number = 3;

    validParameters(edition: string, name: string, level: number): boolean {
        return edition && name && level && level < 10 && gameManager.charactersData(edition).find((char) => char.name == name) != undefined || false;
    }

    executeWithParameters(edition: string, name: string, level: number) {
        const characterData = gameManager.charactersData(edition).find((char) => char.name == name);
        if (characterData) {
            gameManager.characterManager.addCharacter(characterData, level);
        } else {
            this.executionError("character not found");
        }
    }
}