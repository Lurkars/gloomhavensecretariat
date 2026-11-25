import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { ScenarioFinishApply } from 'src/app/game/businesslogic/ScenarioFinishManager';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { additionalTownGuardAttackModifier, AttackModifier } from 'src/app/game/model/data/AttackModifier';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { LootType } from 'src/app/game/model/data/Loot';
import { ScenarioData, ScenarioFinish, ScenarioRewards } from 'src/app/game/model/data/ScenarioData';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { GameScenarioModel, Scenario } from 'src/app/game/model/Scenario';
import { BattleGoalComponent } from 'src/app/ui/figures/battlegoal/battlegoal';
import { CharacterBattleGoalsDialog } from 'src/app/ui/figures/battlegoal/dialog/battlegoal-dialog';
import { ChallengeCardComponent } from 'src/app/ui/figures/challenges/challenge-card';
import { ChallengeDialogComponent } from 'src/app/ui/figures/challenges/dialog/challenge-dialog';
import { CharacterSheetDialog } from 'src/app/ui/figures/character/dialogs/character-sheet-dialog';
import { CharacterRetirementDialog } from 'src/app/ui/figures/character/sheet/retirement-dialog';
import { ItemDialogComponent } from 'src/app/ui/figures/items/dialog/item-dialog';
import { ItemComponent } from 'src/app/ui/figures/items/item/item';
import { DistributionChange, DistributionEntry, PartyDistributionComponent } from 'src/app/ui/figures/party/distribution/distribution';
import { ScenarioRequirementsDialogComponent } from 'src/app/ui/figures/party/requirements/requirements';
import { TrialDialogComponent } from 'src/app/ui/figures/trials/dialog/trial-dialog';
import { TreasureLabelComponent } from 'src/app/ui/footer/scenario/treasures/label/label';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe, GhsValueSignPipe } from 'src/app/ui/helper/Pipes';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [
    NgClass,
    NgTemplateOutlet,
    GhsLabelDirective,
    GhsTooltipDirective,
    GhsValueSignPipe,
    GhsRangePipe,
    TrackUUIDPipe,
    ChallengeCardComponent,
    ItemComponent,
    BattleGoalComponent,
    TreasureLabelComponent,
    PartyDistributionComponent
  ],
  selector: 'ghs-scenario-summary',
  templateUrl: './scenario-summary.html',
  styleUrls: ['./scenario-summary.scss']
})
export class ScenarioSummaryComponent {
  private dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  LootType = LootType;

  scenario: Scenario;
  conclusion: ScenarioData | undefined;
  success: boolean;
  conclusionWarning: boolean;
  alreadyWarning: boolean = false;
  characterProgress: boolean = true;
  gainRewards: boolean = true;
  forceCampaign: boolean = false;
  conclusionOnly: boolean;
  rewardsOnly: boolean;

  characters: Character[];
  battleGoals: number[] = [];
  collectiveGold: number[] = [];
  collectiveResources: Partial<Record<LootType, number>>[] = [];
  lootColumns: LootType[] = [];
  lootColumnsLooted: number[] = [];
  lootColumnsTotal: number[] = [];
  lootedGold: number = 0;
  totalGold: number = 0;
  rewardItems: ItemData[] = [];
  rewardItemCount: number[] = [];
  items: number[][] = [];
  chooseLocation: string | undefined;
  chooseUnlockCharacter: string | undefined;
  rewards: ScenarioRewards | undefined = undefined;
  challenges: number = 0;
  numberChallenges: number = 0;
  calendarSectionManual: number[] = [];
  randomItem: ItemData | undefined;
  randomItemIndex: number = -1;
  randomItems: (ItemData | undefined)[] = [];
  randomItemBlueprints: number[] = [];
  randomItemDesigns: number[] = [];
  randomSideScenario: ScenarioData | undefined;
  trials: boolean[] = [];
  trial349: Character | undefined;
  trial356: Character | undefined;
  overlayCustomText: string = '';
  townGuardAMs: AttackModifier[] = [];
  levelUp: boolean[] = [];
  perksUp: boolean[] = [];
  stats: boolean = false;
  lootMultiplier: number = 0;
  experienceBonus: number = 0;
  wealthFavor: number = 0;
  knowledgeFavor: number = 0;

