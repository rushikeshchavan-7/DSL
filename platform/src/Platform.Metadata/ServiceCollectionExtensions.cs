using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Platform.Metadata;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Registers <see cref="MetadataDbContext"/>.
    /// The caller (Platform.Api) is responsible for registering an <see cref="ITenantProvider"/> 
    /// implementation before calling this method.
    /// </summary>
    public static IServiceCollection AddPlatformMetadata(
        this IServiceCollection services,
        string connectionString)
    {
        services.AddDbContext<MetadataDbContext>(opts =>
            opts.UseNpgsql(connectionString));
        return services;
    }
}

