import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, input, OnChanges, output } from '@angular/core';
import { ActionHex, ActionHexFromString, ActionHexToString, ActionHexType } from 'src/app/game/model/ActionHex';
import { Character } from 'src/app/game/model/Character';
import { Action } from 'src/app/game/model/data/Action';
import { ConditionName } from 'src/app/game/model/data/Condition';
import { ActionEnhancementsComponent } from 'src/app/ui/figures/actions/enhancements/enhancements';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, TrackUUIDPipe, forwardRef(() => ActionEnhancementsComponent)],
  selector: 'ghs-action-hex',
  templateUrl: './action-hex.html',
  styleUrls: ['./action-hex.scss']
})
export class ActionHexComponent implements OnChanges {
  readonly inputAction = input<Action>(undefined, { alias: 'action' });
  get action(): Action | undefined {
    return this.inputAction();
  }

  readonly inputCharacter = input<Character>(undefined, { alias: 'character' });
  get character(): Character | undefined {
    return this.inputCharacter();
  }

  readonly inputValue = input<string>('', { alias: 'value' });

  readonly size = input<number>();
  readonly actionIndex = input<string>('', { alias: 'index' });
  readonly cardId = input<number>();
  readonly clickCallback = output<ActionHex>();
  readonly doubleclickCallback = output<ActionHex>();
  hexes: ActionHex[] = [];
  enhanceHexes: ActionHex[] = [];
  enhancedHexes: ActionHex[] = [];
  edit: boolean = false;
  editMode: boolean = false;
  ActionHex = ActionHex;
  ActionHexToString = ActionHexToString;

  doubleClick: any = null;
  value: string = '';

  ngOnChanges() {
    this.hexes = [];
    this.enhanceHexes = [];
    this.enhancedHexes = [];
    this.value = this.inputValue();
    if (!this.value && this.action) {
      this.value = '' + this.action.value;
    }
    this.value.split('|').forEach((hexValue) => {
      const hex: ActionHex | null = ActionHexFromString(hexValue);
      if (hex !== null) {
        this.hexes.push(hex);
        if (hex.type === ActionHexType.enhance) {
          this.enhanceHexes.push(hex);
          if (
            this.character &&
            this.cardId() &&
            this.actionIndex() &&
            this.character.progress.enhancements &&
            this.character.progress.enhancements.find(
              (e) =>
                e.cardId === this.cardId() &&
                e.actionIndex === this.actionIndex() &&
                e.index === this.enhanceHexes.length - 1 &&
                e.action === 'hex'
            )
          ) {
            this.enhancedHexes.push(hex);
          }
        }
        if (hex.type === ActionHexType.invisible) {
          this.editMode = true;
        }
      }
    });

    this.edit = (this.character && this.character.tags.includes('edit-abilities')) || false;
  }

  click(hex: ActionHex) {
    if (this.doubleClick) {
      clearTimeout(this.doubleClick);
      this.doubleClick = null;
      this.doubleclickCallback.emit(hex);
    } else {
      this.doubleClick = setTimeout(() => {
        if (this.doubleClick) {
          this.clickCallback.emit(hex);
          this.doubleClick = null;
        }
      }, 200);
    }
  }

  hasCondition(hex: ActionHex): boolean {
    return (hex.value && Object.keys(ConditionName).includes(hex.value)) || false;
  }
}
