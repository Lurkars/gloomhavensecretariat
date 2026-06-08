import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import {
  AttackModifierDeck,
  AttackModifierEffect,
  AttackModifierEffectType,
  AttackResult
} from 'src/app/game/model/data/AttackModifier';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/data/Action';
import { Condition, ConditionName, ConditionType, EntityCondition, EntityConditionState } from 'src/app/game/model/data/Condition';
import { MonsterStat } from 'src/app/game/model/data/MonsterStat';
import { Entity, EntityExpressionRegex, EntityValueFunction, EntityValueRegex } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { Summon, SummonState } from 'src/app/game/model/Summon';
import { AttackModiferDeckChange } from 'src/app/ui/figures/attackmodifier/attackmodifierdeck';
import { ghsValueSign } from 'src/app/ui/helper/Static';

export type AttackResolvePhase = 'idle' | 'pickTarget' | 'configure';
export type AttackResolveTarget = { entity: Entity; figure: Figure };
export type AttackResolveInputField = 'attack' | 'pierce' | 'damage';

type AttackResolveConfigureSnapshot = {
  baseAttack: number;
  pierce: number;
  pierceBase: number;
  pendingAttackerConditions: EntityCondition[];
  pendingTargetConditions: EntityCondition[];
};

export class AttackResolveManager {
  phase: AttackResolvePhase = 'idle';
  character: Character | undefined;
  monster: Monster | undefined;
  target: AttackResolveTarget | undefined;
  baseAttack: number = 0;
  pierce: number = 0;
  private pierceBase: number = 0;
  damageValue: number = 0;
  private damageManuallySet: boolean = false;
  private inputOverwrite: boolean = true;
  inputField: AttackResolveInputField = 'attack';
  numpadOpen: boolean = false;
  pendingAttackerConditions: EntityCondition[] = [];
  pendingTargetConditions: EntityCondition[] = [];
  attackResult: AttackResult | undefined;
  applied: boolean = false;
  conditionType: string = 'monster';
  private configureSnapshot: AttackResolveConfigureSnapshot | undefined;
  private deckChangeCount: number = 0;
  private damageEditSnapshot: { value: number; manual: boolean } | undefined;
  private targetIndex: number = -1;

  constructor(private gameManager: GameManager) {}

  get hasAttacker(): boolean {
    return !!this.character || !!this.monster;
  }

  get attackerLabel(): string {
    if (this.character) {
      return this.gameManager.characterManager.characterName(this.character, true);
    }
    if (this.monster) {
      const nameKey = this.monster.statEffect?.name ? this.monster.statEffect.name : this.monster.name;
      return settingsManager.getLabel('data.monster.' + nameKey);
    }
    return '';
  }

  get attackModifierDeck(): AttackModifierDeck | undefined {
    if (this.character) {
      return this.character.attackModifierDeck;
    }
    if (this.monster) {
      return this.monsterUsesAllyDeck(this.monster)
        ? this.gameManager.game.allyAttackModifierDeck
        : this.gameManager.game.monsterAttackModifierDeck;
    }
    return undefined;
  }

  get deckNumeration(): string {
    if (this.character) {
      return '' + this.character.number;
    }
    return this.monsterUsesAllyDeck(this.monster!) ? 'A' : 'm';
  }

  get deckIconUrl(): string {
    return this.character?.iconUrl || '';
  }

  get attackerEntity(): Entity | undefined {
    if (this.character) {
      return this.character;
    }
    if (this.monster) {
      return this.activeMonsterEntity(this.monster);
    }
    return undefined;
  }

  get attackerFigure(): Figure | undefined {
    return this.character || this.monster;
  }

  get conditionAttackBonus(): number {
    const target = this.target;
    if (!target) {
      return 0;
    }
    return this.gameManager.entityManager.attackConditionBonus(target.entity, target.figure);
  }

  get effectiveBaseAttack(): number {
    return this.baseAttack + this.conditionAttackBonus;
  }

  get targetShield(): number {
    const target = this.target;
    if (!target) {
      return 0;
    }
    return this.gameManager.entityManager.entityShieldValue(target.entity, target.figure);
  }

