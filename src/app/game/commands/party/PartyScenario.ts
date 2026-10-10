import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findScenarioData, findSectionData } from 'src/app/game/commands/scenario/Scenario';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { GameScenarioModel, Scenario } from 'src/app/game/model/Scenario';

function sameScenario(model: GameScenarioModel, scenarioData: ScenarioData): boolean {
  return model.index === scenarioData.index && model.edition === scenarioData.edition && model.group === scenarioData.group;
}

export class PartyScenarioSuccessCommand extends CommandImpl {
  id: string = 'party.scenario.success';
  requiredParameters: number = 2;

  conclusion(scenarioData: ScenarioData, index: BASE_TYPE): ScenarioData | undefined {
    return index
      ? gameManager
          .sectionData(scenarioData.edition)
          .find(
            (sectionData) =>
              sectionData.index === index &&
              sectionData.group === scenarioData.group &&
              sectionData.parent === scenarioData.index &&
              sectionData.conclusion
          )
      : undefined;
  }

  validParameters(edition: string, index: string, group: string = '', conclusionIndex: string = ''): boolean {
    const scenarioData = findScenarioData(edition, index, group);
    return !!scenarioData && (!conclusionIndex || !!this.conclusion(scenarioData, conclusionIndex));
  }

  executeWithParameters(edition: string, index: string, group: string = '', conclusionIndex: string = '') {
    const scenarioData = findScenarioData(edition, index, group);
    if (scenarioData) {
      const finished = gameManager.game.party.scenarios.filter((model) => sameScenario(model, scenarioData)).length;
      gameManager.scenarioManager.finishScenario(
        new Scenario(scenarioData),
        true,
        this.conclusion(scenarioData, conclusionIndex),
        false,
        false,
        false,
        gameManager.game.party.campaignMode && finished === 0,
        true
      );
    } else {
      this.executionError('scenario not found');
    }
  }
}

export class PartyScenarioRemoveCommand extends CommandImpl {
  id: string = 'party.scenario.remove';
  requiredParameters: number = 2;

  scenarios(casual: BASE_TYPE): GameScenarioModel[] {
    return casual ? gameManager.game.party.casualScenarios : gameManager.game.party.scenarios;
  }

  validParameters(edition: string, index: string, group: string = '', casual: boolean = false): boolean {
    const scenarioData = findScenarioData(edition, index, group);
    return !!scenarioData && this.scenarios(casual).some((model) => sameScenario(model, scenarioData));
  }

  executeWithParameters(edition: string, index: string, group: string = '', casual: boolean = false) {
    const scenarioData = findScenarioData(edition, index, group);
    const scenarios = this.scenarios(casual);
    const value = scenarioData && scenarios.find((model) => sameScenario(model, scenarioData));
    if (value) {
      scenarios.splice(scenarios.indexOf(value), 1);
    } else {
      this.executionError('finished scenario not found');
    }
  }
}

export class PartyScenarioManualCommand extends CommandImpl {
  id: string = 'party.scenario.manual';
  requiredParameters: number = 3;

  manual(scenarioData: ScenarioData): GameScenarioModel | undefined {
    return gameManager.game.party.manualScenarios.find((model) => sameScenario(model, scenarioData));
  }

  validParameters(edition: string, index: string, value: boolean, group: string = ''): boolean {
    const scenarioData = findScenarioData(edition, index, group);
    return (
      !!scenarioData &&
      typeof value === 'boolean' &&
      (!value ||
        !!this.manual(scenarioData) ||
        !gameManager.scenarioManager
          .scenarioData(scenarioData.edition, false)
          .some(
            (available) =>
              available.edition === scenarioData.edition && available.group === scenarioData.group && available.index === scenarioData.index
          ))
    );
  }

  executeWithParameters(edition: string, index: string, value: boolean, group: string = '') {
    const scenarioData = findScenarioData(edition, index, group);
    if (scenarioData) {
      const manual = this.manual(scenarioData);
      if (manual && !value) {
        gameManager.game.party.manualScenarios.splice(gameManager.game.party.manualScenarios.indexOf(manual), 1);
      } else if (!manual && value) {
        gameManager.game.party.manualScenarios.push(new GameScenarioModel(scenarioData.index, scenarioData.edition, scenarioData.group));
      }
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
      const scenario = new Scenario(sectionData);
      gameManager.scenarioManager.finishScenario(scenario, true, scenario, false, false, false, gameManager.game.party.campaignMode, true);
      if (week !== -1 && !scenario.repeatable) {
        gameManager.game.party.weekSections[week] = [...(gameManager.game.party.weekSections[week] || []), scenario.index];
      }
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
    gameManager.game.party.conclusions = gameManager.game.party.conclusions.filter(
      (conclusion) => conclusion.edition !== edition || conclusion.index !== index
    );
  }
}

export class PartyWeekSectionCommand extends CommandImpl {
  id: string = 'party.weekSection';
  requiredParameters: number = 3;

  has(week: BASE_TYPE, section: BASE_TYPE): boolean {
    return (gameManager.game.party.weekSections[week as number] || []).includes(section as string);
  }

  validParameters(week: number, section: string, value: boolean): boolean {
    return typeof week === 'number' && week >= 0 && typeof section === 'string' && !!section && typeof value === 'boolean';
  }

  executeWithParameters(week: number, section: string, value: boolean) {
    const party = gameManager.game.party;
    if (this.has(week, section) === value) {
      return;
    }
    if (!value) {
      const sections = party.weekSections[week] || [];
      sections.splice(sections.indexOf(section), 1);
      if (sections.length === 0) {
        delete party.weekSections[week];
      }
      party.conclusions = party.conclusions.filter(
        (conclusion) => conclusion.edition !== gameManager.game.edition || conclusion.index !== section
      );
    } else {
      party.weekSections[week] = [...(party.weekSections[week] || []), section];
    }
  }
}
