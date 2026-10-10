import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { storageManager } from 'src/app/game/businesslogic/StorageManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { validSeed } from 'src/app/game/commands/CommandHelper';
import { ConditionName } from 'src/app/game/model/data/Condition';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { Favor } from 'src/app/game/model/data/Trials';
import { GameModel } from 'src/app/game/model/Game';

export class GameEditionCommand extends CommandImpl {
  id: string = 'game.edition';
  requiredParameters: number = 1;

  validParameters(edition: string): boolean {
    return edition === '' || gameManager.editions().includes(edition);
  }

  executeWithParameters(edition: string) {
    if (edition) {
      settingsManager.automaticTheme(edition, gameManager.game.edition);
    }
    gameManager.game.edition = edition || undefined;
    gameManager.game.party.edition = edition || undefined;
  }
}

export class GameConditionCommand extends CommandImpl {
  id: string = 'game.condition';
  requiredParameters: number = 2;

  validParameters(name: string, value: boolean): boolean {
    return Object.values(ConditionName).includes(name as ConditionName) && name !== ConditionName.invalid && typeof value === 'boolean';
  }

  executeWithParameters(name: ConditionName, value: boolean) {
    gameManager.game.conditions = gameManager.game.conditions.filter((conditionName) => conditionName !== name);
    if (value) {
      gameManager.game.conditions.push(name);
    }
  }
}

export class GameFavorsKeepCommand extends CommandImpl {
  id: string = 'game.favors.keep';
  requiredParameters: number = 1;

  validParameters(keep: boolean): boolean {
    return typeof keep === 'boolean';
  }

  executeWithParameters(keep: boolean) {
    gameManager.game.keepFavors = keep;
  }
}

export class GameFavorsCommand extends CommandImpl {
  id: string = 'game.favors';
  requiredParameters: number = 0;

  availableFavors(): Favor[] {
    const editionData = gameManager.editionData.find(
      (editionData) => editionData.edition === gameManager.currentEdition() && editionData.favors
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

  validParameters(...values: (string | number)[]): boolean {
    const points = this.points();
    const favors = this.favors();
    const totalPoints = points.length ? points.reduce((a, b) => a + b) : 0;
    const spentPoints = favors.length ? favors.map((favor) => (favor ? favor.points : 0)).reduce((a, b) => a + b) : 0;
    return (
      values.every((value) => typeof value === 'string' || value === 1 || value === 2) &&
      favors.every((favor) => !!favor) &&
      totalPoints <= 7 &&
      spentPoints <= totalPoints
    );
  }

  executeWithParameters() {
    const gameFavorPoints = this.points();
    const favors = this.favors();
    const spentPoints = favors.length ? favors.map((favor) => favor.points).reduce((a, b) => a + b) : 0;
    let availablePoints = Math.min(Math.max((gameFavorPoints.length ? gameFavorPoints.reduce((a, b) => a + b) : 0) - spentPoints, 0), 7);

    while (availablePoints) {
      if (availablePoints > 2 && gameFavorPoints.includes(2)) {
        gameFavorPoints.splice(gameFavorPoints.indexOf(2), 1);
        availablePoints -= 2;
      } else if (gameFavorPoints.includes(1)) {
        gameFavorPoints.splice(gameFavorPoints.indexOf(1), 1);
        availablePoints--;
      } else {
        gameFavorPoints.splice(gameFavorPoints.indexOf(2), 1);
        availablePoints = Math.max(availablePoints - 2, 0);
      }
    }

    gameManager.game.favors = favors.map((favor) => new Identifier(favor.name, favor.edition));
    gameManager.game.favorPoints = gameFavorPoints;
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
    const deck = gameManager.game.monsterAttackModifierDeck;
    if (mode === 'disable') {
      gameManager.imbuementManager.disable(deck);
    } else if (mode === 'advanced') {
      gameManager.imbuementManager.advanced(deck);
    } else {
      gameManager.imbuementManager.enable(deck);
    }
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
      if (gameModel.revision < gameManager.game.revision) {
        storageManager.addBackup(gameManager.game.toModel());
        gameModel.revision = gameManager.game.revision;
        gameModel.revisionOffset = gameManager.game.revisionOffset;
      }
      if (gameModel.edition) {
        settingsManager.automaticTheme(gameModel.edition, gameManager.game.edition);
      }
      gameManager.game.fromModel(gameModel, false, true);
    } else {
      this.executionError('invalid game model');
    }
  }
}
