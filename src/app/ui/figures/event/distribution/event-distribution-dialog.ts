import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { EventCardEffect, EventCardEffectType } from 'src/app/game/model/data/EventCard';
import { AdditionalIdentifier } from 'src/app/game/model/data/Identifier';
import { ItemData, ItemFlags, ItemSlot } from 'src/app/game/model/data/ItemData';
import { herbResourceLootTypes, LootType, materialResourceLootTypes, resourceLootTypes } from 'src/app/game/model/data/Loot';
import { EventCardEffectComponent } from 'src/app/ui/figures/event/effect/event-card-effect';
import { ItemDialogComponent } from 'src/app/ui/figures/items/dialog/item-dialog';
import { ItemComponent } from 'src/app/ui/figures/items/item/item';
import { DistributionChange, DistributionEntry, PartyDistributionComponent } from 'src/app/ui/figures/party/distribution/distribution';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';

export const CollectiveDistributionEffects: EventCardEffectType[] = [
  EventCardEffectType.collectiveGold,
  EventCardEffectType.collectiveGoldAdditional,
  EventCardEffectType.collectiveGoldOther,
  EventCardEffectType.collectiveItem,
  EventCardEffectType.collectiveResource,
  EventCardEffectType.collectiveResourceType,
  EventCardEffectType.consumeItem,
  EventCardEffectType.consumeCollectiveItem,
  EventCardEffectType.itemCollective,
  EventCardEffectType.loseItem,
  EventCardEffectType.loseCollectiveExperience,
  EventCardEffectType.loseCollectiveGold,
  EventCardEffectType.loseCollectiveResource,
  EventCardEffectType.loseCollectiveResourceAny,
  EventCardEffectType.loseCollectiveResourceType
];

export interface ItemReceiveEntry {
  item: ItemData;
  count: number;
  assignedTo: number;
}

export interface ItemConsumeEntry {
  slot: ItemSlot | undefined;
  count: number;
  characterItems: ItemData[][];
  selected: number[][];
}

export interface ItemLoseEntry {
  item: ItemData;
  assignedTo: number;
}

