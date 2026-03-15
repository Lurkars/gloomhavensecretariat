import { gameManager } from "../../businesslogic/GameManager";
import { Character } from "../../model/Character";
import { Condition, ConditionName } from "../../model/data/Condition";
import { BASE_TYPE, CommandImpl } from "../Command";

export class CharacterConditionCommand extends CommandImpl {
    id: string = 'character.condition';
    requiredParameters: number = 2;

    conditions: ConditionName[] = [];

    constructor(...parameters: BASE_TYPE[]) {
        super(...parameters);

        this.conditions.push(...gameManager.conditionsForTypes('standard', 'negative', 'character').map((condition) => condition.name));
        this.conditions.push(...gameManager.conditionsForTypes('upgrade', 'negative', 'character').map((condition) => condition.name));
        this.conditions.push(...gameManager.conditionsForTypes('stack', 'negative', 'character').map((condition) => condition.name));

        this.conditions.push(...gameManager.conditionsForTypes('standard', 'positive', 'character').map((condition) => condition.name));
        this.conditions.push(...gameManager.conditionsForTypes('upgrade', 'positive', 'character').map((condition) => condition.name));
        this.conditions.push(...gameManager.conditionsForTypes('stack', 'positive', 'character').map((condition) => condition.name));

        this.conditions.push(...gameManager.conditionsForTypes('standard', 'neutral', 'character').map((condition) => condition.name));
        this.conditions.push(...gameManager.conditionsForTypes('upgrade', 'neutral', 'character').map((condition) => condition.name));
        this.conditions.push(...gameManager.conditionsForTypes('stack', 'neutral', 'character').map((condition) => condition.name));
    }

    validParameters(number: number, conditionIndex: number): boolean {
        return conditionIndex >= 0 && conditionIndex < this.conditions.length && gameManager.game.figures.find((figure) => figure instanceof Character && figure.number == number) != undefined || false;
    }

    executeWithParameters(number: number, conditionIndex: number) {
        const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.number == number) as Character;
        if (character) {
            const condition = this.conditions[conditionIndex];
            if (condition) {
                if (gameManager.entityManager.hasCondition(character, new Condition(condition))) {
                    gameManager.entityManager.removeCondition(character, character, new Condition(condition));
                } else {
                    gameManager.entityManager.addCondition(character, character, new Condition(condition));
                }
            } else {
                this.executionError("condition not found");
            }
        } else {
            this.executionError("character not found");
        }
    }

    override before(): BASE_TYPE[] {
        const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.number == this.parameters[0]) as Character;
        const condition = this.conditions[this.parameters[1] as number];
        if (character && condition) {
            return ['command.' + this.id, gameManager.characterManager.characterName(character, true, true, false), 'game.condition.' + condition];
        }

        return ['command.invalid.' + this.id, ...this.parameters];
    }
}