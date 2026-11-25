import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findScenarioData, findSectionData } from 'src/app/game/commands/scenario/Scenario';
import { Scenario } from 'src/app/game/model/Scenario';

export class PartyScenarioSuccessCommand extends CommandImpl {
  id: string = 'party.scenario.success';
  requiredParameters: number = 2;

  validParameters(edition: string, index: string, group: string = '', conclusionIndex: string = '', force: boolean = false): boolean {
    const scenarioData = findScenarioData(edition, index, group);
    return (
      !!scenarioData &&
      typeof force === 'boolean' &&
      (!conclusionIndex || !!gameManager.scenarioFinishManager.scenarioConclusion(scenarioData, conclusionIndex)) &&
      gameManager.scenarioFinishManager.canAddScenarioSuccess(scenarioData, force)
    );
  }

  executeWithParameters(edition: string, index: string, group: string = '', conclusionIndex: string = '', force: boolean = false) {
    const scenarioData = findScenarioData(edition, index, group);
    if (scenarioData) {
      gameManager.scenarioFinishManager.addScenarioSuccess(
        scenarioData,
        conclusionIndex ? gameManager.scenarioFinishManager.scenarioConclusion(scenarioData, conclusionIndex) : undefined,
        force
      );
    } else {
      this.executionError('scenario not found');
    }
  }
}

export class PartyScenarioRemoveCommand extends CommandImpl {
  id: string = 'party.scenario.remove';
  requiredParameters: number = 2;

  validParameters(edition: string, index: string, group: string = '', casual: boolean = false): boolean {
    const scenarioData = findScenarioData(edition, index, group);
    return !!scenarioData && gameManager.scenarioFinishManager.canRemoveScenarioSuccess(scenarioData, !!casual);
  }

  executeWithParameters(edition: string, index: string, group: string = '', casual: boolean = false) {
    const scenarioData = findScenarioData(edition, index, group);
    if (!scenarioData || !gameManager.scenarioFinishManager.removeScenarioSuccess(scenarioData, !!casual)) {
      this.executionError('finished scenario not found');
    }
  }
}

export class PartyScenarioManualCommand extends CommandImpl {
  id: string = 'party.scenario.manual';
  requiredParameters: number = 3;

  validParameters(edition: string, index: string, value: boolean, group: string = ''): boolean {
    const scenarioData = findScenarioData(edition, index, group);
    return !!scenarioData && typeof value === 'boolean' && gameManager.campaignManager.canSetManualScenario(scenarioData, value);
  }

  executeWithParameters(edition: string, index: string, value: boolean, group: string = '') {
    const scenarioData = findScenarioData(edition, index, group);
    if (scenarioData) {
      gameManager.campaignManager.setManualScenario(scenarioData, value);
    } else {
      this.executionError('scenario not found');
    }
  }
}

export class PartyConclusionFinishCommand extends CommandImpl {
  id: string = 'party.conclusion.finish';
  requiredParameters: number = 2;

  validParameters(edition: string, index: string, group: string = '', week: number = -1): boolean {
    const sectionData = findSectionData(edition, index, group);
    return !!sectionData && sectionData.conclusion && typeof week === 'number';
  }

  executeWithParameters(edition: string, index: string, group: string = '', week: number = -1) {
    const sectionData = findSectionData(edition, index, group);
    if (sectionData) {
      gameManager.campaignManager.finishWeekConclusion(new Scenario(sectionData), week);
    } else {
      this.executionError('conclusion not found');
    }
  }
}

export class PartyConclusionRemoveCommand extends CommandImpl {
  id: string = 'party.conclusion.remove';
  requiredParameters: number = 2;

  validParameters(edition: string, index: string): boolean {
    return gameManager.game.party.conclusions.some((conclusion) => conclusion.edition === edition && conclusion.index === index);
  }

  executeWithParameters(edition: string, index: string) {
    gameManager.campaignManager.removeConclusion(edition, index);
  }
}

export class PartyWeekSectionCommand extends CommandImpl {
  id: string = 'party.weekSection';
  requiredParameters: number = 3;

  validParameters(week: number, section: string, value: boolean): boolean {
    return typeof week === 'number' && week >= 0 && typeof section === 'string' && !!section && typeof value === 'boolean';
  }

  executeWithParameters(week: number, section: string, value: boolean) {
    if (value) {
      gameManager.campaignManager.addWeekSection(week, section);
    } else {
      gameManager.campaignManager.removeWeekSection(week, section);
    }
  }
}