  EntityValueFunction = EntityValueFunction;

  waitForClose: boolean = false;

  data: { scenario: Scenario; success: boolean; conclusion: ScenarioData | undefined; conclusionOnly: boolean; rewardsOnly: boolean } =
    inject(DIALOG_DATA);

  constructor() {
    this.ghsManager.uiChangeEffect(() => {
      this.lootMultiplier = gameManager.levelManager.loot();
      this.experienceBonus = gameManager.levelManager.experience();
      this.wealthFavor = gameManager.trialsManager.activeFavor('fh', 'wealth');
      this.knowledgeFavor = gameManager.trialsManager.activeFavor('fh', 'knowledge');
      if (!this.conclusionOnly) {
        if (!gameManager.game.finish && !this.rewardsOnly) {
          gameManager.stateManager.scenarioSummary = false;
          this.close();
        } else {
          this.loadFinish();
        }
      }
    });

    this.scenario = this.data.scenario;
    this.success = this.data.success;
    this.conclusion = this.data.conclusion;
    this.conclusionOnly = this.data.conclusionOnly;
    this.rewardsOnly = this.data.rewardsOnly;
    if (this.conclusionOnly) {
      this.conclusion = this.scenario;
      this.success = true;
      // repeatable conclusions can be solved again, others only show their rewards once solved
      if (
        !this.conclusion.repeatable &&
        gameManager.game.party.conclusions.find(
          (conclusion) =>
            conclusion.index === this.scenario.index &&
            conclusion.edition === this.scenario.edition &&
            conclusion.group === this.scenario.group
        )
      ) {
        this.rewardsOnly = true;
      }

      if (!this.rewardsOnly) {
        gameManager.game.finish = undefined;
      }
    }

    if (this.conclusion) {
      this.overlayCustomText = gameManager.scenarioFinishManager.conclusionCustomText(this.conclusion) || this.overlayCustomText;
    }
    this.conclusionWarning = this.success && gameManager.scenarioFinishManager.missingConclusion(this.scenario, this.conclusion);

    this.characters = gameManager.scenarioFinishManager.summaryCharacters();
    this.battleGoals = this.characters.map(() => 0);

    this.trial349 = this.characters.find((character) => gameManager.scenarioFinishManager.hasTrial349(character));

    this.trial356 = this.characters.find(
      (character) => character.progress.trial && character.progress.trial.edition === 'fh' && character.progress.trial.name === '356'
    );

    for (const value in LootType) {
      const lootType: LootType = value as LootType;
      if (
        lootType !== LootType.money &&
        !this.lootColumns.includes(lootType) &&
        this.characters.some(
          (character) =>
            character.lootCards &&
            character.lootCards.some(
              (index) => gameManager.game.lootDeck.cards[index] && gameManager.game.lootDeck.cards[index].type === lootType
            )
        )
      ) {
        this.lootColumns.push(lootType);
        this.lootColumnsLooted.push(this.characters.map((character) => this.lootValue(character, lootType)).reduce((a, b) => a + b));
        this.lootColumnsTotal.push(gameManager.lootManager.getTotal(gameManager.game.lootDeck, lootType));
      }
    }

    if (gameManager.game.lootDeck && gameManager.game.lootDeck.cards.length > 0) {
      if (this.characters.length > 0) {
        this.lootedGold = this.characters.map((character) => this.lootValue(character, LootType.money)).reduce((a, b) => a + b);
      }
      this.totalGold = gameManager.lootManager.getTotal(gameManager.game.lootDeck, LootType.money);
    }

    this.alreadyWarning =
      !this.rewardsOnly &&
      gameManager.game.party.campaignMode &&
      this.success &&
      gameManager.scenarioFinishManager.alreadyFinished(this.scenario, this.conclusion);

    this.characterProgress =
      !this.rewardsOnly && !this.conclusionOnly && (gameManager.game.party.campaignMode || !gameManager.fhRules(true));
    this.gainRewards = gameManager.game.party.campaignMode;

    this.updateState(this.rewardsOnly);

    gameManager.stateManager.scenarioSummary = true;

    if (!gameManager.game.finish && !this.conclusionOnly && !this.rewardsOnly) {
      gameManager.stateManager.before('finishScenario.dialog', ...gameManager.scenarioManager.scenarioUndoArgs());
      this.updateFinish();
      gameManager.stateManager.after();
    } else if (!this.rewardsOnly) {
      this.loadFinish();
    }

    this.dialogRef.closed.subscribe({
      next: () => {
        if (gameManager.stateManager.scenarioSummary && !this.conclusionOnly && !this.rewardsOnly && !this.waitForClose) {
          gameManager.stateManager.before('finishScenario.close', ...gameManager.scenarioManager.scenarioUndoArgs());
          gameManager.stateManager.scenarioSummary = false;
          gameManager.scenarioFinishManager.closeFinish();
          gameManager.stateManager.after();
        }
      }
    });
  }

