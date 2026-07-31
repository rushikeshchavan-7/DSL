using Platform.Domain.Enums;

namespace Platform.Domain.DTOs;

/// <summary>
/// Self-contained JSON schema returned by the Form Renderer to Angular.
/// Angular renders from this DTO — no further DB calls needed.
/// </summary>
public sealed class FormSchemaDto
{
    public Guid   FormId    { get; init; }
    public Guid   EntityId  { get; init; }
    public string FormName  { get; init; } = string.Empty;
    public string EntityName { get; init; } = string.Empty;

    public IReadOnlyList<FormSectionDto> Sections { get; init; } = [];
    /// <summary>Fields not assigned to any section.</summary>
    public IReadOnlyList<FormFieldSchemaDto> UnassignedFields { get; init; } = [];
}

public sealed class FormSectionDto
{
    public Guid   SectionId    { get; init; }
    public string Title        { get; init; } = string.Empty;
    public int    DisplayOrder { get; init; }
    public int    Columns      { get; init; } = 1;
    public IReadOnlyList<FormFieldSchemaDto> Fields { get; init; } = [];
}

public sealed class FormFieldSchemaDto
{
    public Guid          FormFieldId   { get; init; }
    public Guid          FieldId       { get; init; }
    public string        Name          { get; init; } = string.Empty;   // machine name
    public string        Label         { get; init; } = string.Empty;
    public FieldDataType DataType      { get; init; }
    public bool          IsRequired    { get; init; }
    public bool          IsVisible     { get; init; } = true;
    public bool          IsReadonly    { get; init; }
    public int           DisplayOrder  { get; init; }
    public int           ColSpan       { get; init; } = 1;
    public string?       Placeholder   { get; init; }
    public string?       DefaultValue  { get; init; }

    /// <summary>Enum options. Populated only when DataType == Enum.</summary>
    public IReadOnlyList<EnumOptionDto> Options { get; init; } = [];

    /// <summary>Validation rules for this field in this form, ordered by DisplayOrder.</summary>
    public IReadOnlyList<ValidationRuleDto> Validations { get; init; } = [];
}

public sealed class EnumOptionDto
{
    public string Value { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
}

public sealed class ValidationRuleDto
{
    public Guid           ValidationId { get; init; }
    public ValidationType RuleType     { get; init; }
    public string?        RuleValue    { get; init; }
    public string         ErrorMessage { get; init; } = string.Empty;
}
