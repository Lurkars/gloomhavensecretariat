import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter, validSeed } from 'src/app/game/commands/CommandHelper';
import { LootType } from 'src/app/game/model/data/Loot';

export class ScenarioFinishOpenCommand extends CommandImpl {
  id: string = 'scenario.finish.open';
  requiredParameters: number = 1;

  validParameters(success: boolean, conclusionIndex: string = ''): boolean {
    return (
      typeof success === 'boolean' &&
      (!conclusionIndex || !!gameManager.scenarioFinishManager.conclusionSection(conclusionIndex)) &&
      gameManager.scenarioFinishManager.canOpenFinish()
    );
  }

  executeWithParameters(success: boolean, conclusionIndex: string = '') {
    gameManager.scenarioFinishManager.openFinish(success, gameManager.scenarioFinishManager.conclusionSection(conclusionIndex));
  }
}

export class ScenarioFinishCloseCommand extends CommandImpl {
  id: string = 'scenario.finish.close';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return gameManager.scenarioFinishManager.canCloseFinish();
  }

  executeWithParameters() {
    gameManager.scenarioFinishManager.closeFinish();
  }
}

export class ScenarioFinishBattleGoalCommand extends CommandImpl {
  id: string = 'scenario.finish.battleGoal';
  requiredParameters: number = 2;

  validParameters(number: number, value: number): boolean {
    return gameManager.scenarioFinishManager.canSetFinishBattleGoal(findCharacter(number), value);
  }

  executeWithParameters(number: number, value: number) {
    gameManager.scenarioFinishManager.setFinishBattleGoal(findCharacter(number), value);
  }
}

export class ScenarioFinishTrialCommand extends CommandImpl {
  id: string = 'scenario.finish.trial';
  requiredParameters: number = 2;

  validParameters(number: number, value: boolean): boolean {
    return gameManager.scenarioFinishManager.canSetFinishTrial(findCharacter(number), value);
  }

  executeWithParameters(number: number, value: boolean) {
    gameManager.scenarioFinishManager.setFinishTrial(findCharacter(number), value);
  }
}

export class ScenarioFinishChallengesCommand extends CommandImpl {
  id: string = 'scenario.finish.challenges';
  requiredParameters: number = 1;

  validParameters(value: number): boolean {
    return gameManager.scenarioFinishManager.canSetFinishChallenges(value);
  }

  executeWithParameters(value: number) {
    gameManager.scenarioFinishManager.setFinishChallenges(value);
  }
}

export class ScenarioFinishItemCommand extends CommandImpl {
  id: string = 'scenario.finish.item';
  requiredParameters: number = 3;

  validParameters(number: number, itemIndex: number, value: boolean): boolean {
    return gameManager.scenarioFinishManager.canSetFinishItem(findCharacter(number), itemIndex, value);
  }

  executeWithParameters(number: number, itemIndex: number, value: boolean) {
    gameManager.scenarioFinishManager.setFinishItem(findCharacter(number), itemIndex, value);
  }
}

export class ScenarioFinishRandomItemCommand extends CommandImpl {
  id: string = 'scenario.finish.randomItem';
  requiredParameters: number = 1;

  validParameters(number: number): boolean {
    const character = number === -1 ? undefined : findCharacter(number);
    return (number === -1 || !!character) && gameManager.scenarioFinishManager.canSetFinishRandomItem(character);
  }

  executeWithParameters(number: number) {
    gameManager.scenarioFinishManager.setFinishRandomItem(number === -1 ? undefined : findCharacter(number));
  }
}

export class ScenarioFinishCollectiveGoldCommand extends CommandImpl {
  id: string = 'scenario.finish.collectiveGold';
  requiredParameters: number = 2;

  validParameters(number: number, value: number): boolean {
    return gameManager.scenarioFinishManager.canSetFinishCollectiveGold(findCharacter(number), value);
  }

  executeWithParameters(number: number, value: number) {
    gameManager.scenarioFinishManager.setFinishCollectiveGold(findCharacter(number), value);
  }
}

export class ScenarioFinishCollectiveResourceCommand extends CommandImpl {
  id: string = 'scenario.finish.collectiveResource';
  requiredParameters: number = 3;

  validParameters(number: number, type: string, value: number): boolean {
    return gameManager.scenarioFinishManager.canSetFinishCollectiveResource(findCharacter(number), type as LootType, value);
  }

  executeWithParameters(number: number, type: LootType, value: number) {
    gameManager.scenarioFinishManager.setFinishCollectiveResource(findCharacter(number), type, value);
  }
}

export class ScenarioFinishCalendarSectionCommand extends CommandImpl {
  id: string = 'scenario.finish.calendarSection';
  requiredParameters: number = 2;

  validParameters(index: number, value: number): boolean {
    return gameManager.scenarioFinishManager.canSetFinishCalendarSection(index, value);
  }

  executeWithParameters(index: number, value: number) {
    gameManager.scenarioFinishManager.setFinishCalendarSection(index, value);
  }
}

export class ScenarioFinishLocationCommand extends CommandImpl {
  id: string = 'scenario.finish.location';
  requiredParameters: number = 1;

  validParameters(location: string): boolean {
    return gameManager.scenarioFinishManager.canSetFinishLocation(location);
  }

  executeWithParameters(location: string) {
    gameManager.scenarioFinishManager.setFinishLocation(location);
  }
}

export class ScenarioFinishUnlockCharacterCommand extends CommandImpl {
  id: string = 'scenario.finish.unlockCharacter';
  requiredParameters: number = 1;

  validParameters(name: string): boolean {
    return gameManager.scenarioFinishManager.canSetFinishUnlockCharacter(name);
  }

  executeWithParameters(name: string) {
    gameManager.scenarioFinishManager.setFinishUnlockCharacter(name);
  }
}

export class ScenarioFinishOverlayTextCommand extends CommandImpl {
  id: string = 'scenario.finish.overlayText';
  requiredParameters: number = 1;

  validParameters(text: string): boolean {
    return gameManager.scenarioFinishManager.canSetFinishOverlayText(text);
  }

  executeWithParameters(text: string) {
    gameManager.scenarioFinishManager.setFinishOverlayText(text);
  }
}

export class ScenarioFinishApplyCommand extends CommandImpl {
  id: string = 'scenario.finish.apply';
  requiredParameters: number = 1;

  validParameters(seed: number, linkedIndex: string = ''): boolean {
    return validSeed(seed) && gameManager.scenarioFinishManager.canApplyFinish(linkedIndex);
  }

  executeWithParameters(seed: number, linkedIndex: string = '', forcedLink: boolean = false) {
    gameManager.game.seed = seed;
    gameManager.scenarioFinishManager.applyFinish(linkedIndex, forcedLink);
  }
}

export class ScenarioFinishRestartCommand extends CommandImpl {
  id: string = 'scenario.finish.restart';
  requiredParameters: number = 1;

  validParameters(seed: number): boolean {
    return validSeed(seed) && gameManager.scenarioFinishManager.canRestartFinish();
  }

  executeWithParameters(seed: number) {
    gameManager.game.seed = seed;
    gameManager.scenarioFinishManager.restartFinish();
  }
}
