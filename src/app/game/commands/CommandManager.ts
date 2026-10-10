import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { AttackModifierDeckDrawCommand } from 'src/app/game/commands/attackModifierDeck/AttackModifierDeckDraw';
import {
  AttackModifierDeckActiveCommand,
  AttackModifierDeckAddCardCommand,
  AttackModifierDeckAdditionalCommand,
  AttackModifierDeckChangeCommand,
  AttackModifierDeckDiscardCommand,
  AttackModifierDeckFactionCommand,
  AttackModifierDeckMoveCommand,
  AttackModifierDeckRemoveCardCommand,
  AttackModifierDeckRemoveDrawnDiscardsCommand,
  AttackModifierDeckRestoreCardCommand,
  AttackModifierDeckRestoreDefaultCommand,
  AttackModifierDeckRevealCommand,
  AttackModifierDeckShuffleCommand
} from 'src/app/game/commands/attackModifierDeck/AttackModifierDeckEdit';
import {
  BuildingAddCommand,
  BuildingDowngradeCommand,
  BuildingRepairCommand,
  BuildingStateCommand,
  BuildingUpgradeCommand,
  GardenAutomationCommand,
  GardenFlipCommand,
  GardenHarvestCommand,
  GardenPlantCommand,
  OutpostBuildingAttackedCommand,
  PetActiveCommand,
  PetCommand,
  PetLostCommand,
  PetNameCommand
} from 'src/app/game/commands/building/Building';
import {
  CampaignCancelCommand,
  CampaignModeCommand,
  CampaignResetCommand,
  CampaignStartCommand
} from 'src/app/game/commands/campaign/Campaign';
import {
  ChallengeDeckActiveCommand,
  ChallengeDeckClearCommand,
  ChallengeDeckDrawCommand,
  ChallengeDeckKeepCommand,
  ChallengeDeckMoveCommand,
  ChallengeDeckRemoveCardCommand,
  ChallengeDeckRestoreCardCommand,
  ChallengeDeckShuffleCommand
} from 'src/app/game/commands/challengeDeck/ChallengeDeck';
import { CharacterAbilityDeckCommand } from 'src/app/game/commands/character/CharacterAbilityDeck';
import { CharacterAbilityDeckResetCommand } from 'src/app/game/commands/character/CharacterAbilityDeckReset';
import { CharacterAbilityDeckUndoCommand } from 'src/app/game/commands/character/CharacterAbilityDeckUndo';
import { CharacterAbsentCommand } from 'src/app/game/commands/character/CharacterAbsent';
import { CharacterAddCommand } from 'src/app/game/commands/character/CharacterAdd';
import { CharacterBattleGoalDrawCommand } from 'src/app/game/commands/character/CharacterBattleGoalDraw';
import { CharacterBattleGoalDrawCardCommand } from 'src/app/game/commands/character/CharacterBattleGoalDrawCard';
import { CharacterBattleGoalSelectCommand } from 'src/app/game/commands/character/CharacterBattleGoalSelect';
import { CharacterConditionCommand } from 'src/app/game/commands/character/CharacterCondition';
import { CharacterDonateCommand } from 'src/app/game/commands/character/CharacterDonate';
import { CharacterEnhancementAddCommand } from 'src/app/game/commands/character/CharacterEnhancementAdd';
import { CharacterEnhancementRemoveCommand } from 'src/app/game/commands/character/CharacterEnhancementRemove';
import { CharacterExhaustedCommand } from 'src/app/game/commands/character/CharacterExhausted';
import { CharacterHpCommand } from 'src/app/game/commands/character/CharacterHp';
import { CharacterIdentityCommand } from 'src/app/game/commands/character/CharacterIdentity';
import { CharacterImportCommand } from 'src/app/game/commands/character/CharacterImport';
import { CharacterInitiativeCommand } from 'src/app/game/commands/character/CharacterInitiative';
import {
  CharacterItemAddCommand,
  CharacterItemBuyCommand,
  CharacterItemCraftCommand,
  CharacterItemDistillCommand,
  CharacterItemEquipCommand,
  CharacterItemRemoveCommand,
  CharacterItemSellCommand,
  CharacterItemShareCommand
} from 'src/app/game/commands/character/CharacterItem';
import { CharacterItemBrewCommand } from 'src/app/game/commands/character/CharacterItemBrew';
import { CharacterItemFlagCommand, CharacterItemFlagCountCommand } from 'src/app/game/commands/character/CharacterItemFlag';
import { CharacterLevelCommand } from 'src/app/game/commands/character/CharacterLevel';
import { CharacterLongRestCommand } from 'src/app/game/commands/character/CharacterLongRest';
import { CharacterLootCommand } from 'src/app/game/commands/character/CharacterLoot';
import { CharacterLootDrawCommand } from 'src/app/game/commands/character/CharacterLootDraw';
import { CharacterMarkerCommand } from 'src/app/game/commands/character/CharacterMarker';
import { CharacterMasteryCommand } from 'src/app/game/commands/character/CharacterMastery';
import { CharacterMoveResourceCommand } from 'src/app/game/commands/character/CharacterMoveResource';
import { CharacterPerkCommand } from 'src/app/game/commands/character/CharacterPerk';
import { CharacterPersonalQuestCommand } from 'src/app/game/commands/character/CharacterPersonalQuest';
import { CharacterPersonalQuestAutotrackCommand } from 'src/app/game/commands/character/CharacterPersonalQuestAutotrack';
import { CharacterPersonalQuestProgressCommand } from 'src/app/game/commands/character/CharacterPersonalQuestProgress';
import { CharacterPlayerNumberCommand } from 'src/app/game/commands/character/CharacterPlayerNumber';
import { CharacterProgressExperienceCommand } from 'src/app/game/commands/character/CharacterProgressExperience';
import { CharacterProgressResourceCommand } from 'src/app/game/commands/character/CharacterProgressResource';
import { CharacterProgressSetCommand } from 'src/app/game/commands/character/CharacterProgressSet';
import { CharacterRemoveCommand } from 'src/app/game/commands/character/CharacterRemove';
import { CharacterRemoveAllCommand } from 'src/app/game/commands/character/CharacterRemoveAll';
import { CharacterReplayCommand } from 'src/app/game/commands/character/CharacterReplay';
import { CharacterRetireCommand } from 'src/app/game/commands/character/CharacterRetire';
import { CharacterSetAsideCommand } from 'src/app/game/commands/character/CharacterSetAside';
import { CharacterSpecialActionSlotCommand } from 'src/app/game/commands/character/CharacterSpecialActionSlot';
import { CharacterTokenCommand } from 'src/app/game/commands/character/CharacterToken';
import { CharacterTokenValueCommand } from 'src/app/game/commands/character/CharacterTokenValue';
import { CharacterTrialCommand } from 'src/app/game/commands/character/CharacterTrial';
import {
  CharacterUnlockAllCommand,
  CharacterUnlockCommand,
  CharacterUnlockResetCommand
} from 'src/app/game/commands/character/CharacterUnlock';
import { CharacterXpCommand } from 'src/app/game/commands/character/CharacterXp';
import {
  BASE_TYPE,
  Command,
  CommandExecutionError,
  CommandInvalidParametersError,
  CommandMissingParameterError,
  CommandUnknownError
} from 'src/app/game/commands/Command';
import { ElementStateCommand } from 'src/app/game/commands/element/ElementState';
import { ElementToggleCommand } from 'src/app/game/commands/element/ElementToggle';
import { EntityActiveCommand } from 'src/app/game/commands/entity/EntityActive';
import { EntityAttackModifierCommand } from 'src/app/game/commands/entity/EntityAttackModifier';
import { EntityConditionCommand } from 'src/app/game/commands/entity/EntityCondition';
import { EntityConditionApplyCommand } from 'src/app/game/commands/entity/EntityConditionApply';
import { EntityConditionValueCommand } from 'src/app/game/commands/entity/EntityConditionValue';
import { EntityDeadCommand } from 'src/app/game/commands/entity/EntityDead';
import { EntityExtraActionRemoveCommand } from 'src/app/game/commands/entity/EntityExtraActionRemove';
import { EntityExtraActionResolveCommand } from 'src/app/game/commands/entity/EntityExtraActionResolve';
import { EntityHpCommand } from 'src/app/game/commands/entity/EntityHp';
import { EntityImmunityCommand } from 'src/app/game/commands/entity/EntityImmunity';
import { EntityMarkerCommand } from 'src/app/game/commands/entity/EntityMarker';
import { EntityMaxHpCommand } from 'src/app/game/commands/entity/EntityMaxHp';
import { EntityNumberCommand } from 'src/app/game/commands/entity/EntityNumber';
import { EntityObjectiveMarkerCommand } from 'src/app/game/commands/entity/EntityObjectiveMarker';
import { EntityRetaliateCommand } from 'src/app/game/commands/entity/EntityRetaliate';
import { EntityShieldCommand } from 'src/app/game/commands/entity/EntityShield';
import { EntitySpecialActionCommand } from 'src/app/game/commands/entity/EntitySpecialAction';
import { EntitySummonStateCommand } from 'src/app/game/commands/entity/EntitySummonState';
import { EntityTitleCommand } from 'src/app/game/commands/entity/EntityTitle';
import { EntityTypeCommand } from 'src/app/game/commands/entity/EntityType';
import {
  EventDeckAddCommand,
  EventDeckMarkDrawnCommand,
  EventDeckMoveCommand,
  EventDeckRemoveCommand,
  EventDeckRemoveDrawnCommand,
  EventDeckResetCommand,
  EventDeckSelectionCommand,
  EventDeckShuffleCommand,
  EventDrawAcceptCommand,
  EventDrawCancelCommand,
  EventDrawNewCommand
} from 'src/app/game/commands/event/EventDeck';
import {
  EventDistributionCommand,
  EventEffectCharactersCommand,
  EventEffectCommand,
  EventEffectRandomItemCommand,
  EventEffectRandomScenarioCommand
} from 'src/app/game/commands/event/EventEffect';
import { FigureActiveCommand } from 'src/app/game/commands/figure/FigureActive';
import { FigureInitiativeCommand } from 'src/app/game/commands/figure/FigureInitiative';
import { FigureInteractiveActionsCommand } from 'src/app/game/commands/figure/FigureInteractiveActions';
import { FigureNextCommand } from 'src/app/game/commands/figure/FigureNext';
import { FigureReorderCommand } from 'src/app/game/commands/figure/FigureReorder';
import {
  GameConditionCommand,
  GameEditionCommand,
  GameFavorsCommand,
  GameFavorsKeepCommand,
  GameImbuementCommand,
  GameImportCommand
} from 'src/app/game/commands/game/Game';
import { GameClockCommand, GameClockMergeCommand } from 'src/app/game/commands/game/GameClock';
import {
  LevelAdjustmentCommand,
  LevelBbDifficultyCommand,
  LevelBonusCommand,
  LevelCalculationCommand,
  LevelGe5PlayerCappedCommand,
  LevelGe5PlayerCommand,
  LevelPlayerCountCommand,
  LevelSetCommand,
  LevelSoloCommand
} from 'src/app/game/commands/level/Level';
import { LootDeckAssignCommand, LootDeckRandomItemCommand, LootDeckSectionCommand } from 'src/app/game/commands/lootDeck/LootDeckAssign';
import { LootDeckDrawCommand } from 'src/app/game/commands/lootDeck/LootDeckDraw';
import {
  LootDeckActiveCommand,
  LootDeckConfigCommand,
  LootDeckEnhancementCommand,
  LootDeckFixedCommand,
  LootDeckMoveCommand,
  LootDeckRemoveCardCommand,
  LootDeckShuffleCommand
} from 'src/app/game/commands/lootDeck/LootDeckEdit';
import {
  MonsterAbilityDrawCommand,
  MonsterAbilityDrawExtraCommand,
  MonsterAbilityMoveCommand,
  MonsterAbilityRemoveCommand,
  MonsterAbilityRestoreCommand,
  MonsterAbilityRestoreDefaultCommand,
  MonsterAbilityRevealedCommand,
  MonsterAbilityShuffleCommand
} from 'src/app/game/commands/monster/MonsterAbility';
import { MonsterAddCommand } from 'src/app/game/commands/monster/MonsterAdd';
import { MonsterCatchCommand } from 'src/app/game/commands/monster/MonsterCatch';
import { MonsterEntityAddCommand } from 'src/app/game/commands/monster/MonsterEntityAdd';
import { MonsterLevelCommand } from 'src/app/game/commands/monster/MonsterLevel';
import { MonsterRemoveAllCommand, MonsterRemoveCommand } from 'src/app/game/commands/monster/MonsterRemove';
import { MonsterAlliedCommand, MonsterAllyCommand, MonsterDormantCommand } from 'src/app/game/commands/monster/MonsterToggle';
import { ObjectiveActionsCommand, ObjectiveActionsRestoreCommand } from 'src/app/game/commands/objectives/ObjectiveActions';
import { ObjectiveAddCommand } from 'src/app/game/commands/objectives/ObjectiveAdd';
import { ObjectiveAmDeckCommand } from 'src/app/game/commands/objectives/ObjectiveAmDeck';
import { ObjectiveEntityAddCommand } from 'src/app/game/commands/objectives/ObjectiveEntityAdd';
import { ObjectiveRemoveAllCommand, ObjectiveRemoveCommand } from 'src/app/game/commands/objectives/ObjectiveRemove';
import { PartyAddCommand, PartyChangeCommand, PartyRemoveCommand } from 'src/app/game/commands/party/Party';
import {
  PartyCharacterEnhancementsCommand,
  PartyCharacterPlayerNumberCommand,
  PartyCharacterReactivateCommand
} from 'src/app/game/commands/party/PartyCharacter';
import {
  PartyAchievementCommand,
  PartyCampaignStickerCommand,
  PartyGlobalAchievementCommand,
  PartyItemCountCommand,
  PartyItemFilterCommand,
  PartyItemUnlockCommand,
  PartyTownGuardPerkSectionCommand,
  PartyTreasureCommand
} from 'src/app/game/commands/party/PartyLists';
import {
  PartyConclusionFinishCommand,
  PartyConclusionRemoveCommand,
  PartyScenarioManualCommand,
  PartyScenarioRemoveCommand,
  PartyScenarioSuccessCommand,
  PartyWeekSectionCommand
} from 'src/app/game/commands/party/PartyScenario';
import {
  PartyBattleGoalEditionCommand,
  PartyBattleGoalFilterCommand,
  PartyPersonalQuestCommand
} from 'src/app/game/commands/party/PartySetup';
import {
  PartyEnvelopeBCommand,
  PartyFactionReputationCommand,
  PartyMoraleCommand,
  PartyPlayerCommand,
  PartyProsperityCommand,
  PartyReputationCommand,
  PartyResourceCommand,
  PartySetCommand,
  PartySoldiersCommand,
  PartyWeeksCommand
} from 'src/app/game/commands/party/PartyValues';
import { RoundEndAllTurnsCommand, RoundNextCommand, RoundResetCommand } from 'src/app/game/commands/round/Round';
import { RoundStateCommand } from 'src/app/game/commands/round/RoundState';
import {
  ScenarioCancelCommand,
  ScenarioCustomCommand,
  ScenarioCustomNameCommand,
  ScenarioRandomCommand,
  ScenarioResetCommand,
  ScenarioRoomCommand,
  ScenarioSectionCommand,
  ScenarioSetCommand
} from 'src/app/game/commands/scenario/Scenario';
import {
  ScenarioFinishApplyCommand,
  ScenarioFinishBattleGoalCommand,
  ScenarioFinishCalendarSectionCommand,
  ScenarioFinishChallengesCommand,
  ScenarioFinishCloseCommand,
  ScenarioFinishCollectiveGoldCommand,
  ScenarioFinishCollectiveResourceCommand,
  ScenarioFinishItemCommand,
  ScenarioFinishLocationCommand,
  ScenarioFinishOpenCommand,
  ScenarioFinishOverlayTextCommand,
  ScenarioFinishRandomItemCommand,
  ScenarioFinishRestartCommand,
  ScenarioFinishTrialCommand,
  ScenarioFinishUnlockCharacterCommand
} from 'src/app/game/commands/scenario/ScenarioFinish';
import {
  ScenarioRuleApplyCommand,
  ScenarioRuleClearDiscardedCommand,
  ScenarioRuleDiscardCommand,
  ScenarioRuleHideCommand,
  ScenarioRuleRemoveCommand
} from 'src/app/game/commands/scenario/ScenarioRule';
import { ScenarioTreasureLootCommand, ScenarioTreasureRemoveCommand } from 'src/app/game/commands/scenario/ScenarioTreasure';
import { SummonAddCommand } from 'src/app/game/commands/summons/SummonAdd';
import { SummonAddCustomCommand } from 'src/app/game/commands/summons/SummonAddCustom';
import { SummonInitCommand } from 'src/app/game/commands/summons/SummonInit';
import { SummonStatCommand } from 'src/app/game/commands/summons/SummonStat';
import { SummonTrapCommand } from 'src/app/game/commands/summons/SummonTrap';

