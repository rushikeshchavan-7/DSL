import {
  Component, Input, Output, EventEmitter, OnInit, OnChanges,
  SimpleChanges, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { PlatformClientService, FormSchema, FormFieldSchema, FieldError } from './platform-client.service';

/**
 * DynamicFormComponent — the core runtime-lib component.
 *
 * Usage in host apps:
 *   <plat-dynamic-form [formId]="id" (submitted)="onSubmit($event)">
 *   </plat-dynamic-form>
 *
 * Fetches the schema once on init, builds a reactive FormGroup at runtime,
 * validates on submit via the server-side Validator endpoint.
 */
@Component({
  selector: 'plat-dynamic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (loading()) {
      <div class="plat-loading">Loading form…</div>
    } @else if (error()) {
      <div class="plat-error">{{ error() }}</div>
    } @else if (schema()) {
      <form [formGroup]="formGroup" (ngSubmit)="submit()" class="plat-form" novalidate>
        <div class="plat-form-title">{{ schema()!.formName }}</div>

        <!-- Sections -->
        @for (section of schema()!.sections; track section.sectionId) {
          <fieldset class="plat-section">
            <legend class="plat-section-title">{{ section.title }}</legend>
            <div class="plat-section-grid" [class.cols-2]="section.columns === 2">
              @for (field of section.fields; track field.fieldId) {
                @if (field.isVisible) {
                  <div class="plat-field" [class.span-2]="field.colSpan === 2 && section.columns === 2">
                    <ng-container *ngTemplateOutlet="fieldTpl; context: { field: field }"></ng-container>
                  </div>
                }
              }
            </div>
          </fieldset>
        }

        <!-- Unassigned fields -->
        @if (schema()!.unassignedFields.length > 0) {
          <div class="plat-section-grid">
            @for (field of schema()!.unassignedFields; track field.fieldId) {
              @if (field.isVisible) {
                <div class="plat-field">
                  <ng-container *ngTemplateOutlet="fieldTpl; context: { field: field }"></ng-container>
                </div>
              }
            }
          </div>
        }

        <!-- Submit -->
        <div class="plat-form-footer">
          <button type="submit" class="plat-btn-submit" [disabled]="submitting()">
            {{ submitting() ? 'Submitting…' : submitLabel }}
          </button>
        </div>

        @if (!result()?.isValid && result() !== null) {
          <div class="plat-form-summary-error">
            Please fix {{ result()!.errors.length }} error(s) before continuing.
          </div>
        }
      </form>

      <!-- Field template -->
      <ng-template #fieldTpl let-field="field">
        <label class="plat-label">
          {{ field.label }}
          @if (field.isRequired) { <span class="plat-required">*</span> }
        </label>

        @switch (field.dataType) {
          @case ('boolean') {
            <label class="plat-checkbox-label">
              <input type="checkbox" [formControlName]="field.name" />
              {{ field.placeholder || field.label }}
            </label>
          }
          @case ('enum') {
            <select [formControlName]="field.name" class="plat-input"
                    [class.plat-readonly]="field.isReadonly">
              <option value="">{{ field.placeholder || 'Select…' }}</option>
              @for (opt of field.options; track opt.value) {
                <option [value]="opt.value">{{ opt.label }}</option>
              }
            </select>
          }
          @case ('date') {
            <input type="date" [formControlName]="field.name" class="plat-input"
                   [placeholder]="field.placeholder || ''"
                   [readOnly]="field.isReadonly" />
          }
          @case ('number') {
            <input type="number" [formControlName]="field.name" class="plat-input"
                   [placeholder]="field.placeholder || ''"
                   [readOnly]="field.isReadonly" />
          }
          @default {
            <input type="text" [formControlName]="field.name" class="plat-input"
                   [placeholder]="field.placeholder || ''"
                   [readOnly]="field.isReadonly" />
          }
        }

        @if (getError(field.name); as err) {
          <span class="plat-error-msg">{{ err }}</span>
        }
      </ng-template>
    }
  `,
  styles: [`
    .plat-form { font-family: system-ui, sans-serif; }
    .plat-form-title { font-size: 1.2rem; font-weight: 600; margin-bottom: 1.5rem; }
    .plat-section { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.25rem; }
    .plat-section-title { font-size: 0.9rem; font-weight: 600; color: #4a5568; padding: 0 0.5rem; }
    .plat-section-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
    .plat-section-grid.cols-2 { grid-template-columns: 1fr 1fr; }
    .span-2 { grid-column: span 2; }
    .plat-field { display: flex; flex-direction: column; gap: 0.35rem; }
    .plat-label { font-size: 0.875rem; font-weight: 500; color: #374151; }
    .plat-required { color: #ef4444; margin-left: 2px; }
    .plat-input {
      width: 100%; padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db; border-radius: 6px;
      font-size: 0.9rem; transition: border-color 0.15s;
      &:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
    }
    .plat-error-msg { font-size: 0.8rem; color: #ef4444; }
    .plat-checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer; }
    .plat-btn-submit {
      padding: 0.6rem 1.5rem; background: #6366f1; color: #fff;
      border: none; border-radius: 6px; font-size: 0.9rem; font-weight: 500; cursor: pointer;
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .plat-form-footer { display: flex; justify-content: flex-end; margin-top: 1.5rem; }
    .plat-form-summary-error { color: #ef4444; font-size: 0.85rem; text-align: right; margin-top: 0.5rem; }
    .plat-loading, .plat-error { padding: 2rem; text-align: center; color: #6b7280; }
    .plat-error { color: #ef4444; }
    .plat-readonly { background: #f9fafb; cursor: not-allowed; }
  `]
})
export class DynamicFormComponent implements OnInit, OnChanges {
  @Input({ required: true }) formId!: string;
  @Input() submitLabel = 'Submit';

  /** Emits the raw form data when server validation passes */
  @Output() submitted = new EventEmitter<Record<string, unknown>>();
  /** Emits on server validation failure with the error list */
  @Output() validationFailed = new EventEmitter<FieldError[]>();

  private readonly client = inject(PlatformClientService);
  private readonly fb = inject(FormBuilder);

  schema = signal<FormSchema | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  submitting = signal(false);
  result = signal<{ isValid: boolean; errors: FieldError[] } | null>(null);

  formGroup: FormGroup = this.fb.group({});
  private fieldErrors = signal<Record<string, string>>({});

  ngOnInit(): void { this.loadSchema(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formId'] && !changes['formId'].firstChange) {
      this.loadSchema();
    }
  }

  private loadSchema(): void {
    this.loading.set(true);
    this.error.set(null);
    this.client.getFormSchema(this.formId).subscribe({
      next: (s) => {
        this.schema.set(s);
        this.buildFormGroup(s);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load form. Please try again.');
        this.loading.set(false);
      }
    });
  }

  private buildFormGroup(schema: FormSchema): void {
    const allFields = [
      ...schema.sections.flatMap(s => s.fields),
      ...schema.unassignedFields
    ];

    const controls: Record<string, AbstractControl> = {};
    for (const field of allFields) {
      const validators = [];
      if (field.isRequired) validators.push(Validators.required);
      // Add Angular client-side validators mirroring server rules
      for (const rule of field.validations) {
        if (rule.ruleType === 'min' && rule.ruleValue)
          validators.push(Validators.min(Number(rule.ruleValue)));
        if (rule.ruleType === 'max' && rule.ruleValue)
          validators.push(Validators.max(Number(rule.ruleValue)));
        if (rule.ruleType === 'min_length' && rule.ruleValue)
          validators.push(Validators.minLength(Number(rule.ruleValue)));
        if (rule.ruleType === 'max_length' && rule.ruleValue)
          validators.push(Validators.maxLength(Number(rule.ruleValue)));
        if (rule.ruleType === 'regex' && rule.ruleValue)
          validators.push(Validators.pattern(rule.ruleValue));
      }
      controls[field.name] = this.fb.control(field.defaultValue ?? null, validators);
    }
    this.formGroup = this.fb.group(controls);
  }

  submit(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.invalid) return;

    this.submitting.set(true);
    const data = this.formGroup.value as Record<string, unknown>;

    this.client.validateForm(this.formId, data).subscribe({
      next: (res) => {
        this.result.set(res);
        this.submitting.set(false);
        if (res.isValid) {
          this.fieldErrors.set({});
          this.submitted.emit(data);
        } else {
          const errs: Record<string, string> = {};
          res.errors.forEach(e => errs[e.fieldName] = e.errorMessage);
          this.fieldErrors.set(errs);
          this.validationFailed.emit(res.errors);
        }
      },
      error: () => this.submitting.set(false)
    });
  }

  getError(fieldName: string): string | null {
    // Server errors take priority; fall back to Angular client-side errors
    const serverErr = this.fieldErrors()[fieldName];
    if (serverErr) return serverErr;
    const ctrl = this.formGroup.get(fieldName);
    if (!ctrl || !ctrl.invalid || !ctrl.touched) return null;
    if (ctrl.errors?.['required']) return 'This field is required.';
    if (ctrl.errors?.['min'])      return `Minimum value is ${ctrl.errors['min'].min}.`;
    if (ctrl.errors?.['max'])      return `Maximum value is ${ctrl.errors['max'].max}.`;
    if (ctrl.errors?.['minlength']) return `Minimum length is ${ctrl.errors['minlength'].requiredLength}.`;
    if (ctrl.errors?.['maxlength']) return `Maximum length is ${ctrl.errors['maxlength'].requiredLength}.`;
    if (ctrl.errors?.['pattern'])  return 'Invalid format.';
    return 'Invalid value.';
  }
}
