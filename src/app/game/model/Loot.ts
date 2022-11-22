export enum LootClass {
    money = "money",
    material_resources = "material_resources",
    herb_resources = "herb_resources",
    random_item = "random_item"
}

export enum LootType {
    money = "money",
    money1 = "money1",
    money2 = "money2",
    money3 = "money3",
    lumber = "lumber",
    metal = "metal",
    hide = "hide",
    arrowvine = "arrowvine",
    axenut = "axenut",
    corpsecap = "corpsecap",
    flamefruit = "flamefruit",
    rockroot = "rockroot",
    snowthistle = "snowthistle",
    random_item = "random_item"
}

export class LootDeck {

    loot: Partial<Record<LootType, number>>;
    current: number = -1;
    cards: LootType[] = [];

    constructor(loot: Partial<Record<LootType, number>> = {}) {
        this.loot = loot;
    }

}