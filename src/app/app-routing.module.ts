import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MonsterToolComponent } from './ui/tools/monster/monster';
import { MainComponent } from './ui/main';
import { AttackModifierToolComponent } from './ui/tools/attackmodifier/attackmodifier-tool';


const routes: Routes = [
  { path: 'index.html', component: MainComponent },
  { path: 'tools/monster', component: MonsterToolComponent },
  { path: 'tools/attackmodifier', component: AttackModifierToolComponent },
  { path: '**', redirectTo: 'index.html', pathMatch: 'full' }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload', relativeLinkResolution: 'legacy' }) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
