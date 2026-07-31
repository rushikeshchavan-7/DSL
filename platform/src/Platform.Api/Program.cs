using Platform.Api.Infrastructure;
using Platform.Metadata;
using Platform.Engine;

var builder = WebApplication.CreateBuilder(args);

// ── Tenant resolution (before Metadata, which depends on ITenantProvider) ─────
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantProvider, HttpHeaderTenantProvider>();

// ── Services ─────────────────────────────────────────────────────────────────
builder.Services.AddPlatformMetadata(
    builder.Configuration.GetConnectionString("MetadataDb")
    ?? throw new InvalidOperationException("Connection string 'MetadataDb' is required."));

builder.Services.AddPlatformEngine();

builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// .NET 10 built-in OpenAPI (replaces Swashbuckle)
builder.Services.AddOpenApi();

// ── CORS — allow Studio dev server and configurable host origins ──────────────
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost:4200"];

builder.Services.AddCors(o => o.AddPolicy("Platform", p =>
    p.WithOrigins(allowedOrigins)
     .AllowAnyMethod()
     .AllowAnyHeader()));

// ── App ───────────────────────────────────────────────────────────────────────
var app = builder.Build();

app.MapOpenApi();   // serves /openapi/v1.json
app.UseCors("Platform");
app.UseAuthorization();
app.MapControllers();

app.Run();
