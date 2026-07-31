namespace Platform.Metadata;

/// <summary>
/// Provides the active tenant ID for the current request/scope.
/// Injected into <see cref="MetadataDbContext"/> to power global query filters.
/// Implement in the host (Platform.Api) using IHttpContextAccessor or JWT claims.
/// </summary>
public interface ITenantProvider
{
    Guid TenantId { get; }
}
