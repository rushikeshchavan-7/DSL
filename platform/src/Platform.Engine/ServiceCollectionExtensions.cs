using Microsoft.Extensions.DependencyInjection;
using Platform.Engine.FormRenderer;
using Platform.Engine.Validator;

namespace Platform.Engine;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Registers all engine services. Call from Platform.Api's <c>Program.cs</c>.
    /// </summary>
    public static IServiceCollection AddPlatformEngine(this IServiceCollection services)
    {
        services.AddMemoryCache();
        services.AddScoped<FormRendererService>();
        services.AddScoped<ValidatorService>();
        return services;
    }
}
