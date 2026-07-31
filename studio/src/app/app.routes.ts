import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'entities', pathMatch: 'full' },
  {
    path: 'entities',
    loadComponent: () => import('./features/entities/entity-list.component')
      .then(m => m.EntityListComponent)
  },
  {
    path: 'entities/:entityId/fields',
    loadComponent: () => import('./features/entities/field-manager.component')
      .then(m => m.FieldManagerComponent)
  },
  {
    path: 'entities/:entityId/forms',
    loadComponent: () => import('./features/forms/form-list.component')
      .then(m => m.FormListComponent)
  },
  {
    path: 'forms/:formId/designer',
    loadComponent: () => import('./features/forms/form-designer.component')
      .then(m => m.FormDesignerComponent)
  }
];
