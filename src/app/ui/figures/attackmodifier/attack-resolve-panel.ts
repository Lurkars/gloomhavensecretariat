import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { AttackResolveInputField } from 'src/app/game/businesslogic/AttackResolveManager';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { AttackModifierComponent } from 'src/app/ui/figures/attackmodifier/attackmodifier';
import { ConditionsComponent } from 'src/app/ui/figures/conditions/conditions';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [NgClass, GhsLabelDirective, ConditionsComponent, AttackModifierComponent],
  selector: 'ghs-attack-resolve-panel',
  templateUrl: './attack-resolve-panel.html',
  styleUrls: ['./attack-resolve-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttackResolvePanelComponent {
  private ghsManager = inject(GhsManager);

  settingsManager: SettingsManager = settingsManager;
  gameManager: GameManager = gameManager;
  numpadKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  constructor() {
    this.ghsManager.uiChangeEffect(() => {});
  }

  get manager() {
    return gameManager.attackResolveManager;
  }

  get visible(): boolean {
    return this.manager.phase === 'configure' && this.manager.hasAttacker && !!this.manager.target;
  }

  get target() {
    return this.manager.target!;
  }

  get attackDeck() {
    return this.manager.attackModifierDeck;
  }

  get deckNumeration(): string {
    return this.manager.deckNumeration;
  }

  get deckIconUrl(): string {
    return this.manager.deckIconUrl;
  }

  get newStyle(): boolean {
    if (this.manager.character) {
      return gameManager.newAmStyle(this.manager.character.edition) || settingsManager.settings.fhStyle;
    }
    return settingsManager.settings.fhStyle;
  }

  get attackerEntity() {
    return this.manager.attackerEntity;
  }

  get attackerFigure() {
    return this.manager.attackerFigure;
  }

  get activeInputDisplay(): string {
    if (this.manager.inputField === 'damage') {
      return '' + this.manager.finalDamage;
    }
    if (this.manager.inputField === 'pierce') {
      return '' + this.manager.pierce;
    }
    return '' + this.manager.baseAttack;
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (!this.visible || !settingsManager.settings.keyboardShortcuts) {
      return;
    }
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }
    if (event.key >= '0' && event.key <= '9') {
      this.manager.appendDigit(+event.key);
      event.preventDefault();
      event.stopPropagation();
    } else if (event.key === 'Backspace') {
      this.manager.backspaceDigit();
      event.preventDefault();
      event.stopPropagation();
    } else if (event.key === 'Escape') {
      if (this.manager.inputField === 'damage' && this.manager.numpadOpen) {
        this.manager.cancelDamageEdit();
      } else {
        this.manager.closeNumpad();
      }
      event.preventDefault();
      event.stopPropagation();
    } else if (event.key === 'Enter' && this.manager.numpadOpen) {
      this.manager.closeNumpad();
      event.preventDefault();
      event.stopPropagation();
    }
  }

  acceptNumpad(): void {
    this.manager.closeNumpad();
  }

  openInputField(field: AttackResolveInputField, event: Event): void {
    event.stopPropagation();
    this.manager.setInputField(field);
  }

  inputFieldLabel(field: AttackResolveInputField): string {
    const value =
      field === 'damage' ? this.manager.finalDamage : field === 'pierce' ? this.manager.pierce : this.manager.baseAttack;
    const key =
      field === 'damage'
        ? 'game.attackResolve.inputDamageValue'
        : field === 'pierce'
          ? 'game.attackResolve.inputPierceValue'
          : 'game.attackResolve.inputAttackValue';
    return settingsManager.getLabel(key, ['' + value]);
  }

  numpadDigitLabel(digit: number): string {
    return settingsManager.getLabel('game.attackResolve.numpadDigit', ['' + digit]);
  }

  get clearButtonLabel(): string {
    return settingsManager.getLabel('game.attackResolve.clear');
  }

  get backspaceButtonLabel(): string {
    return settingsManager.getLabel('game.attackResolve.backspace');
  }

  actionAltLabel(action: 'attack' | 'pierce' | 'damage' | 'shield'): string {
    const keys: Record<typeof action, string> = {
      attack: 'game.attackResolve.inputAttack',
      pierce: 'game.attackResolve.inputPierce',
      damage: 'game.attackResolve.inputDamage',
      shield: 'game.action.shield'
    };
    return settingsManager.getLabel(keys[action]);
  }

  get drawAdvantageAltLabel(): string {
    return settingsManager.getLabel('game.cards.drawAdvantage');
  }

  get drawDisadvantageAltLabel(): string {
    return settingsManager.getLabel('game.cards.drawDisadvantage');
  }

  actionIconUrl(action: 'attack' | 'pierce' | 'damage' | 'shield'): string {
    const prefix = settingsManager.settings.fhStyle ? '/fh' : '';
    if (action === 'shield') {
      return './assets/images' + prefix + '/action/hint/shield.svg';
    }
    if (action === 'damage') {
      return './assets/images' + prefix + '/action/damage.svg';
    }
    return './assets/images' + prefix + '/action/' + action + '.svg';
  }

  get numpadDoneLabel(): string {
    return settingsManager.getLabel('game.attackResolve.numpadDone');
  }

  get undoButtonLabel(): string {
    return settingsManager.getLabel('game.attackResolve.undo');
  }

  get cancelDamageLabel(): string {
    return settingsManager.getLabel('cancel');
  }

  get applyButtonLabel(): string {
    return settingsManager.getLabel(this.manager.applied ? 'game.attackResolve.applied' : 'game.attackResolve.apply');
  }

  get closeButtonLabel(): string {
    return settingsManager.getLabel('close');
  }
}
