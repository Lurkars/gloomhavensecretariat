import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';

export class CampaignStartCommand extends CommandImpl {
  id: string = 'campaign.start';
  requiredParameters: number = 2;

  validParameters(edition: string, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return gameManager.editionManager.editions().includes(edition);
  }

  executeWithParameters(edition: string, seed: number) {
    gameManager.game.seed = seed;
    gameManager.campaignManager.startCampaign(edition);
  }
}

export class CampaignCancelCommand extends CommandImpl {
  id: string = 'campaign.cancel';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return true;
  }

  executeWithParameters() {
    gameManager.campaignManager.cancelCampaign();
  }
}

export class CampaignModeCommand extends CommandImpl {
  id: string = 'campaign.mode';
  requiredParameters: number = 1;

  validParameters(campaignMode: boolean): boolean {
    return typeof campaignMode === 'boolean';
  }

  executeWithParameters(campaignMode: boolean) {
    gameManager.campaignManager.setCampaignMode(campaignMode);
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
