using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Platform.Domain.DTOs;
using Platform.Domain.Enums;
using Platform.Metadata;

namespace Platform.Engine.Validator;

/// <summary>
/// Server-side field validator.
/// Loads validation rules from metadata and evaluates them against submitted data.
/// Pure: no side effects, returns a structured <see cref="ValidationResultDto"/>.
/// </summary>
public sealed class ValidatorService(MetadataDbContext db)
{
    public async Task<ValidationResultDto> ValidateAsync(
        Guid formId,
        IReadOnlyDictionary<string, object?> data,
        CancellationToken ct = default)
    {
        // Load all validations for the form in one query, joining through the field name
        var rules = await db.Validations
            .AsNoTracking()
            .Where(v => v.FormId == formId)
            .Include(v => v.Field)
            .OrderBy(v => v.DisplayOrder)
            .ToListAsync(ct);

        var errors = new List<FieldErrorDto>();

        // Group by field so we can stop on first failure per field (optional — currently evaluates all)
        foreach (var rule in rules)
        {
            var fieldName = rule.Field.Name;
            data.TryGetValue(fieldName, out var rawValue);
            var error = EvaluateRule(rule.RuleType, rule.RuleValue, rawValue, fieldName, rule.ErrorMessage);
            if (error is not null)
                errors.Add(error);
        }

        return errors.Count == 0
            ? ValidationResultDto.Success()
            : ValidationResultDto.Failure(errors);
    }

    // ── Rule evaluators ──────────────────────────────────────────────────────

    private static FieldErrorDto? EvaluateRule(
        ValidationType type,
        string? ruleValue,
        object? fieldValue,
        string fieldName,
        string errorMessage)
    {
        return type switch
        {
            ValidationType.Required      => EvalRequired(fieldValue, fieldName, errorMessage),
            ValidationType.Min           => EvalNumeric(fieldValue, ruleValue, fieldName, errorMessage, isMin: true),
            ValidationType.Max           => EvalNumeric(fieldValue, ruleValue, fieldName, errorMessage, isMin: false),
            ValidationType.MinLength     => EvalLength(fieldValue, ruleValue, fieldName, errorMessage, isMin: true),
            ValidationType.MaxLength     => EvalLength(fieldValue, ruleValue, fieldName, errorMessage, isMin: false),
            ValidationType.Regex         => EvalRegex(fieldValue, ruleValue, fieldName, errorMessage),
            ValidationType.CustomExpression => null,   // Phase 2+
            _ => null
        };
    }

    private static FieldErrorDto? EvalRequired(object? value, string field, string msg) =>
        (value is null || (value is string s && string.IsNullOrWhiteSpace(s)))
            ? Err(field, msg, "required")
            : null;

    private static FieldErrorDto? EvalNumeric(object? value, string? limit, string field, string msg, bool isMin)
    {
        if (value is null) return null;
        if (!double.TryParse(value.ToString(), out var num)) return null;
        if (!double.TryParse(limit, out var bound)) return null;
        bool violated = isMin ? num < bound : num > bound;
        return violated ? Err(field, msg, isMin ? "min" : "max") : null;
    }

    private static FieldErrorDto? EvalLength(object? value, string? limit, string field, string msg, bool isMin)
    {
        var str = value?.ToString() ?? string.Empty;
        if (!int.TryParse(limit, out var bound)) return null;
        bool violated = isMin ? str.Length < bound : str.Length > bound;
        return violated ? Err(field, msg, isMin ? "min_length" : "max_length") : null;
    }

    private static FieldErrorDto? EvalRegex(object? value, string? pattern, string field, string msg)
    {
        if (string.IsNullOrWhiteSpace(pattern) || value is null) return null;
        var str = value.ToString() ?? string.Empty;
        bool matches = Regex.IsMatch(str, pattern, RegexOptions.ECMAScript | RegexOptions.None);
        return matches ? null : Err(field, msg, "regex");
    }

    private static FieldErrorDto Err(string field, string msg, string type) =>
        new() { FieldName = field, ErrorMessage = msg, RuleType = type };
}
