using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Platform.Domain.Entities;
using Platform.Domain.Enums;
using Platform.Engine.FormRenderer;
using Platform.Metadata;

namespace Platform.Api.Controllers;

// ── Request models ────────────────────────────────────────────────────────────

public record CreateFormRequest(Guid EntityId, string Name, string? Description);
public record UpdateFormRequest(string Name, string? Description, bool IsActive);

public record CreateSectionRequest(string Title, int DisplayOrder, int Columns = 1);
public record UpdateSectionRequest(string Title, int DisplayOrder, int Columns);

public record CreateFormFieldRequest(
    Guid FieldId,
    Guid? SectionId,
    int DisplayOrder,
    string? LabelOverride,
    string? Placeholder,
    bool IsVisible = true,
    bool IsReadonly = false,
    int ColSpan = 1);

public record CreateValidationRequest(
    Guid FieldId,
    ValidationType RuleType,
    string? RuleValue,
    string ErrorMessage,
    int DisplayOrder = 0);

// ── Controller ────────────────────────────────────────────────────────────────

/// <summary>Studio CRUD for forms, sections, form-fields, and validation rules.</summary>
[ApiController]
[Route("api/[controller]")]
public sealed class FormsController(
    MetadataDbContext db,
    FormRendererService renderer) : ControllerBase
{
    // ── Forms ─────────────────────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? entityId, CancellationToken ct)
    {
        var q = db.Forms.AsNoTracking().AsQueryable();
        if (entityId.HasValue) q = q.Where(f => f.EntityId == entityId.Value);
        return Ok(await q.OrderBy(f => f.Name).ToListAsync(ct));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var form = await db.Forms.AsNoTracking()
            .Include(f => f.Sections.OrderBy(s => s.DisplayOrder))
            .Include(f => f.Fields.OrderBy(ff => ff.DisplayOrder))
            .Include(f => f.Validations)
            .FirstOrDefaultAsync(f => f.FormId == id, ct);
        return form is null ? NotFound() : Ok(form);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFormRequest req, CancellationToken ct)
    {
        var form = new MetaForm
        {
            FormId      = Guid.NewGuid(),
            EntityId    = req.EntityId,
            Name        = req.Name,
            Description = req.Description,
            CreatedAt   = DateTime.UtcNow,
            UpdatedAt   = DateTime.UtcNow
        };
        db.Forms.Add(form);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = form.FormId }, form);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateFormRequest req, CancellationToken ct)
    {
        var form = await db.Forms.FindAsync([id], ct);
        if (form is null) return NotFound();
        form.Name        = req.Name;
        form.Description = req.Description;
        form.IsActive    = req.IsActive;
        form.UpdatedAt   = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        renderer.InvalidateCache(id);
        return Ok(form);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var form = await db.Forms.FindAsync([id], ct);
        if (form is null) return NotFound();
        db.Forms.Remove(form);
        await db.SaveChangesAsync(ct);
        renderer.InvalidateCache(id);
        return NoContent();
    }

    // ── Sections ──────────────────────────────────────────────────────────────

    [HttpGet("{formId:guid}/sections")]
    public async Task<IActionResult> ListSections(Guid formId, CancellationToken ct) =>
        Ok(await db.FormSections.AsNoTracking()
            .Where(s => s.FormId == formId)
            .OrderBy(s => s.DisplayOrder)
            .ToListAsync(ct));

    [HttpPost("{formId:guid}/sections")]
    public async Task<IActionResult> CreateSection(
        Guid formId, [FromBody] CreateSectionRequest req, CancellationToken ct)
    {
        var section = new MetaFormSection
        {
            SectionId    = Guid.NewGuid(),
            FormId       = formId,
            Title        = req.Title,
            DisplayOrder = req.DisplayOrder,
            Columns      = req.Columns,
            CreatedAt    = DateTime.UtcNow,
            UpdatedAt    = DateTime.UtcNow
        };
        db.FormSections.Add(section);
        await db.SaveChangesAsync(ct);
        renderer.InvalidateCache(formId);
        return Created(string.Empty, section);
    }

    [HttpPut("{formId:guid}/sections/{sectionId:guid}")]
    public async Task<IActionResult> UpdateSection(
        Guid formId, Guid sectionId, [FromBody] UpdateSectionRequest req, CancellationToken ct)
    {
        var section = await db.FormSections.FirstOrDefaultAsync(
            s => s.SectionId == sectionId && s.FormId == formId, ct);
        if (section is null) return NotFound();
        section.Title        = req.Title;
        section.DisplayOrder = req.DisplayOrder;
        section.Columns      = req.Columns;
        section.UpdatedAt    = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        renderer.InvalidateCache(formId);
        return Ok(section);
    }

    [HttpDelete("{formId:guid}/sections/{sectionId:guid}")]
    public async Task<IActionResult> DeleteSection(Guid formId, Guid sectionId, CancellationToken ct)
    {
        var section = await db.FormSections.FirstOrDefaultAsync(
            s => s.SectionId == sectionId && s.FormId == formId, ct);
        if (section is null) return NotFound();
        db.FormSections.Remove(section);
        await db.SaveChangesAsync(ct);
        renderer.InvalidateCache(formId);
        return NoContent();
    }

    // ── Form Fields (placement) ───────────────────────────────────────────────

    [HttpGet("{formId:guid}/fields")]
    public async Task<IActionResult> ListFormFields(Guid formId, CancellationToken ct) =>
        Ok(await db.FormFields.AsNoTracking()
            .Where(ff => ff.FormId == formId)
            .Include(ff => ff.Field)
            .OrderBy(ff => ff.DisplayOrder)
            .ToListAsync(ct));

    [HttpPost("{formId:guid}/fields")]
    public async Task<IActionResult> AddField(
        Guid formId, [FromBody] CreateFormFieldRequest req, CancellationToken ct)
    {
        var ff = new MetaFormField
        {
            FormFieldId  = Guid.NewGuid(),
            FormId       = formId,
            FieldId      = req.FieldId,
            SectionId    = req.SectionId,
            DisplayOrder = req.DisplayOrder,
            LabelOverride = req.LabelOverride,
            Placeholder  = req.Placeholder,
            IsVisible    = req.IsVisible,
            IsReadonly   = req.IsReadonly,
            ColSpan      = req.ColSpan,
            CreatedAt    = DateTime.UtcNow,
            UpdatedAt    = DateTime.UtcNow
        };
        db.FormFields.Add(ff);
        await db.SaveChangesAsync(ct);
        renderer.InvalidateCache(formId);
        return Created(string.Empty, ff);
    }

    [HttpDelete("{formId:guid}/fields/{formFieldId:guid}")]
    public async Task<IActionResult> RemoveField(Guid formId, Guid formFieldId, CancellationToken ct)
    {
        var ff = await db.FormFields.FirstOrDefaultAsync(
            x => x.FormFieldId == formFieldId && x.FormId == formId, ct);
        if (ff is null) return NotFound();
        db.FormFields.Remove(ff);
        await db.SaveChangesAsync(ct);
        renderer.InvalidateCache(formId);
        return NoContent();
    }

    // ── Validations ───────────────────────────────────────────────────────────

    [HttpGet("{formId:guid}/validations")]
    public async Task<IActionResult> ListValidations(Guid formId, CancellationToken ct) =>
        Ok(await db.Validations.AsNoTracking()
            .Where(v => v.FormId == formId)
            .OrderBy(v => v.DisplayOrder)
            .ToListAsync(ct));

    [HttpPost("{formId:guid}/validations")]
    public async Task<IActionResult> AddValidation(
        Guid formId, [FromBody] CreateValidationRequest req, CancellationToken ct)
    {
        var v = new MetaValidation
        {
            ValidationId = Guid.NewGuid(),
            FormId       = formId,
            FieldId      = req.FieldId,
            RuleType     = req.RuleType,
            RuleValue    = req.RuleValue,
            ErrorMessage = req.ErrorMessage,
            DisplayOrder = req.DisplayOrder,
            CreatedAt    = DateTime.UtcNow,
            UpdatedAt    = DateTime.UtcNow
        };
        db.Validations.Add(v);
        await db.SaveChangesAsync(ct);
        renderer.InvalidateCache(formId);
        return Created(string.Empty, v);
    }

    [HttpDelete("{formId:guid}/validations/{validationId:guid}")]
    public async Task<IActionResult> DeleteValidation(
        Guid formId, Guid validationId, CancellationToken ct)
    {
        var v = await db.Validations.FirstOrDefaultAsync(
            x => x.ValidationId == validationId && x.FormId == formId, ct);
        if (v is null) return NotFound();
        db.Validations.Remove(v);
        await db.SaveChangesAsync(ct);
        renderer.InvalidateCache(formId);
        return NoContent();
    }
}
