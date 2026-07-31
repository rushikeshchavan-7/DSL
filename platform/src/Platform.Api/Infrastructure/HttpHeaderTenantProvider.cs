using Platform.Metadata;

namespace Platform.Api.Infrastructure;

/// <summary>
/// Resolves tenant from the X-Tenant-Id HTTP request header.
/// Phase 3: replace with JWT claim extraction.
/// </summary>
public sealed class HttpHeaderTenantProvider(IHttpContextAccessor accessor) : ITenantProvider
{
    public Guid TenantId
    {
        get
        {
            var raw = accessor.HttpContext?.Request.Headers["X-Tenant-Id"].FirstOrDefault();
            return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
        }
    }
}
