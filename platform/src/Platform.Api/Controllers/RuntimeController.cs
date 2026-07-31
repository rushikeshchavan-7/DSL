using Microsoft.AspNetCore.Mvc;
using Platform.Engine.FormRenderer;
using Platform.Engine.Validator;

namespace Platform.Api.Controllers;

public record ValidateFormRequest(
    Dictionary<string, object?> Data);

/// <summary>
/// Runtime endpoints — consumed by host Angular apps via PlatformClientService.
/// These endpoints return the form schema and validate submitted data.
/// </summary>
[ApiController]
[Route("api/runtime")]
public sealed class RuntimeController(
    FormRendererService renderer,
    ValidatorService validator) : ControllerBase
{
    /// <summary>GET the JSON form schema. Called once per form load.</summary>
    [HttpGet("forms/{formId:guid}/schema")]
    public async Task<IActionResult> GetSchema(Guid formId, CancellationToken ct)
    {
        var schema = await renderer.GetFormSchemaAsync(formId, ct);
        return schema is null ? NotFound() : Ok(schema);
    }

    /// <summary>POST submitted form data; returns structured validation errors.</summary>
    [HttpPost("forms/{formId:guid}/validate")]
    public async Task<IActionResult> Validate(
        Guid formId,
        [FromBody] ValidateFormRequest req,
        CancellationToken ct)
    {
        var result = await validator.ValidateAsync(formId, req.Data, ct);
        return Ok(result);
    }
}
