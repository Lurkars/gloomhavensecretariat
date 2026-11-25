import { signal, WritableSignal } from '@angular/core';
import { ActionsManager } from 'src/app/game/businesslogic/ActionsManager';
import { AttackModifierBuildManager } from 'src/app/game/businesslogic/AttackModifierBuildManager';
import { AttackModifierManager } from 'src/app/game/businesslogic/AttackModifierManager';
import { BattleGoalManager } from 'src/app/game/businesslogic/BattleGoalManager';
import { BuildingsManager } from 'src/app/game/businesslogic/BuildingsManager';
import { CampaignManager } from 'src/app/game/businesslogic/CampaignManager';
import { ChallengesManager } from 'src/app/game/businesslogic/ChallengesManager';
import { CharacterAbilityManager } from 'src/app/game/businesslogic/CharacterAbilityManager';
import { CharacterManager } from 'src/app/game/businesslogic/CharacterManager';
import { CharacterRpgManager } from 'src/app/game/businesslogic/CharacterRpgManager';
import { ConditionManager } from 'src/app/game/businesslogic/ConditionManager';
import { EditionManager } from 'src/app/game/businesslogic/EditionManager';
import { ElementManager } from 'src/app/game/businesslogic/ElementManager';
import { EnhancementsManager } from 'src/app/game/businesslogic/EnhancementsManager';
import { EntityCounterManager } from 'src/app/game/businesslogic/EntityCounterManager';
import { EntityManager } from 'src/app/game/businesslogic/EntityManager';
import { EventCardManager } from 'src/app/game/businesslogic/EventCardManager';
import { GameClockManager } from 'src/app/game/businesslogic/GameClockManager';
import { HistoryManager } from 'src/app/game/businesslogic/HistoryManager';
import { ImbuementManager } from 'src/app/game/businesslogic/ImbuementManager';
import { ItemManager } from 'src/app/game/businesslogic/ItemManager';
import { LevelManager } from 'src/app/game/businesslogic/LevelManager';
import { LootManager } from 'src/app/game/businesslogic/LootManager';
import { settingsManager, storageManager } from 'src/app/game/businesslogic/Managers';
import { MonsterAbilityManager } from 'src/app/game/businesslogic/MonsterAbilityManager';
import { MonsterManager } from 'src/app/game/businesslogic/MonsterManager';
import { ObjectiveManager } from 'src/app/game/businesslogic/ObjectiveManager';
import { OutpostAttackManager } from 'src/app/game/businesslogic/OutpostAttackManager';
import { PersonalQuestManager } from 'src/app/game/businesslogic/PersonalQuestManager';
import { RandomManager } from 'src/app/game/businesslogic/RandomManager';
import { RetirementManager } from 'src/app/game/businesslogic/RetirementManager';
import { RoundManager } from 'src/app/game/businesslogic/RoundManager';
import { ScenarioFinishManager } from 'src/app/game/businesslogic/ScenarioFinishManager';
import { ScenarioManager } from 'src/app/game/businesslogic/ScenarioManager';
import { ScenarioRequirementsManager } from 'src/app/game/businesslogic/ScenarioRequirementsManager';
import { ScenarioRuleEffectsManager } from 'src/app/game/businesslogic/ScenarioRuleEffectsManager';
import { ScenarioRulesManager } from 'src/app/game/businesslogic/ScenarioRulesManager';
import { ScenarioStatsManager } from 'src/app/game/businesslogic/ScenarioStatsManager';
import { ServerSyncManager } from 'src/app/game/businesslogic/ServerSyncManager';
import { ShieldRetaliateManager } from 'src/app/game/businesslogic/ShieldRetaliateManager';
import { SpecialActionsManager } from 'src/app/game/businesslogic/SpecialActionsManager';
import { StateManager } from 'src/app/game/businesslogic/StateManager';
import { SummonManager } from 'src/app/game/businesslogic/SummonManager';
import { TreasureManager } from 'src/app/game/businesslogic/TreasureManager';
import { TrialsManager } from 'src/app/game/businesslogic/TrialsManager';
import { TurnManager } from 'src/app/game/businesslogic/TurnManager';
import { Character } from 'src/app/game/model/Character';
import { EditionRules } from 'src/app/game/model/data/EditionRules';
import { Entity } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { Game, GameModel } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { ObjectiveEntity } from 'src/app/game/model/ObjectiveEntity';
import { Summon } from 'src/app/game/model/Summon';