  updateFinish() {
    gameManager.game.finish = this.finishModel();
    this.updateState();
  }

  finishModel(): ScenarioFinish {
    const finish = new ScenarioFinish();
    finish.conclusion = this.conclusion
      ? new GameScenarioModel(this.conclusion.index, this.conclusion.edition, this.conclusion.group)
      : undefined;
    finish.success = this.success;
    finish.battleGoals = this.battleGoals;
    finish.challenges = this.challenges;
    finish.chooseLocation = this.chooseLocation;
    finish.chooseUnlockCharacter = this.chooseUnlockCharacter;
    finish.collectiveGold = this.collectiveGold;
    finish.collectiveResources = this.collectiveResources || [];
    finish.items = this.items;
    finish.calendarSectionManual = this.calendarSectionManual;
    finish.randomItem = this.randomItem ? new Identifier(this.randomItem.id, this.randomItem.edition) : undefined;
    finish.randomItemIndex = this.randomItemIndex;
    finish.randomItems = this.randomItems
      ? this.randomItems.map((itemData) => (itemData ? new Identifier(itemData.id, itemData.edition) : undefined))
      : [];
    finish.randomItemBlueprints = this.randomItemBlueprints;
    finish.randomItemDesigns = this.randomItemDesigns;
    finish.randomSideScenario = this.randomSideScenario
      ? new Identifier(this.randomSideScenario.index, this.randomSideScenario.edition)
      : undefined;
    finish.trials = this.trials;
    finish.overlayCustomText = this.overlayCustomText;
    return finish;
  }

