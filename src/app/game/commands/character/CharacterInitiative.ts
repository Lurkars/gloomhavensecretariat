import { gameManager } from "../../businesslogic/GameManager";
import { Character } from "../../model/Character";
import { CommandImpl } from "../Command";

export class CharacterInitiativeCommand extends CommandImpl {
    id: string = 'character.initiative';
    requiredParameters: number = 3;

    validParameters(number: number, initiative: number, longRest: boolean): boolean {
        return initiative >= 0 && initiative <= 99 && (!longRest || initiative == 99) && gameManager.game.figures.find((figure) => figure instanceof Character && figure.number == number) != undefined || false;
    }

    executeWithParameters(number: number, initiative: number, longRest: boolean) {
        if (longRest && initiative != 99) {
            this.executionError("invalid long rest");
        }

        const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.number == number) as Character;
        if (character) {
            character.initiative = initiative;
            character.longRest = longRest;
        } else {
            this.executionError("character not found");
        }
    }
}