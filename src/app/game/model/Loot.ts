export enum LootClass {
    money = "money",
    material_resources = "material_resources",
    herb_resources = "herb_resources",
    random_item = "random_item",
    special = "special"
}

export enum LootType {
    money = "money",
    lumber = "lumber",
    metal = "metal",
    hide = "hide",
    arrowvine = "arrowvine",
    axenut = "axenut",
    corpsecap = "corpsecap",
    flamefruit = "flamefruit",
    rockroot = "rockroot",
    snowthistle = "snowthistle",
    random_item = "random_item",
    special1 = "special1",
    special2 = "special2"
}

export const enhancableLootTypes: LootType[] = [LootType.lumber, LootType.metal, LootType.hide, LootType.arrowvine, LootType.axenut, LootType.corpsecap, LootType.flamefruit, LootType.rockroot, LootType.snowthistle];

export const appliableLootTypes: LootType[] = [LootType.money, LootType.lumber, LootType.metal, LootType.hide, LootType.arrowvine, LootType.axenut, LootType.corpsecap, LootType.flamefruit, LootType.rockroot, LootType.snowthistle, LootType.special1, LootType.special2];

export class Loot {

    type: LootType;
    value4P: number;
    value3P: number;
    value2P: number;
    enhancements: number = 0;

    // migration
    value: string | undefined;

    constructor(type: LootType, value4P: number, value3P: number = -1, value2P: number = -1,) {
        this.type = type;
        this.value4P = value4P;
        this.value3P = value4P;
        this.value2P = value4P;
        if (value3P != -1) {
            this.value3P = value3P;
        }
        if (value2P != -1) {
            this.value2P = value2P;
        }
    }
}

export const fullLootDeck: Loot[] = [
    // 12x Money 1
    new Loot(LootType.money, 1),
    new Loot(LootType.money, 1),
    new Loot(LootType.money, 1),
    new Loot(LootType.money, 1),
    new Loot(LootType.money, 1),
    new Loot(LootType.money, 1),
    new Loot(LootType.money, 1),
    new Loot(LootType.money, 1),
    new Loot(LootType.money, 1),
    new Loot(LootType.money, 1),
    new Loot(LootType.money, 1),
    new Loot(LootType.money, 1),
    // 6x Money 2
    new Loot(LootType.money, 2),
    new Loot(LootType.money, 2),
    new Loot(LootType.money, 3),
    new Loot(LootType.money, 3),
    new Loot(LootType.money, 3),
    new Loot(LootType.money, 3),
    // 2x Money 3
    new Loot(LootType.money, 4),
    new Loot(LootType.money, 4),
    // herbs
    new Loot(LootType.arrowvine, 1),
    new Loot(LootType.arrowvine, 1),
    new Loot(LootType.axenut, 1),
    new Loot(LootType.axenut, 1),
    new Loot(LootType.corpsecap, 1),
    new Loot(LootType.corpsecap, 1),
    new Loot(LootType.flamefruit, 1),
    new Loot(LootType.flamefruit, 1),
    new Loot(LootType.snowthistle, 1),
    new Loot(LootType.snowthistle, 1),
    new Loot(LootType.rockroot, 1),
    new Loot(LootType.rockroot, 1),
    // 8x lumber
    new Loot(LootType.lumber, 1),
    new Loot(LootType.lumber, 1),
    new Loot(LootType.lumber, 1, 1, 2),
    new Loot(LootType.lumber, 1, 1, 2),
    new Loot(LootType.lumber, 1, 1, 2),
    new Loot(LootType.lumber, 1, 2, 2),
    new Loot(LootType.lumber, 1, 2, 2),
    new Loot(LootType.lumber, 1, 2, 2),
    // 8x hide
    new Loot(LootType.hide, 1),
    new Loot(LootType.hide, 1),
    new Loot(LootType.hide, 1, 1, 2),
    new Loot(LootType.hide, 1, 1, 2),
    new Loot(LootType.hide, 1, 1, 2),
    new Loot(LootType.hide, 1, 2, 2),
    new Loot(LootType.hide, 1, 2, 2),
    new Loot(LootType.hide, 1, 2, 2),
    // 8x metal
    new Loot(LootType.metal, 1),
    new Loot(LootType.metal, 1),
    new Loot(LootType.metal, 1, 1, 2),
    new Loot(LootType.metal, 1, 1, 2),
    new Loot(LootType.metal, 1, 1, 2),
    new Loot(LootType.metal, 1, 2, 2),
    new Loot(LootType.metal, 1, 2, 2),
    new Loot(LootType.metal, 1, 2, 2),
    // 1x random item
    new Loot(LootType.random_item, 0),
    // 2 special
    new Loot(LootType.special1, 1),
    new Loot(LootType.special2, 1)
];

export type LootDeckConfig = Partial<Record<LootType, number>>;

export class LootDeck {

    current: number = -1;
    cards: Loot[] = [];
    active: boolean = false;

    fromModel(model: LootDeck) {
        this.current = model.current;
        this.cards = model.cards;

        // migration
        this.cards.forEach((loot) => {
            if (loot.value) {
                if (!isNaN(+loot.value)) {
                    loot.value4P = +loot.value;
                    loot.value3P = +loot.value;
                    loot.value2P = +loot.value;
                } else if (loot.value == "%game.loot.player.3-4% +1/%game.loot.player.2% +2") {
                    loot.value4P = 1;
                    loot.value3P = 1;
                    loot.value2P = 2;
                } else if (loot.value == "%game.loot.player.4% +1/%game.loot.player.2-3% +2") {
                    loot.value4P = 1;
                    loot.value3P = 2;
                    loot.value2P = 2;
                } else {
                    console.warn("Cannot migrate loot: " + loot.value);
                }

                loot.value = undefined;
            }
        })

        this.active = model.active;
    }
}