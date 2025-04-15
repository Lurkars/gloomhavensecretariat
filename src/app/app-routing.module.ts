import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './ui/main';
import { AttackModifierToolComponent } from './ui/tools/attackmodifier/attackmodifier-tool';
import { DecksToolComponent } from './ui/tools/decks/decks-tool';
import { CharacterEditorComponent } from './ui/tools/editor/character/character';
import { DeckEditorComponent } from './ui/tools/editor/deck/deck';
import { EditionEditorComponent } from './ui/tools/editor/edition';
import { MonsterEditorComponent } from './ui/tools/editor/monster/monster';
import { EventCardsToolComponent } from './ui/tools/events/event-cards-tool';
import { RandomMonsterCardsToolComponent } from './ui/tools/random-monster-cards/random-monster-cards-tool';
import { AttackModifierStandaloneComponent } from './ui/tools/standalone/attackmodifier/attackmodifier-standalone';
import { InitiativeStandaloneComponent } from './ui/tools/standalone/initiative/initiative-standalone';
import { LootDeckStandaloneComponent } from './ui/tools/standalone/loot-deck/loot-deck-standalone';
import { TreasuresToolComponent } from './ui/tools/treasures/treasures-tool';


const routes: Routes = [
  { path: 'editor/edition', component: EditionEditorComponent },
  { path: 'editor/deck', component: DeckEditorComponent },
  { path: 'editor/monster', component: MonsterEditorComponent },
  { path: 'editor/character', component: CharacterEditorComponent },
  { path: 'tools/attackmodifier', component: AttackModifierToolComponent },
  { path: 'tools/decks', component: DecksToolComponent },
  { path: 'tools/events', component: EventCardsToolComponent },
  { path: 'tools/treasures', component: TreasuresToolComponent },
  { path: 'tools/random-monster-cards', component: RandomMonsterCardsToolComponent },
  { path: 'loot', component: LootDeckStandaloneComponent },
  { path: 'am', component: AttackModifierStandaloneComponent },
  { path: 'initiative', component: InitiativeStandaloneComponent },
  { path: '**', component: MainComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
