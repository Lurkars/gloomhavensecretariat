import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { AutocompleteDirective, AutocompleteItem } from 'src/app/ui/helper/autocomplete';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsTooltipDirective, AutocompleteDirective],
  selector: 'ghs-party-sheet-fh-campaign-stickers',
  templateUrl: 'fh-campaign-stickers.html',
  styleUrls: ['../../../sheet.scss', './fh-campaign-stickers.scss']
})
export class PartySheetFhCampaignStickersComponent extends PartySheetSection {
  campaignStickers: AutocompleteItem[] = [];

  override update(): void {
    this.campaignStickers = [];
    const editionData = gameManager.editionData.find((editionData) => this.edition() && editionData.edition === this.edition());
    [editionData, ...(editionData?.extends || []).map((extension) => gameManager.editionData.find((other) => other.edition === extension))]
      .filter((data) => !!data)
      .forEach((data) => {
        if (data.campaign && data.campaign.campaignStickers) {
          this.campaignStickers.push(
            ...data.campaign.campaignStickers.map((sticker) => {
              sticker = sticker.split(':')[0];
              return new AutocompleteItem(
                settingsManager.getLabel('data.campaignSticker.' + sticker),
                sticker,
                this.party.campaignStickers.includes(sticker)
              );
            })
          );
        }
      });
  }

  addCampaignSticker(campaignStickerElement: HTMLInputElement) {
    const stickerLabel = campaignStickerElement.value;
    const sticker = this.campaignStickers.find((item) => item.label === stickerLabel);

    if (sticker) {
      this.party.campaignStickers = this.party.campaignStickers || [];

      let total = 0;
      const campaign = gameManager.campaignManager.campaignData();
      if (campaign.campaignStickers) {
        const campaignSticker = campaign.campaignStickers.find((campaignSticker) => campaignSticker.startsWith(sticker.value));
        if (campaignSticker) {
          total = campaignSticker.includes(':') ? +campaignSticker.split(':')[1] : 1;
        }
      }

      const count = this.party.campaignStickers.filter((campaignSticker) => campaignSticker.toLowerCase() === sticker.value).length;

      if (count < total) {
        gameManager.stateManager.before('addCampaignSticker', sticker.label);
        this.party.campaignStickers.push(sticker.value);
        campaignStickerElement.value = '';
        gameManager.stateManager.after();
        this.update();
      }
    }
  }
  removeCampaignSticker(campaignSticker: string) {
    const index = this.party.campaignStickers.indexOf(campaignSticker);
    if (index !== -1) {
      gameManager.stateManager.before('removeCampaignSticker', campaignSticker);
      this.party.campaignStickers.splice(index, 1);
      gameManager.stateManager.after();
      this.update();
    }
  }
  campaignStickerImage(sticker: string, stickerIndex: number): string | undefined {
    const campaign = gameManager.campaignManager.campaignData();

    let total = 0;
    if (campaign.campaignStickers) {
      const campaignSticker = campaign.campaignStickers.find(
        (campaignSticker) => campaignSticker === sticker || campaignSticker.startsWith(sticker)
      );
      if (campaignSticker) {
        if (campaignSticker.includes(':')) {
          total = +campaignSticker.split(':')[1];
        } else {
          total = 1;
        }
      }
    }

    if (total === 1) {
      return './assets/images/fh/party/campaign-stickers/' + sticker + '.png';
    } else if (total > 1) {
      const mappedSticker = this.party.campaignStickers.map((sticker, index) => {
        return { sticker: sticker.toLowerCase().replaceAll(' ', '-'), origIndex: index };
      });
      const mapped = mappedSticker
        .filter((value) => value.sticker === sticker)
        .map((value, index) => {
          return { sticker: value.sticker, origIndex: value.origIndex, index: index + 1 };
        })
        .find((value) => value.origIndex === stickerIndex);
      if (mapped) {
        return './assets/images/fh/party/campaign-stickers/' + sticker + '-' + mapped.index + '.png';
      }
    }
    return undefined;
  }
}