  get targetRetaliate(): number {
    const target = this.target;
    if (!target) {
      return 0;
    }
    return this.gameManager.entityManager.entityRetaliateValue(target.entity, target.figure);
  }

  get shieldBlocked(): number {
    return this.gameManager.entityManager.shieldBlockedByAttack(this.targetShield, this.pierce);
  }

  get calculatedDamage(): number {
    if (!this.attackResult) {
      return 0;
    }
    return Math.max(0, this.attackResult.result - this.shieldBlocked);
  }

  get damageIsManual(): boolean {
    return this.damageManuallySet;
  }

  get finalDamage(): number {
    if (!this.attackResult) {
      return 0;
    }
    return this.damageManuallySet ? this.damageValue : this.calculatedDamage;
  }

  get attackerConditionType(): string {
    if (this.character) {
      return 'character';
    }
    if (this.monster) {
      return 'monster';
    }
    return 'monster';
  }

  monsterUsesAllyDeck(monster: Monster): boolean {
    return monster.isAlly || monster.isAllied;
  }

  footerAttackCharacter(): Character | undefined {
    const figures = this.gameManager.game.figures;

    if (!settingsManager.settings.characterAttackModifierDeck) {
      return undefined;
    }

    if (settingsManager.settings.characterAttackModifierDeckActiveBottom) {
      return figures.find(
        (figure) => figure instanceof Character && (figure.attackModifierDeckVisible || this.gameManager.bbRules())
      ) as Character;
    }

    if (settingsManager.settings.attackResolveGuided && this.gameManager.game.scenario) {
      if (this.phase !== 'idle' && this.character) {
        return this.character;
      }
      return figures.find((figure) => figure instanceof Character && figure.active) as Character;
    }

    return undefined;
  }

  footerAttackMonster(): Monster | undefined {
    if (!settingsManager.settings.attackResolveGuided || !this.gameManager.game.scenario) {
      return undefined;
    }
    if (this.phase !== 'idle' && this.monster) {
      return this.monster;
    }
    return this.gameManager.game.figures.find((figure) => figure instanceof Monster && figure.active) as Monster;
  }

  enabledFor(character: Character | undefined): boolean {
    return (
      settingsManager.settings.attackResolveGuided &&
      !!character &&
      !!this.gameManager.game.scenario &&
      this.gameManager.game.state === GameState.next &&
      character === this.footerAttackCharacter()
    );
  }

  enabledForMonster(monster: Monster | undefined): boolean {
    return (
      settingsManager.settings.attackResolveGuided &&
      !!monster &&
      !!this.gameManager.game.scenario &&
      this.gameManager.game.state === GameState.next &&
      monster.active &&
      monster === this.footerAttackMonster()
    );
  }

  isPickingTarget(character: Character | undefined): boolean {
    return this.phase === 'pickTarget' && this.character === character;
  }

  isPickingTargetMonster(monster: Monster | undefined): boolean {
    return this.phase === 'pickTarget' && this.monster === monster;
  }

  isConfiguring(character: Character | undefined): boolean {
    return this.phase === 'configure' && this.character === character;
  }

  isConfiguringMonster(monster: Monster | undefined): boolean {
    return this.phase === 'configure' && this.monster === monster;
  }

  startAttack(character: Character): void {
    if (!this.enabledFor(character)) {
      return;
    }
    this.cancel(false);
    this.character = character;
    this.monster = undefined;
    this.phase = 'pickTarget';
    this.resetConfigureFields();
    character.attackModifierDeck.active = false;
    this.syncBodyPhaseClass();
    this.gameManager.triggerUiChange(false);
  }

  startMonsterAttack(monster: Monster): void {
    if (!this.enabledForMonster(monster)) {
      return;
    }
    this.cancel(false);
    this.monster = monster;
    this.character = undefined;
    this.phase = 'pickTarget';
    this.resetConfigureFields();
    this.attackModifierDeck!.active = false;
    this.syncBodyPhaseClass();
    this.gameManager.triggerUiChange(false);
  }

