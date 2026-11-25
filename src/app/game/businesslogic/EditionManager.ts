import { debugManager, gameManager, labelManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { AbilityCard } from 'src/app/game/model/data/AbilityCard';
import { BuildingData } from 'src/app/game/model/data/BuildingData';
import { ChallengeCard } from 'src/app/game/model/data/Challenges';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { DeckData } from 'src/app/game/model/data/DeckData';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { FigureError, FigureErrorType } from 'src/app/game/model/data/FigureError';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Figure } from 'src/app/game/model/Figure';
import { Game, GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';

export class EditionManager {
  defaultEditionDataUrls: string[] = [
    './assets/data/gh.json',
    './assets/data/fh.json',
    './assets/data/jotl.json',
    './assets/data/fc.json',
    './assets/data/cs.json',
    './assets/data/toa.json',
    './assets/data/bb.json',
    './assets/data/gh2e.json',
    './assets/data/rpg.json',
    './assets/data/bb-promotional.json',
    './assets/data/fh-crossover.json',
    './assets/data/gh-envx.json',
    './assets/data/toa-envv.json',
    './assets/data/mp.json',
    './assets/data/ccug.json',
    './assets/data/sc.json',
    './assets/data/gh-solo-items.json',
    './assets/data/sox.json',
    './assets/data/bas.json',
    './assets/data/cc.json',
    './assets/data/cq.json',
    './assets/data/ir.json',
    './assets/data/r100kc.json',
    './assets/data/sits.json'
  ];
  failedEditionDataUrls: string[] = [];
  editionData: EditionData[] = [];
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  editions(all: boolean = false, extraContent: boolean = false): string[] {
    return this.editionData
      .filter(
        (editionData) =>
          (all || settingsManager.settings.editions.includes(editionData.edition)) && (extraContent || editionData.type !== 'content')
      )
      .map((editionData) => editionData.edition);
  }

  editionsData(all: boolean = false, extraContent: boolean = false): EditionData[] {
    const editions: string[] = this.editions(all, extraContent);
    return this.editionData.filter((editionData) => editions.includes(editionData.edition));
  }

  editionLogo(edition: string): string {
    const editionData = this.editionData.find((editionData) => editionData.edition === edition);
    if (editionData && editionData.logoUrl) {
      return editionData.logoUrl;
    }
    return '';
  }

  currentEdition(fallback: string | undefined = undefined): string {
    if (this.game.edition) {
      return this.game.edition;
    }

    if (this.game.scenario && this.game.scenario.edition) {
      return this.game.scenario.edition;
    }

    const charEditions = this.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure.edition);

    if (charEditions.length > 0 && charEditions.every((edition, index, self) => index === 0 || self[index - 1] === edition)) {
      return charEditions[0];
    }

    return fallback !== undefined ? fallback : this.editions()[0];
  }

  relevantEditions(edition: string | undefined = undefined, extensionOnly: boolean = false, extraContent: boolean = true): string[] {
    if (!edition) {
      if (!this.game.edition) {
        return this.editions(false, extraContent);
      }
      edition = this.game.edition;
    }
    const editions: string[] = [];
    const editionData = this.editionData.find((e) => e.edition === edition);
    if (editionData) {
      editions.push(editionData.edition);
      if ((!extensionOnly || editionData.type !== 'extension') && !!editionData.extends) {
        editionData.extends.forEach((e) => {
          if (!editions.includes(e) && settingsManager.settings.editions.includes(e)) {
            editions.push(e);
            this.relevantEditions(e, extensionOnly, false).forEach((p) => {
              if (!editions.includes(p) && settingsManager.settings.editions.includes(p)) {
                editions.push(p);
              }
            });
          }
        });
      }

      if (extraContent) {
        this.editionData
          .filter(
            (e) =>
              settingsManager.settings.editions.includes(e.edition) &&
              e.type === 'content' &&
              (!e.extends || !e.extends.length || e.extends.includes(edition))
          )
          .sort((a, b) => {
            if (!!a.extends && a.extends.includes(edition) && (!b.extends || !b.extends.length)) {
              return -1;
            } else if (!!b.extends && b.extends.includes(edition) && (!a.extends || !a.extends.length)) {
              return 1;
            }
            return 0;
          })
          .map((e) => e.edition)
          .forEach((p) => {
            if (!editions.includes(p)) {
              editions.push(p);
            }
          });
      }
    }

    return editions;
  }

  isEditionRelevant(other: string, edition: string | undefined, extensionOnly: boolean = false): boolean {
    if (!settingsManager.settings.editions.includes(other)) {
      return false;
    }

    const editionData = this.editionData.find((e) => e.edition === other);
    if (!editionData) {
      return false;
    }
    return (
      !edition ||
      this.relevantEditions(edition, extensionOnly).includes(editionData.edition) ||
      (editionData.type === 'content' && (!editionData.extends || !editionData.extends.length || editionData.extends.includes(edition)))
    );
  }

  newItemStyle(edition: string): boolean {
    const editionData = this.editionData.find((editionData) => editionData.edition === edition);
    if (!editionData) return false;
    if (editionData.newItemStyle) return true;
    if (editionData.type === 'extension' || editionData.type === 'addon') {
      return (editionData.extends || []).some((ext) => this.newItemStyle(ext));
    }
    return false;
  }

  newAmStyle(edition: string): boolean {
    const editionData = this.editionData.find((editionData) => editionData.edition === edition);
    if (!editionData) return false;
    if (editionData.newAmStyle) return true;
    if (editionData.type === 'extension' || editionData.type === 'addon') {
      return (editionData.extends || []).some((ext) => this.newAmStyle(ext));
    }
    return false;
  }

  charactersData(edition: string | undefined = undefined): CharacterData[] {
    const characters = this.editionData
      .filter((editionData) => this.isEditionRelevant(editionData.edition, edition))
      .flatMap((editionData) => editionData.characters);

    const merges = characters.filter((characterData) => characterData.merge);

    return characters
      .filter(
        (characterData) =>
          (!edition || characterData.edition === edition) &&
          !characterData.merge &&
          (characterData.replace ||
            (!characterData.replace &&
              !characters.find(
                (characterDataReplacement) =>
                  characterDataReplacement.replace &&
                  characterDataReplacement.name === characterData.name &&
                  characterDataReplacement.edition === characterData.edition
              )))
      )
      .map((characterData) => {
        const merge = merges.find(
          (characterDataMerge) => characterDataMerge.name === characterData.name && characterDataMerge.edition === characterData.edition
        );
        if (merge) {
          return Object.assign(new CharacterData(characterData), merge);
        }

        return new CharacterData(characterData);
      });
  }

  monstersData(edition: string | undefined = undefined): MonsterData[] {
    return this.editionData
      .filter((editionData) => this.isEditionRelevant(editionData.edition, edition))
      .flatMap((editionData) => editionData.monsters)
      .filter(
        (monsterData, index, monsters) =>
          (!edition || monsterData.edition === edition) &&
          (monsterData.replace ||
            (!monsterData.replace &&
              !monsters.find(
                (monsterDataReplacement) =>
                  monsterDataReplacement.replace &&
                  monsterDataReplacement.name === monsterData.name &&
                  monsterDataReplacement.edition === monsterData.edition
              )))
      );
  }

  decksData(edition: string | undefined = undefined): DeckData[] {
    const decks = this.editionData
      .filter((editionData) => this.isEditionRelevant(editionData.edition, edition))
      .flatMap((editionData) => editionData.decks);

    const replaces = decks.filter((deckData) => deckData.abilities.some((abilityCard) => abilityCard.replace));

    return decks
      .filter((deckData) => !replaces.includes(deckData))
      .map((deckData) => {
        const replace = replaces.find((other) => other.edition === deckData.edition && other.name === deckData.name);
        if (!replace) {
          return deckData;
        }
        const newDeckData = new DeckData(deckData.edition, deckData.name, deckData.character);

        newDeckData.abilities = deckData.abilities.map((abilityCard) =>
          Object.assign(
            new AbilityCard(),
            replace.abilities.find((other) => other.cardId === abilityCard.cardId && other.replace) || abilityCard
          )
        );

        return newDeckData;
      });
  }

  scenarioData(edition: string | undefined = undefined): ScenarioData[] {
    const edData = edition ? this.editionData.find((ed) => ed.edition === edition) : undefined;
    return this.editionData
      .filter((editionData) => this.isEditionRelevant(editionData.edition, edition))
      .flatMap((editionData) => editionData.scenarios)
      .filter(
        (scenarioData) =>
          !edition ||
          scenarioData.edition === edition ||
          (edData?.type === 'addon' && (edData.extends || []).includes(scenarioData.edition))
      );
  }

  sectionData(edition: string | undefined = undefined, extension: boolean = false): ScenarioData[] {
    return this.editionData
      .filter((editionData) => this.isEditionRelevant(editionData.edition, edition))
      .flatMap((editionData) => editionData.sections)
      .filter((sectionData) => this.isEditionRelevant(sectionData.edition, edition, extension))
      .map((sectionData) => {
        if (!settingsManager.settings.fhSecondEdition || sectionData.edition !== 'fh') {
          return sectionData;
        } else if (sectionData.index === '6.2') {
          const section = new ScenarioData(sectionData);
          section.index = '60.2';
          return section;
        } else if (sectionData.index === '60.2') {
          const section = new ScenarioData(sectionData);
          section.index = '6.2';
          return section;
        }
        return sectionData;
      });
  }

  itemData(edition: string | undefined = undefined, all: boolean = false): ItemData[] {
    return this.editionData
      .filter((editionData) => this.isEditionRelevant(editionData.edition, edition, all))
      .flatMap((editionData) => editionData.items)
      .filter(
        (itemData, index, items) =>
          itemData.replace ||
          (!itemData.replace &&
            !items.find(
              (itemDataReplacement) =>
                itemDataReplacement.replace && itemDataReplacement.id === itemData.id && itemDataReplacement.edition === itemData.edition
            ))
      );
  }

  challengesData(edition: string | undefined = undefined, all: boolean = false): ChallengeCard[] {
    return this.editionData
      .filter((editionData) => this.isEditionRelevant(editionData.edition, edition, all))
      .flatMap((editionData) => editionData.challenges);
  }

  deckData(figure: Monster | Character, ignoreError: boolean = false): DeckData {
    let deckData: DeckData | undefined;

    // find stat effect deck
    if (figure instanceof Monster && figure.statEffect && figure.statEffect.deck) {
      deckData = this.decksData().find(
        (deck) =>
          figure instanceof Monster &&
          figure.statEffect &&
          figure.statEffect.deck &&
          figure.statEffect.deck === deck.name &&
          (deck.edition === figure.edition || this.isEditionRelevant(deck.edition, this.currentEdition()))
      );
      if (deckData && figure.abilities.length !== deckData.abilities.length) {
        figure.abilities = deckData.abilities
          .filter((abilityCard) => isNaN(+abilityCard.level) || +abilityCard.level <= ((figure && figure.level) || 0))
          .map((abilityCard) => (deckData ? deckData.abilities.indexOf(abilityCard) : -1));
        gameManager.randomManager.shuffle(figure.abilities);
        if (this.game.state === GameState.next) {
          figure.ability = 0;
        }
      }
    }

    if (!deckData) {
      deckData = this.decksData(figure.edition).find((deck) => deck.name === figure.deck || deck.name === figure.name);
    }

    // find extensions decks
    if (!deckData) {
      deckData = this.decksData().find(
        (deck) => (deck.name === figure.deck || deck.name === figure.name) && this.isEditionRelevant(deck.edition, figure.edition)
      );
    }

    // find other
    if (!deckData) {
      deckData = this.decksData().find(
        (deck) => (deck.name === figure.deck || deck.name === figure.name) && deck.edition === figure.edition
      );
    }

    if (!deckData) {
      figure.errors = figure.errors || [];
      if (
        !ignoreError &&
        !figure.errors.find((figureError) => figureError.type === FigureErrorType.unknown) &&
        !figure.errors.find((figureError) => figureError.type === FigureErrorType.deck)
      ) {
        console.error('Unknwon deck: ' + figure.name + (figure.deck ? '[' + figure.deck + ']' : '') + ' for ' + figure.edition);
        figure.errors.push(
          new FigureError(
            FigureErrorType.deck,
            figure instanceof Character ? 'character' : 'monster',
            figure.name,
            figure.edition,
            figure.deck
          )
        );
      }
      return new DeckData();
    }

    return deckData;
  }

  abilityCards(figure: Monster | Character): AbilityCard[] {
    return this.deckData(figure).abilities || [];
  }

  hasBottomAbility(abilityCard: AbilityCard | undefined): boolean {
    return (abilityCard && abilityCard.bottomActions && abilityCard.bottomActions.length > 0) || false;
  }

  getCharacterData(name: string, edition: string = ''): CharacterData {
    let characterData = this.charactersData().find((value) => value.name === name && (!edition || value.edition === edition));
    if (!characterData) {
      characterData = this.charactersData().find((value) => value.name === name);

      if (!characterData && !edition) {
        edition = name.split('-')[0];
        name = name.split('-').slice(1).join('-');
        characterData = this.charactersData().find((value) => value.name === name && value.edition === edition);
        while (name && !characterData) {
          edition = edition + '-' + name.split('-')[0];
          name = name.split('-').slice(1).join('-');
          characterData = this.charactersData().find((value) => value.name === name && value.edition === edition);
        }
      }

      if (!characterData) {
        characterData = new CharacterData();
        characterData.name = name;
        characterData.edition = edition;
        characterData.errors = characterData.errors || [];
        if (!characterData.errors.find((figureError) => figureError.type === FigureErrorType.unknown)) {
          console.error("unknown character '" + name + "' for edition '" + edition + "'");
          characterData.errors.push(new FigureError(FigureErrorType.unknown, 'character', name, edition));
        }
      }
      return characterData;
    }
    return characterData;
  }

  getEdition(figure: Figure, fallback: string = ''): string {
    const edition = this.currentEdition(fallback);
    if (figure.edition !== edition && !this.isEditionRelevant(figure.edition, edition)) {
      return figure.edition;
    }
    return '';
  }

  getMonsterData(name: string, edition: string): MonsterData {
    let monsterData = this.monstersData().find((value) => value.name === name && value.edition === edition);
    if (!monsterData) {
      monsterData = this.monstersData().find((value) => value.name === name);
      if (!monsterData) {
        monsterData = new MonsterData();
        monsterData.errors = monsterData.errors || [];
        monsterData.name = name;
        monsterData.edition = edition;
        if (!monsterData.errors.find((figureError) => figureError.type === FigureErrorType.unknown)) {
          console.error("unknown monster '" + name + "' for edition '" + edition + "'");
          monsterData.errors.push(new FigureError(FigureErrorType.unknown, 'monster', name, edition));
        }
      }
      return monsterData;
    }

    return monsterData;
  }

  cleanEditionData() {
    this.editionData = [];
  }

  async loadEditionData(url: string, force: boolean = false): Promise<EditionData | undefined> {
    try {
      const success = await fetch(url)
        .then((response) => {
          if (!response.ok) {
            console.warn('Invalid data url: ' + url + ' [' + response.statusText + ']');
            return undefined;
          }
          return response.json();
        })
        .then((value: EditionData) => {
          // include extra content editions, otherwise they get added again on every init (e.g. opening an editor)
          if (this.editions(true, true).includes(value.edition) && !force) {
            console.warn('Edition already exists: ' + value.edition);
            return undefined;
          }

          if (force) {
            this.editionData = this.editionData.filter((editionData) => editionData.url !== url);
          }

          value.characters = value.characters || [];
          value.monsters = value.monsters || [];
          value.decks = value.decks || [];
          value.scenarios = value.scenarios || [];
          value.sections = value.sections || [];
          value.items = value.items || [];
          value.conditions = value.conditions || [];
          value.battleGoals = value.battleGoals || [];
          value.events = value.events || [];
          value.challenges = value.challenges || [];
          value.trials = value.trials || [];
          value.favors = value.favors || [];
          value.pets = value.pets || [];
          value.personalQuests = value.personalQuests || [];
          value.label = value.label || {};
          value.labelSpoiler = value.labelSpoiler || {};
          value.labelEvents = value.labelEvents || {};
          value.url = url;
          value.logoUrl = value.logoUrl || '';
          value.extends = value.extends || [];
          value.newAmStyle = value.newAmStyle || false;
          value.newItemStyle = value.newItemStyle || false;
          value.treasures = value.treasures || [];
          value.treasureOffset = value.treasureOffset || 0;

          if (value.campaign && value.campaign.buildings) {
            value.campaign.buildings = value.campaign.buildings.map((buildingData) => Object.assign(new BuildingData(), buildingData));
          }

          value.battleGoals.map((battleGoal, index) => {
            if (!battleGoal.edition) {
              battleGoal.edition = value.edition;
            }
            if (!battleGoal.cardId) {
              battleGoal.cardId = battleGoal.edition + '-' + (index + 1);
            }
            return battleGoal;
          });

          value.events.map((event, index) => {
            if (!event.edition) {
              event.edition = value.edition;
            }
            if (!event.cardId) {
              event.cardId = '' + (index + 1);
            }
            return event;
          });

          value.personalQuests.map((personalQuest, index) => {
            if (!personalQuest.edition) {
              personalQuest.edition = value.edition;
            }
            if (!personalQuest.cardId) {
              personalQuest.cardId = value.edition + '-' + (index + 1);
            }
            if (!personalQuest.requirements) {
              personalQuest.requirements = [];
            }
            return personalQuest;
          });

          if (value.campaign && value.campaign.buildings) {
            value.campaign.buildings.forEach((buildingData) => {
              if (!buildingData.edition) {
                buildingData.edition = value.edition;
              }
            });
          }

          value.challenges.map((challenge, index) => {
            if (!challenge.edition) {
              challenge.edition = value.edition;
            }
            if (!challenge.cardId) {
              challenge.cardId = index + 1;
            }
            return challenge;
          });

          value.trials.map((trialCard, index) => {
            if (!trialCard.edition) {
              trialCard.edition = value.edition;
            }
            if (!trialCard.cardId) {
              trialCard.cardId = index + 1;
            }
            return trialCard;
          });

          value.favors.map((favor, index) => {
            if (!favor.edition) {
              favor.edition = value.edition;
            }
            if (!favor.name) {
              favor.name = 'favor-' + (index + 1);
            }
            return favor;
          });

          value.pets.map((pet, index) => {
            if (!pet.edition) {
              pet.edition = value.edition;
            }
            if (!pet.id) {
              pet.id = (index < 9 ? '0' : '') + (index + 1);
            }
            return pet;
          });

          this.failedEditionDataUrls = this.failedEditionDataUrls.filter((failedUrl) => failedUrl !== url);
          this.editionData.push(value);
          this.editionData.sort((a, b) => {
            return settingsManager.settings.editionDataUrls.indexOf(a.url) - settingsManager.settings.editionDataUrls.indexOf(b.url);
          });

          if (settingsManager.settings.editions.includes(value.edition)) {
            labelManager.loadDataLabel(value);
          } else {
            labelManager.loadEditionLabel(value);
          }
          return value;
        });
      return success;
    } catch (error) {
      console.warn('Invalid data url: ' + url + ' [' + error + ']');
      if (!this.failedEditionDataUrls.includes(url)) {
        this.failedEditionDataUrls.push(url);
      }
      return undefined;
    }
  }

  validateEditionData() {
    debugManager.checkDuplicates();
    debugManager.checkScenarioMonster();
    debugManager.checkSectionMonster();
    debugManager.checkMissingScenarioMonster();
    debugManager.checkMissingSectionMonster();
    debugManager.checkMonsterUsage();
    debugManager.checkMonsterBossCount();
  }

  getEditionByUrl(url: string): string {
    const editionData = this.editionData.find((editionData) => editionData.url === url);

    if (editionData) {
      return editionData.url;
    }

    console.error("No edition data found for url '" + url + "'");
    return '';
  }

  async addEditionDataUrl(editionDataUrl: string): Promise<EditionData | undefined> {
    if (!settingsManager.settings.editionDataUrls.includes(editionDataUrl)) {
      const success = await this.loadEditionData(editionDataUrl);
      if (success) {
        settingsManager.settings.editionDataUrls.push(editionDataUrl);
        this.editionData.sort((a, b) => {
          return settingsManager.settings.editionDataUrls.indexOf(a.url) - settingsManager.settings.editionDataUrls.indexOf(b.url);
        });
        if (settingsManager.settings.excludeEditionDataUrls.includes(editionDataUrl)) {
          settingsManager.settings.excludeEditionDataUrls.splice(
            settingsManager.settings.excludeEditionDataUrls.indexOf(editionDataUrl),
            1
          );
        }
        settingsManager.storeSettings();
        return success;
      }
    }

    return undefined;
  }

  async removeEditionDataUrl(editionDataUrl: string) {
    if (settingsManager.settings.editionDataUrls.includes(editionDataUrl)) {
      this.editionData = this.editionData.filter((editionData) => editionData.url !== editionDataUrl);
      settingsManager.settings.editionDataUrls.splice(settingsManager.settings.editionDataUrls.indexOf(editionDataUrl), 1);
      if (this.defaultEditionDataUrls.includes(editionDataUrl)) {
        settingsManager.settings.excludeEditionDataUrls.push(editionDataUrl);
      }
      settingsManager.storeSettings();
    }
  }

  async restoreDefaultEditionDataUrls() {
    for (const editionDataUrl of this.defaultEditionDataUrls) {
      if (!settingsManager.settings.editionDataUrls.includes(editionDataUrl)) {
        settingsManager.settings.editionDataUrls.push(editionDataUrl);
        await this.loadEditionData(editionDataUrl);
      }
    }

    settingsManager.settings.editionDataUrls.sort((a, b) => {
      if (this.defaultEditionDataUrls.includes(a) && this.defaultEditionDataUrls.includes(b)) {
        return this.defaultEditionDataUrls.indexOf(a) - this.defaultEditionDataUrls.indexOf(b);
      } else if (this.defaultEditionDataUrls.includes(a) && !this.defaultEditionDataUrls.includes(b)) {
        return -1;
      } else if (!this.defaultEditionDataUrls.includes(a) && this.defaultEditionDataUrls.includes(b)) {
        return 1;
      } else {
        return settingsManager.settings.editionDataUrls.indexOf(a) - settingsManager.settings.editionDataUrls.indexOf(b);
      }
    });

    this.editionData.sort((a, b) => {
      return settingsManager.settings.editionDataUrls.indexOf(a.url) - settingsManager.settings.editionDataUrls.indexOf(b.url);
    });

    settingsManager.storeSettings();
  }
}
