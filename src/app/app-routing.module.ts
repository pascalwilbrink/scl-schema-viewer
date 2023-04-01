import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main/main.component';
import { OverviewComponent } from './overview/overview.component';
import { VersionSelectorComponent } from './version-selector/version-selector.component';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'select-version',
      },
      {
        path: 'select-version',
        component: VersionSelectorComponent,
      },
      {
        path: 'overview',
        component: OverviewComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
