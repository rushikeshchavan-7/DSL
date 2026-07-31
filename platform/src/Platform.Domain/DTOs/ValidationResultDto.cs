namespace Platform.Domain.DTOs;

/// <summary>Structured validation result returned by ValidatorService and the runtime API.</summary>
public sealed class ValidationResultDto
{
    public bool IsValid { get; init; }
    public IReadOnlyList<FieldErrorDto> Errors { get; init; } = [];

    public static ValidationResultDto Success() =>
        new() { IsValid = true };

    public static ValidationResultDto Failure(IReadOnlyList<FieldErrorDto> errors) =>
        new() { IsValid = false, Errors = errors };
}

public sealed class FieldErrorDto
{
    /// <summary>Machine name of the field (matches FormFieldSchemaDto.Name).</summary>
    public string FieldName    { get; init; } = string.Empty;
    public string ErrorMessage { get; init; } = string.Empty;
    public string RuleType     { get; init; } = string.Empty;
}
