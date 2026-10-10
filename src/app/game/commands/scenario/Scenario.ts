import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';
import { RoomData } from 'src/app/game/model/data/RoomData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Scenario } from 'src/app/game/model/Scenario';

export function findScenarioData(edition: BASE_TYPE | undefined, index: BASE_TYPE | undefined, group: BASE_TYPE | undefined) {
  if (typeof edition !== 'string' || typeof index !== 'string') {
    return undefined;
  }
  return gameManager.scenarioManager.getScenario(index, edition, (group as string) || undefined);
}

export function findSectionData(edition: BASE_TYPE | undefined, index: BASE_TYPE | undefined, group: BASE_TYPE | undefined) {
  if (typeof edition !== 'string' || typeof index !== 'string') {
    return undefined;
  }
  return gameManager.scenarioManager.getSection(index, edition, (group as string) || undefined);
}

export class ScenarioSetCommand extends CommandImpl {
  id: string = 'scenario.set';
  requiredParameters: number = 3;

  validParameters(edition: string, index: string, seed: number, group: string = ''): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    const scenarioData = findScenarioData(edition, index, group);
    return !!scenarioData && !gameManager.scenarioManager.isCurrent(scenarioData);
  }

  executeWithParameters(edition: string, index: string, seed: number, group: string = '', linked: boolean = false) {
    gameManager.game.seed = seed;
    const scenarioData = findScenarioData(edition, index, group);
    if (scenarioData) {
      gameManager.scenarioManager.setScenario(new Scenario(scenarioData), linked);
    } else {
      this.executionError('scenario not found');
    }
  }
}

export class ScenarioResetCommand extends CommandImpl {
  id: string = 'scenario.reset';
  requiredParameters: number = 1;

  validParameters(seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return true;
  }

  executeWithParameters(seed: number) {
    gameManager.game.seed = seed;
    gameManager.roundManager.resetScenario();
    if (gameManager.game.scenario) {
      gameManager.scenarioManager.setScenario(gameManager.game.scenario);
    }
  }
}

export class ScenarioCancelCommand extends CommandImpl {
  id: string = 'scenario.cancel';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return !!gameManager.game.scenario;
  }

  executeWithParameters() {
    gameManager.scenarioManager.setScenario(undefined);
  }
}

export class ScenarioCustomCommand extends CommandImpl {
  id: string = 'scenario.custom';
  requiredParameters: number = 1;

  validParameters(custom: boolean): boolean {
    return typeof custom === 'boolean';
  }

  executeWithParameters(custom: boolean) {
    const isCustom = !!gameManager.game.scenario && gameManager.game.scenario.custom;
    if (custom && !isCustom) {
      gameManager.scenarioManager.setScenario(gameManager.scenarioManager.createScenario());
    } else if (!custom && isCustom) {
      gameManager.scenarioManager.setScenario(undefined);
    }
  }
}

export class ScenarioCustomNameCommand extends CommandImpl {
  id: string = 'scenario.customName';
  requiredParameters: number = 1;

  validParameters(name: string): boolean {
    return typeof name === 'string' && !!gameManager.game.scenario && gameManager.game.scenario.custom;
  }

  executeWithParameters(name: string) {
    if (gameManager.game.scenario) {
      gameManager.game.scenario.name = name;
    }
  }
}

export class ScenarioRandomCommand extends CommandImpl {
  id: string = 'scenario.random';
  requiredParameters: number = 2;

  sections(edition: BASE_TYPE): ScenarioData[] {
    return gameManager.sectionData(edition as string).filter((sectionData) => sectionData.group === 'randomMonsterCard');
  }

  validParameters(edition: string, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return typeof edition === 'string' && this.sections(edition).length >= 3;
  }

  executeWithParameters(edition: string, seed: number) {
    gameManager.game.seed = seed;
    const shuffledSections: ScenarioData[] = gameManager.randomManager.shuffle(this.sections(edition));
    const scenario = gameManager.scenarioManager.createScenario();
    scenario.name = '%scenario.random%';
    scenario.additionalSections = shuffledSections.slice(0, 3).map((sectionData) => sectionData.index);
    gameManager.scenarioManager.setScenario(undefined);
    gameManager.scenarioManager.setScenario(scenario);
    gameManager.scenarioManager.addSection(shuffledSections[0]);
  }
}

export class ScenarioRoomCommand extends CommandImpl {
  id: string = 'scenario.room';
  requiredParameters: number = 2;

  room(roomNumber: BASE_TYPE, sectionIndex: BASE_TYPE): { roomData: RoomData; scenario: ScenarioData } | undefined {
    const scenario = gameManager.game.scenario;
    if (!scenario) {
      return undefined;
    }
    const source: ScenarioData | undefined = sectionIndex
      ? gameManager.game.sections.find((section) => section.index === sectionIndex)
      : scenario;
    const roomData = source && source.rooms && source.rooms.find((room) => room.roomNumber === roomNumber);
    return source && roomData ? { roomData: roomData, scenario: source } : undefined;
  }

  validParameters(roomNumber: number, seed: number, sectionIndex: string = ''): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    const scenario = gameManager.game.scenario;
    return (
      typeof roomNumber === 'number' &&
      !!scenario &&
      !!this.room(roomNumber, sectionIndex) &&
      !(scenario.revealedRooms || []).includes(roomNumber)
    );
  }

  executeWithParameters(roomNumber: number, seed: number, sectionIndex: string = '') {
    gameManager.game.seed = seed;
    const room = this.room(roomNumber, sectionIndex);
    if (room) {
      gameManager.scenarioManager.openRoom(room.roomData, room.scenario, false);
    } else {
      this.executionError('room not found');
    }
  }
}

export class ScenarioSectionCommand extends CommandImpl {
  id: string = 'scenario.section';
  requiredParameters: number = 3;

  validParameters(edition: string, index: string, seed: number, group: string = ''): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    const sectionData = findSectionData(edition, index, group);
    return (
      !!sectionData &&
      !!gameManager.game.scenario &&
      !gameManager.game.sections.some(
        (section) => section.index === sectionData.index && section.edition === sectionData.edition && section.group === sectionData.group
      )
    );
  }

  executeWithParameters(edition: string, index: string, seed: number, group: string = '') {
    gameManager.game.seed = seed;
    const sectionData = findSectionData(edition, index, group);
    if (sectionData) {
      gameManager.scenarioManager.addSection(sectionData);
    } else {
      this.executionError('section not found');
    }
  }
}
