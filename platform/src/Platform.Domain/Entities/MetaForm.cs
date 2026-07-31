namespace Platform.Domain.Entities;

/// <summary>
/// A versioned UI form over a <see cref="MetaEntity"/>.
/// One entity can have multiple forms (e.g. "Create", "Edit", "Summary").
/// </summary>
public sealed class MetaForm
{
    public Guid   FormId      { get; set; }
    public Guid   EntityId    { get; set; }
    public string Name        { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int    Version     { get; set; } = 1;
    public bool   IsActive    { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public MetaEntity                  Entity   { get; set; } = null!;
    public ICollection<MetaFormSection> Sections { get; set; } = [];
    public ICollection<MetaFormField>   Fields   { get; set; } = [];
    public ICollection<MetaValidation>  Validations { get; set; } = [];
}
