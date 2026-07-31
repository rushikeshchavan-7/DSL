namespace Platform.Domain.Enums;

/// <summary>
/// Supported data types for metadata fields.
/// Must stay in sync with the CHECK constraint in 001_core.sql.
/// </summary>
public enum FieldDataType
{
    String,
    Number,
    Boolean,
    Date,
    Enum
}