  loadFinish() {
    if (gameManager.game.finish) {
      const finish = gameManager.game.finish;
      this.conclusion = finish.conclusion
        ? gameManager.editionManager
            .sectionData(finish.conclusion.edition)
            .find(
              (sectionData) =>
                finish.conclusion &&
                sectionData.index === finish.conclusion.index &&
                sectionData.group === finish.conclusion.group &&
                sectionData.conclusion
            )
        : undefined;
      this.success = finish.success;
      this.battleGoals = finish.battleGoals || [];
      this.challenges = finish.challenges;
      this.chooseLocation = finish.chooseLocation;
      this.chooseUnlockCharacter = finish.chooseUnlockCharacter;
      this.collectiveGold = finish.collectiveGold || [];
      this.collectiveResources = finish.collectiveResources || [];
      this.items = finish.items;
      this.calendarSectionManual = finish.calendarSectionManual || finish.calenderSectionManual;
      this.randomItem = finish.randomItem
        ? gameManager.itemManager.getItem(finish.randomItem.name, finish.randomItem.edition, true)
        : undefined;
      this.randomItemIndex = finish.randomItemIndex;
      this.randomItems = finish.randomItems
        ? finish.randomItems.map((item) => (item ? gameManager.itemManager.getItem(item.name, item.edition, true) : undefined))
        : [];
      this.randomItemBlueprints = finish.randomItemBlueprints || [];
      this.randomItemDesigns = finish.randomItemDesigns || [];
      this.randomSideScenario = finish.randomSideScenario
        ? gameManager.scenarioManager.getScenario(finish.randomSideScenario.name, finish.randomSideScenario.edition, this.scenario.group)
        : undefined;
      this.trials = finish.trials || [];
      this.overlayCustomText = finish.overlayCustomText || '';
      this.updateState();
    }
  }

  updateState(forceCampaign: boolean = false): void {
    this.forceCampaign = forceCampaign;
    this.numberChallenges = 0;
    this.rewards = undefined;
    this.townGuardAMs = [];
    if ((gameManager.game.party.campaignMode || forceCampaign) && this.success) {
      this.rewards = gameManager.scenarioFinishManager.finishRewards(
        this.scenario,
        this.conclusion,
        this.success,
        forceCampaign,
        this.rewardsOnly
      );

      if (settingsManager.settings.scenarioRewards && this.rewards) {
        const rewardItems = gameManager.scenarioFinishManager.rewardItems(this.scenario.edition, this.rewards);
        this.rewardItems = rewardItems.items;
        this.rewardItemCount = rewardItems.counts;
        gameManager.scenarioFinishManager.prepareFinishRewards(
          this,
          this.scenario,
          this.rewards,
          this.characters,
          this.rewardItems,
          this.rewardsOnly
        );

        if (this.rewards.townGuardAm) {
          this.townGuardAMs = this.rewards.townGuardAm.map(
            (id) => additionalTownGuardAttackModifier.find((am) => am.id === id) as AttackModifier
          );
        }
      }

      this.numberChallenges = gameManager.scenarioFinishManager.finishChallengeCount();
    }

    this.characters.forEach((character, index) => {
      const newXP = gameManager.scenarioFinishManager.finishExperience(character, this.rewards, this.success, this.challenges);
      this.levelUp[index] =
        gameManager.characterManager.levelForXp(newXP) > gameManager.characterManager.levelForXp(character.progress.experience);
      this.perksUp[index] = gameManager.scenarioFinishManager.battleGoalPerkGained(character, this.battleGoals[index]);
    });
  }

  characterRetirementLabel(): string {
    return gameManager.editionManager.isEditionRelevant('gh2e', this.scenario.edition)
      ? 'scenario.rewards.characterRetirement'
      : 'scenario.rewards.questComplete';
  }

  retirementCharacter(cardId: string): string {
    const character = gameManager.game.figures.find((figure) => {
      if (!(figure instanceof Character) || !figure.progress.personalQuest) {
        return false;
      }
      const personalQuest = gameManager.personalQuestManager.personalQuestByCard(figure.edition, figure.progress.personalQuest);
      return !!personalQuest && (personalQuest.cardId === cardId || personalQuest.altId === cardId);
    }) as Character | undefined;
    return character ? ' (' + gameManager.characterManager.characterName(character, false, true) + ')' : '';
  }

