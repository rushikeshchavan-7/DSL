import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PLATFORM_CONFIG } from './platform.config';

export interface FormSchema {
  formId: string;
  entityId: string;
  formName: string;
  entityName: string;
  sections: FormSection[];
  unassignedFields: FormFieldSchema[];
}

export interface FormSection {
  sectionId: string;
  title: string;
  displayOrder: number;
  columns: 1 | 2;
  fields: FormFieldSchema[];
}

export interface FormFieldSchema {
  formFieldId: string;
  fieldId: string;
  name: string;
  label: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  isRequired: boolean;
  isVisible: boolean;
  isReadonly: boolean;
  displayOrder: number;
  colSpan: number;
  placeholder?: string;
  defaultValue?: string;
  options: EnumOption[];
  validations: ValidationRule[];
}

export interface EnumOption { value: string; label: string; }
export interface ValidationRule {
  validationId: string;
  ruleType: string;
  ruleValue: string | null;
  errorMessage: string;
}
export interface ValidationResult {
  isValid: boolean;
  errors: FieldError[];
}
export interface FieldError {
  fieldName: string;
  errorMessage: string;
  ruleType: string;
}

/**
 * Thin HTTP client wrapping all Platform API calls.
 * This is the only API surface a host Angular app needs to interact with.
 */
@Injectable()
export class PlatformClientService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PLATFORM_CONFIG);

  private headers(): HttpHeaders {
    return new HttpHeaders({ 'X-Tenant-Id': this.config.tenantId });
  }

  getFormSchema(formId: string): Observable<FormSchema> {
    return this.http.get<FormSchema>(
      `${this.config.apiUrl}/api/runtime/forms/${formId}/schema`,
      { headers: this.headers() }
    );
  }

  validateForm(formId: string, data: Record<string, unknown>): Observable<ValidationResult> {
    return this.http.post<ValidationResult>(
      `${this.config.apiUrl}/api/runtime/forms/${formId}/validate`,
      { data },
      { headers: this.headers() }
    );
  }
}
