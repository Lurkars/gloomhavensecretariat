import { AdvancedImbueAttackModifier, AttackModifierDeck, AttackModifierType, ImbuementAttackModifier } from "../model/data/AttackModifier";
import { Game } from "../model/Game";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class ImbuementManager {

    game: Game;
    enabled: boolean = false;
    available: boolean | 'advanced' = false;
    imbuement: boolean | 'advanced' = false;

    constructor(game: Game) {
        this.game = game;
    }

    update() {
        this.available = gameManager.gh2eRules() && gameManager.game.party.conclusions.some((s) => s.edition == 'gh2e' && s.index == '48.2') && (gameManager.game.party.conclusions.some((s) => s.edition == 'gh2e' && s.index == '16.5') ? 'advanced' : true);

        if (settingsManager.settings.alwaysGh2eImbuement || !this.available && !settingsManager.settings.partySheet) {
            this.available = 'advanced';
        }

        this.enabled = settingsManager.settings.alwaysGh2eImbuement || this.available && settingsManager.settings.gh2eImbuement;

        if (!settingsManager.settings.gh2eImbuementKeep || !this.imbuement) {
            this.imbuement = gameManager.game.monsterAttackModifierDeck.cards.find((am) => am.type == AttackModifierType.imbue) != undefined;
            if (this.imbuement && gameManager.game.monsterAttackModifierDeck.cards.find((am) => am.type == AttackModifierType.advancedImbue) != undefined) {
                this.imbuement = 'advanced';
            }
        }
    }

    disable(attackModifierDeck: AttackModifierDeck) {
        attackModifierDeck.cards = attackModifierDeck.cards.filter((am) => am.type != AttackModifierType.imbue && am.type != AttackModifierType.advancedImbue);
        gameManager.attackModifierManager.shuffleModifiers(attackModifierDeck);
        if (this.imbuement == 'advanced') {
            gameManager.attackModifierManager.addModifierByType(attackModifierDeck, AttackModifierType.minus2);
            gameManager.attackModifierManager.addModifierByType(attackModifierDeck, AttackModifierType.minus1);
            gameManager.attackModifierManager.addModifierByType(attackModifierDeck, AttackModifierType.minus1);
            gameManager.attackModifierManager.addModifierByType(attackModifierDeck, AttackModifierType.minus1);
            gameManager.attackModifierManager.addModifierByType(attackModifierDeck, AttackModifierType.plus0);
            gameManager.attackModifierManager.addModifierByType(attackModifierDeck, AttackModifierType.plus0);
        } else {
            gameManager.attackModifierManager.addModifierByType(attackModifierDeck, AttackModifierType.minus1);
            gameManager.attackModifierManager.addModifierByType(attackModifierDeck, AttackModifierType.minus1);
            gameManager.attackModifierManager.addModifierByType(attackModifierDeck, AttackModifierType.minus1);
        }

        this.imbuement = false;
    }

    enable(attackModifierDeck: AttackModifierDeck, shuffle: boolean = true) {
        if (settingsManager.settings.gh2eImbuementKeep) {
            this.imbuement = true;
        }
        gameManager.attackModifierManager.removeModifierByType(attackModifierDeck, AttackModifierType.minus1);
        gameManager.attackModifierManager.removeModifierByType(attackModifierDeck, AttackModifierType.minus1);
        gameManager.attackModifierManager.removeModifierByType(attackModifierDeck, AttackModifierType.minus1);
        ImbuementAttackModifier.forEach((am) => {
            gameManager.attackModifierManager.addModifier(attackModifierDeck, am, -1, shuffle);
        })
        this.imbuement = true;
    }

    advanced(attackModifierDeck: AttackModifierDeck, shuffle: boolean = true) {
        if (settingsManager.settings.gh2eImbuementKeep) {
            this.imbuement = 'advanced';
        }
        gameManager.attackModifierManager.removeModifierByType(attackModifierDeck, AttackModifierType.minus2);
        gameManager.attackModifierManager.removeModifierByType(attackModifierDeck, AttackModifierType.minus1);
        gameManager.attackModifierManager.removeModifierByType(attackModifierDeck, AttackModifierType.minus1);
        gameManager.attackModifierManager.removeModifierByType(attackModifierDeck, AttackModifierType.minus1);
        gameManager.attackModifierManager.removeModifierByType(attackModifierDeck, AttackModifierType.plus0);
        gameManager.attackModifierManager.removeModifierByType(attackModifierDeck, AttackModifierType.plus0);
        ImbuementAttackModifier.forEach((am) => {
            gameManager.attackModifierManager.addModifier(attackModifierDeck, am, -1, shuffle);
        })
        AdvancedImbueAttackModifier.forEach((am) => {
            gameManager.attackModifierManager.addModifier(attackModifierDeck, am, -1, shuffle);
        })
        this.imbuement = 'advanced';
    }


}