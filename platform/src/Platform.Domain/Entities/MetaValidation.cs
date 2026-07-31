using Platform.Domain.Enums;

namespace Platform.Domain.Entities;

/// <summary>A validation rule attached to a field within a specific form.</summary>
public sealed class MetaValidation
{
    public Guid           ValidationId { get; set; }
    public Guid           FieldId      { get; set; }
    public Guid           FormId       { get; set; }
    public ValidationType RuleType     { get; set; }
    public string?        RuleValue    { get; set; }   // e.g. "2" for MinLength
    public string         ErrorMessage { get; set; } = string.Empty;
    public int            DisplayOrder { get; set; }
    public DateTime       CreatedAt    { get; set; }
    public DateTime       UpdatedAt    { get; set; }

    public MetaField Field { get; set; } = null!;
    public MetaForm  Form  { get; set; } = null!;
}