  handleStandeeClick(entity: Entity, figure: Figure): boolean {
    if (this.phase !== 'pickTarget' || !this.hasAttacker) {
      return false;
    }
    this.selectTarget(entity, figure);
    return true;
  }

  selectTarget(entity: Entity, figure: Figure): void {
    if (this.phase !== 'pickTarget' || !this.hasAttacker) {
      return;
    }
    this.target = { entity, figure };
    this.targetIndex = this.gameManager.entityManager.getIndexForEntity(entity, true);
    this.phase = 'configure';
    this.attackResult = undefined;
    this.applied = false;
    this.updateConditionType();
    if (this.monster) {
      this.applyMonsterAbilitySuggestions();
    } else {
      this.baseAttack = 0;
      this.pierce = 0;
      this.pierceBase = 0;
      this.pendingAttackerConditions = [];
      this.pendingTargetConditions = [];
    }
    this.inputField = 'attack';
    this.inputOverwrite = true;
    this.numpadOpen = false;
    const deck = this.attackModifierDeck;
    if (deck) {
      deck.active = false;
    }
    this.saveConfigureSnapshot();
    this.deckChangeCount = 0;
    this.damageEditSnapshot = undefined;
    this.syncBodyPhaseClass();
    this.gameManager.triggerUiChange(false);
  }

  cancel(trigger: boolean = true): void {
    this.phase = 'idle';
    this.character = undefined;
    this.monster = undefined;
    this.target = undefined;
    this.resetConfigureFields();
    this.syncBodyPhaseClass();
    if (trigger) {
      this.gameManager.triggerUiChange(false);
    }
  }

  setInputField(field: AttackResolveInputField): void {
    if (this.phase !== 'configure') {
      return;
    }
    if (field === 'damage' && !this.attackResult) {
      return;
    }
    if (field === 'damage') {
      this.damageEditSnapshot = {
        value: this.damageManuallySet ? this.damageValue : this.calculatedDamage,
        manual: this.damageManuallySet
      };
    }
    this.inputField = field;
    this.inputOverwrite = true;
    this.numpadOpen = true;
    this.gameManager.triggerUiChange(false);
  }

  closeNumpad(): void {
    if (!this.numpadOpen) {
      return;
    }
    this.numpadOpen = false;
    this.damageEditSnapshot = undefined;
    this.gameManager.triggerUiChange(false);
  }

  cancelDamageEdit(): void {
    if (this.inputField === 'damage' && this.damageEditSnapshot) {
      this.damageValue = this.damageEditSnapshot.value;
      this.damageManuallySet = this.damageEditSnapshot.manual;
    }
    this.damageEditSnapshot = undefined;
    this.closeNumpad();
  }

  appendDigit(digit: number): void {
    if (this.phase !== 'configure') {
      return;
    }
    if (this.inputField === 'damage') {
      if (!this.attackResult) {
        return;
      }
      if (this.inputOverwrite) {
        this.damageValue = digit;
        this.inputOverwrite = false;
      } else {
        this.damageValue = Math.min(999, this.damageValue * 10 + digit);
      }
      this.damageManuallySet = true;
    } else if (this.inputField === 'pierce') {
      if (this.inputOverwrite) {
        this.pierceBase = digit;
        this.inputOverwrite = false;
      } else {
        this.pierceBase = Math.min(99, this.pierceBase * 10 + digit);
      }
      this.pierce = this.pierceBase;
      this.resetDamageFromCalculation();
    } else {
      if (this.inputOverwrite) {
        this.baseAttack = digit;
        this.inputOverwrite = false;
      } else {
        this.baseAttack = Math.min(999, this.baseAttack * 10 + digit);
      }
      this.attackResult = undefined;
      this.damageManuallySet = false;
      this.damageValue = 0;
    }
    this.gameManager.triggerUiChange(false);
  }