declare global {
  interface Window {
    gameManager: GameManager;
  }
}

export class GameManager {
  game: Game = new Game();
  editionManager: EditionManager;
  gameClockManager: GameClockManager;
  elementManager: ElementManager;
  stateManager: StateManager;
  serverSyncManager: ServerSyncManager;
  historyManager: HistoryManager;
  entityManager: EntityManager;
  conditionManager: ConditionManager;
  characterManager: CharacterManager;
  characterAbilityManager: CharacterAbilityManager;
  characterRpgManager: CharacterRpgManager;
  summonManager: SummonManager;
  monsterManager: MonsterManager;
  monsterAbilityManager: MonsterAbilityManager;
  objectiveManager: ObjectiveManager;
  personalQuestManager: PersonalQuestManager;
  retirementManager: RetirementManager;
  shieldRetaliateManager: ShieldRetaliateManager;
  attackModifierManager: AttackModifierManager;
  attackModifierBuildManager: AttackModifierBuildManager;
  actionsManager: ActionsManager;
  levelManager: LevelManager;
  scenarioManager: ScenarioManager;
  scenarioFinishManager: ScenarioFinishManager;
  scenarioRequirementsManager: ScenarioRequirementsManager;
  scenarioRulesManager: ScenarioRulesManager;
  scenarioRuleEffectsManager: ScenarioRuleEffectsManager;
  campaignManager: CampaignManager;
  roundManager: RoundManager;
  turnManager: TurnManager;
  lootManager: LootManager;
  treasureManager: TreasureManager;
  itemManager: ItemManager;
  battleGoalManager: BattleGoalManager;
  eventCardManager: EventCardManager;
  buildingsManager: BuildingsManager;
  outpostAttackManager: OutpostAttackManager;
  challengesManager: ChallengesManager;
  scenarioStatsManager: ScenarioStatsManager;
  entityCounterManager: EntityCounterManager;
  trialsManager: TrialsManager;
  enhancementsManager: EnhancementsManager;
  imbuementManager: ImbuementManager;
  specialActionsManager: SpecialActionsManager;
  randomManager: RandomManager;

  uiChangeSignal: WritableSignal<number> = signal(0);
  uiChangeFromServer: WritableSignal<boolean> = signal(false);

  triggerUiChange(fromServer: boolean = false): void {
    this.uiChangeFromServer.set(fromServer);
    this.uiChangeSignal.update((v) => v + 1);
  }

  constructor() {
    this.editionManager = new EditionManager(this.game);
    this.gameClockManager = new GameClockManager(this.game);
    this.elementManager = new ElementManager(this.game);
    this.randomManager = new RandomManager(this.game);
    this.stateManager = new StateManager(this.game);
    this.serverSyncManager = new ServerSyncManager(this.game);
    this.historyManager = new HistoryManager(this.game);
    this.entityManager = new EntityManager(this.game);
    this.conditionManager = new ConditionManager(this.game);
    this.characterManager = new CharacterManager(this.game);
    this.characterAbilityManager = new CharacterAbilityManager(this.game);
    this.characterRpgManager = new CharacterRpgManager(this.game);
    this.summonManager = new SummonManager(this.game);
    this.monsterManager = new MonsterManager(this.game);
    this.monsterAbilityManager = new MonsterAbilityManager(this.game);
    this.objectiveManager = new ObjectiveManager(this.game);
    this.personalQuestManager = new PersonalQuestManager(this.game);
    this.retirementManager = new RetirementManager(this.game);
    this.shieldRetaliateManager = new ShieldRetaliateManager(this.game);
    this.attackModifierManager = new AttackModifierManager(this.game);
    this.attackModifierBuildManager = new AttackModifierBuildManager(this.game);
    this.actionsManager = new ActionsManager();
    this.levelManager = new LevelManager(this.game);
    this.scenarioManager = new ScenarioManager(this.game);
    this.scenarioFinishManager = new ScenarioFinishManager(this.game);
    this.scenarioRequirementsManager = new ScenarioRequirementsManager(this.game);
    this.scenarioRulesManager = new ScenarioRulesManager(this.game);
    this.scenarioRuleEffectsManager = new ScenarioRuleEffectsManager(this.game);
    this.campaignManager = new CampaignManager(this.game);
    this.roundManager = new RoundManager(this.game);
    this.turnManager = new TurnManager(this.game);
    this.itemManager = new ItemManager(this.game);
    this.lootManager = new LootManager(this.game);
    this.treasureManager = new TreasureManager(this.game);
    this.battleGoalManager = new BattleGoalManager(this.game);
    this.eventCardManager = new EventCardManager(this.game);
    this.buildingsManager = new BuildingsManager(this.game);
    this.outpostAttackManager = new OutpostAttackManager(this.game);
    this.challengesManager = new ChallengesManager(this.game);
    this.scenarioStatsManager = new ScenarioStatsManager(this.game);
    this.entityCounterManager = new EntityCounterManager(this.game);
    this.trialsManager = new TrialsManager(this.game);
    this.enhancementsManager = new EnhancementsManager(this.game);
    this.imbuementManager = new ImbuementManager(this.game);
    this.specialActionsManager = new SpecialActionsManager(this.game);
  }

