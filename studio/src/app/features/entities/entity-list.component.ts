import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { EntityApiService } from '../../services/entity-api.service';
import { TenantService } from '../../services/tenant.service';
import { MetaEntity } from '../../models/api.models';

@Component({
  selector: 'app-entity-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Entities</h1>
          <p class="subtitle">Define the logical data objects for your platform.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">+ New Entity</button>
      </div>

      @if (loading()) {
        <div class="loading-spinner">Loading…</div>
      } @else if (entities().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">🗂️</span>
          <h3>No entities yet</h3>
          <p>Create your first entity to get started (e.g. "LoanApplication").</p>
          <button class="btn btn-primary" (click)="openCreate()">Create Entity</button>
        </div>
      } @else {
        <div class="entity-grid">
          @for (entity of entities(); track entity.entityId) {
            <div class="entity-card">
              <div class="entity-card-header">
                <span class="entity-icon">📋</span>
                <div class="entity-info">
                  <h3>{{ entity.name }}</h3>
                  @if (entity.pluralName) { <span class="tag">{{ entity.pluralName }}</span> }
                </div>
                <div class="entity-actions">
                  <button class="btn btn-sm btn-outline" [routerLink]="['/entities', entity.entityId, 'fields']">
                    Fields
                  </button>
                  <button class="btn btn-sm btn-outline" [routerLink]="['/entities', entity.entityId, 'forms']">
                    Forms
                  </button>
                  <button class="btn btn-sm btn-icon" (click)="openEdit(entity)" title="Edit">✏️</button>
                  <button class="btn btn-sm btn-icon btn-danger" (click)="confirmDelete(entity)" title="Delete">🗑️</button>
                </div>
              </div>
              @if (entity.description) {
                <p class="entity-description">{{ entity.description }}</p>
              }
              <div class="entity-meta">
                Created {{ entity.createdAt | date:'mediumDate' }}
              </div>
            </div>
          }
        </div>
      }

      <!-- Create/Edit Dialog -->
      @if (dialogOpen()) {
        <div class="dialog-overlay" (click)="closeDialog()">
          <div class="dialog" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <h2>{{ editingEntity() ? 'Edit Entity' : 'New Entity' }}</h2>
              <button class="btn btn-icon" (click)="closeDialog()">✕</button>
            </div>
            <form [formGroup]="form" (ngSubmit)="save()" class="dialog-body">
              <div class="field-group">
                <label>Name <span class="required">*</span></label>
                <input formControlName="name" placeholder="e.g. LoanApplication" class="input" />
                @if (form.get('name')?.invalid && form.get('name')?.touched) {
                  <span class="error-text">Name is required</span>
                }
              </div>
              <div class="field-group">
                <label>Plural Name</label>
                <input formControlName="pluralName" placeholder="e.g. Loan Applications" class="input" />
              </div>
              <div class="field-group">
                <label>Description</label>
                <textarea formControlName="description" placeholder="What does this entity represent?" class="input textarea" rows="3"></textarea>
              </div>
              <div class="dialog-footer">
                <button type="button" class="btn btn-outline" (click)="closeDialog()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
                  {{ saving() ? 'Saving…' : 'Save' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./entity-list.component.scss']
})
export class EntityListComponent implements OnInit {
  private readonly api = inject(EntityApiService);
  private readonly tenantSvc = inject(TenantService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  entities = signal<MetaEntity[]>([]);
  loading = signal(true);
  saving = signal(false);
  dialogOpen = signal(false);
  editingEntity = signal<MetaEntity | null>(null);

  form = this.fb.group({
    name: ['', Validators.required],
    pluralName: [''],
    description: ['']
  });

  ngOnInit(): void {
    this.loadEntities();
  }

  loadEntities(): void {
    this.loading.set(true);
    this.api.listEntities().subscribe({
      next: (data) => { this.entities.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate(): void {
    this.editingEntity.set(null);
    this.form.reset();
    this.dialogOpen.set(true);
  }

  openEdit(entity: MetaEntity): void {
    this.editingEntity.set(entity);
    this.form.patchValue({
      name: entity.name,
      pluralName: entity.pluralName ?? '',
      description: entity.description ?? ''
    });
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
    this.editingEntity.set(null);
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const payload = {
      name: this.form.value.name!,
      pluralName: this.form.value.pluralName || undefined,
      description: this.form.value.description || undefined
    };
    const op = this.editingEntity()
      ? this.api.updateEntity(this.editingEntity()!.entityId, payload)
      : this.api.createEntity(payload);

    op.subscribe({
      next: () => { this.saving.set(false); this.closeDialog(); this.loadEntities(); },
      error: () => this.saving.set(false)
    });
  }

  confirmDelete(entity: MetaEntity): void {
    if (!confirm(`Delete entity "${entity.name}"? This cannot be undone.`)) return;
    this.api.deleteEntity(entity.entityId).subscribe(() => this.loadEntities());
  }
}