  backspaceDigit(): void {
    if (this.phase !== 'configure') {
      return;
    }
    if (this.inputField === 'damage') {
      if (!this.attackResult) {
        return;
      }
      this.damageValue = Math.floor(this.damageValue / 10);
      this.damageManuallySet = true;
      this.inputOverwrite = false;
    } else if (this.inputField === 'pierce') {
      this.pierceBase = Math.floor(this.pierceBase / 10);
      this.pierce = this.pierceBase;
      this.inputOverwrite = false;
      this.resetDamageFromCalculation();
    } else {
      this.baseAttack = Math.floor(this.baseAttack / 10);
      this.attackResult = undefined;
      this.damageManuallySet = false;
      this.damageValue = 0;
      this.inputOverwrite = false;
    }
    this.gameManager.triggerUiChange(false);
  }

  clearActiveInput(): void {
    if (this.phase !== 'configure') {
      return;
    }
    if (this.inputField === 'damage') {
      if (!this.attackResult) {
        return;
      }
      this.damageValue = 0;
      this.damageManuallySet = true;
      this.inputOverwrite = true;
    } else if (this.inputField === 'pierce') {
      this.pierceBase = 0;
      this.pierce = 0;
      this.inputOverwrite = true;
      this.resetDamageFromCalculation();
    } else {
      this.baseAttack = 0;
      this.attackResult = undefined;
      this.damageManuallySet = false;
      this.damageValue = 0;
      this.inputOverwrite = true;
    }
    this.gameManager.triggerUiChange(false);
  }

  private resetDamageFromCalculation(): void {
    if (this.attackResult) {
      this.damageManuallySet = false;
      this.syncDamageFromCalculation();
    }
  }

  private syncDamageFromCalculation(): void {
    this.damageValue = this.calculatedDamage;
    this.damageManuallySet = false;
    this.inputOverwrite = true;
  }

  setPendingAttackerConditions(conditions: EntityCondition[]): void {
    this.pendingAttackerConditions = conditions;
    this.gameManager.triggerUiChange(false);
  }

  setPendingTargetConditions(conditions: EntityCondition[]): void {
    this.pendingTargetConditions = conditions;
    this.gameManager.triggerUiChange(false);
  }

  get canDraw(): boolean {
    return this.phase === 'configure' && !!this.target && this.baseAttack >= 0 && this.hasAttacker;
  }

  get needsShuffle(): boolean {
    const deck = this.attackModifierDeck;
    return !!deck && deck.current >= deck.cards.length - 1;
  }

  get canUndoAttack(): boolean {
    if (this.phase !== 'configure' || !this.configureSnapshot) {
      return false;
    }
    return (
      this.deckChangeCount > 0 ||
      !!this.attackResult ||
      this.baseAttack !== this.configureSnapshot.baseAttack ||
      this.pierce !== this.configureSnapshot.pierce ||
      this.damageManuallySet ||
      !this.pendingConditionsMatch(this.pendingAttackerConditions, this.configureSnapshot.pendingAttackerConditions) ||
      !this.pendingConditionsMatch(this.pendingTargetConditions, this.configureSnapshot.pendingTargetConditions)
    );
  }

  drawModifier(state?: 'advantage' | 'disadvantage'): void {
    const deck = this.attackModifierDeck;
    if (!this.canDraw || !deck) {
      return;
    }

    const changeType = this.needsShuffle ? 'shuffle' : 'draw' + (state ? state : '');
    this.beforeDeck(new AttackModiferDeckChange(deck, changeType));
    deck.active = true;
    if (this.needsShuffle) {
      this.gameManager.attackModifierManager.shuffleModifiers(deck);
    } else {
      this.gameManager.attackModifierManager.drawModifier(deck, state);
    }
    this.deckChangeCount++;
    this.afterDeck(new AttackModiferDeckChange(deck, changeType));
  }

  undoAttack(): void {
    if (!this.canUndoAttack) {
      return;
    }
    if (this.deckChangeCount > 0) {
      this.gameManager.stateManager.fixedUndo(this.deckChangeCount, false);
      this.deckChangeCount = 0;
      this.refreshResolveReferences();
    }
    this.restoreConfigureSnapshot();
    const deck = this.attackModifierDeck;
    if (deck) {
      deck.active = false;
    }
    this.gameManager.triggerUiChange(false);
  }