  setEdition(edition: string | undefined) {
    if (edition) {
      settingsManager.automaticTheme(edition, this.game.edition);
    }
    this.game.edition = edition || undefined;
    this.game.party.edition = edition || undefined;
    this.attackModifierManager.updateDefaultDecks();
    if (edition && this.game.party.campaignMode) {
      this.campaignManager.setupCampaign();
    }
  }

  importGame(gameModel: GameModel) {
    if (gameModel.revision < this.game.revision) {
      storageManager.addBackup(this.game.toModel());
      gameModel.revision = this.game.revision;
      gameModel.revisionOffset = this.game.revisionOffset;
    }
    if (gameModel.edition) {
      settingsManager.automaticTheme(gameModel.edition, this.game.edition);
    }
    this.game.fromModel(gameModel, false, true);
  }

  isCharacter(figure: Figure | Entity): boolean {
    return figure instanceof Character;
  }

  isMonster(figure: Figure): boolean {
    return figure instanceof Monster;
  }

  isMonsterEntity(entity: Entity): boolean {
    return entity instanceof MonsterEntity;
  }

  isSummon(entity: Entity): boolean {
    return entity instanceof Summon;
  }

  isObjectiveContainer(figure: Figure): boolean {
    return figure instanceof ObjectiveContainer;
  }

  isObjectiveEntity(entity: Entity): boolean {
    return entity instanceof ObjectiveEntity;
  }

  toCharacter(figure: Figure | Entity): Character {
    return figure as Character;
  }

  toMonster(figure: Figure): Monster {
    return figure as Monster;
  }

  toMonsterEntity(entity: Entity): MonsterEntity {
    return entity as MonsterEntity;
  }

  toSummon(entity: Entity): Summon {
    return entity as Summon;
  }

  toObjectiveContainer(figure: Figure): ObjectiveContainer {
    return figure as ObjectiveContainer;
  }

  toObjectiveEntity(entity: Entity): ObjectiveEntity {
    return entity as ObjectiveEntity;
  }

  fhRules(gh2e: boolean = false): boolean {
    return this.editionRules('fh') || (gh2e && this.gh2eRules());
  }
  gh2eRules(): boolean {
    return this.editionRules('gh2e');
  }
  bbRules(): boolean {
    return this.editionRules('bb');
  }
  rpgRules(): boolean {
    return this.editionRules('rpg');
  }
  hasCampaignSheet(): boolean {
    return !this.bbRules() && !this.rpgRules();
  }
  hasPartySheet(): boolean {
    return this.hasCampaignSheet() && (this.game.party.edition || this.game.edition) !== 'jotl';
  }
  matchesEditionRules(data: { editionRules: EditionRules }): boolean {
    const rules: EditionRules = this.bbRules() ? 'bb' : this.rpgRules() ? 'rpg' : undefined;
    return !rules || data.editionRules === rules;
  }
  editionRules(edition: string, current: boolean = true): boolean {
    const currentEdition = current ? this.editionManager.currentEdition() : this.game.edition;
    return this.editionManager.isEditionRelevant(edition, currentEdition);
  }
}
