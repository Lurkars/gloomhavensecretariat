import { gameManager } from 'src/app/game/businesslogic/Managers';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { Party } from 'src/app/game/model/Party';

function findParty(id: BASE_TYPE): Party | undefined {
  return gameManager.game.parties.find((party) => party.id === id);
}

export class PartyAddCommand extends CommandImpl {
  id: string = 'party.add';
  requiredParameters: number = 0;

  validParameters(name: string = ''): boolean {
    return typeof name === 'string';
  }

  executeWithParameters(name: string = '') {
    gameManager.campaignManager.addParty(name);
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
      gameManager.campaignManager.removeParty(party);
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
      gameManager.campaignManager.changeParty(party);
    } else {
      this.executionError('party not found');
    }
  }
}
