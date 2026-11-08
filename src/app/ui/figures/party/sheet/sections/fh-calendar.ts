import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Scenario } from 'src/app/game/model/Scenario';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { PartySheetMapLinksComponent } from 'src/app/ui/figures/party/sheet/sections/map-links';
import { PartyWeekDialogComponent } from 'src/app/ui/figures/party/week-dialog/week-dialog';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsRangePipe, GhsTooltipDirective, PointerInputDirective, PartySheetMapLinksComponent],
  selector: 'ghs-party-sheet-fh-calendar',
  templateUrl: 'fh-calendar.html',
  styleUrls: ['../../../sheet.scss', './fh-calendar.scss']
})
export class PartySheetFhCalendarComponent extends PartySheetSection {
  readonly disableShortcuts = input<boolean>(false);
  readonly openCampaign = output<void>();

  calendarSheet: number = 0;
  summer: boolean = false;

  override update(): void {
    this.calendarSheet = Math.floor(Math.max(this.party.weeks - 1, 0) / 80);
    this.summer = Math.max(this.party.weeks, 0) % 20 < 10;
  }

  sectionsForWeekFixed(week: number): string[] {
    const campaign = gameManager.campaignManager.campaignData();
    if (campaign.weeks && campaign.weeks[week + 1]) {
      return campaign.weeks[week + 1] || [];
    }
    return [];
  }
  sectionsForWeek(week: number): string[] {
    if (this.party.weekSections && this.party.weekSections[week + 1]) {
      return this.party.weekSections[week + 1] || [];
    }
    return [];
  }
  setWeek(value: number) {
    if (
      settingsManager.settings.calendarLocked &&
      (settingsManager.settings.calendarLocked !== 'permissive' || (this.party.weeks !== value - 1 && this.party.weeks !== value))
    ) {
      return;
    }

    if (this.party.weeks === value) {
      value--;
    }
    if (value < 0) {
      value = 0;
    }

    const conclusions: string[] = [];
    for (let week = this.party.weeks; week < value; week++) {
      this.sectionsForWeekFixed(week).forEach((section) => {
        if (this.hasConclusions(section) && !conclusions.includes(section)) {
          conclusions.push(section);
        }
      });
      this.sectionsForWeek(week).forEach((section) => {
        if (this.hasConclusions(section) && !conclusions.includes(section)) {
          conclusions.push(section);
        }
      });
    }

    conclusions.forEach((conclusion) => {
      this.openConclusions(conclusion, value);
    });

    gameManager.stateManager.before('setPartyWeeks', value);
    for (let week = this.party.weeks; week < value; week++) {
      const sectionsForWeeks = [...this.sectionsForWeekFixed(week), ...this.sectionsForWeek(week)];
      sectionsForWeeks.forEach((section) => {
        const sectionData = gameManager
          .sectionData(gameManager.game.edition)
          .find((sectionData) => sectionData.index === section && sectionData.conclusion);
        if (
          sectionData &&
          !gameManager.game.party.conclusions.find(
            (model) => model.edition === sectionData.edition && model.index === sectionData.index && model.group === sectionData.group
          )
        ) {
          gameManager.scenarioManager.finishScenario(
            new Scenario(sectionData),
            true,
            undefined,
            false,
            false,
            false,
            gameManager.game.party.campaignMode,
            true
          );
        }
      });
    }
    this.party.weeks = value;
    gameManager.stateManager.after();
    this.update();
  }
  setWeekSection(week: number) {
    this.dialog.open(PartyWeekDialogComponent, {
      panelClass: ['dialog-invert'],
      data: week
    });
  }
}
