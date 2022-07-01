import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MonsterToolComponent } from './ui/tools/monster/monster';
import { MainComponent } from './ui/main';


const routes: Routes = [
  { path: 'index.html', component: MainComponent },
  { path: 'tools/monster', component: MonsterToolComponent },
  { path: '**', redirectTo: 'index.html', pathMatch: 'full' }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload', relativeLinkResolution: 'legacy' }) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
