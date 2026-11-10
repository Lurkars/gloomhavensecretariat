import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { applyPayment, paymentValid } from 'src/app/game/commands/party/payment';
import { LootType } from 'src/app/game/model/data/Loot';

const PARTY_FIELDS: { [key: string]: { text: boolean } } = {
  name: { text: true },
  location: { text: true },
  notes: { text: true },
  donations: { text: false },
  imbuement: { text: false },
  inspiration: { text: false },
  defense: { text: false },
  townGuardPerks: { text: false }
};

export class PartySetCommand extends CommandImpl {
  id: string = 'party.set';
  requiredParameters: number = 2;

  validParameters(field: string, value: string | number): boolean {
    const partyField = PARTY_FIELDS[field];
    return !!partyField && (partyField.text ? typeof value === 'string' : typeof value === 'number' && (value >= 0 || field === 'defense'));
  }

  executeWithParameters(field: string, value: string | number) {
    const party = gameManager.game.party;
    switch (field) {
      case 'name':
        party.name = value as string;
        break;
      case 'location':
        party.location = value as string;
        break;
      case 'notes':
        party.notes = value as string;
        break;
      case 'donations':
        party.donations = value as number;
        if ((value as number) < 10) {
          party.envelopeB = false;
        }
        break;
      case 'imbuement':
        party.imbuement = value as number;
        break;
      case 'inspiration':
        party.inspiration = value as number;
        break;
      case 'defense':
        party.defense = value as number;
        break;
      case 'townGuardPerks':
        party.townGuardPerks = value as number;
        break;
    }
  }
}

export class PartyEnvelopeBCommand extends CommandImpl {
  id: string = 'party.envelopeB';
  requiredParameters: number = 1;

  validParameters(envelopeB: boolean): boolean {
    return typeof envelopeB === 'boolean';
  }

  executeWithParameters(envelopeB: boolean) {
    const party = gameManager.game.party;
    party.envelopeB = envelopeB;
    if (party.donations > 10) {
      party.donations = 10;
    }
  }
}

export class PartyReputationCommand extends CommandImpl {
  id: string = 'party.reputation';
  requiredParameters: number = 1;

  validParameters(value: number): boolean {
    return typeof value === 'number' && value >= -20 && value <= 20;
  }

  executeWithParameters(value: number) {
    gameManager.campaignManager.changeReputation(value - gameManager.game.party.reputation);
  }
}

export class PartyProsperityCommand extends CommandImpl {
  id: string = 'party.prosperity';
  requiredParameters: number = 1;

  validParameters(value: number): boolean {
    return typeof value === 'number' && value >= 0;
  }

  executeWithParameters(value: number) {
    gameManager.campaignManager.changeProsperity(value - gameManager.game.party.prosperity);
  }
}

export class PartyMoraleCommand extends CommandImpl {
  id: string = 'party.morale';
  requiredParameters: number = 1;

  validParameters(value: number): boolean {
    return typeof value === 'number' && value >= 0 && value <= 20;
  }

  executeWithParameters(value: number) {
    gameManager.campaignManager.changeMorale(value - gameManager.game.party.morale);
  }
}

export class PartyFactionReputationCommand extends CommandImpl {
  id: string = 'party.factionReputation';
  requiredParameters: number = 2;

  validParameters(faction: string, value: number): boolean {
    return typeof faction === 'string' && !!faction && typeof value === 'number' && value >= -10 && value <= 20;
  }

  executeWithParameters(faction: string, value: number, force: boolean = false) {
    if (force && value > 12) {
      gameManager.campaignManager.unlockGh2eFaction(faction);
    }
    gameManager.campaignManager.changeFactionReputation(faction, value - (gameManager.game.party.factionReputation[faction] || 0), force);
  }
}

export class PartySoldiersCommand extends CommandImpl {
  id: string = 'party.soldiers';
  requiredParameters: number = 1;

  validParameters(value: number, ...payment: BASE_TYPE[]): boolean {
    return typeof value === 'number' && value >= 0 && paymentValid(payment);
  }

  executeWithParameters(value: number) {
    gameManager.game.party.soldiers = value;
    applyPayment(this.parameters.slice(1));
  }
}

export class PartyResourceCommand extends CommandImpl {
  id: string = 'party.resource';
  requiredParameters: number = 2;

  validParameters(type: string, value: number): boolean {
    return Object.values(LootType).includes(type as LootType) && typeof value === 'number' && value >= 0;
  }

  executeWithParameters(type: LootType, value: number) {
    gameManager.game.party.loot[type] = value;
  }
}

export class PartyWeeksCommand extends CommandImpl {
  id: string = 'party.weeks';
  requiredParameters: number = 1;

  validParameters(value: number): boolean {
    return typeof value === 'number' && value >= 0;
  }

  executeWithParameters(value: number) {
    const party = gameManager.game.party;
    for (let week = party.weeks; week < value; week++) {
      gameManager.scenarioManager.passWeekSections(week + 1, gameManager.currentEdition(), undefined, party.campaignMode);
    }
    party.weeks = value;
  }
}

export class PartyPlayerCommand extends CommandImpl {
  id: string = 'party.player';
  requiredParameters: number = 2;

  validParameters(index: number, name: string): boolean {
    return typeof index === 'number' && index >= 0 && typeof name === 'string';
  }

  executeWithParameters(index: number, name: string) {
    if (name) {
      gameManager.game.party.players[index] = name;
    } else {
      gameManager.game.party.players.splice(index, 1);
    }
  }
}
