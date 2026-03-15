import { gameManager } from "../../businesslogic/GameManager";
import { Character } from "../../model/Character";
import { BASE_TYPE, CommandImpl } from "../Command";

export class CharacterIdentityCommand extends CommandImpl {
    id: string = 'character.identity';
    requiredParameters: number = 2;

    constructor(...parameters: BASE_TYPE[]) {
        super(...parameters);
    }

    validParameters(number: number, identity: number): boolean {
        const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.number == number) as Character;
        return character != undefined && character.identities.length && identity >= 0 && identity < character.identities.length || false;
    }

    executeWithParameters(number: number, identity: number) {
        const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.number == number) as Character;
        if (character && character.identities.length) {
            if (identity >= 0 && identity < character.identities.length) {
                character.identity = identity;
            } else {
                this.executionError("invalid identity");
            }
        } else {
            this.executionError("character not found or invalid");
        }
    }

    override before(): BASE_TYPE[] {
        const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.number == this.parameters[0]) as Character;
        const identity = this.parameters[1] as number;
        if (character) {
            return ['command.' + this.id, gameManager.characterManager.characterName(character, true, true, false), 'data.character.' + character.edition + '.' + character.name + '.' + character.identities[identity]];
        }

        return ['command.invalid.' + this.id, ...this.parameters];
    }
}