declare global {
  interface Window {
    commandManager: CommandManager;
  }
}

type CommandClass = new (...parameters: BASE_TYPE[]) => Command;

export class CommandManager {
  private commands: CommandClass[] = [
    AttackModifierDeckActiveCommand,
    AttackModifierDeckAddCardCommand,
    AttackModifierDeckAdditionalCommand,
    AttackModifierDeckChangeCommand,
    AttackModifierDeckDiscardCommand,
    AttackModifierDeckDrawCommand,
    AttackModifierDeckFactionCommand,
    AttackModifierDeckMoveCommand,
    AttackModifierDeckRemoveCardCommand,
    AttackModifierDeckRemoveDrawnDiscardsCommand,
    AttackModifierDeckRestoreCardCommand,
    AttackModifierDeckRestoreDefaultCommand,
    AttackModifierDeckRevealCommand,
    AttackModifierDeckShuffleCommand,
    BuildingAddCommand,
    BuildingDowngradeCommand,
    BuildingRepairCommand,
    BuildingStateCommand,
    BuildingUpgradeCommand,
    CampaignCancelCommand,
    CampaignModeCommand,
    CampaignResetCommand,
    CampaignStartCommand,
    ChallengeDeckActiveCommand,
    ChallengeDeckClearCommand,
    ChallengeDeckDrawCommand,
    ChallengeDeckMoveCommand,
    ChallengeDeckRemoveCardCommand,
    ChallengeDeckRestoreCardCommand,
    ChallengeDeckShuffleCommand,
    ChallengeDeckKeepCommand,
    CharacterAbilityDeckCommand,
    CharacterAbilityDeckResetCommand,
    CharacterAbilityDeckUndoCommand,
    CharacterAbsentCommand,
    CharacterExhaustedCommand,
    CharacterAddCommand,
    CharacterBattleGoalDrawCommand,
    CharacterBattleGoalDrawCardCommand,
    CharacterBattleGoalSelectCommand,
    CharacterConditionCommand,
    CharacterDonateCommand,
    CharacterEnhancementAddCommand,
    CharacterEnhancementRemoveCommand,
    CharacterHpCommand,
    CharacterIdentityCommand,
    CharacterImportCommand,
    CharacterInitiativeCommand,
    CharacterItemAddCommand,
    CharacterItemBrewCommand,
    CharacterItemBuyCommand,
    CharacterItemCraftCommand,
    CharacterItemDistillCommand,
    CharacterItemEquipCommand,
    CharacterItemFlagCommand,
    CharacterItemFlagCountCommand,
    CharacterItemRemoveCommand,
    CharacterItemSellCommand,
    CharacterItemShareCommand,
    CharacterLevelCommand,
    CharacterLongRestCommand,
    CharacterLootCommand,
    CharacterLootDrawCommand,
    CharacterMarkerCommand,
    CharacterMasteryCommand,
    CharacterMoveResourceCommand,
    CharacterPerkCommand,
    CharacterPersonalQuestCommand,
    CharacterPersonalQuestAutotrackCommand,
    CharacterPersonalQuestProgressCommand,
    CharacterPlayerNumberCommand,
    CharacterProgressExperienceCommand,
    CharacterProgressResourceCommand,
    CharacterProgressSetCommand,
    CharacterRemoveCommand,
    CharacterRemoveAllCommand,
    CharacterReplayCommand,
    CharacterRetireCommand,
    CharacterSetAsideCommand,
    CharacterSpecialActionSlotCommand,
    CharacterTokenCommand,
    CharacterTokenValueCommand,
    CharacterTrialCommand,
    CharacterUnlockCommand,
    CharacterUnlockAllCommand,
    CharacterUnlockResetCommand,
    CharacterXpCommand,
    ElementStateCommand,
    ElementToggleCommand,
    EntityActiveCommand,
    EntityAttackModifierCommand,
    EntityConditionCommand,
    EntityConditionApplyCommand,
    EntityConditionValueCommand,
    EntityDeadCommand,
    EntityExtraActionRemoveCommand,
    EntityExtraActionResolveCommand,
    EntityHpCommand,
    EntityImmunityCommand,
    EntityMarkerCommand,
    EntityMaxHpCommand,
    EntityNumberCommand,
    EntityObjectiveMarkerCommand,
    EntityRetaliateCommand,
    EntityShieldCommand,
    EntitySpecialActionCommand,
    EntitySummonStateCommand,
    EntityTitleCommand,
    EntityTypeCommand,
    EventDeckAddCommand,
    EventDeckMarkDrawnCommand,
    EventDeckMoveCommand,
    EventDeckRemoveCommand,
    EventDeckRemoveDrawnCommand,
    EventDeckResetCommand,
    EventDeckSelectionCommand,
    EventDeckShuffleCommand,
    EventDistributionCommand,
    EventDrawAcceptCommand,
    EventDrawCancelCommand,
    EventDrawNewCommand,
    EventEffectCommand,
    EventEffectCharactersCommand,
    EventEffectRandomItemCommand,
    EventEffectRandomScenarioCommand,
    FigureActiveCommand,
    FigureInitiativeCommand,
    FigureInteractiveActionsCommand,
    FigureNextCommand,
    FigureReorderCommand,
    GameConditionCommand,
    GameEditionCommand,
    GameFavorsCommand,
    GameFavorsKeepCommand,
    GameImbuementCommand,
    GameImportCommand,
    GameClockMergeCommand,
    GameClockCommand,
    GardenAutomationCommand,
    GardenFlipCommand,
    GardenHarvestCommand,
    GardenPlantCommand,
    LevelAdjustmentCommand,
    LevelBbDifficultyCommand,
    LevelBonusCommand,
    LevelCalculationCommand,
    LevelGe5PlayerCommand,
    LevelGe5PlayerCappedCommand,
    LevelPlayerCountCommand,
    LevelSetCommand,
    LevelSoloCommand,
    LootDeckActiveCommand,
    LootDeckAssignCommand,
    LootDeckConfigCommand,
    LootDeckDrawCommand,
    LootDeckEnhancementCommand,
    LootDeckFixedCommand,
    LootDeckMoveCommand,
    LootDeckRandomItemCommand,
    LootDeckRemoveCardCommand,
    LootDeckSectionCommand,
    LootDeckShuffleCommand,
    MonsterAbilityDrawCommand,
    MonsterAbilityDrawExtraCommand,
    MonsterAbilityMoveCommand,
    MonsterAbilityRemoveCommand,
    MonsterAbilityRestoreCommand,
    MonsterAbilityRestoreDefaultCommand,
    MonsterAbilityRevealedCommand,
    MonsterAbilityShuffleCommand,
    MonsterAddCommand,
    MonsterAlliedCommand,
    MonsterAllyCommand,
    MonsterCatchCommand,
    MonsterDormantCommand,
    MonsterEntityAddCommand,
    MonsterLevelCommand,
    MonsterRemoveCommand,
    MonsterRemoveAllCommand,
    ObjectiveActionsCommand,
    ObjectiveActionsRestoreCommand,
    ObjectiveAddCommand,
    ObjectiveAmDeckCommand,
    ObjectiveEntityAddCommand,
    ObjectiveRemoveCommand,
    ObjectiveRemoveAllCommand,
    OutpostBuildingAttackedCommand,
    PartyAchievementCommand,
    PartyAddCommand,
    PartyBattleGoalEditionCommand,
    PartyBattleGoalFilterCommand,
    PartyCampaignStickerCommand,
    PartyChangeCommand,
    PartyCharacterEnhancementsCommand,
    PartyCharacterPlayerNumberCommand,
    PartyCharacterReactivateCommand,
    PartyConclusionFinishCommand,
    PartyConclusionRemoveCommand,
    PartyEnvelopeBCommand,
    PartyFactionReputationCommand,
    PartyGlobalAchievementCommand,
    PartyItemCountCommand,
    PartyItemFilterCommand,
    PartyItemUnlockCommand,
    PartyMoraleCommand,
    PartyPersonalQuestCommand,
    PartyPlayerCommand,
    PartyProsperityCommand,
    PartyRemoveCommand,
    PartyReputationCommand,
    PartyResourceCommand,
    PartyScenarioManualCommand,
    PartyScenarioRemoveCommand,
    PartyScenarioSuccessCommand,
    PartySetCommand,
    PartySoldiersCommand,
    PartyTownGuardPerkSectionCommand,
    PartyTreasureCommand,
    PartyWeekSectionCommand,
    PartyWeeksCommand,
    PetActiveCommand,
    PetCommand,
    PetLostCommand,
    PetNameCommand,
    RoundEndAllTurnsCommand,
    RoundNextCommand,
    RoundResetCommand,
    RoundStateCommand,
    ScenarioCancelCommand,
    ScenarioCustomCommand,
    ScenarioCustomNameCommand,
    ScenarioFinishApplyCommand,
    ScenarioFinishBattleGoalCommand,
    ScenarioFinishCalendarSectionCommand,
    ScenarioFinishChallengesCommand,
    ScenarioFinishCloseCommand,
    ScenarioFinishCollectiveGoldCommand,
    ScenarioFinishCollectiveResourceCommand,
    ScenarioFinishItemCommand,
    ScenarioFinishLocationCommand,
    ScenarioFinishOpenCommand,
    ScenarioFinishOverlayTextCommand,
    ScenarioFinishRandomItemCommand,
    ScenarioFinishRestartCommand,
    ScenarioFinishTrialCommand,
    ScenarioFinishUnlockCharacterCommand,
    ScenarioRandomCommand,
    ScenarioResetCommand,
    ScenarioRoomCommand,
    ScenarioRuleApplyCommand,
    ScenarioRuleClearDiscardedCommand,
    ScenarioRuleDiscardCommand,
    ScenarioRuleHideCommand,
    ScenarioRuleRemoveCommand,
    ScenarioSectionCommand,
    ScenarioSetCommand,
    ScenarioTreasureLootCommand,
    ScenarioTreasureRemoveCommand,
    SummonAddCommand,
    SummonAddCustomCommand,
    SummonInitCommand,
    SummonStatCommand,
    SummonTrapCommand
  ];

