import { DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject, OnInit } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";
import { DamageStats, ScenarioStats } from "src/app/game/model/CharacterProgress";
import { LootType } from "src/app/game/model/data/Loot";

@Component({
	standalone: false,
    selector: 'ghs-statistics-dialog',
    templateUrl: 'statistics-dialog.html',
    styleUrls: ['./statistics-dialog.scss']
})
export class StatisticsDialogComponent implements OnInit {

    characters: Character[] = [];
    scenarios: number[][] = [];
    overall: ScenarioStats = new ScenarioStats();
    retired: boolean = false;
    available: boolean = false;

    gameManager: GameManager = gameManager;

    constructor(@Inject(DIALOG_DATA) public character: Character | undefined) { }

    ngOnInit(): void {
        this.update();
    }

    update() {
        if (this.character) {
            this.characters = [this.character];
        } else {
            this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character).map((character) => {
                const charactyCopy = new Character(character, character.level);
                charactyCopy.fromModel(character.toModel());
                return charactyCopy;
            });

            if (this.retired) {
                this.characters.push(...gameManager.game.party.retirements.map((characterModel) => {
                    const character = new Character(gameManager.getCharacterData(characterModel.name, characterModel.edition), characterModel.level);
                    character.fromModel(characterModel);
                    return character;
                }));
            }

            if (this.available) {
                this.characters.push(...gameManager.game.party.availableCharacters.map((characterModel) => {
                    const character = new Character(gameManager.getCharacterData(characterModel.name, characterModel.edition), characterModel.level);
                    character.fromModel(characterModel);
                    return character;
                }));
            }
        }

        this.characters.forEach((character, index) => {
            character.scenarioStats = new ScenarioStats();
            this.scenarios[index] = [0, 0, 0];
            if (character.progress.scenarioStats.length) {
                character.scenarioStats = this.scenarioStatisticsSum(character.progress.scenarioStats);
                this.scenarios[index] = [character.progress.scenarioStats.length, character.progress.scenarioStats.filter((stat) => stat.success).length, character.progress.scenarioStats.filter((stat) => !stat.success).length];
            }
        })

        this.overall = this.scenarioStatisticsSum(this.characters.map((character) => character.scenarioStats));
        this.scenarios[this.characters.length] = this.scenarios.reduce((a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]);
    }

    scenarioStatisticsSum(stats: ScenarioStats[]): ScenarioStats {
        let scenarioStats = new ScenarioStats();

        let damageStats = this.damageStatisticsSum(stats);

        scenarioStats.dealtDamage = damageStats.dealtDamage;
        scenarioStats.monsterDamage = damageStats.monsterDamage;
        scenarioStats.otherDamage = damageStats.otherDamage;
        scenarioStats.healedDamage = damageStats.healedDamage;
        scenarioStats.heals = damageStats.monsterDamage;
        scenarioStats.normalKills = damageStats.normalKills;
        scenarioStats.eliteKills = damageStats.eliteKills;
        scenarioStats.bossKills = damageStats.bossKills;
        scenarioStats.exhausts = damageStats.exhausts;
        scenarioStats.maxDealtDamage = damageStats.maxDealtDamage;
        scenarioStats.maxDamage = damageStats.maxDamage;

        if (stats.length) {
            scenarioStats.gold = stats.map((stat) => stat.gold).reduce((a, b) => a + b);
            scenarioStats.xp = stats.map((stat) => stat.xp).reduce((a, b) => a + b);
            scenarioStats.treasures = stats.map((stat) => stat.treasures).reduce((a, b) => a + b);

            scenarioStats.loot = stats.map((stat) => stat.loot).reduce((a, b) => {
                let loot: Partial<Record<LootType, number>> = {};
                loot.arrowvine = (a.arrowvine || 0) + (b.arrowvine || 0);
                loot.axenut = (a.axenut || 0) + (b.axenut || 0);
                loot.corpsecap = (a.corpsecap || 0) + (b.corpsecap || 0);
                loot.flamefruit = (a.flamefruit || 0) + (b.flamefruit || 0);
                loot.hide = (a.hide || 0) + (b.hide || 0);
                loot.lumber = (a.lumber || 0) + (b.lumber || 0);
                loot.metal = (a.metal || 0) + (b.metal || 0);
                loot.money = (a.money || 0) + (b.money || 0);
                loot.random_item = (a.random_item || 0) + (b.random_item || 0);
                loot.rockroot = (a.rockroot || 0) + (b.rockroot || 0);
                loot.snowthistle = (a.snowthistle || 0) + (b.snowthistle || 0);
                return loot;
            });

            scenarioStats.summons = this.damageStatisticsSum(stats.filter((stat) => stat.summons).map((stat) => stat.summons));
        }

        return scenarioStats;
    }

    damageStatisticsSum(stats: DamageStats[]): DamageStats {
        let damageStats = new DamageStats();

        if (stats.length) {
            damageStats.dealtDamage = stats.map((stat) => stat.dealtDamage).reduce((a, b) => a + b);
            damageStats.monsterDamage = stats.map((stat) => stat.monsterDamage).reduce((a, b) => a + b);
            damageStats.otherDamage = stats.map((stat) => stat.otherDamage).reduce((a, b) => a + b);
            damageStats.healedDamage = stats.map((stat) => stat.healedDamage).reduce((a, b) => a + b);
            damageStats.heals = stats.map((stat) => stat.heals).reduce((a, b) => a + b);
            damageStats.normalKills = stats.map((stat) => stat.normalKills).reduce((a, b) => a + b);
            damageStats.eliteKills = stats.map((stat) => stat.eliteKills).reduce((a, b) => a + b);
            damageStats.bossKills = stats.map((stat) => stat.bossKills).reduce((a, b) => a + b);
            damageStats.exhausts = stats.map((stat) => stat.exhausts).reduce((a, b) => a + b);
            damageStats.maxDealtDamage = Math.max(...stats.map((stat) => stat.maxDealtDamage));
            damageStats.maxDamage = Math.max(...stats.map((stat) => stat.maxDamage));
        }

        return damageStats;
    }
}