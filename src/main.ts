import { DEFAULT_DIALOG_CONFIG } from '@angular/cdk/dialog';
import { ErrorHandler, provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { AppComponent } from 'src/app/app.component';
import { MainComponent } from 'src/app/ui/main';
import { GhsErrorHandler } from 'src/app/ui/tools/error-handler';
import { environment } from 'src/environments/environment';

const routes = [
  { path: 'editor/edition', loadComponent: () => import('src/app/ui/tools/editor/edition').then((m) => m.EditionEditorComponent) },
  { path: 'editor/deck', loadComponent: () => import('src/app/ui/tools/editor/deck/deck').then((m) => m.DeckEditorComponent) },
  { path: 'editor/monster', loadComponent: () => import('src/app/ui/tools/editor/monster/monster').then((m) => m.MonsterEditorComponent) },
  {
    path: 'editor/character',
    loadComponent: () => import('src/app/ui/tools/editor/character/character').then((m) => m.CharacterEditorComponent)
  },
  {
    path: 'tools/attackmodifier',
    loadComponent: () => import('src/app/ui/tools/attackmodifier/attackmodifier-tool').then((m) => m.AttackModifierToolComponent)
  },
  { path: 'tools/decks', loadComponent: () => import('src/app/ui/tools/decks/decks-tool').then((m) => m.DecksToolComponent) },
  { path: 'tools/events', loadComponent: () => import('src/app/ui/tools/events/event-cards-tool').then((m) => m.EventCardsToolComponent) },
  { path: 'tools/items', loadComponent: () => import('src/app/ui/tools/items/items-cards-tool').then((m) => m.ItemsCardsToolComponent) },
  {
    path: 'tools/treasures',
    loadComponent: () => import('src/app/ui/tools/treasures/treasures-tool').then((m) => m.TreasuresToolComponent)
  },
  {
    path: 'tools/random-monster-cards',
    loadComponent: () =>
      import('src/app/ui/tools/random-monster-cards/random-monster-cards-tool').then((m) => m.RandomMonsterCardsToolComponent)
  },
  {
    path: 'loot',
    loadComponent: () => import('src/app/ui/tools/standalone/loot-deck/loot-deck-standalone').then((m) => m.LootDeckStandaloneComponent)
  },
  {
    path: 'am',
    loadComponent: () =>
      import('src/app/ui/tools/standalone/attackmodifier/attackmodifier-standalone').then((m) => m.AttackModifierStandaloneComponent)
  },
  {
    path: 'calc',
    loadComponent: () =>
      import('src/app/ui/tools/standalone/enhancement-calculator/enhancement-calculator').then(
        (m) => m.EnhancementCalculatorStandaloneComponent
      )
  },
  {
    path: 'initiative',
    loadComponent: () => import('src/app/ui/tools/standalone/initiative/initiative-standalone').then((m) => m.InitiativeStandaloneComponent)
  },
  { path: '**', component: MainComponent }
];

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production && !environment.electron,
      registrationStrategy: 'registerImmediately'
    }),
    {
      provide: DEFAULT_DIALOG_CONFIG,
      useValue: {
        autoFocus: 'dialog',
        hasBackdrop: true
      }
    },
    {
      provide: ErrorHandler,
      useClass: GhsErrorHandler
    }
  ]
}).catch((err) => console.error(err));
