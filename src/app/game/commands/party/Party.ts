import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { Party } from 'src/app/game/model/Party';

function findParty(id: BASE_TYPE): Party | undefined {
  return gameManager.game.parties.find((party) => party.id === id);
}

export class PartyAddCommand extends CommandImpl {
  id: string = 'party.add';
  requiredParameters: number = 0;

  nextId(): number {
    let id = 0;
    while (gameManager.game.parties.some((party) => party.id === id)) {
      id++;
    }
    return id;
  }

  validParameters(name: string = ''): boolean {
    return typeof name === 'string';
  }

  executeWithParameters(name: string = '') {
    const party = new Party();
    party.id = this.nextId();
    party.name = name;
    gameManager.game.parties.push(party);
    gameManager.changeParty(party);
  }
}

export class PartyRemoveCommand extends CommandImpl {
  id: string = 'party.remove';
  requiredParameters: number = 1;

  validParameters(id: number): boolean {
    return !!findParty(id) && gameManager.game.parties.length > 1;
  }

  executeWithParameters(id: number) {
    const party = findParty(id);
    if (party) {
      gameManager.game.parties.splice(gameManager.game.parties.indexOf(party), 1);
      if (gameManager.game.party.id === party.id) {
        gameManager.changeParty(gameManager.game.parties[0]);
      }
    } else {
      this.executionError('party not found');
    }
  }
}

export class PartyChangeCommand extends CommandImpl {
  id: string = 'party.change';
  requiredParameters: number = 1;

  validParameters(id: number): boolean {
    const party = findParty(id);
    return !!party && party.id !== gameManager.game.party.id;
  }

  executeWithParameters(id: number) {
    const party = findParty(id);
    if (party) {
      gameManager.changeParty(party);
    } else {
      this.executionError('party not found');
    }
  }
}