  hasRewards(): boolean {
    const rewards = this.rewards;
    if (
      rewards &&
      ((rewards.envelopes && rewards.envelopes.length) ||
        rewards.gold ||
        rewards.experience ||
        rewards.collectiveGold ||
        (rewards.resources && rewards.resources.length) ||
        (rewards.collectiveResources && rewards.collectiveResources.length) ||
        rewards.reputation ||
        rewards.prosperity ||
        rewards.inspiration ||
        rewards.morale ||
        rewards.perks ||
        rewards.battleGoals ||
        rewards.soldiers ||
        (rewards.items && rewards.items.length) ||
        (rewards.chooseItem && rewards.chooseItem.length) ||
        (rewards.itemDesigns && rewards.itemDesigns.length) ||
        (rewards.itemBlueprints && rewards.itemBlueprints.length) ||
        rewards.randomItemBlueprint ||
        rewards.randomItemBlueprints ||
        rewards.randomItemDesign ||
        rewards.randomItemDesigns ||
        (rewards.removeItem && rewards.removeItem.length) ||
        rewards.characterRetirement ||
        rewards.characterRetirementSkipEvents ||
        (rewards.events && rewards.events.length) ||
        (rewards.returnEvents && rewards.returnEvents.length) ||
        (rewards.chooseUnlockCharacter && rewards.chooseUnlockCharacter.length) ||
        rewards.unlockCharacter ||
        rewards.custom ||
        (rewards.lootDeckCards && rewards.lootDeckCards.length) ||
        (rewards.removeLootDeckCards && rewards.removeLootDeckCards.length) ||
        (rewards.townGuardAm && rewards.townGuardAm.length) ||
        rewards.overlayCampaignSticker ||
        rewards.overlaySticker ||
        rewards.overlayCustomText ||
        rewards.pet ||
        (rewards.eventDecks && rewards.eventDecks.length) ||
        (rewards.reputationFactions && rewards.reputationFactions.length) ||
        rewards.factionUnlock ||
        rewards.randomSideScenario)
    ) {
      return true;
    }
    return false;
  }

  // conclusions only show a character table for rewards that need to be distributed to characters
  conclusionCharacterRewards(): boolean {
    return (
      this.conclusionOnly &&
      !this.rewardsOnly &&
      this.success &&
      this.characters.length > 0 &&
      settingsManager.settings.characterSheet &&
      !gameManager.bbRules() &&
      (this.rewardItems.length > 0 || !!this.randomItem || this.randomItems.length > 0 || this.collectiveEntries.length > 0)
    );
  }

  hasBonus(): boolean {
    return (
      (gameManager.game.party.campaignMode || this.forceCampaign) &&
      this.success &&
      !this.conclusionOnly &&
      ((gameManager.fhRules(true) && gameManager.scenarioFinishManager.inspirationBonus(this.scenario, this.rewards) > 0) ||
        (!this.scenario.solo && this.numberChallenges > 0))
    );
  }

  addWeek(): boolean {
    return (
      this.success &&
      !this.conclusionOnly &&
      !this.rewardsOnly &&
      gameManager.scenarioFinishManager.passesWeek(
        this.scenario,
        this.rewards,
        gameManager.scenarioFinishManager.hasForcedLinks(this.scenario, this.conclusion),
        gameManager.game.party.campaignMode || this.forceCampaign
      )
    );
  }

  weekSections(): ScenarioData[] {
    return gameManager.campaignManager
      .weekSections(gameManager.game.party.weeks + 1, this.scenario.edition)
      .map((section) => gameManager.campaignManager.weekSectionConclusion(section, this.scenario.edition, this.scenario.group))
      .filter((sectionData) => sectionData !== undefined);
  }

  // calendar sections without conclusion data, to be read in the Section Book
  weekReadSections(): string[] {
    if (settingsManager.settings.automaticWeekSections) {
      return [];
    }
    return gameManager.campaignManager
      .weekSections(gameManager.game.party.weeks + 1, this.scenario.edition)
      .filter((section) => !gameManager.campaignManager.weekSectionConclusion(section, this.scenario.edition, this.scenario.group));
  }

  showWeekConclusion(sectionData: ScenarioData) {
    const scenario = new Scenario(sectionData);
    this.dialog.open(ScenarioSummaryComponent, {
      panelClass: ['dialog'],
      data: {
        scenario: scenario,
        conclusionOnly: true,
        rewardsOnly: true
      }
    });
  }

