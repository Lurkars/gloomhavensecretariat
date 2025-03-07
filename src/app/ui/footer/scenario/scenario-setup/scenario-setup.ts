import { Dialog } from "@angular/cdk/dialog";
import { Component, Input, OnInit } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Monster } from "src/app/game/model/Monster";
import { Scenario } from "src/app/game/model/Scenario";
import { LootType } from "src/app/game/model/data/Loot";
import { MonsterData } from "src/app/game/model/data/MonsterData";
import { StatsListComponent } from "../dialog/stats-list/stats-list";
import { StatEffectRule } from "src/app/game/model/data/ScenarioRule";

@Component({
    standalone: false,
    selector: 'ghs-scenario-setup',
    templateUrl: './scenario-setup.html',
    styleUrls: ['./scenario-setup.scss']
})
export class ScenarioSetupComponent implements OnInit {

    @Input() scenario!: Scenario;
    @Input() spoiler: boolean = false;
    @Input() title: boolean = true;
    @Input() details: boolean = true;

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;

    monsters: Monster[] = [];
    lootConfig: { type: LootType, value: number }[] = [];
    lootRandomItem: boolean = false;
    hasSpoiler: boolean = false;
    detailed: boolean = false;

    constructor(private dialog: Dialog) { }

    ngOnInit(): void {
        this.updateMonster();
        if (this.scenario.lootDeckConfig) {
            for (let value in LootType) {
                const lootType: LootType = value as LootType;
                if (this.scenario.lootDeckConfig[lootType]) {
                    this.lootConfig.push({ type: lootType, value: this.scenario.lootDeckConfig[lootType] || 0 });
                    if (lootType == LootType.random_item && gameManager.game.party.randomItemLooted.find((model) => model.edition == this.scenario.edition && model.group == this.scenario.group && model.index == this.scenario.index)) {
                        this.lootRandomItem = true;
                    }
                }
            }
        }
    }

    updateMonster() {
        this.monsters = [];
        const cs = gameManager.editionRules('cs');
        const sections = !gameManager.editionRules('fc') || this.spoiler;
        this.hasSpoiler = false;
        if (!sections && gameManager.scenarioManager.getMonsters(this.scenario, false, this.scenario.custom).length != gameManager.scenarioManager.getMonsters(this.scenario, true, this.scenario.custom).length) {
            this.hasSpoiler = true;
        }

        gameManager.scenarioManager.getMonsters(this.scenario, sections, this.scenario.custom).forEach((monsterData) => {
            let monster: Monster = new Monster(monsterData, gameManager.game.level);
            if (this.spoiler || !monster.standeeShare || gameManager.scenarioManager.openRooms().find((room) => room.initial && room.monster.find((standee) => standee.name.split(':')[0] == monster.name)) || gameManager.game.figures.some((figure) => figure instanceof Monster && figure.name == monster.name && figure.edition == monster.edition)) {
                if (!this.monsters.find((m) => m.edition == monster.edition && m.name == monster.name)) {
                    monster.tags = [];
                    this.monsters.push(monster);
                }
            } else {
                const standee = gameManager.monstersData().find((monsterData) => monsterData.name == monster.standeeShare && monsterData.edition == (monster.standeeShareEdition || monster.edition));
                if (standee) {
                    const changedStandee = new Monster(JSON.parse(JSON.stringify(standee)) as MonsterData);
                    changedStandee.tags = changedStandee.tags || [];
                    if (cs) {
                        if (monster.boss) {
                            changedStandee.tags.push('boss');
                        }
                    }

                    const otherStandee = this.monsters.find((m) => m.name == changedStandee.name && m.edition == changedStandee.edition);
                    if (!otherStandee) {
                        this.hasSpoiler = true;
                        this.monsters.push(changedStandee);
                    } else if (!this.spoiler && cs) {
                        otherStandee.tags = otherStandee.tags || [];
                        if (monster.boss) {
                            this.hasSpoiler = true;
                            otherStandee.tags.push('boss');
                        }
                    }
                }
            }

            let statEffectRules = this.scenario.rules ? this.scenario.rules.filter((rule) => rule.statEffects).flatMap((rule) => rule.statEffects) : [];
            let statEffectRule: StatEffectRule | undefined = statEffectRules.find((statEffectRule) => gameManager.figuresByIdentifier(statEffectRule.identifier, false, [monster]).length);

            if (!statEffectRule) {
                gameManager.scenarioManager.getSections(this.scenario).forEach((sectionData) => {
                    if (!statEffectRule && sectionData.rules) {
                        statEffectRules = sectionData.rules.filter((rule) => rule.statEffects).flatMap((rule) => rule.statEffects);
                        statEffectRule = statEffectRules.find((statEffectRule) => gameManager.figuresByIdentifier(statEffectRule.identifier, false, [monster]).length);
                    }
                })
            }

            if (statEffectRule) {
                this.hasSpoiler = true;
                if (this.spoiler) {
                    monster.statEffect = statEffectRule.statEffect;
                    monster.statEffect.note = statEffectRule.note;
                }
            }


        })

        this.monsters = this.monsters.filter((monsterData, index, self) => !self.find((m) => monsterData.standeeShare == m.edition && monsterData.standeeShareEdition == m.name)).sort((a, b) => {
            const textA = settingsManager.getLabel('data.monster.' + a.name).toLowerCase();
            const textB = settingsManager.getLabel('data.monster.' + b.name).toLowerCase();
            return textA < textB ? -1 : 1;
        });
    }

    openStats(monster: Monster) {
        gameManager.monsterManager.resetMonsterAbilities(monster);
        this.dialog.open(StatsListComponent, { panelClass: ['dialog'], data: { monster: monster, statEffectNote: monster.statEffect ? monster.statEffect.note : '' } });
    }
}