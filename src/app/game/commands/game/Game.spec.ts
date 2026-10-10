import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CampaignCancelCommand, CampaignModeCommand, CampaignStartCommand } from 'src/app/game/commands/campaign/Campaign';
import { createTestCharacter, createTestEdition, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { ElementStateCommand } from 'src/app/game/commands/element/ElementState';
import {
  GameConditionCommand,
  GameEditionCommand,
  GameFavorsCommand,
  GameFavorsKeepCommand,
  GameImbuementCommand,
  GameImportCommand
} from 'src/app/game/commands/game/Game';
import { GameClockCommand, GameClockMergeCommand } from 'src/app/game/commands/game/GameClock';
import { ConditionName } from 'src/app/game/model/data/Condition';
import { Element, ElementState } from 'src/app/game/model/data/Element';
import { Favor } from 'src/app/game/model/data/Trials';
import { GameClockTimestamp } from 'src/app/game/model/Game';

describe('Game commands', () => {
  beforeEach(() => {
    resetTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets an element state', () => {
    new ElementStateCommand(Element.fire, ElementState.strong).execute();
    expect(gameManager.game.elementBoard.find((element) => element.type === Element.fire)?.state).toBe(ElementState.strong);
    expect(new ElementStateCommand(Element.fire, 'hot').validParameters(Element.fire, 'hot')).toBe(false);
  });

  it('clocks in, out and merges game clock entries', () => {
    expect(new GameClockCommand(false, 5).validParameters(false, 5)).toBe(false);
    new GameClockCommand(true, 5).execute();
    expect(gameManager.game.gameClock).toEqual([new GameClockTimestamp(5)]);
    expect(new GameClockCommand(true, 6).validParameters(true, 6)).toBe(false);
    expect(new GameClockCommand(false, 4).validParameters(false, 4)).toBe(false);
    new GameClockCommand(false, 8).execute();
    expect(gameManager.game.gameClock).toEqual([new GameClockTimestamp(5, 8)]);

    gameManager.game.gameClock = [new GameClockTimestamp(30, 40), new GameClockTimestamp(10, 20)];
    expect(new GameClockMergeCommand(30).validParameters(30)).toBe(false);
    new GameClockMergeCommand(10).execute();
    expect(gameManager.game.gameClock.length).toBe(1);
    expect(gameManager.game.gameClock[0].clockIn).toBe(10);
  });

  it('sets the edition and game conditions', () => {
    createTestEdition();
    vi.spyOn(settingsManager, 'automaticTheme').mockImplementation(() => {});
    new GameEditionCommand('test').execute();
    expect(gameManager.game.edition).toBe('test');
    expect(gameManager.game.party.edition).toBe('test');
    new GameEditionCommand('').execute();
    expect(gameManager.game.edition).toBeUndefined();

    new GameConditionCommand(ConditionName.bane, true).execute();
    new GameConditionCommand(ConditionName.bane, true).execute();
    expect(gameManager.game.conditions).toEqual([ConditionName.bane]);
    new GameConditionCommand(ConditionName.bane, false).execute();
    expect(gameManager.game.conditions).toEqual([]);
  });

  it('sets keeping favors and applies a favor selection', () => {
    new GameFavorsKeepCommand(true).execute();
    expect(gameManager.game.keepFavors).toBe(true);

    createTestEdition({ favors: [Object.assign(new Favor(), { name: 'wealth', edition: 'test', points: 2 })] });
    vi.spyOn(gameManager, 'currentEdition').mockReturnValue('test');
    expect(new GameFavorsCommand(1, 'wealth').validParameters(1, 'wealth')).toBe(false);
    new GameFavorsCommand(2, 1, 'wealth').execute();
    expect(gameManager.game.favors.map((favor) => favor.name)).toEqual(['wealth']);
    expect(gameManager.game.favorPoints).toEqual([2]);
  });

  it('toggles the imbuement mode', () => {
    const enable = vi.spyOn(gameManager.imbuementManager, 'enable').mockImplementation(() => {});
    const disable = vi.spyOn(gameManager.imbuementManager, 'disable').mockImplementation(() => {});
    new GameImbuementCommand('enable', 1).execute();
    new GameImbuementCommand('disable', 1).execute();
    expect(enable).toHaveBeenCalled();
    expect(disable).toHaveBeenCalled();
    expect(new GameImbuementCommand('max', 1).validParameters('max', 1)).toBe(false);
  });

  it('imports a game model', () => {
    createTestCharacter(1);
    const fromModel = vi.spyOn(gameManager.game, 'fromModel').mockImplementation(() => {});
    const model = gameManager.game.toModel();
    new GameImportCommand(JSON.stringify(model)).execute();
    expect(fromModel).toHaveBeenCalled();
    expect(new GameImportCommand('{"no":"game"}').validParameters('{"no":"game"}')).toBe(false);
  });

  describe('campaign commands', () => {
    it('starts, toggles and cancels a campaign', () => {
      createTestEdition();
      vi.spyOn(settingsManager, 'automaticTheme').mockImplementation(() => {});
      vi.spyOn(gameManager.eventCardManager, 'buildPartyDeckMigration').mockImplementation(() => {});
      new CampaignStartCommand('test', 1).execute();
      expect(gameManager.game.edition).toBe('test');
      expect(gameManager.game.party.campaignMode).toBe(true);

      new CampaignModeCommand(false).execute();
      expect(gameManager.game.party.campaignMode).toBe(false);

      new CampaignCancelCommand().execute();
      expect(gameManager.game.edition).toBeUndefined();
      expect(new CampaignStartCommand('unknown', 1).validParameters('unknown', 1)).toBe(false);
    });
  });
});
