import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './ui/main';
import { AttackModifierToolComponent } from './ui/tools/attackmodifier/attackmodifier-tool';
import { EditionEditorComponent } from './ui/tools/editor/edition';
import { MonsterEditorComponent } from './ui/tools/editor/monster/monster';


const routes: Routes = [
  { path: 'index.html', component: MainComponent },
  { path: 'editor/edition', component: EditionEditorComponent },
  { path: 'editor/monster', component: MonsterEditorComponent },
  { path: 'tools/attackmodifier', component: AttackModifierToolComponent },
  { path: '**', component: MainComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