  toggleAttackResult(): void {
    const deck = this.attackModifierDeck;
    if (!this.attackResult || !this.attackResult.chooseOffset || !deck) {
      return;
    }
    this.attackResult = this.gameManager.attackModifierManager.calculateAttackResult(
      deck,
      this.effectiveBaseAttack,
      this.attackResult.index + this.attackResult.chooseOffset
    );
    this.applyModifierPierce();
    this.syncDamageFromCalculation();
    this.gameManager.triggerUiChange(false);
  }

  applyAttack(): void {
    const target = this.target;
    const deck = this.attackModifierDeck;
    if (!target || !this.attackResult || this.applied || !deck) {
      return;
    }

    const damage = this.finalDamage;
    const skipPoisonHighlight = this.conditionAttackBonus > 0;
    this.gameManager.stateManager.before('changeDamage', ghsValueSign(-damage), this.targetLabel(target));
    this.gameManager.entityManager.changeHealth(target.entity, target.figure, -damage, true, skipPoisonHighlight);

    const attacker = this.attackerEntity;
    const attackerFigure = this.attackerFigure;

    this.pendingAttackerConditions
      .filter((condition) => condition.state === EntityConditionState.new && !condition.expired)
      .forEach((condition) => {
        if (attacker && attackerFigure && !this.gameManager.entityManager.isImmune(attacker, attackerFigure, condition.name)) {
          this.gameManager.entityManager.addCondition(attacker, attackerFigure, new Condition(condition.name, condition.value));
        }
      });

    this.pendingTargetConditions
      .filter((condition) => condition.state === EntityConditionState.new && !condition.expired)
      .forEach((condition) => {
        if (!this.gameManager.entityManager.isImmune(target.entity, target.figure, condition.name)) {
          this.gameManager.entityManager.addCondition(target.entity, target.figure, new Condition(condition.name, condition.value));
        }
      });

    this.attackResult.effects.forEach((effect) => {
      if (effect.type === AttackModifierEffectType.condition && effect.value) {
        const name = effect.value as ConditionName;
        if (!this.gameManager.entityManager.isImmune(target.entity, target.figure, name)) {
          this.gameManager.entityManager.addCondition(target.entity, target.figure, new Condition(name));
        }
      }
    });

    this.gameManager.stateManager.after();
    this.finish();
  }

  finish(): void {
    const deck = this.attackModifierDeck;
    if (deck) {
      deck.active = false;
    }
    this.cancel();
  }

  targetLabel(entry: AttackResolveTarget): string {
    if (entry.figure instanceof Character && entry.entity === entry.figure) {
      return this.gameManager.characterManager.characterName(entry.figure, true);
    }
    if (entry.figure instanceof Character && entry.entity instanceof Summon) {
      return settingsManager.getLabel('data.summon.' + entry.entity.name);
    }
    if (entry.figure instanceof Monster && entry.entity instanceof MonsterEntity) {
      const monster = entry.figure;
      const nameKey = monster.statEffect?.name ? monster.statEffect.name : monster.name;
      const entityNum = monster.entities.indexOf(entry.entity) + 1;
      return settingsManager.getLabel('data.monster.' + nameKey) + ' #' + entityNum;
    }
    if (entry.figure instanceof ObjectiveContainer) {
      return settingsManager.getLabel('data.objective.' + entry.figure.name);
    }
    const index = this.gameManager.entityManager.getIndexForEntity(entry.entity, true) + 1;
    return '' + index;
  }

  deckHintLabelKey(): string {
    if (this.monster) {
      return this.monsterUsesAllyDeck(this.monster) ? 'game.attackResolve.deckHintAlly' : 'game.attackResolve.deckHintMonster';
    }
    return 'game.attackResolve.deckHint';
  }

  private resetConfigureFields(): void {
    this.target = undefined;
    this.baseAttack = 0;
    this.pierce = 0;
    this.pierceBase = 0;
    this.damageValue = 0;
    this.damageManuallySet = false;
    this.inputOverwrite = true;
    this.inputField = 'attack';
    this.numpadOpen = false;
    this.pendingAttackerConditions = [];
    this.pendingTargetConditions = [];
    this.attackResult = undefined;
    this.applied = false;
    this.configureSnapshot = undefined;
    this.deckChangeCount = 0;
    this.damageEditSnapshot = undefined;
    this.targetIndex = -1;
  }

