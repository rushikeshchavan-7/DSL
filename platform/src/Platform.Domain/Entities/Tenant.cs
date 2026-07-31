namespace Platform.Domain.Entities;

/// <summary>Represents a tenant (isolated namespace) in the metadata platform.</summary>
public sealed class Tenant
{
    public Guid   TenantId  { get; set; }
    public string Name      { get; set; } = string.Empty;
    public string Slug      { get; set; } = string.Empty;
    public bool   IsActive  { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<MetaEntity> Entities { get; set; } = [];
}
