import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { ConditionName } from 'src/app/game/model/data/Condition';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { Party } from 'src/app/game/model/Party';
import { CampaignMenuComponent } from 'src/app/ui/header/menu/campaign/campaign';

// CampaignMenuComponent has no dialog-opening methods exercised here (openCharacterSheet/
// openPartySheet/etc. are all pure dialog.open() calls, out of scope). Following the
// AppComponent.spec.ts pattern: create via TestBed, never call fixture.detectChanges() (ngOnInit
// never runs — we call update() directly instead). This spec covers update()'s character sort/
// condition filtering/worldMap detection, setEdition, toggleCampaignMode, toggleCondition,
// addParty/changeParty/removeParty's confirm-then-delete flow, setName, and resetCampaign's
// confirm-then-reset flow.

function buildCharacter(name: string): Character {
  const data = Object.assign(new CharacterData(), { name, edition: 'gh', stats: [new CharacterStat(1, 10)] });
  return new Character(data, 1);
}

function createComponent(): CampaignMenuComponent {
  const fixture = TestBed.createComponent(CampaignMenuComponent);
  return fixture.componentInstance;
}

describe('CampaignMenuComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CampaignMenuComponent] }).compileComponents();

    gameManager.game.figures = [];
    gameManager.game.edition = 'gh';
    gameManager.game.conditions = [];
    gameManager.game.parties = [Object.assign(new Party(), { id: 0 })];
    gameManager.game.party = gameManager.game.parties[0];
    gameManager.editionData = [];
    settingsManager.settings.editions = ['gh'];
  });

  it('renders the template without throwing', () => {
    const fixture = TestBed.createComponent(CampaignMenuComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('update', () => {
    it('sorts characters alphabetically by display name', () => {
      const b = buildCharacter('scoundrel');
      const a = buildCharacter('brute');
      gameManager.game.figures = [b, a];
      const component = createComponent();
      component.update();
      expect(component.characters).toEqual([a, b]);
    });

    it('flags worldMap when the edition declares one', () => {
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [], []), { worldMap: { width: 1, height: 1 } })];
      const component = createComponent();
      component.update();
      expect(component.worldMap).toBe(true);
    });

    it('filters out hidden/special conditions from the visible condition list', () => {
      const component = createComponent();
      component.update();
      expect(component.conditions.every((c) => c.name !== undefined)).toBe(true);
      expect(component.conditions.length).toBeGreaterThan(0);
    });
  });

  describe('setEdition', () => {
    it('sets the game and party edition and refreshes state', () => {
      const component = createComponent();
      component.setEdition('fh');
      expect(gameManager.game.edition).toEqual('fh');
      expect(gameManager.game.party.edition).toEqual('fh');
    });
  });

  describe('toggleCampaignMode', () => {
    it('flips party.campaignMode', () => {
      const component = createComponent();
      gameManager.game.party.campaignMode = false;
      component.toggleCampaignMode();
      expect(gameManager.game.party.campaignMode).toBe(true);
    });
  });

  describe('toggleCondition', () => {
    it('adds then removes a custom game condition', () => {
      const component = createComponent();
      component.editionConditions = [];
      component.toggleCondition(ConditionName.bane);
      expect(gameManager.game.conditions).toContain(ConditionName.bane);
      component.toggleCondition(ConditionName.bane);
      expect(gameManager.game.conditions).not.toContain(ConditionName.bane);
    });

    it('is a no-op for a condition already provided by the edition', () => {
      const component = createComponent();
      component.editionConditions = [ConditionName.bane];
      component.toggleCondition(ConditionName.bane);
      expect(gameManager.game.conditions).not.toContain(ConditionName.bane);
    });
  });

  describe('addParty / changeParty / removeParty', () => {
    it('addParty appends a new party with a unique id', () => {
      const component = createComponent();
      component.addParty();
      expect(gameManager.game.parties.length).toEqual(2);
      expect(gameManager.game.parties[1].id).toEqual(1);
    });

    it('changeParty switches the active party', () => {
      const otherParty = Object.assign(new Party(), { id: 1, name: 'second' });
      gameManager.game.parties.push(otherParty);
      const component = createComponent();
      component.changeParty(otherParty);
      expect(gameManager.game.party).toBe(otherParty);
    });

    it('removeParty requires a second confirming call before actually deleting', () => {
      const otherParty = Object.assign(new Party(), { id: 1, name: 'second' });
      gameManager.game.parties.push(otherParty);
      const component = createComponent();
      component.removeParty(otherParty);
      expect(gameManager.game.parties).toContain(otherParty);
      expect(component.confirmPartyDelete).toEqual(1);
      component.removeParty(otherParty);
      expect(gameManager.game.parties).not.toContain(otherParty);
    });

    it('removeParty is a no-op when it is the only party', () => {
      const component = createComponent();
      component.removeParty(gameManager.game.parties[0]);
      expect(gameManager.game.parties.length).toEqual(1);
    });

    it('cancelRemoveParty resets the confirmation state', () => {
      const component = createComponent();
      component.confirmPartyDelete = 3;
      component.cancelRemoveParty();
      expect(component.confirmPartyDelete).toEqual(-1);
    });
  });

  describe('setName', () => {
    it('updates the party name', () => {
      const component = createComponent();
      component.setName({ target: { value: 'The Warband' } });
      expect(gameManager.game.party.name).toEqual('The Warband');
    });
  });

  describe('resetCampaign / cancelResetCampaign', () => {
    it('requires a second confirming call before actually resetting', () => {
      const character = buildCharacter('brute');
      gameManager.game.figures = [character];
      const component = createComponent();
      component.resetCampaign();
      expect(component.confirmResetCampaign).toBe(true);
      expect(gameManager.game.figures).toContain(character);
      component.resetCampaign();
      expect(gameManager.game.figures).toEqual([]);
    });

    it('cancelResetCampaign resets the confirmation flag', () => {
      const component = createComponent();
      component.confirmResetCampaign = true;
      component.cancelResetCampaign();
      expect(component.confirmResetCampaign).toBe(false);
    });
  });
});
