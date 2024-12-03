import { Dialog } from "@angular/cdk/dialog";
import { Component, Input, OnChanges, OnInit, SimpleChanges } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { Loot, LootType, fullLootDeck } from "src/app/game/model/data/Loot";
import { LootApplyDialogComponent } from "./loot-apply-dialog";
import { LootRandomItemDialogComponent } from "./random-item/random-item-dialog";
import { AdditionalIdentifier, Identifier } from "src/app/game/model/data/Identifier";
import { ItemData } from "src/app/game/model/data/ItemData";
import { ScenarioSummaryComponent } from "../../footer/scenario/summary/scenario-summary";
import { GameScenarioModel } from "src/app/game/model/Scenario";
import { EntityValueFunction } from "src/app/game/model/Entity";

@Component({
	standalone: false,
    selector: 'ghs-loot',
    templateUrl: './loot-card.html',
    styleUrls: ['./loot-card.scss']
})
export class LootComponent implements OnInit, OnChanges {

    @Input() loot!: Loot;
    @Input() index: number = -1;
    @Input() disableFlip: boolean = false;
    @Input() flipped: boolean = false;
    @Input() reveal: boolean = false;
    @Input() edit: boolean = false;
    @Input() looted: boolean = false;
    @Input() highlight: boolean = true;
    @Input() apply: boolean = true;
    @Input() character: string = "";

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    LootType = LootType;

    revealed: boolean = false;
    animate: boolean = false;
    sections: string[] = [];

    constructor(private dialog: Dialog) { }

    ngOnInit(): void {
        this.animate = !this.disableFlip;
        if ((this.loot.type == LootType.special1 || this.loot.type == LootType.special2) && this.loot.value) {
            this.sections = this.loot.value.split('|');
        }
    }

    onChange(revealed: boolean) {
        this.revealed = revealed;
    }

    ngOnChanges(changes: SimpleChanges): void {
        const flipped = changes['flipped'];
        if (flipped && !this.disableFlip && flipped.currentValue && flipped.currentValue != flipped.previousValue) {
            this.animate = true;
        }
        if ((this.loot.type == LootType.special1 || this.loot.type == LootType.special2) && this.loot.value) {
            this.sections = this.loot.value.split('|');
        }
    }

    hasSection(section: string): boolean {
        return gameManager.game.party.conclusions.find((model) => model.edition == gameManager.currentEdition() && model.index == section) != undefined;
    }