  private saveConfigureSnapshot(): void {
    this.configureSnapshot = {
      baseAttack: this.baseAttack,
      pierce: this.pierce,
      pierceBase: this.pierceBase,
      pendingAttackerConditions: this.clonePendingConditions(this.pendingAttackerConditions),
      pendingTargetConditions: this.clonePendingConditions(this.pendingTargetConditions)
    };
  }

  private restoreConfigureSnapshot(): void {
    const snapshot = this.configureSnapshot;
    if (!snapshot) {
      return;
    }
    this.baseAttack = snapshot.baseAttack;
    this.pierce = snapshot.pierce;
    this.pierceBase = snapshot.pierceBase;
    this.pendingAttackerConditions = this.clonePendingConditions(snapshot.pendingAttackerConditions);
    this.pendingTargetConditions = this.clonePendingConditions(snapshot.pendingTargetConditions);
    this.attackResult = undefined;
    this.damageValue = 0;
    this.damageManuallySet = false;
    this.inputOverwrite = true;
    this.inputField = 'attack';
    this.numpadOpen = false;
    this.damageEditSnapshot = undefined;
  }

  private clonePendingConditions(conditions: EntityCondition[]): EntityCondition[] {
    return conditions.map((condition) => {
      const copy = new EntityCondition(condition.name, condition.value);
      copy.state = condition.state;
      copy.lastState = condition.lastState;
      copy.permanent = condition.permanent;
      copy.expired = condition.expired;
      copy.highlight = condition.highlight;
      copy.highlightValue = condition.highlightValue;
      return copy;
    });
  }

  private refreshResolveReferences(): void {
    if (this.character) {
      const number = this.character.number;
      const figure = this.gameManager.game.figures.find((f) => f instanceof Character && f.number === number);
      if (figure instanceof Character) {
        this.character = figure;
      }
    } else if (this.monster) {
      const name = this.monster.name;
      const figure =
        this.gameManager.game.figures.find((f) => f instanceof Monster && f.name === name && f.active) ||
        this.gameManager.game.figures.find((f) => f instanceof Monster && f.name === name);
      if (figure instanceof Monster) {
        this.monster = figure;
      }
    }
    if (this.targetIndex >= 0) {
      const indexed = this.gameManager.entityManager.getIndexedEntities(true)[this.targetIndex];
      if (indexed) {
        this.target = { entity: indexed.entity, figure: indexed.figure };
      }
    }
  }

  private pendingConditionsMatch(current: EntityCondition[], snapshot: EntityCondition[]): boolean {
    if (current.length !== snapshot.length) {
      return false;
    }
    return current.every((condition, index) => {
      const other = snapshot[index];
      return (
        condition.name === other.name &&
        condition.value === other.value &&
        condition.state === other.state &&
        condition.expired === other.expired
      );
    });
  }

  refreshMonsterAbilitySuggestions(): void {
    if (this.phase !== 'configure' || !this.monster) {
      return;
    }
    this.applyMonsterAbilitySuggestions();
    this.saveConfigureSnapshot();
    this.gameManager.triggerUiChange(false);
  }

  private applyMonsterAbilitySuggestions(): void {
    if (!this.monster) {
      return;
    }
    const attack = this.monsterAbilityAttackValue(this.monster);
    this.baseAttack = attack !== undefined ? attack : 0;
    this.pierceBase = this.monsterAbilityPierceValue(this.monster);
    this.pierce = this.pierceBase;
    const pending = this.pendingConditionsFromMonsterAbility(this.monster);
    this.pendingAttackerConditions = pending.attacker;
    this.pendingTargetConditions = pending.target;
  }

  private activeMonsterEntity(monster: Monster): MonsterEntity | undefined {
    if (settingsManager.settings.monsterStandeeTurns) {
      return monster.entities.find(
        (entity) => entity.active && !entity.dead && entity.summon !== SummonState.new
      );
    }
    return (
      monster.entities.find((entity) => entity.active && !entity.dead) ||
      monster.entities.find((entity) => !entity.dead)
    );
  }

