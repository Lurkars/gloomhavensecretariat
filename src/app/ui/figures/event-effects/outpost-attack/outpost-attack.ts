import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { AttackModifierDeck, AttackResult } from 'src/app/game/model/data/AttackModifier';
import { EventCardAttack, EventCardEffect, EventCardEffectType } from 'src/app/game/model/data/EventCard';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { ghsDialogClosingHelper, ghsShuffleArray, ghsValueSign } from 'src/app/ui/helper/Static';
import { AttackModiferDeckChange } from '../../attackmodifier/attackmodifierdeck';
import { Building } from '../../party/buildings/buildings';
import { PartySheetDialogComponent } from '../../party/party-sheet-dialog';
import { WorldMapComponent } from '../../party/world-map/world-map';

@Component({
    standalone: false,
    selector: 'ghs-outpost-attack',
    templateUrl: './outpost-attack.html',
    styleUrls: ['./outpost-attack.scss'],
})
export class OutpostAttackComponent {

    settingsManager: SettingsManager = settingsManager;
    gameManager: GameManager = gameManager;
    EntityValueFunction = EntityValueFunction;
    attack: EventCardAttack;
    defaultAttack: EventCardAttack | undefined;
    manualAttackValue: number = 50;
    manualTargetNumber: number = 4;
    townGuardDeck: AttackModifierDeck = new AttackModifierDeck();
    allBuildings: Building[] = [];
    buildings: Building[] = [];
    disabledBuildings: Building[] = [];

    parity: "even" | "odd" | 0 = 0;
    factor: "advantage" | "disadvantage" | false = false;
    lowerBoundary: number = 0;
    upperBoundary: number = 0;
    desc: boolean = false;
    barracks: boolean = false;
    soldiers: number = 0;
    baracksBonus: number = 0;
    moraleDefense: number = 0;
    attacks: number = 0;
    attackResult: AttackResult | undefined;

    constructor(@Inject(DIALOG_DATA) public data: { attack: EventCardAttack, effects: EventCardEffect[] }, private dialogRef: DialogRef, private dialog: Dialog) {
        if (this.data.attack) {
            this.defaultAttack = new EventCardAttack(data.attack.attackValue, data.attack.targetNumber, data.attack.targetDescription, data.attack.narrative, data.attack.effects);
        }

        if (this.defaultAttack && data.effects) {
            let attackValueChange = 0;
            let targetNumberValueChange = 0;
            data.effects.forEach((effect) => {
                if (effect.type == EventCardEffectType.outpostAttack && effect.values.length && typeof effect.values[0] !== 'object') {
                    attackValueChange = EntityValueFunction(effect.values[0]);
                } else if (effect.type == EventCardEffectType.outpostTarget && effect.values.length && typeof effect.values[0] !== 'object') {
                    targetNumberValueChange = EntityValueFunction(effect.values[0]);
                }
            })

            if (attackValueChange) {
                this.defaultAttack.attackValue = typeof this.defaultAttack.attackValue == 'number' ? this.defaultAttack.attackValue + attackValueChange : this.defaultAttack.attackValue + " " + ghsValueSign(attackValueChange);
            }

            if (targetNumberValueChange) {
                this.defaultAttack.targetNumber = typeof this.defaultAttack.targetNumber == 'number' ? this.defaultAttack.targetNumber + targetNumberValueChange : this.defaultAttack.targetNumber + " " + ghsValueSign(targetNumberValueChange);
            }
        }
        this.attack = this.defaultAttack || new EventCardAttack(this.manualAttackValue, this.manualTargetNumber, "", "", []);
    }

