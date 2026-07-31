using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Platform.Domain.Entities;
using Platform.Domain.Enums;
using Platform.Metadata;

namespace Platform.Api.Controllers;

// ── Request models ────────────────────────────────────────────────────────────

public record CreateEntityRequest(
    string Name,
    string? Description,
    string? PluralName);

public record UpdateEntityRequest(
    string Name,
    string? Description,
    string? PluralName);

public record CreateFieldRequest(
    string Name,
    string Label,
    FieldDataType DataType,
    bool IsRequired = false,
    int DisplayOrder = 0,
    string? OptionsJson = null,
    string? DefaultValue = null);

public record UpdateFieldRequest(
    string Name,
    string Label,
    FieldDataType DataType,
    bool IsRequired,
    int DisplayOrder,
    string? OptionsJson,
    string? DefaultValue);

// ── Controller ────────────────────────────────────────────────────────────────

/// <summary>Studio CRUD for entities and their fields.</summary>
[ApiController]
[Route("api/[controller]")]
public sealed class EntitiesController(MetadataDbContext db) : ControllerBase
{
    // ── Entities ──────────────────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) =>
        Ok(await db.Entities.AsNoTracking()
            .OrderBy(e => e.Name)
            .Select(e => new { e.EntityId, e.Name, e.Description, e.PluralName, e.CreatedAt })
            .ToListAsync(ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var entity = await db.Entities.AsNoTracking()
            .Include(e => e.Fields.OrderBy(f => f.DisplayOrder))
            .FirstOrDefaultAsync(e => e.EntityId == id, ct);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEntityRequest req, CancellationToken ct)
    {
        // Resolve tenant from the provider (injected via global filter on db)
        var tenantId = db.Database.GetDbConnection() is { } conn
            ? GetTenantId()
            : Guid.Empty;

        tenantId = GetTenantId();

        var entity = new MetaEntity
        {
            EntityId   = Guid.NewGuid(),
            TenantId   = tenantId,
            Name       = req.Name,
            Description = req.Description,
            PluralName  = req.PluralName,
            CreatedAt   = DateTime.UtcNow,
            UpdatedAt   = DateTime.UtcNow
        };
        db.Entities.Add(entity);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = entity.EntityId }, entity);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEntityRequest req, CancellationToken ct)
    {
        var entity = await db.Entities.FindAsync([id], ct);
        if (entity is null) return NotFound();
        entity.Name        = req.Name;
        entity.Description = req.Description;
        entity.PluralName  = req.PluralName;
        entity.UpdatedAt   = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(entity);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var entity = await db.Entities.FindAsync([id], ct);
        if (entity is null) return NotFound();
        db.Entities.Remove(entity);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ── Fields ────────────────────────────────────────────────────────────────

    [HttpGet("{entityId:guid}/fields")]
    public async Task<IActionResult> ListFields(Guid entityId, CancellationToken ct) =>
        Ok(await db.Fields.AsNoTracking()
            .Where(f => f.EntityId == entityId)
            .OrderBy(f => f.DisplayOrder)
            .ToListAsync(ct));

    [HttpPost("{entityId:guid}/fields")]
    public async Task<IActionResult> CreateField(
        Guid entityId, [FromBody] CreateFieldRequest req, CancellationToken ct)
    {
        var field = new MetaField
        {
            FieldId      = Guid.NewGuid(),
            EntityId     = entityId,
            Name         = req.Name,
            Label        = req.Label,
            DataType     = req.DataType,
            IsRequired   = req.IsRequired,
            DisplayOrder = req.DisplayOrder,
            OptionsJson  = req.OptionsJson,
            DefaultValue = req.DefaultValue,
            CreatedAt    = DateTime.UtcNow,
            UpdatedAt    = DateTime.UtcNow
        };
        db.Fields.Add(field);
        await db.SaveChangesAsync(ct);
        return Created($"api/entities/{entityId}/fields/{field.FieldId}", field);
    }

    [HttpPut("{entityId:guid}/fields/{fieldId:guid}")]
    public async Task<IActionResult> UpdateField(
        Guid entityId, Guid fieldId, [FromBody] UpdateFieldRequest req, CancellationToken ct)
    {
        var field = await db.Fields.FirstOrDefaultAsync(
            f => f.FieldId == fieldId && f.EntityId == entityId, ct);
        if (field is null) return NotFound();
        field.Name         = req.Name;
        field.Label        = req.Label;
        field.DataType     = req.DataType;
        field.IsRequired   = req.IsRequired;
        field.DisplayOrder = req.DisplayOrder;
        field.OptionsJson  = req.OptionsJson;
        field.DefaultValue = req.DefaultValue;
        field.UpdatedAt    = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(field);
    }

    [HttpDelete("{entityId:guid}/fields/{fieldId:guid}")]
    public async Task<IActionResult> DeleteField(Guid entityId, Guid fieldId, CancellationToken ct)
    {
        var field = await db.Fields.FirstOrDefaultAsync(
            f => f.FieldId == fieldId && f.EntityId == entityId, ct);
        if (field is null) return NotFound();
        db.Fields.Remove(field);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Guid GetTenantId()
    {
        var raw = HttpContext.Request.Headers["X-Tenant-Id"].FirstOrDefault();
        return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
    }
}