  availableCollectiveGold(): number {
    return (
      (this.rewards &&
        this.rewards.collectiveGold &&
        this.collectiveGold.length > 0 &&
        this.rewards.collectiveGold - this.collectiveGold.reduce((a, b) => a + b)) ||
      0
    );
  }

  lootValue(character: Character, lootType: LootType): number {
    return gameManager.lootManager.characterLootValue(character, lootType);
  }

  toggleBattleGoal(event: any, index: number, value: number) {
    const character = this.characters[index];
    const battleGoals = gameManager.scenarioFinishManager.battleGoalToggleValue(
      character,
      this.battleGoals[index],
      value,
      event.target.checked
    );
    if (!gameManager.scenarioFinishManager.validBattleGoalValue(character, battleGoals)) {
      event.target.checked = !event.target.checked;
      return;
    }
    gameManager.stateManager.before('finishScenario.battleGoal', character.edition, character.name, value);
    this.battleGoals[index] = battleGoals;
    this.updateFinish();
    gameManager.stateManager.after();
  }

  openBattleGoals(character: Character): void {
    this.dialog.open(CharacterBattleGoalsDialog, {
      panelClass: ['dialog'],
      data: { character: character, cardOnly: character.battleGoal }
    });
  }

  openTrial(character: Character): void {
    if (character.progress.trial) {
      this.dialog.open(TrialDialogComponent, {
        panelClass: ['fullscreen-panel'],
        data: {
          edition: character.progress.trial.edition,
          trial: +character.progress.trial.name
        }
      });
    }
  }

  openChallenge(index: number): void {
    if (gameManager.game.challengeDeck.cards[index]) {
      this.dialog.open(ChallengeDialogComponent, {
        panelClass: ['fullscreen-panel'],
        data: gameManager.game.challengeDeck.cards[index]
      });
    }
  }

  toggleTrial(event: any, index: number) {
    const character = this.characters[index];
    gameManager.stateManager.before(
      'finishScenario.trial',
      gameManager.characterManager.characterName(character, true, true),
      this.trials[index]
    );
    this.trials[index] = event.target.checked;
    this.updateFinish();
    gameManager.stateManager.after();
  }

  toggleChallenges(event: any, second: boolean = false) {
    gameManager.stateManager.before('finishScenario.dialog.challenge' + (second ? 's' : ''));
    this.challenges = gameManager.scenarioFinishManager.toggleChallenges(this.challenges, second);
    if (second && this.challenges === 1) {
      event.target.checked = false;
    }
    this.updateFinish();
    gameManager.stateManager.after();
  }

  itemDistributed(index: number, itemIndex: number): boolean {
    return gameManager.scenarioFinishManager.finishItemBlocked(
      {
        characters: this.characters,
        items: this.items,
        rewards: this.rewards,
        rewardItems: { items: this.rewardItems, counts: this.rewardItemCount }
      },
      index,
      itemIndex
    );
  }

  toggleItem(event: any, index: number, itemIndex: number) {
    this.items[index] = this.items[index] || [];
    if (!this.items[index].includes(itemIndex) && this.itemDistributed(index, itemIndex)) {
      return;
    }
    gameManager.stateManager.before('finishScenario.dialog.item', index, this.rewardItems[itemIndex].id);
    if (!this.items[index].includes(itemIndex)) {
      this.items[index].push(itemIndex);
    } else {
      this.items[index].splice(this.items[index].indexOf(itemIndex), 1);
    }
    this.updateFinish();
    gameManager.stateManager.after();
  }

  toggleRandomItem(event: any, index: number) {
    gameManager.stateManager.before('finishScenario.dialog.item', index);
    this.randomItemIndex = this.randomItemIndex === index ? -1 : index;
    this.updateFinish();
    gameManager.stateManager.after();
  }

