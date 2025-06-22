import { gameManager } from "../businesslogic/GameManager";
import { AttackModifierDeckDrawCommand } from "./attackModifierDeck/AttackModifierDeckDraw";
import { CharacterAddCommand } from "./character/CharacterAdd";
import { CharacterInitiativeCommand } from "./character/CharacterInitiative";
import { BASE_TYPE, Command, CommandExecutionError, CommandInvalidParametersError, CommandMissingParameterError, CommandUnknownError } from "./Command";
import { FigureNextCommand } from "./figure/FigureNext";
import { LootDeckDrawCommand } from "./lootDeck/LootDeckDraw";
import { RoundStateCommand } from "./round/RoundState";

declare global {
    interface Window { commandManager: CommandManager }
}

export class CommandManager {

    private commandsMap: { [key: string]: new (...paramater: BASE_TYPE[]) => Command } = {
        'attackModifierDeck.draw': AttackModifierDeckDrawCommand,
        'character.add': CharacterAddCommand,
        'character.initiative': CharacterInitiativeCommand,
        'figure.next': FigureNextCommand,
        'lootDeck.draw': LootDeckDrawCommand,
        'round.state': RoundStateCommand,
    }

    private history: Command[] = [];

    execute(id: string, ...parameters: BASE_TYPE[]) {
        try {
            if (!this.commandsMap[id]) {
                throw new CommandUnknownError(id);
            }

            const command: Command = new this.commandsMap[id](...parameters);
            gameManager.stateManager.before(...command.before());
            try {
                command.execute();
                this.history.push(command);
                gameManager.stateManager.after();
            } catch (e) {
                gameManager.stateManager.revertLastUndo();
                if (e instanceof CommandExecutionError) {
                    console.error(e, e.id, e.parameters, e.message);
                } else if (e instanceof CommandMissingParameterError) {
                    console.error("Missing Parameter", id, e.parameter);
                } else if (e instanceof CommandInvalidParametersError) {
                    console.error("Invalid Parameters", id, e.parameters);
                } else {
                    throw e;
                }
            }
        } catch (e) {
            if (e instanceof CommandUnknownError) {
                console.error("Unkown Command", id, e.message);
            } else {
                throw e;
            }
        }
    }
}

export const commandManager: CommandManager = new CommandManager();
window.commandManager = commandManager;