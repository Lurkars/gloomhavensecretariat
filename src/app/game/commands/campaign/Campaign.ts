import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';

export class CampaignStartCommand extends CommandImpl {
  id: string = 'campaign.start';
  requiredParameters: number = 2;

  validParameters(edition: string, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return gameManager.editions().includes(edition);
  }

  executeWithParameters(edition: string, seed: number) {
    gameManager.game.seed = seed;
    settingsManager.automaticTheme(edition, gameManager.game.edition);
    gameManager.game.edition = edition;
    gameManager.game.party.campaignMode = true;
    gameManager.game.party.edition = edition;
    gameManager.game.party.eventDecks = {};
    gameManager.eventCardManager.buildPartyDeckMigration(edition);
  }
}

export class CampaignCancelCommand extends CommandImpl {
  id: string = 'campaign.cancel';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return true;
  }

  executeWithParameters() {
    gameManager.game.edition = undefined;
    gameManager.game.party.campaignMode = false;
    gameManager.game.party.eventDecks = {};
  }
}

export class CampaignModeCommand extends CommandImpl {
  id: string = 'campaign.mode';
  requiredParameters: number = 1;

  validParameters(campaignMode: boolean): boolean {
    return typeof campaignMode === 'boolean';
  }

  executeWithParameters(campaignMode: boolean) {
    gameManager.game.party.campaignMode = campaignMode;
  }
}

export class CampaignResetCommand extends CommandImpl {
  id: string = 'campaign.reset';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return true;
  }

  executeWithParameters() {
    gameManager.campaignManager.resetCampaign();
  }
}
