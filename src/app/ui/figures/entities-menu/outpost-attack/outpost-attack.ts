import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectorRef, Component, inject, Inject } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { AttackModifierDeck, AttackResult } from 'src/app/game/model/data/AttackModifier';
import { EventCardAttack, EventCardAttackTarget, EventCardEffect, EventCardEffectType } from 'src/app/game/model/data/EventCard';
import { WorldMapCoordinates } from 'src/app/game/model/data/WorldMap';
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

    private cdr = inject(ChangeDetectorRef);

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

    factor: "advantage" | "disadvantage" | false = false;

    lowerBoundary: number = 0;
    upperBoundary: number = 0;
    parity: "even" | "odd" | 0 = 0;
    level: "low" | "high" | 0 = 0;
    distance: "previousTarget" | string | WorldMapCoordinates | undefined;
    desc: boolean = false;

    barracks: boolean = false;
    soldiers: number = 0;
    baracksBonus: number = 0;
    moraleDefense: number = 0;
    attacks: number = 0;
    attackResult: AttackResult | undefined;

    deckActive: boolean = false;

    constructor(@Inject(DIALOG_DATA) public data: { attack: EventCardAttack, effects: EventCardEffect[] }, private dialogRef: DialogRef, private dialog: Dialog, private ghsManager: GhsManager) {
        this.ghsManager.uiChangeEffect(() => this.update());
        if (this.data.attack) {
            this.defaultAttack = new EventCardAttack(data.attack.attackValue, data.attack.targetNumber, data.attack.target, data.attack.targetDescription, data.attack.narrative, data.attack.effects);
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
        this.attack = this.defaultAttack || new EventCardAttack(this.manualAttackValue, this.manualTargetNumber, new EventCardAttackTarget(), "", "", []);

        this.deckActive = !!gameManager.game.party.townGuardDeck && gameManager.game.party.townGuardDeck.active;
    }

    ngOnInit(): void {
        this.update(true);
    }

    ngOnDestroy(): void {
        if (gameManager.game.party.townGuardDeck) {
            gameManager.game.party.townGuardDeck.active = this.deckActive;
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
            if (this.attack.target) {
                this.lowerBoundary = this.attack.target.lowerBoundary || 0;
                this.upperBoundary = this.attack.target.upperBoundary || 0;
                this.parity = this.attack.target.parity || 0;
                this.level = this.attack.target.level || 0;
                this.distance = this.attack.target.distance || undefined;
                this.applyFilter();
                if (this.attack.target.randomize) {
                    this.randomize();
                }
            } else {
                this.applyFilter();
            }
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
            let state = building.model.state;
            if (this.attackResult) {
                if (this.townGuardDeck.cards[this.attackResult.index].type == 'wreck') {
                    state = 'wrecked';
                } else if (this.townGuardDeck.cards[this.attackResult.index].type != 'success' && this.attackResult.result < EntityValueFunction(this.attack.attackValue)) {
                    state = 'damaged';
                }
            }
            gameManager.stateManager.before("buildingAttacked" + (state != building.model.state ? '.' + state : ''), building.data.id, building.data.name);
            gameManager.game.party.soldiers -= this.soldiers;
            this.soldiers = 0;
            building.model.attacked = true;
            this.attacks++;
            building.model.state = state;
            this.attackResult = undefined;
            this.applyBaracks();

            if (this.attack.target.distance === "previousTarget") {
                this.buildings.sort((a, b) => {
                    const distanceA = this.targetDistance(a);
                    const distanceB = this.targetDistance(b);
                    if (distanceA > 0 && distanceB > 0) {
                        return distanceA - distanceB;
                    }
                    return 0;
                })
            }

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

        let target = new EventCardAttackTarget();
        target.lowerBoundary = this.lowerBoundary || 0;
        target.upperBoundary = this.upperBoundary || 0;
        target.parity = this.parity || 0;
        target.level = this.level || 0;
        target.distance = this.distance || undefined;

        this.attack = new EventCardAttack(EntityValueFunction(this.defaultAttack ? this.defaultAttack.attackValue : this.manualAttackValue) + (this.soldiers * this.baracksBonus), EntityValueFunction(this.defaultAttack ? this.defaultAttack.targetNumber : this.manualTargetNumber) - this.attacks, this.defaultAttack ? this.defaultAttack.target : target, this.defaultAttack ? this.defaultAttack.targetDescription : "", this.defaultAttack ? this.defaultAttack.narrative : "", this.defaultAttack ? this.defaultAttack.effects : []);
    }

    applyFilter() {
        this.attack.target.lowerBoundary = this.lowerBoundary || 0;
        this.attack.target.upperBoundary = this.upperBoundary || 0;
        this.attack.target.parity = this.parity || 0;
        this.attack.target.level = this.level || 0;
        this.attack.target.distance = this.distance || undefined;

        this.buildings = this.allBuildings.filter((building) => this.filterBuilding(building));

        this.buildings.sort((a, b) => this.sortBuildings(a, b));

        if (this.attack.target && this.attack.target.desc) {
            this.buildings.reverse();
        }

        this.disabledBuildings = [...this.allBuildings.filter((building) => !this.buildings.includes(building))];
        this.disabledBuildings.sort((a, b) => this.sortBuildings(a, b));

        if (this.attack.target && this.attack.target.desc) {
            this.disabledBuildings.reverse();
        }
    }

    filterBuilding(building: Building): boolean {
        if (!building.data.id || isNaN(+building.data.id)) {
            return false;
        }

        if (building.model.state == 'wrecked') {
            return false;
        }

        const number = +building.data.id;

        if (this.attack.target.parity && (this.attack.target.parity == 'even' && number % 2 == 1 || this.attack.target.parity == 'odd' && number % 2 == 0)) {
            return false;
        }

        if (this.attack.target.lowerBoundary && number < this.attack.target.lowerBoundary) {
            return false;
        }

        if (this.attack.target.upperBoundary && number > this.attack.target.upperBoundary) {
            return false;
        }

        return true;
    }

    sortBuildings(a: Building, b: Building): number {

        const filterA = this.filterBuilding(a);
        const filterB = this.filterBuilding(b);

        if (filterA && !filterB) {
            return -1;
        } else if (!filterA && filterB) {
            return 1;
        }

        if (this.attack.target.level && a.model.level != b.model.level) {
            if (this.attack.target.level == 'low') {
                return a.model.level - b.model.level;
            } else if (this.attack.target.level == 'high') {
                return b.model.level - a.model.level;
            }
        }

        if (this.attack.target.distance) {
            const distanceA = this.targetDistance(a);
            const distanceB = this.targetDistance(b);
            if (distanceA != -1 && distanceB != -1) {
                return distanceA - distanceB;
            }
        }

        return +a.data.id - +b.data.id;
    }

    targetDistance(building: Building): number {
        let distance: number | undefined;
        if (this.attack.target.distance === "previousTarget") {
            const index = this.buildings.indexOf(building);
            if (index > this.attacks) {
                distance = gameManager.buildingsManager.distanceBetween(building.model, this.buildings[this.attacks].model);
            } else {
                return 0;
            }
        } else if (typeof this.attack.target.distance === 'string') {
            const targetBuilding = this.allBuildings.find((building) => building.model.name == this.attack.target.distance);
            if (targetBuilding) {
                distance = gameManager.buildingsManager.distanceBetween(building.model, targetBuilding.model);
            }
        } else if (this.attack.target.distance) {
            const coordinates = this.attack.target.distance as WorldMapCoordinates;
            distance = gameManager.buildingsManager.distanceFrom(building.model, coordinates);
        }

        return distance != undefined ? distance : -1;
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
        this.buildings = [...this.buildings];
        this.disabledBuildings = [...this.disabledBuildings];
    }

    dropDisabledBuildings(event: CdkDragDrop<Building[]>) {
        if (event.container == event.previousContainer) {
            moveItemInArray(this.disabledBuildings, event.previousIndex, event.currentIndex);
        } else {
            const building = this.buildings.splice(event.previousIndex, 1)[0];
            this.disabledBuildings.splice(event.currentIndex, 0, building);
        }
        this.buildings = [...this.buildings];
        this.disabledBuildings = [...this.disabledBuildings];
    }

    partySheet() {
        this.dialog.open(PartySheetDialogComponent, {
            panelClass: ['dialog-invert'],
            data: gameManager.currentEdition()
        })
    }

    worldMap(pick: boolean = false) {
        this.dialog.open(WorldMapComponent, {
            panelClass: ['fullscreen-panel'],
            backdropClass: ['fullscreen-backdrop'],
            data: { edition: gameManager.currentEdition(), pick: pick }
        }).closed.subscribe({
            next: (result) => {
                if (pick) {
                    if (result) {
                        this.distance = result as WorldMapCoordinates;
                    } else {
                        this.distance = undefined;
                    }

                    this.applyFilter();
                    this.cdr.markForCheck();
                }
            }
        })
    }

    resetDistance() {
        this.distance = undefined;
        this.applyFilter();
        this.cdr.markForCheck();
    }

    close(finish: boolean = false) {
        ghsDialogClosingHelper(this.dialogRef, finish);
    }
}