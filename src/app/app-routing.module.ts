import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './ui/main';
import { AttackModifierToolComponent } from './ui/tools/attackmodifier/attackmodifier-tool';
import { DecksToolComponent } from './ui/tools/decks/decks-tool';
import { CharacterEditorComponent } from './ui/tools/editor/character/character';
import { DeckEditorComponent } from './ui/tools/editor/deck/deck';
import { EditionEditorComponent } from './ui/tools/editor/edition';
import { MonsterEditorComponent } from './ui/tools/editor/monster/monster';
import { AttackModifierStandaloneComponent } from './ui/tools/standalone/attackmodifier-standalone';
import { LootDeckStandaloneComponent } from './ui/tools/standalone/loot-deck-standalone';
import { TreasuresToolComponent } from './ui/tools/treasures/treasures-tool';
import { EventCardsToolComponent } from './ui/tools/events/event-cards-tool';


const routes: Routes = [
  { path: 'editor/edition', component: EditionEditorComponent },
  { path: 'editor/deck', component: DeckEditorComponent },
  { path: 'editor/monster', component: MonsterEditorComponent },
  { path: 'editor/character', component: CharacterEditorComponent },
  { path: 'tools/attackmodifier', component: AttackModifierToolComponent },
  { path: 'tools/decks', component: DecksToolComponent },
  { path: 'tools/events', component: EventCardsToolComponent },
  { path: 'tools/treasures', component: TreasuresToolComponent },
  { path: 'loot', component: LootDeckStandaloneComponent },
  { path: 'am', component: AttackModifierStandaloneComponent },
  { path: '**', component: MainComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
