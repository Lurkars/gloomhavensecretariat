import { gameManager } from "../../businesslogic/GameManager";
import { CommandImpl } from "../Command";

export class RoundStateCommand extends CommandImpl {
    id: string = 'round.state';
    requiredParameters: number = 0;

    validParameters(): boolean {
        return true;
    }

    executeWithParameters() {
        gameManager.roundManager.nextGameState();
    }
}