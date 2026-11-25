import { gameManager } from 'src/app/game/businesslogic/Managers';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';

export class CharacterIdentityCommand extends CommandImpl {
  id: string = 'character.identity';
  requiredParameters: number = 2;

  constructor(...parameters: BASE_TYPE[]) {
    super(...parameters);
  }

  validParameters(number: number, identity: number): boolean {
    const character = findCharacter(number);
    return !!character && gameManager.characterManager.canSetIdentity(character, identity);
  }

  executeWithParameters(number: number, identity: number) {
    const character = findCharacter(number);
    if (!character || !gameManager.characterManager.setIdentity(character, identity)) {
      this.executionError('character not found or invalid identity');
    }
  }

  override before(): BASE_TYPE[] {
    const character = findCharacter(this.parameters[0] as number);
    const identity = this.parameters[1] as number;
    if (character) {
      return [
        'command.' + this.id,
        gameManager.characterManager.characterName(character, true, true),
        'data.character.' + character.edition + '.' + character.name + '.' + character.identities[identity]
      ];
    }

    return ['command.invalid.' + this.id, ...this.parameters];
  }
}