  openItemDialog(itemData: ItemData | undefined) {
    if (itemData) {
      this.dialog.open(ItemDialogComponent, {
        panelClass: ['fullscreen-panel'],
        disableClose: true,
        data: { item: itemData }
      });
    }
  }

  get collectiveEntries(): DistributionEntry[] {
    const entries: DistributionEntry[] = [];
    if (this.rewards?.collectiveGold) {
      entries.push({ type: 'gold', total: this.rewards.collectiveGold });
    }
    if (this.rewards?.collectiveResources && !settingsManager.settings.fhShareResources) {
      for (const resource of this.rewards.collectiveResources) {
        entries.push({ type: resource.type, total: EntityValueFunction(resource.value) });
      }
    }
    return entries;
  }

  get collectiveInitialCharacterValues(): Partial<Record<string, number>>[] {
    return this.characters.map((_, i) => {
      const values: Partial<Record<string, number>> = {};
      if (this.collectiveGold[i]) values['gold'] = this.collectiveGold[i];
      if (this.collectiveResources[i]) {
        for (const [type, val] of Object.entries(this.collectiveResources[i])) {
          if (val) values[type] = val;
        }
      }
      return values;
    });
  }

  onCollectiveChange(change: DistributionChange): void {
    if (change.source === 'party') return;
    const index = change.source as number;
    if (change.type === 'gold') {
      const value = change.value;
      if (
        value !== (this.collectiveGold[index] || 0) &&
        gameManager.scenarioFinishManager.validCollectiveGold(this.rewards, this.collectiveGold, index, value)
      ) {
        gameManager.stateManager.before('finishScenario.dialog.collectiveGold', index, value);
        this.collectiveGold[index] = value;
        this.updateFinish();
        gameManager.stateManager.after();
      }
    } else {
      const type = change.type as LootType;
      const value = change.value;
      if (!this.collectiveResources[index]) {
        this.collectiveResources[index] = {};
      }
      if (
        value !== (this.collectiveResources[index][type] || 0) &&
        gameManager.scenarioFinishManager.validCollectiveResource(this.rewards, this.collectiveResources, index, type, value)
      ) {
        gameManager.stateManager.before('finishScenario.dialog.collectiveResource', type, index, value);
        this.collectiveResources[index][type] = value;
        this.updateFinish();
        gameManager.stateManager.after();
      }
    }
  }

  changeCalendarSectionManual(event: any, index: number) {
    if (!gameManager.scenarioFinishManager.validCalendarSection(this.rewards, index, +event.target.value)) {
      event.target.value = this.calendarSectionManual[index] ?? -1;
      return;
    }
    gameManager.stateManager.before('finishScenario.dialog.calendarSectionManual', index, event.target.value);
    this.calendarSectionManual[index] = +event.target.value;
    this.updateFinish();
    gameManager.stateManager.after();
  }

  selectLocation(location: string) {
    gameManager.stateManager.before('finishScenario.dialog.chooseLocation', location);
    this.chooseLocation = location;
    this.updateFinish();
    gameManager.stateManager.after();
  }

  selectCharacter(character: string) {
    gameManager.stateManager.before('finishScenario.dialog.chooseUnlockCharacter', character);
    this.chooseUnlockCharacter = character;
    this.updateFinish();
    gameManager.stateManager.after();
  }

  openCharacterSheet(character: Character): void {
    this.dialog.open(CharacterSheetDialog, {
      panelClass: ['dialog-invert'],
      data: { character: character }
    });
  }

  toggleAbsent(character: Character): void {
    if (gameManager.characterManager.canSetAbsent(character, !character.absent)) {
      gameManager.entityManager.before(character, character, character.absent ? 'unsetAbsent' : 'setAbsent');
      gameManager.characterManager.setAbsent(character, !character.absent);
      gameManager.stateManager.after();
    }
  }

