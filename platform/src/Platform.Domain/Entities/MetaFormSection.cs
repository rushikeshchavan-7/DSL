namespace Platform.Domain.Entities;

/// <summary>Visual grouping of fields within a form (e.g. "Applicant Info").</summary>
public sealed class MetaFormSection
{
    public Guid   SectionId    { get; set; }
    public Guid   FormId       { get; set; }
    public string Title        { get; set; } = string.Empty;
    public int    DisplayOrder { get; set; }
    public int    Columns      { get; set; } = 1;   // 1 or 2
    public DateTime CreatedAt  { get; set; }
    public DateTime UpdatedAt  { get; set; }

    public MetaForm                  Form   { get; set; } = null!;
    public ICollection<MetaFormField> Fields { get; set; } = [];
}
