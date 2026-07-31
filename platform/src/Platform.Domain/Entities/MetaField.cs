using Platform.Domain.Enums;

namespace Platform.Domain.Entities;

/// <summary>
/// A typed column belonging to a <see cref="MetaEntity"/>.
/// </summary>
public sealed class MetaField
{
    public Guid          FieldId      { get; set; }
    public Guid          EntityId     { get; set; }
    public string        Name         { get; set; } = string.Empty;   // machine name
    public string        Label        { get; set; } = string.Empty;   // display label
    public FieldDataType DataType     { get; set; }
    public bool          IsRequired   { get; set; }
    public int           DisplayOrder { get; set; }

    /// <summary>
    /// For Enum fields: JSON array of {value, label} objects.
    /// Stored as JSONB in Postgres, serialised/deserialised by EF.
    /// </summary>
    public string? OptionsJson   { get; set; }
    public string? DefaultValue  { get; set; }
    public DateTime CreatedAt    { get; set; }
    public DateTime UpdatedAt    { get; set; }

    public MetaEntity                Entity      { get; set; } = null!;
    public ICollection<MetaFormField> FormFields  { get; set; } = [];
    public ICollection<MetaValidation> Validations { get; set; } = [];
}