    toggleSection(event: TouchEvent | MouseEvent, section: string, force: boolean = false) {
        if (this.hasSection(section)) {
            if (force) {
                gameManager.stateManager.before("unsetLootCardSection", section);
                gameManager.game.party.conclusions = gameManager.game.party.conclusions.filter((model) => model.edition != gameManager.currentEdition() || model.index != section);
                gameManager.stateManager.after();
            }
        } else {
            const conclusion = gameManager.sectionData(gameManager.currentEdition()).find((sectionData) => sectionData.index == section && sectionData.conclusion);
            if (conclusion && !force) {
                this.dialog.open(ScenarioSummaryComponent, {
                    panelClass: ['dialog'],
                    data: {
                        scenario: conclusion,
                        conclusionOnly: true
                    }
                }).closed.subscribe({
                    next: () => {
                        if (this.hasSection(section)) {
                            gameManager.stateManager.before("setLootCardSection", section);
                            gameManager.game.lootDeckSections.push(section);
                            if (this.character && conclusion.rewards) {
                                const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.name == this.character);
                                if (character instanceof Character) {
                                    if (conclusion.rewards.lootingGold) {
                                        character.progress.gold += EntityValueFunction(conclusion.rewards.lootingGold);
                                    }
                                    if (conclusion.rewards.items) {
                                        conclusion.rewards.items.forEach((item) => {
                                            if (!character.progress.items.find((value) => value.edition == gameManager.currentEdition() && value.name == item)) {
                                                character.progress.items.push(new Identifier(item, gameManager.currentEdition()));
                                            }
                                        })
                                    }
                                }
                            }
                            if (conclusion.rewards && conclusion.rewards.removeLootDeckCards) {
                                conclusion.rewards.removeLootDeckCards.forEach((lootDeckCard) => {
                                    const loot = fullLootDeck.find((loot) => loot.cardId == lootDeckCard);
                                    if (loot && gameManager.game.lootDeckFixed.indexOf(loot.type) != -1) {
                                        gameManager.game.lootDeckFixed.splice(gameManager.game.lootDeckFixed.indexOf(loot.type), 1);
                                    }
                                })
                            }
                            gameManager.stateManager.after();
                        }
                    }
                })
            } else {
                gameManager.stateManager.before("setLootCardSection", section);
                gameManager.game.lootDeckSections.push(section);
                gameManager.game.party.conclusions.push(new GameScenarioModel(section, gameManager.currentEdition()));
                gameManager.stateManager.after();
            }
        }
        event.stopPropagation();
        event.preventDefault();
    }

    changeCharacter(event: any) {
        if (settingsManager.settings.applyLoot && (this.edit || !this.character)) {
            event.preventDefault();
            event.stopPropagation();
            const dialog = this.dialog.open(LootApplyDialogComponent, {
                panelClass: ['dialog'],
                data: { loot: this.loot, selected: this.character, edit: this.edit }
            });

            dialog.closed.subscribe({
                next: (name) => {
                    if (typeof name === 'string') {
                        const charBefore = gameManager.game.figures.find((figure) => figure instanceof Character && figure.name == this.character);
                        let randomItemIdentifier: AdditionalIdentifier | undefined;
                        if (charBefore instanceof Character && charBefore.name != name) {
                            if (this.loot.type == LootType.random_item && name) {
                                randomItemIdentifier = charBefore.progress.equippedItems.find((value) => value.marker == "loot-random-item");
                            } else {
                                gameManager.stateManager.before("removeLootCard", gameManager.characterManager.characterName(charBefore), "game.loot." + this.loot.type, gameManager.lootManager.getValue(this.loot));
                                charBefore.lootCards = charBefore.lootCards.filter((index) => index != this.index);
                                if (this.loot.type == LootType.money || this.loot.type == LootType.special1 || this.loot.type == LootType.special2) {
                                    charBefore.loot -= gameManager.lootManager.getValue(this.loot);
                                }

                                if (this.loot.type == LootType.random_item) {
                                    randomItemIdentifier = charBefore.progress.equippedItems.find((value) => value.marker == "loot-random-item");
                                    if (randomItemIdentifier) {
                                        charBefore.progress.items = charBefore.progress.items.filter((value) => randomItemIdentifier && (value.edition != randomItemIdentifier.edition || value.name != randomItemIdentifier.name));
                                        charBefore.progress.equippedItems = charBefore.progress.equippedItems.filter((value) => randomItemIdentifier && (value.edition != randomItemIdentifier.edition || value.name != randomItemIdentifier.name));
                                    }
                                }
                                gameManager.stateManager.after();
                            }
                        }

                        if (name && (!charBefore || charBefore.name != name)) {
                            const character = gameManager.game.figures.find((figure) => figure instanceof Character && figure.name == name);
                            if (character instanceof Character) {
                                if (this.loot.type != LootType.random_item) {
                                    gameManager.stateManager.before("addLootCard", gameManager.characterManager.characterName(character), "game.loot." + this.loot.type, gameManager.lootManager.getValue(this.loot));
                                    gameManager.lootManager.applyLoot(this.loot, character, this.index);
                                    gameManager.stateManager.after();
                                } else {
                                    let result: ItemData | undefined = randomItemIdentifier ? gameManager.itemManager.getItem(randomItemIdentifier.name, randomItemIdentifier.edition, true) : undefined;
                                    if (!result) {
                                        result = gameManager.lootManager.applyLoot(this.loot, character, this.index);
                                    }
                                    if (result) {
                                        this.dialog.open(LootRandomItemDialogComponent, {
                                            panelClass: ['dialog'],
                                            data: { item: result, character: character }
                                        }).closed.subscribe({
                                            next: (result) => {
                                                if (result) {
                                                    const item = result as ItemData;
                                                    gameManager.stateManager.before("lootRandomItem", item.id, item.edition, item.name, gameManager.characterManager.characterName(character));
                                                    let itemIdentifier: Identifier = new Identifier('' + item.id, item.edition);
                                                    gameManager.itemManager.addItemCount(item);
                                                    if (character.lootCards.indexOf(this.index) == -1) {
                                                        character.lootCards.push(this.index);
                                                        character.lootCards.sort((a, b) => a - b);
                                                    }
                                                    if (character.progress.items.find((existing) => existing.name == '' + item.id && existing.edition == item.edition) != undefined) {
                                                        character.progress.gold += gameManager.itemManager.itemSellValue(item);
                                                    } else {
                                                        character.progress.items.push(itemIdentifier);
                                                        character.progress.equippedItems.push(new AdditionalIdentifier(itemIdentifier.name, itemIdentifier.edition, undefined, "loot-random-item"));
                                                    }

                                                    if (randomItemIdentifier && charBefore instanceof Character) {
                                                        charBefore.lootCards = charBefore.lootCards.filter((index) => index != this.index);
                                                        charBefore.progress.items = charBefore.progress.items.filter((value) => randomItemIdentifier && (value.edition != randomItemIdentifier.edition || value.name != randomItemIdentifier.name));
                                                        charBefore.progress.equippedItems = charBefore.progress.equippedItems.filter((value) => value.marker != "loot-random-item");
                                                    }
                                                    gameManager.stateManager.after();
                                                } else {
                                                    character.lootCards = character.lootCards.filter((index) => index != this.index);
                                                }
                                            }
                                        })
                                    }
                                }
                            }
                        }
                    }
                }
            })
        }
    }
}