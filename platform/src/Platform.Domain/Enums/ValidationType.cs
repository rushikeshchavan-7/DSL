namespace Platform.Domain.Enums;

/// <summary>
/// Validation rule types.
/// Must stay in sync with the CHECK constraint in 005_validations.sql.
/// </summary>
public enum ValidationType
{
    Required,
    Min,
    Max,
    MinLength,
    MaxLength,
    Regex,
    CustomExpression
}
