import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormApiService } from '../../services/form-api.service';
import { EntityApiService } from '../../services/entity-api.service';
import { MetaForm, MetaEntity } from '../../models/api.models';

@Component({
  selector: 'app-form-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <a class="back-link" routerLink="/entities">← Entities</a>
          <h1>{{ entity()?.name }} — Forms</h1>
          <p class="subtitle">Create and design forms for this entity.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">+ New Form</button>
      </div>

      @if (loading()) { <div class="loading-spinner">Loading…</div> }
      @else if (forms().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">📄</span>
          <h3>No forms yet</h3>
          <p>Create a form to start placing fields and defining the user interface.</p>
          <button class="btn btn-primary" (click)="openCreate()">Create Form</button>
        </div>
      } @else {
        <div class="forms-grid">
          @for (form of forms(); track form.formId) {
            <div class="form-card">
              <div class="form-card-icon">📋</div>
              <div class="form-card-info">
                <h3>{{ form.name }}</h3>
                <span class="tag">v{{ form.version }}</span>
                @if (!form.isActive) { <span class="tag tag-inactive">Inactive</span> }
              </div>
              <div class="form-card-actions">
                <a class="btn btn-primary btn-sm" [routerLink]="['/forms', form.formId, 'designer']">
                  Open Designer
                </a>
                <button class="btn btn-sm btn-icon btn-danger" (click)="confirmDelete(form)">🗑️</button>
              </div>
              @if (form.description) {
                <p class="form-desc">{{ form.description }}</p>
              }
            </div>
          }
        </div>
      }

      @if (dialogOpen()) {
        <div class="dialog-overlay" (click)="closeDialog()">
          <div class="dialog" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <h2>New Form</h2>
              <button class="btn btn-icon" (click)="closeDialog()">✕</button>
            </div>
            <form [formGroup]="form" (ngSubmit)="save()" class="dialog-body">
              <div class="field-group">
                <label>Form Name <span class="required">*</span></label>
                <input formControlName="name" placeholder="e.g. Loan Application Form" class="input" />
              </div>
              <div class="field-group">
                <label>Description</label>
                <textarea formControlName="description" class="input textarea" rows="2"></textarea>
              </div>
              <div class="dialog-footer">
                <button type="button" class="btn btn-outline" (click)="closeDialog()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
                  {{ saving() ? 'Creating…' : 'Create Form' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 960px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; h1 { margin: 0.25rem 0; } }
    .back-link { font-size: 0.875rem; color: var(--accent); text-decoration: none; &:hover { text-decoration: underline; } }
    .subtitle { color: var(--text-secondary); margin: 0; }
    .forms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
    .form-card {
      background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
      padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem;
      transition: transform 0.2s, box-shadow 0.2s;
      &:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
      .form-card-icon { font-size: 2rem; }
      .form-card-info { h3 { margin: 0; } display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
      .form-card-actions { display: flex; gap: 0.5rem; }
      .form-desc { color: var(--text-secondary); font-size: 0.875rem; margin: 0; }
    }
    .tag { font-size: 0.72rem; padding: 0.15rem 0.5rem; border-radius: 9999px; background: var(--surface-alt); color: var(--text-secondary); }
    .tag-inactive { color: var(--danger); background: var(--danger-subtle); }
    .empty-state { text-align: center; padding: 4rem 2rem; color: var(--text-secondary); .empty-icon { font-size: 3rem; display: block; margin-bottom: 1rem; } h3 { color: var(--text-primary); } p { margin-bottom: 1.5rem; } }
    .loading-spinner { text-align: center; padding: 3rem; color: var(--text-secondary); }
  `]
})
export class FormListComponent implements OnInit {
  private readonly formApi = inject(FormApiService);
  private readonly entityApi = inject(EntityApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  entityId = '';
  entity = signal<MetaEntity | null>(null);
  forms = signal<MetaForm[]>([]);
  loading = signal(true);
  saving = signal(false);
  dialogOpen = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
    description: ['']
  });

  ngOnInit(): void {
    this.entityId = this.route.snapshot.paramMap.get('entityId') ?? '';
    this.entityApi.getEntity(this.entityId).subscribe(e => this.entity.set(e));
    this.loadForms();
  }

  loadForms(): void {
    this.loading.set(true);
    this.formApi.listForms(this.entityId).subscribe({
      next: (data) => { this.forms.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate(): void { this.form.reset(); this.dialogOpen.set(true); }
  closeDialog(): void { this.dialogOpen.set(false); }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.formApi.createForm({
      entityId: this.entityId,
      name: this.form.value.name!,
      description: this.form.value.description || undefined
    }).subscribe({
      next: () => { this.saving.set(false); this.closeDialog(); this.loadForms(); },
      error: () => this.saving.set(false)
    });
  }

  confirmDelete(f: MetaForm): void {
    if (!confirm(`Delete form "${f.name}"?`)) return;
    this.formApi.deleteForm(f.formId).subscribe(() => this.loadForms());
  }
}
