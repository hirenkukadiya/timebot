import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent }   from './dashboard/dashboard.component';
import { ListsComponent }   from './lists/lists.component';
import { CategoryComponent }   from './category/category.component';
import { PlannerComponent }   from './planner/planner.component';
import { AdminComponent }   from './admin/admin.component';


const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'lists', component: ListsComponent },
  { path: 'category', component: CategoryComponent },
  { path: 'planner', component: PlannerComponent },
  { path: 'admin', component: AdminComponent },
  { path: '', redirectTo: '/admin', pathMatch: 'full' },
];



@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}