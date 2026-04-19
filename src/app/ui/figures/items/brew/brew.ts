import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { CountIdentifier, Identifier } from 'src/app/game/model/data/Identifier';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { LootType } from 'src/app/game/model/data/Loot';
import { ItemDialogComponent } from 'src/app/ui/figures/items/dialog/item-dialog';
import { ItemComponent } from 'src/app/ui/figures/items/item/item';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsTooltipDirective, PointerInputDirective, GhsRangePipe, TrackUUIDPipe, ItemComponent],
  selector: 'ghs-items-brew',
  templateUrl: 'brew.html',
  styleUrls: ['./brew.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsBrewDialog implements OnInit {
  private dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  herbs: LootType[] = [
    LootType.flamefruit,
    LootType.corpsecap,
    LootType.axenut,
    LootType.snowthistle,
    LootType.rockroot,
    LootType.arrowvine
  ];

  brewing: number;
  characterSpent: Partial<Record<LootType, number>> = {};
  fhSupportSpent: Partial<Record<LootType, number>> = {};
  receipe: (LootType | undefined)[] = [undefined, undefined];
  item: ItemData | undefined;
  brewed: ItemData | undefined;
  characters: Character[] = [];
  selectedCharacter: Character | undefined;
  applied: boolean = false;
  forced: boolean[] = [];

  herbTotals: number[] = [];
  gridItems2: (ItemData | undefined)[][] = [];
  gridCellActive2: boolean[][] = [];
  gridCellDisabled2: boolean[][] = [];
  gridItems3: (ItemData | undefined)[][][] = [];
  gridCellActive3: boolean[][][] = [];
  gridCellDisabled3: boolean[][][] = [];
  gridItemSpecial3: ItemData | undefined;
  gridCellActiveSpecial3: boolean = false;
  gridCellDisabledSpecial3: boolean = false;

  character: Character | undefined = inject(DIALOG_DATA);

  constructor() {
    this.brewing = 0;
    if (gameManager.fhRules() && gameManager.game.party.campaignMode && gameManager.game.party.buildings) {
      const alchemist = gameManager.game.party.buildings.find((buildingModel) => buildingModel.name === 'alchemist');
      if (alchemist && alchemist.level) {
        this.brewing = alchemist.level < 3 ? 2 : 3;
      }
    }
  }

  ngOnInit(): void {
    this.updateItem();
  }

  updateItem() {
    const item = this.getItem();
    this.item =
      item &&
      gameManager.game.party.unlockedItems.find(
        (identitfier) => identitfier.name === '' + item.id && identitfier.edition === item.edition
      ) &&
      item;
    this.brewed = undefined;
    this.characters = gameManager.game.figures
      .filter(
        (figure) =>
          figure instanceof Character &&
          (!this.item ||
            !figure.progress.items.find(
              (identifier) => this.item && identifier.name === '' + this.item.id && identifier.edition === this.item.edition
            ))
      )
      .map((figure) => figure as Character)
      .sort((a, b) => {
        if (a === this.character) {
          return -1;
        } else if (b === this.character) {
          return 1;
        }
        return gameManager.sortFiguresByTypeAndName(a, b);
      });
    this.selectedCharacter = this.characters.length ? this.characters[0] : undefined;
    this.applied = false;
    this.computeGridState();
  }

  computeGridState() {
    this.herbTotals = this.herbs.map(
      (herb) => ((!!this.character && this.character.progress.loot[herb]) || 0) + (gameManager.game.party.loot[herb] || 0)
    );

    this.gridItems2 = [];
    this.gridCellActive2 = [];
    this.gridCellDisabled2 = [];
    for (let i = 0; i < this.herbs.length; i++) {
      this.gridItems2[i] = [];
      this.gridCellActive2[i] = [];
      this.gridCellDisabled2[i] = [];
      const leftIdx = this.herbs.length - 1 - i;
      const leftHerb = this.herbs[leftIdx];
      for (let j = 0; j < this.herbs.length - i; j++) {
        const topHerb = this.herbs[j];
        this.gridCellActive2[i][j] = this.isGridCombinationActive(leftHerb, topHerb);
        this.gridCellDisabled2[i][j] =
          leftIdx === j ? this.herbTotals[leftIdx] < 2 : this.herbTotals[leftIdx] < 1 || this.herbTotals[j] < 1;
        this.gridItems2[i][j] = this.getGridCombinationItem(leftHerb, topHerb);
      }
    }

    this.gridItems3 = [];
    this.gridCellActive3 = [];
    this.gridCellDisabled3 = [];
    for (let ci = 0; ci < 4; ci++) {
      this.gridItems3[ci] = [];
      this.gridCellActive3[ci] = [];
      this.gridCellDisabled3[ci] = [];
      const cornerIdx = ci + 2;
      const cornerHerb = this.herbs[cornerIdx];
      for (let li = 0; li <= ci; li++) {
        this.gridItems3[ci][li] = [];
        this.gridCellActive3[ci][li] = [];
        this.gridCellDisabled3[ci][li] = [];
        const leftIdx = ci + 1 - li;
        const leftHerb = this.herbs[leftIdx];
        for (let ti = 0; ti < ci + 1 - li; ti++) {
          const topHerb = this.herbs[ti];
          this.gridCellActive3[ci][li][ti] = this.isGridCombinationActive(topHerb, leftHerb, cornerHerb);
          this.gridCellDisabled3[ci][li][ti] = this.herbTotals[cornerIdx] < 1 || this.herbTotals[leftIdx] < 1 || this.herbTotals[ti] < 1;
          this.gridItems3[ci][li][ti] = this.getGridCombinationItem(topHerb, leftHerb, cornerHerb);
        }
      }
    }

    const specialItem = gameManager.itemManager
      .getItems(gameManager.currentEdition(), true)
      .find(
        (itemData) =>
          (!itemData.requiredItems || !itemData.requiredItems.length) &&
          itemData.requiredBuilding === 'alchemist' &&
          itemData.requiredBuildingLevel >= 3 &&
          !itemData.resources
      );
    this.gridItemSpecial3 =
      specialItem &&
      gameManager.game.party.unlockedItems.find(
        (identifier) => identifier.name === '' + specialItem.id && identifier.edition === specialItem.edition
      )
        ? specialItem
        : undefined;
    this.gridCellActiveSpecial3 = !!(
      this.receipe[0] &&
      this.receipe[1] &&
      this.receipe[2] &&
      this.receipe.filter((h, idx, a) => h && a.indexOf(h) === idx).length < this.receipe.filter((h) => h).length
    );
    this.gridCellDisabledSpecial3 = !this.herbTotals.some((total) => total >= 2);
  }

  addHerb(type: LootType | undefined, source: Partial<Record<LootType, number>> | false, index: number = -1, force: boolean = false) {
    if (type) {
      if (!force) {
        if (!source) {
          if (((!!this.character && this.character.progress.loot[type]) || 0) > (this.characterSpent[type] || 0)) {
            source = this.characterSpent;
          } else if (gameManager.game.party.loot[type] && (gameManager.game.party.loot[type] || 0) > (this.fhSupportSpent[type] || 0)) {
            source = this.fhSupportSpent;
          }
        }

        if (source) {
          source[type] = (source[type] || 0) + 1;
        }
      } else {
        this.forced[index > -1 ? index : this.receipe.length] = true;
      }

      if (source || force) {
        this.receipe[index > -1 ? index : this.receipe.length] = type;
      }
    }
    this.updateItem();
  }

  removeHerb(type: LootType | undefined, source: Partial<Record<LootType, number>> | false, index: number = -1) {
    this.receipe[index > -1 ? index : this.receipe.indexOf(type)] = undefined;
    if (index === 2) {
      this.receipe.splice(2, 1);
    }
    if (type && !this.forced[index > -1 ? index : this.receipe.indexOf(type)]) {
      if (!source) {
        if (this.fhSupportSpent[type]) {
          source = this.fhSupportSpent;
        } else {
          source = this.characterSpent;
        }
      }
      source[type] = (source[type] || 1) - 1;
    } else if (type) {
      this.forced[index > -1 ? index : this.receipe.indexOf(type)] = false;
    }
    this.updateItem();
  }

  toggleHerb(type: LootType, index: number, force: boolean = false) {
    const add = this.receipe[index] !== type || (!this.forced[index] && force) || (this.forced[index] && !force);
    if (this.receipe[index]) {
      this.removeHerb(this.receipe[index], false, index);
    }
    if (add) {
      if (
        ((!!this.character && this.character.progress.loot[type]) || 0) <= (this.characterSpent[type] || 0) &&
        (gameManager.game.party.loot[type] || 0) <= (this.fhSupportSpent[type] || 0)
      ) {
        this.removeHerb(type, false);
      }
      this.addHerb(type, false, index, force);
    }
  }

  moveHerb(type: LootType, source: Partial<Record<LootType, number>>, target: Partial<Record<LootType, number>>) {
    source[type] = (source[type] || 1) - 1;
    target[type] = (target[type] || 0) + 1;
  }

  brew(force: boolean = false) {
    if ((!gameManager.itemManager.brewingDisabled() && !this.forced.includes(true)) || force) {
      this.brewed = this.getItem();
      if (this.selectedCharacter && this.brewed) {
        gameManager.stateManager.before(
          this.selectedCharacter === this.character ? 'brewPotion' : 'brewPotionOther',
          (!!this.character && gameManager.characterManager.characterName(this.character, true, true)) || '',
          this.brewed.id,
          this.brewed.edition,
          gameManager.characterManager.characterName(this.selectedCharacter, true, true)
        );
        if (!force) {
          this.herbs.forEach((herb) => {
            if (this.fhSupportSpent[herb]) {
              gameManager.game.party.loot[herb] = (gameManager.game.party.loot[herb] || 0) - (this.fhSupportSpent[herb] || 0);
            }
            if (!!this.character && this.characterSpent[herb]) {
              this.character.progress.loot[herb] = (this.character.progress.loot[herb] || 0) - (this.characterSpent[herb] || 0);
            }
          });
        }
        if (
          !gameManager.game.party.unlockedItems.find(
            (identitfier) => this.brewed && identitfier.name === '' + this.brewed.id && identitfier.edition === this.brewed.edition
          )
        ) {
          gameManager.game.party.unlockedItems.push(new CountIdentifier(this.brewed.id, this.brewed.edition));
        }
        this.selectedCharacter.progress.items.push(new Identifier(this.brewed.id, this.brewed.edition));
        this.applied = true;
        this.computeGridState();
        gameManager.stateManager.after();
      }
    }
  }

  getItem(): ItemData | undefined {
    if (this.receipe[0] && this.receipe[1]) {
      if (
        this.receipe.filter((herb, index, self) => herb && self.indexOf(herb) === index).length !=
        this.receipe.filter((herb) => herb).length
      ) {
        return gameManager.itemManager
          .getItems(gameManager.currentEdition(), true)
          .find(
            (itemData) =>
              (!itemData.requiredItems || !itemData.requiredItems.length) &&
              itemData.requiredBuilding === 'alchemist' &&
              (!this.receipe[2] ? itemData.requiredBuildingLevel < 3 : itemData.requiredBuildingLevel >= 3) &&
              !itemData.resources
          );
      } else {
        return gameManager.itemManager
          .getItems(gameManager.currentEdition(), true)
          .find(
            (itemData) =>
              (!itemData.requiredItems || !itemData.requiredItems.length) &&
              itemData.requiredBuilding === 'alchemist' &&
              (!this.receipe[2] ? itemData.requiredBuildingLevel < 3 : itemData.requiredBuildingLevel >= 3) &&
              itemData.resources &&
              this.herbs.every(
                (herb) => itemData.resources && this.receipe.filter((value) => value === herb).length === (itemData.resources[herb] || 0)
              )
          );
      }
    } else {
      return undefined;
    }
  }

  openItemDialog(item: ItemData | undefined = undefined) {
    this.dialog.open(ItemDialogComponent, {
      panelClass: ['fullscreen-panel'],
      disableClose: true,
      data: { item: item || this.brewed || this.item }
    });
  }

  getGridCombinationItem(herb1: LootType, herb2: LootType, herb3: LootType | undefined = undefined): ItemData | undefined {
    const tempReceipe = herb3 ? [herb1, herb2, herb3] : [herb1, herb2];
    const hasDuplicates = !herb3 && herb1 === herb2;
    const item = gameManager.itemManager
      .getItems(gameManager.currentEdition(), true)
      .find(
        (itemData) =>
          (!itemData.requiredItems || !itemData.requiredItems.length) &&
          itemData.requiredBuilding === 'alchemist' &&
          (herb3 ? itemData.requiredBuildingLevel >= 3 : itemData.requiredBuildingLevel < 3) &&
          (hasDuplicates
            ? !itemData.resources
            : !!itemData.resources &&
              this.herbs.every(
                (herb) => itemData.resources && tempReceipe.filter((value) => value === herb).length === (itemData.resources[herb] || 0)
              ))
      );
    if (
      item &&
      gameManager.game.party.unlockedItems.find((identifier) => identifier.name === '' + item.id && identifier.edition === item.edition)
    ) {
      return item;
    }
    return undefined;
  }

  isGridCombinationActive(herb1: LootType, herb2: LootType, herb3: LootType | undefined = undefined): boolean {
    return (
      ((this.receipe[0] === herb1 && this.receipe[1] === herb2) || (this.receipe[0] === herb2 && this.receipe[1] === herb1)) &&
      (!herb3 || this.receipe[2] === herb3)
    );
  }

  isGridCombinationDisabled(herb1: LootType, herb2: LootType, herb3: LootType | undefined = undefined): boolean {
    const total1 = ((!!this.character && this.character.progress.loot[herb1]) || 0) + (gameManager.game.party.loot[herb1] || 0);
    const total2 = ((!!this.character && this.character.progress.loot[herb2]) || 0) + (gameManager.game.party.loot[herb2] || 0);
    if (herb1 === herb2) {
      return total1 < 2;
    }
    if (herb3) {
      const total3 = ((!!this.character && this.character.progress.loot[herb3]) || 0) + (gameManager.game.party.loot[herb3] || 0);
      return total1 < 1 || total2 < 1 || total3 < 1;
    }
    return total1 < 1 || total2 < 1;
  }

  selectSpecial3(force: boolean = false) {
    if (this.gridCellActiveSpecial3) {
      this.characterSpent = {};
      this.fhSupportSpent = {};
      this.forced = [];
      this.receipe = [undefined, undefined, undefined];
      this.updateItem();
    } else if (force || !this.gridCellDisabledSpecial3) {
      this.characterSpent = {};
      this.fhSupportSpent = {};
      this.forced = [];
      this.receipe = [undefined, undefined, undefined];
      const doubleHerb = this.herbs.find((herb, i) => this.herbTotals[i] >= 2) || this.herbs[0];
      const thirdHerb =
        this.herbs.find((herb, i) => herb !== doubleHerb && this.herbTotals[i] >= 1) ||
        (this.herbTotals[this.herbs.indexOf(doubleHerb)] >= 3 ? doubleHerb : undefined) ||
        this.herbs.find((herb) => herb !== doubleHerb) ||
        doubleHerb;
      this.addHerb(doubleHerb, false, 0, force);
      this.addHerb(doubleHerb, false, 1, force);
      this.addHerb(thirdHerb, false, 2, force);
    } else if (this.gridItemSpecial3) {
      this.openItemDialog(this.gridItemSpecial3);
    }
  }

  selectGridCombo(herb1: LootType, herb2: LootType, herb3: LootType | undefined = undefined, force: boolean = false) {
    if (this.isGridCombinationActive(herb1, herb2, herb3)) {
      this.characterSpent = {};
      this.fhSupportSpent = {};
      this.forced = [];
      this.receipe = [undefined, undefined, undefined];
      this.updateItem();
    } else if (force || !this.isGridCombinationDisabled(herb1, herb2, herb3)) {
      this.characterSpent = {};
      this.fhSupportSpent = {};
      this.forced = [];
      this.receipe = [undefined, undefined, undefined];
      this.addHerb(herb1, false, 0, force);
      this.addHerb(herb2, false, 1, force);
      if (herb3) {
        this.addHerb(herb3, false, 2, force);
      }
    } else {
      const item = this.getGridCombinationItem(herb1, herb2, herb3);
      if (item) {
        this.openItemDialog(item);
      }
    }
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }
}
