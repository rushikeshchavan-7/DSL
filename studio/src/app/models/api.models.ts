// Barrel export for all API models shared between studio and runtime-lib
export interface FieldDataType {
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
}

export interface EnumOption {
  value: string;
  label: string;
}

export interface ValidationRule {
  validationId: string;
  ruleType: 'required' | 'min' | 'max' | 'min_length' | 'max_length' | 'regex' | 'custom_expression';
  ruleValue: string | null;
  errorMessage: string;
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

export interface FormSection {
  sectionId: string;
  title: string;
  displayOrder: number;
  columns: 1 | 2;
  fields: FormFieldSchema[];
}

export interface FormSchema {
  formId: string;
  entityId: string;
  formName: string;
  entityName: string;
  sections: FormSection[];
  unassignedFields: FormFieldSchema[];
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

// Studio models

export interface MetaTenant {
  tenantId: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface MetaEntity {
  entityId: string;
  tenantId: string;
  name: string;
  description?: string;
  pluralName?: string;
  createdAt: string;
}

export interface MetaField {
  fieldId: string;
  entityId: string;
  name: string;
  label: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  isRequired: boolean;
  displayOrder: number;
  optionsJson?: string;
  defaultValue?: string;
}

export interface MetaForm {
  formId: string;
  entityId: string;
  name: string;
  description?: string;
  version: number;
  isActive: boolean;
  createdAt: string;
}

export interface MetaFormSection {
  sectionId: string;
  formId: string;
  title: string;
  displayOrder: number;
  columns: 1 | 2;
}

export interface MetaFormField {
  formFieldId: string;
  formId: string;
  fieldId: string;
  sectionId?: string;
  displayOrder: number;
  labelOverride?: string;
  placeholder?: string;
  isVisible: boolean;
  isReadonly: boolean;
  colSpan: 1 | 2;
}

export interface MetaValidation {
  validationId: string;
  fieldId: string;
  formId: string;
  ruleType: string;
  ruleValue?: string;
  errorMessage: string;
  displayOrder: number;
}
