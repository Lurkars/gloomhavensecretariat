import { gameManager } from "../../businesslogic/GameManager";
import { CommandImpl } from "../Command";

export class RoundNextCommand extends CommandImpl {
    id: string = 'round.next';
    requiredParameters: number = 0;

    validParameters(): boolean {
        return true;
    }

    executeWithParameters() {
        gameManager.roundManager.nextGameState();
    }
}