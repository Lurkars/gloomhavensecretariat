import { PartyValueField } from 'src/app/game/businesslogic/CampaignManager';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { payment, paymentValid } from 'src/app/game/commands/party/payment';
import { LootType } from 'src/app/game/model/data/Loot';

export class PartySetCommand extends CommandImpl {
  id: string = 'party.set';
  requiredParameters: number = 2;

  validParameters(field: string, value: string | number): boolean {
    return gameManager.campaignManager.canSetPartyValue(field as PartyValueField, value);
  }

  executeWithParameters(field: string, value: string | number) {
    gameManager.campaignManager.setPartyValue(field as PartyValueField, value);
  }
}

export class PartyEnvelopeBCommand extends CommandImpl {
  id: string = 'party.envelopeB';
  requiredParameters: number = 1;

  validParameters(envelopeB: boolean): boolean {
    return gameManager.campaignManager.canSetEnvelopeB(envelopeB);
  }

  executeWithParameters(envelopeB: boolean) {
    gameManager.campaignManager.setEnvelopeB(envelopeB);
  }
}

export class PartyReputationCommand extends CommandImpl {
  id: string = 'party.reputation';
  requiredParameters: number = 1;

  validParameters(value: number): boolean {
    return typeof value === 'number' && gameManager.campaignManager.canSetReputation(value);
  }

  executeWithParameters(value: number) {
    gameManager.campaignManager.setReputation(value);
  }
}

export class PartyProsperityCommand extends CommandImpl {
  id: string = 'party.prosperity';
  requiredParameters: number = 1;

  validParameters(value: number): boolean {
    return typeof value === 'number' && gameManager.campaignManager.canSetProsperity(value);
  }

  executeWithParameters(value: number) {
    gameManager.campaignManager.setProsperity(value);
  }
}

export class PartyMoraleCommand extends CommandImpl {
  id: string = 'party.morale';
  requiredParameters: number = 1;

  validParameters(value: number): boolean {
    return typeof value === 'number' && gameManager.campaignManager.canSetMorale(value);
  }

  executeWithParameters(value: number) {
    gameManager.campaignManager.setMorale(value);
  }
}

export class PartyFactionReputationCommand extends CommandImpl {
  id: string = 'party.factionReputation';
  requiredParameters: number = 2;

  validParameters(faction: string, value: number, force: boolean = false): boolean {
    return (
      typeof value === 'number' && typeof force === 'boolean' && gameManager.campaignManager.canSetFactionReputation(faction, value, force)
    );
  }

  executeWithParameters(faction: string, value: number, force: boolean = false) {
    gameManager.campaignManager.setFactionReputation(faction, value, force);
  }
}

export class PartySoldiersCommand extends CommandImpl {
  id: string = 'party.soldiers';
  requiredParameters: number = 1;

  force(): boolean {
    return this.parameters[1] === true;
  }

  paymentValues(): BASE_TYPE[] {
    return this.parameters.slice(this.force() ? 2 : 1);
  }

  validParameters(value: number): boolean {
    if (typeof value !== 'number' || !paymentValid(this.paymentValues())) {
      return false;
    }
    if (!this.force() && value === gameManager.game.party.soldiers + 1) {
      return gameManager.buildingsManager.canTrainSoldier(payment(this.paymentValues()));
    }
    return !this.paymentValues().length && gameManager.buildingsManager.canSetSoldiers(value, this.force());
  }

  executeWithParameters(value: number) {
    if (!this.force() && value === gameManager.game.party.soldiers + 1) {
      gameManager.buildingsManager.trainSoldier(payment(this.paymentValues()));
    } else {
      gameManager.buildingsManager.setSoldiers(value, this.force());
    }
  }
}

export class PartyResourceCommand extends CommandImpl {
  id: string = 'party.resource';
  requiredParameters: number = 2;

  validParameters(type: string, value: number): boolean {
    return typeof value === 'number' && gameManager.campaignManager.canSetPartyResource(type as LootType, value);
  }

  executeWithParameters(type: LootType, value: number) {
    gameManager.campaignManager.setPartyResource(type, value);
  }
}

export class PartyWeeksCommand extends CommandImpl {
  id: string = 'party.weeks';
  requiredParameters: number = 1;

  validParameters(value: number): boolean {
    return typeof value === 'number' && gameManager.campaignManager.canSetWeeks(value);
  }

  executeWithParameters(value: number) {
    gameManager.campaignManager.setWeeks(value);
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
