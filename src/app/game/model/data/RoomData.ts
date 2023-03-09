import { MonsterType } from "../MonsterType";

export class RoomData {
    roomNumber: number = 0;
    ref: string = "";
    initial: boolean = false;
    marker: string = "";
    rooms: number[] = [];
    treasures: ('G' | number)[] = [];
    monster: MonsterStandeeData[] = [];
    allies: string[] = [];
    objectives: (string | number)[] = [];
}

export class MonsterStandeeData {
    name: string = "";
    marker: string = "";
    tags: string[] = [];
    type: MonsterType | undefined;
    player2: MonsterType | undefined;
    player3: MonsterType | undefined;
    player4: MonsterType | undefined;
    health: string | number | undefined;

    constructor(name: string) {
        this.name = name;
    }
}

export class TreasureData {

    index: number = 0;
    goal: boolean = false;
    rewards: TreasureReward[] = [];

    constructor(rewardsString: string, index: number = -1) {
        this.index = index;
        if (rewardsString == 'G') {
            this.goal = true;
        } else {
            let rewardStrings = rewardsString.split('|');
            for (let rewardString of rewardStrings) {
                this.rewards.push(new TreasureReward(rewardString));
            }
        }
    }

}

export type TreasureRewardType = "custom" | "gold" | "goldFh" | "experience" | "experienceFh" | "battleGoal" | "damage" | "condition" | "heal" | "item" | "itemFh" | "itemDesign" | "randomItem" | "randomItemDesign" | "itemBlueprint" | "randomItemBlueprint" | "scenario" | "randomScenario" | "partyAchievement" | "event" | "loot" | "lootCards" | "resource" | "campaignSticker" | "calenderSection";

export class TreasureReward {

    type: TreasureRewardType;
    value: string | number | undefined;

    constructor(rewardString: string) {
        let parts = rewardString.split(':');
        try {
            this.type = parts[0] as TreasureRewardType;
            if (parts.length > 1) {
                if (!isNaN(+parts[1])) {
                    this.value = +parts[1];
                } else {
                    this.value = parts[1];
                }
            }
        } catch (e) {
            this.type = "custom";
            console.error("Invalid treasure reward string: '" + rewardString + "'");
        }
    }
}