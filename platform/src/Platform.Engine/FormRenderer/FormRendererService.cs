using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Platform.Domain.DTOs;
using Platform.Domain.Enums;
using Platform.Metadata;

namespace Platform.Engine.FormRenderer;

/// <summary>
/// Builds a self-contained <see cref="FormSchemaDto"/> from metadata, with short-lived caching.
/// This is the hot path: called once per form load by the Angular runtime-lib.
/// </summary>
public sealed class FormRendererService(
    MetadataDbContext db,
    IMemoryCache cache)
{
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    public async Task<FormSchemaDto?> GetFormSchemaAsync(
        Guid formId,
        CancellationToken ct = default)
    {
        var cacheKey = $"form_schema:{formId}";
        if (cache.TryGetValue(cacheKey, out FormSchemaDto? cached))
            return cached;

        var form = await db.Forms
            .AsNoTracking()
            .Include(f => f.Entity)
            .Include(f => f.Sections.OrderBy(s => s.DisplayOrder))
            .Include(f => f.Fields.OrderBy(ff => ff.DisplayOrder))
                .ThenInclude(ff => ff.Field)
            .Include(f => f.Validations.OrderBy(v => v.DisplayOrder))
            .FirstOrDefaultAsync(f => f.FormId == formId, ct);

        if (form is null) return null;

        var schema = MapToSchema(form);

        cache.Set(cacheKey, schema, CacheTtl);
        return schema;
    }

    /// <summary>Invalidate cached schema when the form is saved in Studio.</summary>
    public void InvalidateCache(Guid formId) =>
        cache.Remove($"form_schema:{formId}");

    // ── Mapping ──────────────────────────────────────────────────────────────

    private static FormSchemaDto MapToSchema(Domain.Entities.MetaForm form)
    {
        // Group form-fields by section
        var bySectionId = form.Fields
            .Where(ff => ff.SectionId is not null)
            .GroupBy(ff => ff.SectionId!.Value)
            .ToDictionary(g => g.Key, g => g.OrderBy(ff => ff.DisplayOrder).ToList());

        var validationsByFieldId = form.Validations
            .GroupBy(v => v.FieldId)
            .ToDictionary(g => g.Key, g => g.OrderBy(v => v.DisplayOrder).ToList());

        var sections = form.Sections.Select(s => new FormSectionDto
        {
            SectionId    = s.SectionId,
            Title        = s.Title,
            DisplayOrder = s.DisplayOrder,
            Columns      = s.Columns,
            Fields       = bySectionId.TryGetValue(s.SectionId, out var sFields)
                ? sFields.Select(ff => MapField(ff, validationsByFieldId)).ToList()
                : []
        }).ToList();

        var unassigned = form.Fields
            .Where(ff => ff.SectionId is null)
            .Select(ff => MapField(ff, validationsByFieldId))
            .ToList();

        return new FormSchemaDto
        {
            FormId           = form.FormId,
            EntityId         = form.EntityId,
            FormName         = form.Name,
            EntityName       = form.Entity.Name,
            Sections         = sections,
            UnassignedFields = unassigned
        };
    }

    private static FormFieldSchemaDto MapField(
        Domain.Entities.MetaFormField ff,
        Dictionary<Guid, List<Domain.Entities.MetaValidation>> validationsByFieldId)
    {
        var field   = ff.Field;
        var options = ParseOptions(field.OptionsJson);
        var rules   = validationsByFieldId.TryGetValue(field.FieldId, out var vRules)
            ? vRules.Select(v => new ValidationRuleDto
            {
                ValidationId = v.ValidationId,
                RuleType     = v.RuleType,
                RuleValue    = v.RuleValue,
                ErrorMessage = v.ErrorMessage
            }).ToList()
            : (IReadOnlyList<ValidationRuleDto>)[];

        return new FormFieldSchemaDto
        {
            FormFieldId  = ff.FormFieldId,
            FieldId      = field.FieldId,
            Name         = field.Name,
            Label        = ff.LabelOverride ?? field.Label,
            DataType     = field.DataType,
            IsRequired   = field.IsRequired,
            IsVisible    = ff.IsVisible,
            IsReadonly   = ff.IsReadonly,
            DisplayOrder = ff.DisplayOrder,
            ColSpan      = ff.ColSpan,
            Placeholder  = ff.Placeholder,
            DefaultValue = field.DefaultValue,
            Options      = options,
            Validations  = rules
        };
    }

    private static IReadOnlyList<EnumOptionDto> ParseOptions(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<List<EnumOptionDto>>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];
        }
        catch { return []; }
    }
}
