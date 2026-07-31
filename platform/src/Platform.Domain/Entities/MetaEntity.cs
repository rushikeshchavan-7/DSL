namespace Platform.Domain.Entities;

/// <summary>
/// A logical data object defined in the Studio (e.g. "LoanApplication").
/// Every form, rule, and workflow is anchored to an entity.
/// </summary>
public sealed class MetaEntity
{
    public Guid   EntityId    { get; set; }
    public Guid   TenantId    { get; set; }
    public string Name        { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? PluralName  { get; set; }
    public DateTime CreatedAt  { get; set; }
    public DateTime UpdatedAt  { get; set; }

    public Tenant              Tenant { get; set; } = null!;
    public ICollection<MetaField> Fields  { get; set; } = [];
    public ICollection<MetaForm>  Forms   { get; set; } = [];
}
