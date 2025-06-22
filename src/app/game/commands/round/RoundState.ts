import { gameManager } from "../../businesslogic/GameManager";
import { GameState } from "../../model/Game";
import { BASE_TYPE, CommandImpl } from "../Command";

export class RoundStateCommand extends CommandImpl {
    id: string = 'round.state';
    requiredParameters: number = 0;

    validParameters(): boolean {
        return true;
    }

    executeWithParameters() {
        gameManager.roundManager.nextGameState();
    }

    override before(): BASE_TYPE[] {
        return ['command.' + this.id + (gameManager.game.state == GameState.next ? '.next' : '.draw')];
    }
}