  changeOverlayCustomText(event: any) {
    gameManager.stateManager.before('finishScenario.dialog.overlayCustomText', event.target.value);
    this.overlayCustomText = event.target.value;
    this.updateFinish();
    // an already solved conclusion keeps its text directly
    if (this.conclusion) {
      gameManager.scenarioFinishManager.setConclusionCustomText(this.conclusion, this.overlayCustomText);
    }
    gameManager.stateManager.after();
  }

  async finish(linkedIndex: string | undefined = undefined, forcedLink: boolean = false) {
    this.waitForClose = true;
    const linkedScenarioData = gameManager.editionManager
      .scenarioData(this.scenario.edition)
      .find((scenarioData) => scenarioData.group === this.scenario.group && scenarioData.index === linkedIndex);
    const personalQuestsCompleted = this.personalQuestsCompleted();
    if (this.conclusionOnly) {
      gameManager.stateManager.before('finishConclusion', ...gameManager.scenarioManager.scenarioUndoArgs(this.scenario));
    } else {
      gameManager.stateManager.before(
        this.success && linkedScenarioData ? 'finishScenario.linked' : 'finishScenario.' + (this.success ? 'success' : 'failure'),
        ...gameManager.scenarioManager.scenarioUndoArgs(),
        linkedIndex ? linkedIndex : ''
      );
    }

    const apply = new ScenarioFinishApply(
      this.scenario,
      this.success,
      this.conclusion,
      this.finishModel(),
      this.characters,
      this.rewards,
      this.rewardItems,
      this.characterProgress || this.forceCampaign,
      this.gainRewards || this.forceCampaign
    );
    apply.conclusionOnly = this.conclusionOnly;
    apply.linked = linkedScenarioData;
    apply.forcedLink = forcedLink;
    if (gameManager.scenarioFinishManager.applyScenarioFinish(apply) && linkedScenarioData) {
      this.dialog.open(ScenarioRequirementsDialogComponent, {
        panelClass: ['dialog'],
        data: { scenarioData: linkedScenarioData, linked: true }
      });
    }

    await gameManager.stateManager.after(
      0,
      settingsManager.settings.autoBackup > -1 &&
        settingsManager.settings.autoBackupFinish &&
        (settingsManager.settings.autoBackup === 0 ||
          (gameManager.game.revision + gameManager.game.revisionOffset) % settingsManager.settings.autoBackup !== 0)
    );

    this.close();

    if (!linkedScenarioData) {
      this.openRetirements(this.personalQuestsCompleted().filter((character) => !personalQuestsCompleted.includes(character)));
    }
  }

  personalQuestsCompleted(): Character[] {
    return gameManager.game.figures.filter(
      (figure) => figure instanceof Character && gameManager.personalQuestManager.personalQuestCompleted(figure)
    ) as Character[];
  }

  openRetirements(characters: Character[]) {
    if (!characters.length || !settingsManager.settings.applyRetirement || !gameManager.game.party.campaignMode) {
      return;
    }
    const [character, ...remaining] = characters;
    this.dialog
      .open(CharacterRetirementDialog, {
        panelClass: ['dialog'],
        data: character
      })
      .closed.subscribe({
        next: () => this.openRetirements(remaining)
      });
  }

  restart() {
    this.waitForClose = true;
    gameManager.stateManager.before('finishScenario.restart', ...gameManager.scenarioManager.scenarioUndoArgs());
    gameManager.scenarioFinishManager.finishScenario(
      this.gameManager.game.scenario,
      this.success,
      this.conclusion,
      true,
      false,
      settingsManager.settings.scenarioRewards && (this.characterProgress || this.forceCampaign),
      this.gainRewards || this.forceCampaign,
      false
    );
    gameManager.stateManager.after(1000);
    this.close();
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }

  unlocked(character: string) {
    return gameManager.game.unlockedCharacters.includes(this.scenario.edition + ':' + character);
  }
}