  private commandsMap: Record<string, CommandClass> | undefined;

  private map(): Record<string, CommandClass> {
    if (!this.commandsMap) {
      this.commandsMap = Object.fromEntries(this.commands.map((commandClass) => [new commandClass().id, commandClass]));
    }
    return this.commandsMap;
  }

  ids(): string[] {
    return Object.keys(this.map());
  }

  command(id: string, ...parameters: BASE_TYPE[]): Command | undefined {
    const commandClass = this.map()[id];
    return commandClass ? new commandClass(...parameters) : undefined;
  }

  private history: Command[] = [];

  execute(id: string, server: boolean, ...parameters: BASE_TYPE[]) {
    try {
      const command = this.command(id, ...parameters);
      if (!command) {
        throw new CommandUnknownError(id);
      }

      command.server = server;
      gameManager.stateManager.before(...command.before());
      try {
        command.execute();
        this.history.push(command);
        gameManager.stateManager.after();
      } catch (e) {
        gameManager.stateManager.revertLastUndo();
        if (e instanceof CommandExecutionError) {
          console.error(e, e.id, e.parameters, e.message);
        } else if (e instanceof CommandMissingParameterError) {
          console.error('Missing Parameter', id, e.parameter);
        } else if (e instanceof CommandInvalidParametersError) {
          console.error('Invalid Parameters', id, e.parameters);
        } else {
          throw e;
        }
      }
    } catch (e) {
      if (e instanceof CommandUnknownError) {
        console.error('Unkown Command', id, e.message);
      } else {
        throw e;
      }
    }
  }
}

export const commandManager: CommandManager = new CommandManager();
window.commandManager = commandManager;
