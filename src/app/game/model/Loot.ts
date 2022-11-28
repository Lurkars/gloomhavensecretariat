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

export class Loot {

    type: LootType;
    value: string;

    constructor(type: LootType, value: string) {
        this.type = type;
        this.value = value;
    }

    fromString(value: string) {
        this.type = value.split(':')[0] as unknown as LootType;
        this.value = "";
        if (value.split(':').length > 1) {
            this.value = value.split(':')[1];
        }
    }

    toString(): string {
        return this.type + (this.value ? ':' + this.value : '');
    }
}

export const fullLootDeck: Loot[] = [
    // 12x Money 1
    new Loot(LootType.money, "1"),
    new Loot(LootType.money, "1"),
    new Loot(LootType.money, "1"),
    new Loot(LootType.money, "1"),
    new Loot(LootType.money, "1"),
    new Loot(LootType.money, "1"),
    new Loot(LootType.money, "1"),
    new Loot(LootType.money, "1"),
    new Loot(LootType.money, "1"),
    new Loot(LootType.money, "1"),
    new Loot(LootType.money, "1"),
    new Loot(LootType.money, "1"),
    // 6x Money 2
    new Loot(LootType.money, "2"),
    new Loot(LootType.money, "2"),
    new Loot(LootType.money, "2"),
    new Loot(LootType.money, "2"),
    new Loot(LootType.money, "2"),
    new Loot(LootType.money, "2"),
    // 2x Money 3
    new Loot(LootType.money, "3"),
    new Loot(LootType.money, "3"),
    // herbs
    new Loot(LootType.arrowvine, "1"),
    new Loot(LootType.arrowvine, "1"),
    new Loot(LootType.axenut, "1"),
    new Loot(LootType.axenut, "1"),
    new Loot(LootType.corpsecap, "1"),
    new Loot(LootType.corpsecap, "1"),
    new Loot(LootType.flamefruit, "1"),
    new Loot(LootType.flamefruit, "1"),
    new Loot(LootType.snowthistle, "1"),
    new Loot(LootType.snowthistle, "1"),
    new Loot(LootType.rockroot, "1"),
    new Loot(LootType.rockroot, "1"),
    // 8x lumber
    new Loot(LootType.lumber, "1"),
    new Loot(LootType.lumber, "1"),
    new Loot(LootType.lumber, "%game.loot.player.3-4% +1/%game.loot.player.2% +2"),
    new Loot(LootType.lumber, "%game.loot.player.3-4% +1/%game.loot.player.2% +2"),
    new Loot(LootType.lumber, "%game.loot.player.3-4% +1/%game.loot.player.2% +2"),
    new Loot(LootType.lumber, "%game.loot.player.4% +1/%game.loot.player.2-3% +2"),
    new Loot(LootType.lumber, "%game.loot.player.4% +1/%game.loot.player.2-3% +2"),
    new Loot(LootType.lumber, "%game.loot.player.4% +1/%game.loot.player.2-3% +2"),
    // 8x hide
    new Loot(LootType.hide, "1"),
    new Loot(LootType.hide, "1"),
    new Loot(LootType.hide, "%game.loot.player.3-4% +1/%game.loot.player.2% +2"),
    new Loot(LootType.hide, "%game.loot.player.3-4% +1/%game.loot.player.2% +2"),
    new Loot(LootType.hide, "%game.loot.player.3-4% +1/%game.loot.player.2% +2"),
    new Loot(LootType.hide, "%game.loot.player.4% +1/%game.loot.player.2-3% +2"),
    new Loot(LootType.hide, "%game.loot.player.4% +1/%game.loot.player.2-3% +2"),
    new Loot(LootType.hide, "%game.loot.player.4% +1/%game.loot.player.2-3% +2"),
    // 8x metal
    new Loot(LootType.metal, "1"),
    new Loot(LootType.metal, "1"),
    new Loot(LootType.metal, "%game.loot.player.3-4% +1/%game.loot.player.2% +2"),
    new Loot(LootType.metal, "%game.loot.player.3-4% +1/%game.loot.player.2% +2"),
    new Loot(LootType.metal, "%game.loot.player.3-4% +1/%game.loot.player.2% +2"),
    new Loot(LootType.metal, "%game.loot.player.4% +1/%game.loot.player.2-3% +2"),
    new Loot(LootType.metal, "%game.loot.player.4% +1/%game.loot.player.2-3% +2"),
    new Loot(LootType.metal, "%game.loot.player.4% +1/%game.loot.player.2-3% +2"),
    // 1x random item
    new Loot(LootType.random_item, ""),
    // 2 special
    new Loot(LootType.special1, ""),
    new Loot(LootType.special2, "")
];

export type LootDeckConfig = Partial<Record<LootType, number>>;

export class LootDeck {

    current: number = -1;
    cards: Loot[] = [];
    active: boolean = false;

    apply(config: LootDeckConfig = {}) {
        this.cards = [];
        let availableCards: Loot[] = JSON.parse(JSON.stringify(fullLootDeck));
        Object.values(LootType).forEach((type) => {
            if (config[type]) {
                let availableTypes = availableCards.filter((loot) => loot.type == type).map((value) => ({ value, sort: Math.random() }))
                    .sort((a, b) => a.sort - b.sort)
                    .map(({ value }) => value);;
                const count = Math.min(Math.max(config[type] || 0), availableTypes.length);
                for (let i = 0; i < count; i++) {
                    this.cards.push(availableTypes[i]);
                }
            }

        })
    }

}