import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TenantService } from './tenant.service';
import { MetaForm, MetaFormSection, MetaFormField, MetaValidation, FormSchema, ValidationResult } from '../models/api.models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FormApiService {
  private readonly http = inject(HttpClient);
  private readonly tenantSvc = inject(TenantService);
  private readonly base = `${environment.apiUrl}/api/forms`;
  private readonly runtimeBase = `${environment.apiUrl}/api/runtime`;

  private headers(): HttpHeaders {
    return new HttpHeaders({ 'X-Tenant-Id': this.tenantSvc.tenantId });
  }

  // ── Forms ──────────────────────────────────────────────────────────────────

  listForms(entityId?: string): Observable<MetaForm[]> {
    const params = entityId ? `?entityId=${entityId}` : '';
    return this.http.get<MetaForm[]>(`${this.base}${params}`, { headers: this.headers() });
  }

  getForm(id: string): Observable<MetaForm> {
    return this.http.get<MetaForm>(`${this.base}/${id}`, { headers: this.headers() });
  }

  createForm(payload: { entityId: string; name: string; description?: string }): Observable<MetaForm> {
    return this.http.post<MetaForm>(this.base, payload, { headers: this.headers() });
  }

  updateForm(id: string, payload: Partial<MetaForm>): Observable<MetaForm> {
    return this.http.put<MetaForm>(`${this.base}/${id}`, payload, { headers: this.headers() });
  }

  deleteForm(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`, { headers: this.headers() });
  }

  // ── Sections ───────────────────────────────────────────────────────────────

  listSections(formId: string): Observable<MetaFormSection[]> {
    return this.http.get<MetaFormSection[]>(`${this.base}/${formId}/sections`, { headers: this.headers() });
  }

  createSection(formId: string, payload: Partial<MetaFormSection>): Observable<MetaFormSection> {
    return this.http.post<MetaFormSection>(`${this.base}/${formId}/sections`, payload, { headers: this.headers() });
  }

  updateSection(formId: string, sectionId: string, payload: Partial<MetaFormSection>): Observable<MetaFormSection> {
    return this.http.put<MetaFormSection>(`${this.base}/${formId}/sections/${sectionId}`, payload, { headers: this.headers() });
  }

  deleteSection(formId: string, sectionId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${formId}/sections/${sectionId}`, { headers: this.headers() });
  }

  // ── Form Fields ────────────────────────────────────────────────────────────

  listFormFields(formId: string): Observable<MetaFormField[]> {
    return this.http.get<MetaFormField[]>(`${this.base}/${formId}/fields`, { headers: this.headers() });
  }

  addFormField(formId: string, payload: Partial<MetaFormField>): Observable<MetaFormField> {
    return this.http.post<MetaFormField>(`${this.base}/${formId}/fields`, payload, { headers: this.headers() });
  }

  removeFormField(formId: string, formFieldId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${formId}/fields/${formFieldId}`, { headers: this.headers() });
  }

  // ── Validations ────────────────────────────────────────────────────────────

  listValidations(formId: string): Observable<MetaValidation[]> {
    return this.http.get<MetaValidation[]>(`${this.base}/${formId}/validations`, { headers: this.headers() });
  }

  addValidation(formId: string, payload: Partial<MetaValidation>): Observable<MetaValidation> {
    return this.http.post<MetaValidation>(`${this.base}/${formId}/validations`, payload, { headers: this.headers() });
  }

  deleteValidation(formId: string, validationId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${formId}/validations/${validationId}`, { headers: this.headers() });
  }

  // ── Runtime (schema + validate) ────────────────────────────────────────────

  getFormSchema(formId: string): Observable<FormSchema> {
    return this.http.get<FormSchema>(`${this.runtimeBase}/forms/${formId}/schema`, { headers: this.headers() });
  }

  validateForm(formId: string, data: Record<string, unknown>): Observable<ValidationResult> {
    return this.http.post<ValidationResult>(
      `${this.runtimeBase}/forms/${formId}/validate`,
      { data },
      { headers: this.headers() }
    );
  }
}
