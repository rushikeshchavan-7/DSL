import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { EntityApiService } from '../../services/entity-api.service';
import { MetaEntity, MetaField } from '../../models/api.models';

type DataType = 'string' | 'number' | 'boolean' | 'date' | 'enum';

@Component({
  selector: 'app-field-manager',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <a class="back-link" routerLink="/entities">← Entities</a>
          <h1>{{ entity()?.name }} — Fields</h1>
          <p class="subtitle">Define the data columns for this entity.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">+ Add Field</button>
      </div>

      @if (loading()) {
        <div class="loading-spinner">Loading…</div>
      } @else {
        <div class="fields-table-wrap">
          <table class="fields-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Label</th>
                <th>Type</th>
                <th>Required</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (field of fields(); track field.fieldId; let i = $index) {
                <tr>
                  <td class="order-cell">{{ field.displayOrder }}</td>
                  <td><code>{{ field.name }}</code></td>
                  <td>{{ field.label }}</td>
                  <td><span class="type-badge type-{{ field.dataType }}">{{ field.dataType }}</span></td>
                  <td>
                    @if (field.isRequired) { <span class="required-badge">Required</span> }
                    @else { <span class="optional-badge">Optional</span> }
                  </td>
                  <td class="actions-cell">
                    <button class="btn btn-sm btn-icon" (click)="openEdit(field)" title="Edit">✏️</button>
                    <button class="btn btn-sm btn-icon btn-danger" (click)="confirmDelete(field)" title="Delete">🗑️</button>
                  </td>
                </tr>
              }
              @empty {
                <tr><td colspan="6" class="empty-row">No fields yet. Click "Add Field" to create one.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Field dialog -->
      @if (dialogOpen()) {
        <div class="dialog-overlay" (click)="closeDialog()">
          <div class="dialog dialog-lg" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <h2>{{ editingField() ? 'Edit Field' : 'Add Field' }}</h2>
              <button class="btn btn-icon" (click)="closeDialog()">✕</button>
            </div>
            <form [formGroup]="form" (ngSubmit)="save()" class="dialog-body">
              <div class="form-row">
                <div class="field-group">
                  <label>Machine Name <span class="required">*</span></label>
                  <input formControlName="name" placeholder="e.g. loan_amount" class="input" />
                  <span class="hint">snake_case, used in API responses</span>
                </div>
                <div class="field-group">
                  <label>Display Label <span class="required">*</span></label>
                  <input formControlName="label" placeholder="e.g. Loan Amount" class="input" />
                </div>
              </div>
              <div class="form-row">
                <div class="field-group">
                  <label>Data Type <span class="required">*</span></label>
                  <select formControlName="dataType" class="input">
                    <option value="string">String (text)</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean (checkbox)</option>
                    <option value="date">Date</option>
                    <option value="enum">Enum (dropdown)</option>
                  </select>
                </div>
                <div class="field-group">
                  <label>Display Order</label>
                  <input type="number" formControlName="displayOrder" class="input" />
                </div>
              </div>

              @if (form.value.dataType === 'enum') {
                <div class="field-group">
                  <label>Enum Options (JSON)</label>
                  <textarea formControlName="optionsJson" class="input textarea" rows="3"
                    placeholder='[{"value":"home","label":"Home"}, {"value":"auto","label":"Auto"}]'>
                  </textarea>
                  <span class="hint">Array of {{'{'}}value, label{{'}'}} objects</span>
                </div>
              }

              <div class="field-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="isRequired" />
                  Required field
                </label>
              </div>

              <div class="dialog-footer">
                <button type="button" class="btn btn-outline" (click)="closeDialog()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
                  {{ saving() ? 'Saving…' : 'Save Field' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./field-manager.component.scss']
})
export class FieldManagerComponent implements OnInit {
  private readonly api = inject(EntityApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  entityId = '';
  entity = signal<MetaEntity | null>(null);
  fields = signal<MetaField[]>([]);
  loading = signal(true);
  saving = signal(false);
  dialogOpen = signal(false);
  editingField = signal<MetaField | null>(null);

  form = this.fb.group({
    name: ['', Validators.required],
    label: ['', Validators.required],
    dataType: ['string' as DataType, Validators.required],
    isRequired: [false],
    displayOrder: [0],
    optionsJson: [''],
    defaultValue: ['']
  });

  ngOnInit(): void {
    this.entityId = this.route.snapshot.paramMap.get('entityId') ?? '';
    this.api.getEntity(this.entityId).subscribe(e => this.entity.set(e));
    this.loadFields();
  }

  loadFields(): void {
    this.loading.set(true);
    this.api.listFields(this.entityId).subscribe({
      next: (data) => { this.fields.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate(): void {
    this.editingField.set(null);
    this.form.reset({ dataType: 'string', isRequired: false, displayOrder: this.fields().length });
    this.dialogOpen.set(true);
  }

  openEdit(field: MetaField): void {
    this.editingField.set(field);
    this.form.patchValue({ ...field });
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
    this.editingField.set(null);
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const payload: Partial<MetaField> = {
      name: this.form.value.name!,
      label: this.form.value.label!,
      dataType: this.form.value.dataType as DataType,
      isRequired: !!this.form.value.isRequired,
      displayOrder: this.form.value.displayOrder ?? 0,
      optionsJson: this.form.value.optionsJson || undefined,
      defaultValue: this.form.value.defaultValue || undefined
    };
    const op = this.editingField()
      ? this.api.updateField(this.entityId, this.editingField()!.fieldId, payload)
      : this.api.createField(this.entityId, payload);

    op.subscribe({
      next: () => { this.saving.set(false); this.closeDialog(); this.loadFields(); },
      error: () => this.saving.set(false)
    });
  }

  confirmDelete(field: MetaField): void {
    if (!confirm(`Delete field "${field.name}"?`)) return;
    this.api.deleteField(this.entityId, field.fieldId).subscribe(() => this.loadFields());
  }
}