  private monsterAbilityAttackValue(monster: Monster): number | undefined {
    const ability = this.gameManager.monsterManager.getAbility(monster);
    if (!ability) {
      return undefined;
    }
    const entity = this.activeMonsterEntity(monster);
    const stat = entity ? this.gameManager.monsterManager.getStat(monster, entity.type) : undefined;
    const level = entity?.level ?? monster.level ?? 0;

    for (const action of this.findAttackActions(ability.actions)) {
      const value = this.resolveAttackActionValue(action, stat, level);
      if (value !== undefined) {
        return value;
      }
    }
    return undefined;
  }

  private pendingConditionsFromMonsterAbility(monster: Monster): { attacker: EntityCondition[]; target: EntityCondition[] } {
    const ability = this.gameManager.monsterManager.getAbility(monster);
    if (!ability) {
      return { attacker: [], target: [] };
    }
    const entity = this.activeMonsterEntity(monster);
    const stat = entity ? this.gameManager.monsterManager.getStat(monster, entity.type) : undefined;
    const names = new Set<ConditionName>();

    ability.actions.forEach((action) => {
      this.gameManager.actionConditions(action, stat).forEach((name) => names.add(name));
    });

    const attacker: EntityCondition[] = [];
    const target: EntityCondition[] = [];

    Array.from(names).forEach((name) => {
      const condition = new EntityCondition(name);
      condition.state = EntityConditionState.new;
      if (new Condition(name).types.includes(ConditionType.positive)) {
        attacker.push(condition);
      } else {
        target.push(condition);
      }
    });

    return { attacker, target };
  }

  private monsterAbilityPierceValue(monster: Monster): number {
    const ability = this.gameManager.monsterManager.getAbility(monster);
    if (!ability) {
      return 0;
    }
    const entity = this.activeMonsterEntity(monster);
    const stat = entity ? this.gameManager.monsterManager.getStat(monster, entity.type) : undefined;
    const level = entity?.level ?? monster.level ?? 0;
    let pierce = 0;

    this.findAttackActions(ability.actions).forEach((action) => {
      pierce = Math.max(pierce, this.pierceFromActions(action, level));
    });

    stat?.actions?.forEach((statAction) => {
      if (statAction.type === ActionType.pierce) {
        pierce = Math.max(pierce, EntityValueFunction(statAction.value, level));
      }
    });

    return pierce;
  }

  private pierceFromActions(action: Action, level: number): number {
    let pierce = 0;
    if (action.type === ActionType.pierce) {
      pierce = Math.max(pierce, EntityValueFunction(action.value, level));
    }
    action.subActions?.forEach((subAction) => {
      pierce = Math.max(pierce, this.pierceFromActions(subAction, level));
    });
    return pierce;
  }

  private pierceFromModifierEffects(effects: AttackModifierEffect[]): number {
    let pierce = 0;
    effects.forEach((effect) => {
      if (effect.type === AttackModifierEffectType.pierce && effect.value !== undefined && effect.value !== '') {
        try {
          pierce += EntityValueFunction(effect.value);
        } catch {
          const parsed = parseInt('' + effect.value, 10);
          if (!isNaN(parsed)) {
            pierce += parsed;
          }
        }
      }
    });
    return pierce;
  }

  private applyModifierPierce(): void {
    if (!this.attackResult) {
      this.pierce = this.pierceBase;
      return;
    }
    this.pierce = this.pierceBase + this.pierceFromModifierEffects(this.attackResult.effects);
  }

  private findAttackActions(actions: Action[]): Action[] {
    const result: Action[] = [];
    actions.forEach((action) => {
      if (action.type === ActionType.attack) {
        result.push(action);
      }
      if (action.subActions?.length) {
        result.push(...this.findAttackActions(action.subActions));
      }
    });
    return result;
  }

