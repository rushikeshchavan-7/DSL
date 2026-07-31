import {
  Component, OnInit, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormApiService } from '../../services/form-api.service';
import { EntityApiService } from '../../services/entity-api.service';
import {
  MetaForm, MetaEntity, MetaField, MetaFormField, MetaFormSection,
  MetaValidation, FormSchema
} from '../../models/api.models';
import { DynamicFormComponent } from 'runtime-lib';

@Component({
  selector: 'app-form-designer',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, ReactiveFormsModule,
    CdkDrag, CdkDropList, DynamicFormComponent
  ],
  templateUrl: './form-designer.component.html',
  styleUrls: ['./form-designer.component.scss']
})
export class FormDesignerComponent implements OnInit {
  private readonly formApi = inject(FormApiService);
  private readonly entityApi = inject(EntityApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  formId = '';
  form = signal<MetaForm | null>(null);
  entity = signal<MetaEntity | null>(null);
  availableFields = signal<MetaField[]>([]);   // fields not yet placed
  sections = signal<MetaFormSection[]>([]);
  placedFields = signal<MetaFormField[]>([]);
  validations = signal<MetaValidation[]>([]);

  selectedField = signal<MetaFormField | null>(null);
  previewMode = signal(false);
  saving = signal(false);
  loading = signal(true);

  // Section dialog
  sectionDialogOpen = signal(false);
  sectionForm = this.fb.group({
    title: ['', Validators.required],
    columns: [1]
  });

  // Validation dialog
  validationDialogOpen = signal(false);
  validationForm = this.fb.group({
    ruleType: ['required', Validators.required],
    ruleValue: [''],
    errorMessage: ['', Validators.required]
  });

  ngOnInit(): void {
    this.formId = this.route.snapshot.paramMap.get('formId') ?? '';
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.formApi.getForm(this.formId).subscribe(f => {
      this.form.set(f);
      this.entityApi.getEntity(f.entityId).subscribe(e => {
        this.entity.set(e);
        this.loadFields(f.entityId);
      });
    });
    this.formApi.listSections(this.formId).subscribe(s => this.sections.set(s));
    this.formApi.listFormFields(this.formId).subscribe(ff => {
      this.placedFields.set(ff);
      this.loading.set(false);
    });
    this.formApi.listValidations(this.formId).subscribe(v => this.validations.set(v));
  }

  loadFields(entityId: string): void {
    this.entityApi.listFields(entityId).subscribe(allFields => {
      const placedIds = new Set(this.placedFields().map(pf => pf.fieldId));
      this.availableFields.set(allFields.filter(f => !placedIds.has(f.fieldId)));
    });
  }

  // ── Drag & Drop ─────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dropOnCanvas(event: any): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(this.availableFields(), event.previousIndex, event.currentIndex);
    } else {
      const field = event.previousContainer.data[event.previousIndex];
      this.placeField(field, null, this.placedFields().length);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dropOnSection(event: any, sectionId: string): void {
    const field = event.previousContainer.data[event.previousIndex];
    this.placeField(field, sectionId, event.currentIndex);
  }

  placeField(field: MetaField, sectionId: string | null, order: number): void {
    this.formApi.addFormField(this.formId, {
      fieldId: field.fieldId,
      sectionId: sectionId ?? undefined,
      displayOrder: order,
      isVisible: true,
      isReadonly: false,
      colSpan: 1
    }).subscribe(() => this.loadAll());
  }

  removeField(ff: MetaFormField): void {
    this.formApi.removeFormField(this.formId, ff.formFieldId).subscribe(() => {
      if (this.selectedField()?.formFieldId === ff.formFieldId) {
        this.selectedField.set(null);
      }
      this.loadAll();
    });
  }

  // ── Sections ────────────────────────────────────────────────────────────────

  openAddSection(): void { this.sectionForm.reset({ title: '', columns: 1 }); this.sectionDialogOpen.set(true); }
  closeSectionDialog(): void { this.sectionDialogOpen.set(false); }

  saveSection(): void {
    if (this.sectionForm.invalid) return;
    this.formApi.createSection(this.formId, {
      title: this.sectionForm.value.title!,
      columns: Number(this.sectionForm.value.columns) as 1 | 2,
      displayOrder: this.sections().length
    }).subscribe(() => { this.closeSectionDialog(); this.loadAll(); });
  }

  deleteSection(section: MetaFormSection): void {
    if (!confirm(`Delete section "${section.title}"?`)) return;
    this.formApi.deleteSection(this.formId, section.sectionId).subscribe(() => this.loadAll());
  }

  // ── Field selection / property panel ────────────────────────────────────────

  selectField(ff: MetaFormField): void { this.selectedField.set(ff); }

  fieldValidations(fieldId: string): MetaValidation[] {
    return this.validations().filter(v => v.fieldId === fieldId);
  }

  openAddValidation(): void {
    this.validationForm.reset({ ruleType: 'required', errorMessage: '' });
    this.validationDialogOpen.set(true);
  }
  closeValidationDialog(): void { this.validationDialogOpen.set(false); }

  saveValidation(): void {
    if (!this.selectedField() || this.validationForm.invalid) return;
    this.formApi.addValidation(this.formId, {
      fieldId: this.selectedField()!.fieldId,
      ruleType: this.validationForm.value.ruleType!,
      ruleValue: this.validationForm.value.ruleValue || undefined,
      errorMessage: this.validationForm.value.errorMessage!,
      displayOrder: this.fieldValidations(this.selectedField()!.fieldId).length
    }).subscribe(() => { this.closeValidationDialog(); this.loadAll(); });
  }

  deleteValidation(v: MetaValidation): void {
    this.formApi.deleteValidation(this.formId, v.validationId).subscribe(() => this.loadAll());
  }

  // ── Preview ─────────────────────────────────────────────────────────────────

  togglePreview(): void { this.previewMode.update(v => !v); }

  getFieldLabel(fieldId: string): string {
    return this.entity()?.name ?? '';
  }

  getPlacedFieldsForSection(sectionId: string): MetaFormField[] {
    return this.placedFields().filter(ff => ff.sectionId === sectionId);
  }

  getUnassignedFields(): MetaFormField[] {
    return this.placedFields().filter(ff => !ff.sectionId);
  }

  getFieldById(fieldId: string): MetaField | undefined {
    return [...this.availableFields(), ...this.placedFields()
      .map(ff => ({ fieldId: ff.fieldId } as MetaField))].find(f => f.fieldId === fieldId);
  }
}
