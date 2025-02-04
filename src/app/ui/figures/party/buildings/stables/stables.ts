import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { PetCard, PetIdentifier } from "src/app/game/model/data/PetCard";

@Component({
    standalone: false,

    selector: 'ghs-stables',
    templateUrl: 'stables.html',
    styleUrls: ['./stables.scss'],
})
export class StablesComponent implements OnInit, OnDestroy {

    pets: { card: PetCard | undefined, model: PetIdentifier | undefined }[] = [];

    edit: boolean = false;
    select: boolean = false;
    running: boolean = false;
    showAll: boolean = false;

    capacity: number = 0;
    used: number = 0;
    active: number = 0;

    ngOnInit() {
        this.update();
        this.uiChangeSubscription = gameManager.uiChange.subscribe({
            next: () => {
                this.updateState();
            }
        })
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    update() {
        this.select = gameManager.game.scenario != undefined && gameManager.roundManager.firstRound;
        this.running = gameManager.game.scenario != undefined && !this.select;
        this.used = 0;
        this.pets = [];
        const stables = gameManager.game.party.buildings.find((model) => model.name == 'stables' && model.level);

        if (stables) {
            this.active = stables.level < 3 ? 1 : 2;
            this.capacity = 4 + Math.floor(stables.level / 2) * 4;
        }

        if (this.showAll) {
            const editionData = gameManager.editionData.find((editionData) => editionData.edition == gameManager.currentEdition());
            if (editionData && editionData.pets) {
                editionData.pets.forEach((petCard) => {
                    const model = gameManager.game.party.pets.find((value) => value.edition == petCard.edition && value.name == petCard.id);
                    if (model) {
                        this.used++;
                    }
                    this.pets.push({ card: petCard, model: model });
                })
            }
        }

        gameManager.game.party.pets.forEach((value) => {
            if (this.pets.find((pet) => pet.model && pet.model.edition && value.edition && pet.model.name == value.name) == undefined) {
                const editionData = gameManager.editionData.find((editionData) => editionData.edition == value.edition);
                if (editionData && editionData.pets) {
                    const petCard = editionData.pets.find((petCard) => petCard.edition == value.edition && petCard.id == value.name);
                    this.pets.push({ card: petCard, model: value });
                } else {
                    this.pets.push({ card: undefined, model: value });
                }
                this.used++;
            }
        })

        this.pets.sort((a, b) => {
            if (a.model && !b.model) {
                return -1;
            } else if (!a.model && b.model) {
                return 1;
            } else if (a.model && b.model && a.model.active != b.model.active) {
                return a.model.active ? -1 : 1;
            } else if (a.card && b.card) {
                if (a.card.id < b.card.id) {
                    return -1;
                } else {
                    return 1;
                }
            } else if (a.model && b.model) {
                if (a.model.name < b.model.name) {
                    return -1;
                } else {
                    return 1;
                }
            }
            return 0;
        })
    }

    updateState() {
        gameManager.game.party.pets.forEach((value) => {
            const pet = this.pets.find((pet) => pet.model && pet.model.edition && value.edition && pet.model.name == value.name);
            if (pet && pet.model) {
                pet.model.active = value.active;
                pet.model.lost = value.lost;
                pet.model.petname = value.petname;
            }
        })
    }

    addPet(pet: { card: PetCard | undefined, model: PetIdentifier | undefined }) {
        if (pet.card && gameManager.game.party.pets.find((value) => pet.card && value.edition == pet.card.edition && value.name == pet.card.id) == undefined) {
            const model = new PetIdentifier(pet.card.id, pet.card.edition);
            gameManager.stateManager.before('buildings.stables.pets.add', model.edition, model.name);
            gameManager.game.party.pets.push(model);
            pet.model = model;
            this.used++;
            gameManager.stateManager.after();
        }
    }

    updatePet(event: any, model: PetIdentifier | undefined) {
        if (model && event.target) {
            const name = event.target.value;
            gameManager.stateManager.before(name ? 'buildings.stables.pets.setName' : 'buildings.stables.pets.unsetName', model.edition, model.name, name);
            model.petname = name;
            gameManager.stateManager.after();
        }
    }

    removePet(model: PetIdentifier | undefined) {
        if (model) {
            gameManager.stateManager.before('buildings.stables.pets.remove', model.edition, model.name);
            gameManager.game.party.pets = gameManager.game.party.pets.filter((value) => value.edition != model.edition || value.name != model.name);
            this.update();
            gameManager.stateManager.after();
        }
    }

    toggleLost(model: PetIdentifier | undefined, force: boolean = false) {
        if (model && (!model.lost || force)) {
            gameManager.stateManager.before(model.lost ? 'buildings.stables.pets.restore' : 'buildings.stables.pets.play', model.edition, model.name);
            model.lost = !model.lost;
            gameManager.stateManager.after();
        }
    }


    toggleActive(model: PetIdentifier | undefined, force: boolean = false) {
        if (model && !this.edit && (this.select || force)) {
            gameManager.stateManager.before(model.active ? 'buildings.stables.pets.setInactive' : 'buildings.stables.pets.setActive', model.edition, model.name, model.petname);
            model.active = !model.active;
            const stables = gameManager.game.party.buildings.find((model) => model.name == 'stables' && model.level);
            while (!force && stables && gameManager.game.party.pets.filter((value) => value.active).length > (stables.level < 3 ? 1 : 2)) {
                const other = gameManager.game.party.pets.find((value) => value.active && value != model);
                if (other) {
                    other.active = false;
                }
            }

            gameManager.stateManager.after();
        }
    }

}