  private resolveAttackActionValue(action: Action, stat: MonsterStat | undefined, level: number): number | undefined {
    if (action.type !== ActionType.attack) {
      return undefined;
    }

    if (settingsManager.settings.calculate && stat) {
      let statValue = 0;
      let hasStatAttack = false;

      if (typeof stat.attack === 'number') {
        statValue = stat.attack;
        hasStatAttack = true;
      } else if (typeof stat.attack === 'string' && stat.attack.includes('X')) {
        return undefined;
      } else if (typeof stat.attack === 'string') {
        try {
          statValue = EntityValueFunction(stat.attack, level);
          hasStatAttack = true;
        } catch {
          return undefined;
        }
      }

      if (stat.actions) {
        stat.actions.forEach((statAction) => {
          if (statAction.type === ActionType.attack) {
            if (statAction.valueType === ActionValueType.add) {
              statValue += EntityValueFunction(statAction.value, level);
              hasStatAttack = true;
            } else if (statAction.valueType === ActionValueType.subtract) {
              statValue -= EntityValueFunction(statAction.value, level);
              hasStatAttack = true;
            }
          }
        });
      }

      if (
        action.value !== '' &&
        (action.value || action.value === 0) &&
        (typeof action.value === 'number' ||
          (typeof action.value === 'string' &&
            (action.value.match(EntityExpressionRegex) || action.value.match(EntityValueRegex))))
      ) {
        if (action.valueType === ActionValueType.plus) {
          return statValue + EntityValueFunction(action.value, level);
        }
        if (action.valueType === ActionValueType.minus) {
          return Math.max(0, statValue - EntityValueFunction(action.value, level));
        }
        if (action.valueType === ActionValueType.fixed) {
          return EntityValueFunction(action.value, level);
        }
      }

      return hasStatAttack ? statValue : undefined;
    }

    if (typeof action.value === 'number') {
      return action.value;
    }

    if (
      typeof action.value === 'string' &&
      (action.value.match(EntityExpressionRegex) || action.value.match(EntityValueRegex))
    ) {
      try {
        return EntityValueFunction(action.value, level);
      } catch {
        return undefined;
      }
    }

    return undefined;
  }

  private updateConditionType(): void {
    const target = this.target;
    if (!target) {
      this.conditionType = 'monster';
      return;
    }
    if (target.entity instanceof Character) {
      this.conditionType = 'character';
    } else if (target.entity instanceof MonsterEntity || target.entity instanceof Summon) {
      this.conditionType = 'monster';
    } else {
      this.conditionType = 'objective';
    }
  }

  private beforeDeck(change: AttackModiferDeckChange): void {
    if (!this.hasAttacker) {
      return;
    }
    this.attackResult = undefined;
    this.gameManager.stateManager.before('updateAttackModifierDeck.' + change.type, this.attackerStateLabel(), ...change.values);
  }

  private afterDeck(change: AttackModiferDeckChange): void {
    const deck = this.attackModifierDeck;
    if (!deck) {
      return;
    }
    if (this.character) {
      this.character.attackModifierDeck = change.deck;
    } else if (this.monsterUsesAllyDeck(this.monster!)) {
      this.gameManager.game.allyAttackModifierDeck = change.deck;
    } else {
      this.gameManager.game.monsterAttackModifierDeck = change.deck;
    }
    this.gameManager.stateManager.after();
    if (deck.current < 0) {
      this.attackResult = undefined;
    } else {
      this.attackResult = this.gameManager.attackModifierManager.calculateAttackResult(deck, this.effectiveBaseAttack);
      this.applyModifierPierce();
      this.syncDamageFromCalculation();
    }
    this.gameManager.triggerUiChange(false);
  }

  private attackerStateLabel(): string {
    if (this.character) {
      return this.gameManager.characterManager.characterName(this.character, true, true);
    }
    if (this.monster) {
      const nameKey = this.monster.statEffect?.name ? this.monster.statEffect.name : this.monster.name;
      return settingsManager.getLabel('data.monster.' + nameKey);
    }
    return '';
  }

  private syncBodyPhaseClass(): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.body.classList.toggle('attack-resolve-picking', this.phase === 'pickTarget');
    document.body.classList.toggle('attack-resolve-configuring', this.phase === 'configure');
  }
}

