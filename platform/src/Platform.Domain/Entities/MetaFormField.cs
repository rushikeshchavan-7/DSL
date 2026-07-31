namespace Platform.Domain.Entities;

/// <summary>Placement of a field onto a specific form, with display overrides.</summary>
public sealed class MetaFormField
{
    public Guid   FormFieldId   { get; set; }
    public Guid   FormId        { get; set; }
    public Guid   FieldId       { get; set; }
    public Guid?  SectionId     { get; set; }
    public int    DisplayOrder  { get; set; }
    public string? LabelOverride { get; set; }
    public string? Placeholder   { get; set; }
    public bool   IsVisible     { get; set; } = true;
    public bool   IsReadonly    { get; set; }
    public int    ColSpan       { get; set; } = 1;
    public DateTime CreatedAt   { get; set; }
    public DateTime UpdatedAt   { get; set; }

    public MetaForm        Form    { get; set; } = null!;
    public MetaField       Field   { get; set; } = null!;
    public MetaFormSection? Section { get; set; }
}
