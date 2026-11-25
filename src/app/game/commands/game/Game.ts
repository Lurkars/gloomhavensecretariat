import { gameManager } from 'src/app/game/businesslogic/Managers';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';
import { Condition, ConditionName, ConditionType } from 'src/app/game/model/data/Condition';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { Favor } from 'src/app/game/model/data/Trials';
import { GameModel } from 'src/app/game/model/Game';

export class GameEditionCommand extends CommandImpl {
  id: string = 'game.edition';
  requiredParameters: number = 1;

  validParameters(edition: string): boolean {
    return edition === '' || gameManager.editionManager.editions().includes(edition);
  }

  executeWithParameters(edition: string) {
    gameManager.setEdition(edition);
  }
}

export class GameConditionCommand extends CommandImpl {
  id: string = 'game.condition';
  requiredParameters: number = 2;

  validParameters(name: string, value: boolean): boolean {
    return (
      Object.values(ConditionName).includes(name as ConditionName) &&
      name !== ConditionName.invalid &&
      !new Condition(name).types.includes(ConditionType.immunityOnly) &&
      typeof value === 'boolean'
    );
  }

  executeWithParameters(name: ConditionName, value: boolean) {
    gameManager.conditionManager.setGameCondition(name, value);
  }
}

export class GameFavorsKeepCommand extends CommandImpl {
  id: string = 'game.favors.keep';
  requiredParameters: number = 1;

  validParameters(keep: boolean): boolean {
    return typeof keep === 'boolean';
  }

  executeWithParameters(keep: boolean) {
    gameManager.trialsManager.setKeepFavors(keep);
  }
}

export class GameFavorsCommand extends CommandImpl {
  id: string = 'game.favors';
  requiredParameters: number = 0;

  availableFavors(): Favor[] {
    const editionData = gameManager.editionManager.editionData.find(
      (editionData) => editionData.edition === gameManager.editionManager.currentEdition() && editionData.favors
    );
    return (editionData && editionData.favors) || [];
  }

  points(): number[] {
    return this.parameters.filter((value) => typeof value === 'number') as number[];
  }

  favors(): Favor[] {
    return (this.parameters.filter((value) => typeof value === 'string') as string[]).map(
      (name) => this.availableFavors().find((favor) => favor.name === name) as Favor
    );
  }

  identifiers(): Identifier[] | undefined {
    const favors = this.favors();
    return favors.every((favor) => !!favor) ? favors.map((favor) => new Identifier(favor.name, favor.edition)) : undefined;
  }

  force(): boolean {
    return this.parameters.includes(true);
  }

  validParameters(...values: (string | number | boolean)[]): boolean {
    const identifiers = this.identifiers();
    return (
      values.every((value) => typeof value === 'string' || typeof value === 'number' || value === true) &&
      !!identifiers &&
      gameManager.trialsManager.canApplyFavors(identifiers, this.points(), this.force())
    );
  }

  executeWithParameters() {
    const identifiers = this.identifiers();
    if (identifiers) {
      gameManager.trialsManager.applyFavors(identifiers, this.points(), this.force());
    }
  }
}

export class GameImbuementCommand extends CommandImpl {
  id: string = 'game.imbuement';
  requiredParameters: number = 2;

  validParameters(mode: string, seed: number): boolean {
    if (!validSeed(seed)) {
      return false;
    }
    return ['enable', 'advanced', 'disable'].includes(mode);
  }

  executeWithParameters(mode: string, seed: number) {
    gameManager.game.seed = seed;
    gameManager.imbuementManager.setMode(mode as 'enable' | 'advanced' | 'disable');
  }
}

export class GameImportCommand extends CommandImpl {
  id: string = 'game.import';
  requiredParameters: number = 1;

  model(json: BASE_TYPE): GameModel | undefined {
    try {
      const gameModel = JSON.parse(json as string) as GameModel;
      return gameModel && typeof gameModel === 'object' && Array.isArray(gameModel.figures) ? gameModel : undefined;
    } catch {
      return undefined;
    }
  }

  validParameters(json: string): boolean {
    return typeof json === 'string' && !!this.model(json);
  }

  executeWithParameters(json: string) {
    const gameModel = this.model(json);
    if (gameModel) {
      gameManager.importGame(gameModel);
    } else {
      this.executionError('invalid game model');
    }
  }
}
