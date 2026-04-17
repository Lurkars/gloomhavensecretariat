import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { AttackModifierDeckDrawCommand } from 'src/app/game/commands/attackModifierDeck/AttackModifierDeckDraw';
import { CharacterAddCommand } from 'src/app/game/commands/character/CharacterAdd';
import { CharacterConditionCommand } from 'src/app/game/commands/character/CharacterCondition';
import { CharacterHpCommand } from 'src/app/game/commands/character/CharacterHp';
import { CharacterIdentityCommand } from 'src/app/game/commands/character/CharacterIdentity';
import { CharacterInitiativeCommand } from 'src/app/game/commands/character/CharacterInitiative';
import { CharacterLootCommand } from 'src/app/game/commands/character/CharacterLoot';
import { CharacterLootDrawCommand } from 'src/app/game/commands/character/CharacterLootDraw';
import { CharacterXpCommand } from 'src/app/game/commands/character/CharacterXp';
import {
  BASE_TYPE,
  Command,
  CommandExecutionError,
  CommandInvalidParametersError,
  CommandMissingParameterError,
  CommandUnknownError
} from 'src/app/game/commands/Command';
import { FigureNextCommand } from 'src/app/game/commands/figure/FigureNext';
import { LootDeckDrawCommand } from 'src/app/game/commands/lootDeck/LootDeckDraw';
import { RoundStateCommand } from 'src/app/game/commands/round/RoundState';

declare global {
  interface Window {
    commandManager: CommandManager;
  }
}

export class CommandManager {
  private commandsMap: { [key: string]: new (...paramater: BASE_TYPE[]) => Command } = {
    'attackModifierDeck.draw': AttackModifierDeckDrawCommand,
    'character.add': CharacterAddCommand,
    'character.condition': CharacterConditionCommand,
    'character.hp': CharacterHpCommand,
    'character.identity': CharacterIdentityCommand,
    'character.initiative': CharacterInitiativeCommand,
    'character.loot': CharacterLootCommand,
    'character.loot.draw': CharacterLootDrawCommand,
    'character.xp': CharacterXpCommand,
    'figure.next': FigureNextCommand,
    'lootDeck.draw': LootDeckDrawCommand,
    'round.state': RoundStateCommand
  };

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
          console.error('Missing Parameter', id, e.parameter);
        } else if (e instanceof CommandInvalidParametersError) {
          console.error('Invalid Parameters', id, e.parameters);
        } else {
          throw e;
        }
      }
    } catch (e) {
      if (e instanceof CommandUnknownError) {
        console.error('Unkown Command', id, e.message);
      } else {
        throw e;
      }
    }
  }
}

export const commandManager: CommandManager = new CommandManager();
window.commandManager = commandManager;