    ngOnInit(): void {
        this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => this.update() })
        this.update(true);
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    update(init: boolean = false) {
        this.allBuildings = [];
        const campaign = gameManager.campaignData();
        if (campaign) {
            gameManager.game.party.buildings.forEach((model) => {
                const data = campaign.buildings.find((buildingData) => buildingData.name == model.name);
                if (data && model.level && data.id && !isNaN(+data.id)) {
                    if (init) {
                        model.attacked = undefined;
                    }
                    this.allBuildings.push({ model: model, data: data });
                }
            })
            if (campaign.townGuardPerks) {
                this.townGuardDeck = gameManager.attackModifierManager.buildTownGuardAttackModifierDeck(gameManager.game.party, campaign);
                if (gameManager.game.party.townGuardDeck) {
                    gameManager.attackModifierManager.fromModel(this.townGuardDeck, gameManager.game.party.townGuardDeck);
                } else {
                    gameManager.attackModifierManager.shuffleModifiers(this.townGuardDeck);
                    gameManager.game.party.townGuardDeck = this.townGuardDeck.toModel();
                }
                this.townGuardDeck.active = true;
            } else {
                console.warn("Invalid state, no Town Guard Deck found!");
                this.dialogRef.close();
            }
        }

        if (gameManager.game.party.morale < 3) {
            this.moraleDefense = -10;
        } else if (gameManager.game.party.morale < 5) {
            this.moraleDefense = -5;
        } else if (gameManager.game.party.morale < 8) {
            this.moraleDefense = 0;
        } else if (gameManager.game.party.morale < 11) {
            this.moraleDefense = 5;
        } else if (gameManager.game.party.morale < 14) {
            this.moraleDefense = 10;
        } else {
            this.moraleDefense = 15;
        }

        this.applyBaracks();
        if (init) {
            this.applyFilter();
        }
    }

    beforeTownGuardDeck(change: AttackModiferDeckChange) {
        this.attackResult = undefined;
        gameManager.stateManager.before("updateAttackModifierDeck." + change.type, 'party.campaign.townGuard', ...change.values);
    }

    afterTownGuardDeck(change: AttackModiferDeckChange) {
        this.townGuardDeck = change.deck;
        gameManager.game.party.townGuardDeck = this.townGuardDeck.toModel();
        gameManager.stateManager.after();
        this.attackResult = gameManager.attackModifierManager.calculateAttackResult(this.townGuardDeck, (gameManager.game.party.defense || 0) + this.moraleDefense);
    }

    toggleAttackResult() {
        if (this.attackResult && this.attackResult.chooseOffset) {
            this.attackResult = gameManager.attackModifierManager.calculateAttackResult(this.townGuardDeck, (gameManager.game.party.defense || 0) + this.moraleDefense, this.attackResult.index + this.attackResult.chooseOffset);
        }
    }

    nextTarget() {
        if (this.attacks < this.buildings.length && this.attack.targetNumber) {
            const building = this.buildings[this.attacks];
            gameManager.stateManager.before("buildingAttacked", building.data.id, building.data.name);
            gameManager.game.party.soldiers -= this.soldiers;
            this.soldiers = 0;
            building.model.attacked = true;
            this.attacks++;
            this.applyBaracks();
            gameManager.stateManager.after();
        }
    }

    toggleBuildingState(building: Building) {
        let state: "normal" | "damaged" | "wrecked" | false = false;
        switch (building.model.state) {
            case 'normal':
                state = 'damaged';
                break;
            case 'damaged':
                state = 'wrecked';
                break;
            case 'wrecked':
                state = 'normal';
                break;
        }

        if (state) {
            gameManager.stateManager.before("changeBuildingState", building.data.id, building.model.name, state);
            building.model.state = state;
            gameManager.stateManager.after();
        }
    }

    toggleSoldier(soldier: number) {
        if (this.soldiers == soldier) {
            this.soldiers--;
        } else {
            this.soldiers = soldier;
        }
        this.applyBaracks();
    }

    applyBaracks() {
        const barracks = this.allBuildings.find((building) => building.model.name == 'barracks');
        if (!barracks) {
            console.warn("No Barrack found!");
            return;
        }

        if (barracks.model.state == 'wrecked') {
            this.barracks = false;
            this.baracksBonus = 0;
            this.soldiers = 0;
            this.factor = 'disadvantage';
        } else {
            this.barracks = true;
            this.factor = false;
            switch (barracks.model.level) {
                case 1:
                    this.baracksBonus = -5;
                    break;
                case 2:
                    this.baracksBonus = -15;
                    break;
                case 3:
                    this.baracksBonus = -25;
                    break;
                case 4:
                    this.baracksBonus = -35;
                    break;
            }

            if (this.soldiers) {
                this.factor = 'advantage';
            }
        }

        this.attack = new EventCardAttack(EntityValueFunction(this.defaultAttack ? this.defaultAttack.attackValue : this.manualAttackValue) + (this.soldiers * this.baracksBonus), EntityValueFunction(this.defaultAttack ? this.defaultAttack.targetNumber : this.manualTargetNumber) - this.attacks, this.defaultAttack ? this.defaultAttack.targetDescription : "", this.defaultAttack ? this.defaultAttack.narrative : "", this.defaultAttack ? this.defaultAttack.effects : []);
    }

    applyFilter() {
        this.buildings = this.allBuildings.filter((building) => {
            if (!building.data.id || isNaN(+building.data.id)) {
                return false;
            }

            if (building.model.state == 'wrecked') {
                return false;
            }

            const number = +building.data.id;
            if (this.parity && (this.parity == 'even' && number % 2 == 1 || this.parity == 'odd' && number % 2 == 0)) {
                return false;
            }

            if (+this.lowerBoundary && number < this.lowerBoundary) {
                return false;
            }

            if (+this.upperBoundary && number > this.upperBoundary) {
                return false;
            }

            return true;
        }).sort((a, b) => +a.data.id - +b.data.id);

        if (this.desc) {
            this.buildings.reverse();
        }

        this.disabledBuildings = this.allBuildings.filter((building) => this.buildings.indexOf(building) == -1);
    }

    randomize() {
        ghsShuffleArray(this.buildings);
    }

    dropBuildings(event: CdkDragDrop<Building[]>) {
        if (event.container == event.previousContainer) {
            moveItemInArray(this.buildings, event.previousIndex, event.currentIndex);
        } else {
            const building = this.disabledBuildings.splice(event.previousIndex, 1)[0];
            this.buildings.splice(event.currentIndex, 0, building);
        }
    }

    dropDisabledBuildings(event: CdkDragDrop<Building[]>) {
        if (event.container == event.previousContainer) {
            moveItemInArray(this.disabledBuildings, event.previousIndex, event.currentIndex);
        } else {
            const building = this.buildings.splice(event.previousIndex, 1)[0];
            this.disabledBuildings.splice(event.currentIndex, 0, building);
        }
    }

    partySheet() {
        this.dialog.open(PartySheetDialogComponent, {
            panelClass: ['dialog-invert'],
            data: gameManager.currentEdition()
        })
    }

    worldMap() {
        this.dialog.open(WorldMapComponent, {
            panelClass: ['fullscreen-panel'],
            backdropClass: ['fullscreen-backdrop'],
            data: gameManager.currentEdition()
        })
    }

    close(finish: boolean = false) {
        ghsDialogClosingHelper(this.dialogRef, finish);
    }
}