@Component({
  imports: [NgClass, GhsLabelDirective, PartyDistributionComponent, EventCardEffectComponent, ItemComponent, PointerInputDirective],
  selector: 'ghs-event-distribution-dialog',
  templateUrl: './event-distribution-dialog.html',
  styleUrls: ['./event-distribution-dialog.scss']
})
export class EventDistributionDialogComponent {
  dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);
  effects: EventCardEffect[] = inject(DIALOG_DATA).effects;

  gameManager = gameManager;

  receiveEntries: DistributionEntry[] = [];
  receiveGlobalTotal: number | undefined;
  spendEntries: DistributionEntry[] = [];
  spendGlobalTotal: number | undefined;

  itemReceiveEntries: ItemReceiveEntry[] = [];
  itemConsumeEntries: ItemConsumeEntry[] = [];
  itemLoseEntries: ItemLoseEntry[] = [];
  manualItemEffects: EventCardEffect[] = [];

  characters: Character[] = [];
  private receiveCharacterValues: Partial<Record<string, number>>[] = [];
  private spendCharacterValues: Partial<Record<string, number>>[] = [];
  private spendPartyValues: Partial<Record<string, number>> = {};

  settingsManager = settingsManager;

  constructor() {
    this.characters = gameManager.game.figures.filter((f) => f instanceof Character).map((f) => f as Character);
    this.receiveCharacterValues = this.characters.map(() => ({}));
    this.spendCharacterValues = this.characters.map(() => ({}));
    this.buildEntries();
  }

  private getResourceTypesForCategory(category: string): LootType[] {
    if (category === 'material_resources' || category === 'material-resource') return materialResourceLootTypes;
    if (category === 'herb_resources' || category === 'herb-resource') return herbResourceLootTypes;
    return resourceLootTypes;
  }

  private buildEntries(): void {
    let receiveGold = 0;
    const receiveResourcesByType: Partial<Record<string, number>> = {};
    let collectiveResourceTypeTotal = 0;
    let collectiveResourceTypeCategory: string | undefined;

    let spendGold = 0;
    const spendResourcesByType: Partial<Record<string, number>> = {};
    let loseAnyTotal = 0;
    let loseTypeTotal = 0;
    let loseTypeCategory: string | undefined;
    let loseExperienceTotal = 0;

    const edition = gameManager.game.edition || gameManager.currentEdition();

    for (const effect of this.effects) {
      switch (effect.type) {
        case EventCardEffectType.itemCollective: {
          const itemEdition = effect.values[2] ? (effect.values[2] as string) : edition;
          const item = gameManager.itemManager.getItem(effect.values[0] as number, itemEdition, true);
          if (settingsManager.settings.characterItems && item) {
            for (let c = 0; c < +effect.values[1]; c++) {
              this.itemReceiveEntries.push({ item, count: 1, assignedTo: -1 });
            }
          } else {
            this.manualItemEffects.push(effect);
          }
          break;
        }
        case EventCardEffectType.collectiveItem: {
          const itemEdition = effect.values[1] ? (effect.values[1] as string) : edition;
          const item = gameManager.itemManager.getItem(effect.values[0] as number, itemEdition, true);
          if (settingsManager.settings.characterItems && item) {
            this.itemReceiveEntries.push({ item, count: 1, assignedTo: -1 });
          } else {
            this.manualItemEffects.push(effect);
          }
          break;
        }
        case EventCardEffectType.consumeItem:
        case EventCardEffectType.consumeCollectiveItem: {
          if (settingsManager.settings.characterItems) {
            const slotStr = effect.values[1] as string;
            const slot = Object.values(ItemSlot).includes(slotStr as ItemSlot) ? (slotStr as ItemSlot) : undefined;
            const count = +effect.values[0];
            const characterItems = this.characters.map((char) =>
              char.progress.items
                .map((id) => gameManager.itemManager.getItem(id.name, id.edition, true))
                .filter((it): it is ItemData => !!it && (!slot || it.slot === slot))
            );
            this.itemConsumeEntries.push({
              slot,
              count,
              characterItems,
              selected: this.characters.map(() => [])
            });
          } else {
            this.manualItemEffects.push(effect);
          }
          break;
        }
        case EventCardEffectType.loseItem: {
          const itemEdition = effect.values[1] ? (effect.values[1] as string) : edition;
          const item = gameManager.itemManager.getItem(effect.values[0] as number, itemEdition, true);
          if (settingsManager.settings.characterItems && item) {
            this.itemLoseEntries.push({ item, assignedTo: -1 });
          } else {
            this.manualItemEffects.push(effect);
          }
          break;
        }
        case EventCardEffectType.collectiveGold:
        case EventCardEffectType.collectiveGoldAdditional:
        case EventCardEffectType.collectiveGoldOther:
          receiveGold += +effect.values[0];
          break;
        case EventCardEffectType.collectiveResource:
          receiveResourcesByType[effect.values[1] as string] =
            (receiveResourcesByType[effect.values[1] as string] || 0) + +effect.values[0];
          break;
        case EventCardEffectType.collectiveResourceType:
          collectiveResourceTypeTotal += +effect.values[0];
          collectiveResourceTypeCategory = effect.values[1] as string;
          break;
        case EventCardEffectType.loseCollectiveExperience:
          loseExperienceTotal += +effect.values[0];
          break;
        case EventCardEffectType.loseCollectiveGold:
          spendGold += +effect.values[0];
          break;
        case EventCardEffectType.loseCollectiveResource:
          spendResourcesByType[effect.values[1] as string] = (spendResourcesByType[effect.values[1] as string] || 0) + +effect.values[0];
          break;
        case EventCardEffectType.loseCollectiveResourceAny:
          loseAnyTotal += +effect.values[0];
          break;
        case EventCardEffectType.loseCollectiveResourceType:
          loseTypeTotal += +effect.values[0];
          loseTypeCategory = effect.values[1] as string;
          break;
      }
    }

    if (receiveGold > 0) this.receiveEntries.push({ type: 'gold', total: receiveGold });
    for (const [type, total] of Object.entries(receiveResourcesByType)) {
      if (total) this.receiveEntries.push({ type: type as LootType, total });
    }
    if (collectiveResourceTypeTotal > 0 && collectiveResourceTypeCategory) {
      const types = this.getResourceTypesForCategory(collectiveResourceTypeCategory);
      for (const type of types) this.receiveEntries.push({ type, total: collectiveResourceTypeTotal });
      this.receiveGlobalTotal = collectiveResourceTypeTotal;
    }

    if (spendGold > 0) this.spendEntries.push({ type: 'gold', total: spendGold });
    if (loseExperienceTotal > 0) this.spendEntries.push({ type: 'experience', total: loseExperienceTotal });
    for (const [type, total] of Object.entries(spendResourcesByType)) {
      if (total) this.spendEntries.push({ type: type as LootType, total });
    }
    if (loseAnyTotal > 0) {
      for (const type of resourceLootTypes) this.spendEntries.push({ type, total: loseAnyTotal });
      this.spendGlobalTotal = (this.spendGlobalTotal || 0) + loseAnyTotal;
    }
    if (loseTypeTotal > 0 && loseTypeCategory) {
      const types = this.getResourceTypesForCategory(loseTypeCategory);
      for (const type of types) this.spendEntries.push({ type, total: loseTypeTotal });
      this.spendGlobalTotal = (this.spendGlobalTotal || 0) + loseTypeTotal;
    }
  }

  assignItem(entry: ItemReceiveEntry, charIndex: number): void {
    entry.assignedTo = entry.assignedTo === charIndex ? -1 : charIndex;
  }

  canAssignItem(entry: ItemReceiveEntry, charIndex: number): boolean {
    return gameManager.itemManager.canAdd(entry.item, this.characters[charIndex]);
  }

  totalConsumedForEntry(entry: ItemConsumeEntry): number {
    return entry.selected.reduce((sum, sel) => sum + sel.length, 0);
  }

  toggleConsumeItem(entry: ItemConsumeEntry, charIndex: number, itemIndex: number): void {
    const sel = entry.selected[charIndex];
    const pos = sel.indexOf(itemIndex);
    if (pos !== -1) {
      sel.splice(pos, 1);
    } else {
      if (this.totalConsumedForEntry(entry) >= entry.count) {
        for (const otherSel of entry.selected) {
          if (otherSel.length > 0) {
            otherSel.splice(0, 1);
            break;
          }
        }
      }
      sel.push(itemIndex);
    }
  }

  isConsumeSelected(entry: ItemConsumeEntry, charIndex: number, itemIndex: number): boolean {
    return entry.selected[charIndex].includes(itemIndex);
  }

  assignLoseItem(entry: ItemLoseEntry, charIndex: number): void {
    entry.assignedTo = entry.assignedTo === charIndex ? -1 : charIndex;
  }

  canLoseItem(entry: ItemLoseEntry, charIndex: number): boolean {
    return gameManager.itemManager.owned(entry.item, this.characters[charIndex]);
  }

  onReceiveChange(change: DistributionChange): void {
    if (change.source !== 'party') {
      this.receiveCharacterValues[change.source as number] ??= {};
      (this.receiveCharacterValues[change.source as number] as Record<string, number>)[change.type] = change.value;
    }
  }

  onSpendChange(change: DistributionChange): void {
    if (change.source === 'party') {
      (this.spendPartyValues as Record<string, number>)[change.type] = change.value;
    } else {
      this.spendCharacterValues[change.source as number] ??= {};
      (this.spendCharacterValues[change.source as number] as Record<string, number>)[change.type] = change.value;
    }
  }

  get isDistributionComplete(): boolean {
    for (const entry of this.receiveEntries) {
      const distributed = this.receiveCharacterValues.reduce((sum, cv) => sum + (cv[entry.type] || 0), 0);
      if (distributed < entry.total) return false;
    }
    for (const entry of this.itemReceiveEntries) {
      if (entry.assignedTo < 0) return false;
    }
    for (const entry of this.itemLoseEntries) {
      if (entry.assignedTo < 0) return false;
    }
    for (const entry of this.spendEntries) {
      const paid = this.spendCharacterValues.reduce((sum, cv) => sum + (cv[entry.type] || 0), 0) + (this.spendPartyValues[entry.type] || 0);
      if (this.spendGlobalTotal === undefined && paid < entry.total) return false;
    }
    if (this.spendGlobalTotal !== undefined) {
      const totalPaid = this.spendEntries
        .filter((e) => e.type !== 'gold' && e.type !== 'experience')
        .reduce((sum, e) => {
          return sum + this.spendCharacterValues.reduce((s, cv) => s + (cv[e.type] || 0), 0) + (this.spendPartyValues[e.type] || 0);
        }, 0);
      if (totalPaid < this.spendGlobalTotal) return false;
    }
    for (const entry of this.itemConsumeEntries) {
      if (this.totalConsumedForEntry(entry) < entry.count) return false;
    }
    return true;
  }

  apply(force: boolean = false): void {
    if (!force && !this.isDistributionComplete) return;
    gameManager.stateManager.before('eventDistribution');
    this.receiveCharacterValues.forEach((cv, i) => {
      const char = this.characters[i];
      if (!char) return;
      for (const [type, amount] of Object.entries(cv)) {
        if (!amount) continue;
        if (type === 'gold') {
          char.progress.gold += amount;
        } else if (type === 'experience') {
          char.progress.experience += amount;
        } else {
          char.progress.loot[type as LootType] = (char.progress.loot[type as LootType] || 0) + amount;
        }
      }
    });

    this.spendCharacterValues.forEach((cv, i) => {
      const char = this.characters[i];
      if (!char) return;
      for (const [type, amount] of Object.entries(cv)) {
        if (!amount) continue;
        if (type === 'gold') {
          char.progress.gold = Math.max(0, char.progress.gold - amount);
        } else if (type === 'experience') {
          char.progress.experience = Math.max(0, char.progress.experience - amount);
        } else {
          char.progress.loot[type as LootType] = Math.max(0, (char.progress.loot[type as LootType] || 0) - amount);
        }
      }
    });

    for (const [type, amount] of Object.entries(this.spendPartyValues)) {
      if (!amount || type === 'gold' || type === 'experience') continue;
      gameManager.game.party.loot[type as LootType] = Math.max(0, (gameManager.game.party.loot[type as LootType] || 0) - amount);
    }

    for (const entry of this.itemReceiveEntries) {
      if (entry.assignedTo >= 0) {
        const char = this.characters[entry.assignedTo];
        if (char) gameManager.itemManager.addItem(entry.item, char);
      }
    }

    for (const entry of this.itemConsumeEntries) {
      entry.selected.forEach((sel, charIndex) => {
        const char = this.characters[charIndex];
        if (!char) return;
        for (const itemIndex of sel) {
          const item = entry.characterItems[charIndex][itemIndex];
          if (!item) continue;
          let equipped = char.progress.equippedItems.find((id) => id.name === '' + item.id && id.edition === item.edition);
          if (!equipped) {
            equipped = new AdditionalIdentifier(item.id, item.edition);
            char.progress.equippedItems.push(equipped);
          }
          equipped.tags = equipped.tags || [];
          if (!equipped.tags.includes(ItemFlags.consumed)) {
            equipped.tags.push(ItemFlags.consumed);
          }
        }
      });
    }

    for (const entry of this.itemLoseEntries) {
      if (entry.assignedTo >= 0) {
        const char = this.characters[entry.assignedTo];
        if (char) gameManager.itemManager.removeItem(entry.item, char);
      }
    }

    gameManager.stateManager.after();
    this.dialogRef.close(true);
  }

  openItemDialog(item: ItemData): void {
    this.dialog.open(ItemDialogComponent, {
      panelClass: ['fullscreen-panel'],
      disableClose: true,
      data: { item }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
