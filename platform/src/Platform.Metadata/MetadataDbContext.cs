using Microsoft.EntityFrameworkCore;
using Platform.Domain.Entities;
using Platform.Domain.Enums;

namespace Platform.Metadata;

/// <summary>
/// EF Core DbContext for all platform metadata tables.
/// Tenant isolation is applied via a <see cref="ITenantProvider"/> global query filter.
/// </summary>
public sealed class MetadataDbContext : DbContext
{
    private readonly ITenantProvider _tenantProvider;

    public MetadataDbContext(
        DbContextOptions<MetadataDbContext> options,
        ITenantProvider tenantProvider) : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    // ── DbSets ───────────────────────────────────────────────────────────────
    public DbSet<Tenant>          Tenants          => Set<Tenant>();
    public DbSet<MetaEntity>      Entities         => Set<MetaEntity>();
    public DbSet<MetaField>       Fields           => Set<MetaField>();
    public DbSet<MetaForm>        Forms            => Set<MetaForm>();
    public DbSet<MetaFormSection> FormSections     => Set<MetaFormSection>();
    public DbSet<MetaFormField>   FormFields       => Set<MetaFormField>();
    public DbSet<MetaValidation>  Validations      => Set<MetaValidation>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        base.OnModelCreating(mb);

        // ── Tenant ───────────────────────────────────────────────────────────
        mb.Entity<Tenant>(e =>
        {
            e.ToTable("meta_tenants");
            e.HasKey(t => t.TenantId);
            e.Property(t => t.TenantId).HasColumnName("tenant_id");
            e.Property(t => t.Name).HasColumnName("name").IsRequired();
            e.Property(t => t.Slug).HasColumnName("slug").IsRequired();
            e.Property(t => t.IsActive).HasColumnName("is_active");
            e.Property(t => t.CreatedAt).HasColumnName("created_at");
            e.Property(t => t.UpdatedAt).HasColumnName("updated_at");
            e.HasIndex(t => t.Slug).IsUnique();
        });

        // ── MetaEntity ───────────────────────────────────────────────────────
        mb.Entity<MetaEntity>(e =>
        {
            e.ToTable("meta_entities");
            e.HasKey(x => x.EntityId);
            e.Property(x => x.EntityId).HasColumnName("entity_id");
            e.Property(x => x.TenantId).HasColumnName("tenant_id");
            e.Property(x => x.Name).HasColumnName("name").IsRequired();
            e.Property(x => x.Description).HasColumnName("description");
            e.Property(x => x.PluralName).HasColumnName("plural_name");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.HasOne(x => x.Tenant).WithMany(t => t.Entities)
                .HasForeignKey(x => x.TenantId);
            // Global tenant filter — only rows for the active tenant are visible
            e.HasQueryFilter(x => x.TenantId == _tenantProvider.TenantId);
        });

        // ── MetaField ────────────────────────────────────────────────────────
        mb.Entity<MetaField>(e =>
        {
            e.ToTable("meta_fields");
            e.HasKey(x => x.FieldId);
            e.Property(x => x.FieldId).HasColumnName("field_id");
            e.Property(x => x.EntityId).HasColumnName("entity_id");
            e.Property(x => x.Name).HasColumnName("name").IsRequired();
            e.Property(x => x.Label).HasColumnName("label").IsRequired();
            e.Property(x => x.DataType)
                .HasColumnName("data_type")
                .HasConversion(
                    v => v.ToString().ToLowerInvariant(),
                    v => Enum.Parse<FieldDataType>(v, ignoreCase: true));
            e.Property(x => x.IsRequired).HasColumnName("is_required");
            e.Property(x => x.DisplayOrder).HasColumnName("display_order");
            e.Property(x => x.OptionsJson).HasColumnName("options_json").HasColumnType("jsonb");
            e.Property(x => x.DefaultValue).HasColumnName("default_value");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.HasOne(x => x.Entity).WithMany(en => en.Fields)
                .HasForeignKey(x => x.EntityId);
        });

        // ── MetaForm ─────────────────────────────────────────────────────────
        mb.Entity<MetaForm>(e =>
        {
            e.ToTable("meta_forms");
            e.HasKey(x => x.FormId);
            e.Property(x => x.FormId).HasColumnName("form_id");
            e.Property(x => x.EntityId).HasColumnName("entity_id");
            e.Property(x => x.Name).HasColumnName("name").IsRequired();
            e.Property(x => x.Description).HasColumnName("description");
            e.Property(x => x.Version).HasColumnName("version");
            e.Property(x => x.IsActive).HasColumnName("is_active");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.HasOne(x => x.Entity).WithMany(en => en.Forms)
                .HasForeignKey(x => x.EntityId);
        });

        // ── MetaFormSection ──────────────────────────────────────────────────
        mb.Entity<MetaFormSection>(e =>
        {
            e.ToTable("meta_form_sections");
            e.HasKey(x => x.SectionId);
            e.Property(x => x.SectionId).HasColumnName("section_id");
            e.Property(x => x.FormId).HasColumnName("form_id");
            e.Property(x => x.Title).HasColumnName("title").IsRequired();
            e.Property(x => x.DisplayOrder).HasColumnName("display_order");
            e.Property(x => x.Columns).HasColumnName("columns");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.HasOne(x => x.Form).WithMany(f => f.Sections)
                .HasForeignKey(x => x.FormId);
        });

        // ── MetaFormField ────────────────────────────────────────────────────
        mb.Entity<MetaFormField>(e =>
        {
            e.ToTable("meta_form_fields");
            e.HasKey(x => x.FormFieldId);
            e.Property(x => x.FormFieldId).HasColumnName("form_field_id");
            e.Property(x => x.FormId).HasColumnName("form_id");
            e.Property(x => x.FieldId).HasColumnName("field_id");
            e.Property(x => x.SectionId).HasColumnName("section_id");
            e.Property(x => x.DisplayOrder).HasColumnName("display_order");
            e.Property(x => x.LabelOverride).HasColumnName("label_override");
            e.Property(x => x.Placeholder).HasColumnName("placeholder");
            e.Property(x => x.IsVisible).HasColumnName("is_visible");
            e.Property(x => x.IsReadonly).HasColumnName("is_readonly");
            e.Property(x => x.ColSpan).HasColumnName("col_span");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.HasOne(x => x.Form).WithMany(f => f.Fields)
                .HasForeignKey(x => x.FormId);
            e.HasOne(x => x.Field).WithMany(f => f.FormFields)
                .HasForeignKey(x => x.FieldId);
            e.HasOne(x => x.Section).WithMany(s => s.Fields)
                .HasForeignKey(x => x.SectionId)
                .IsRequired(false);
        });

        // ── MetaValidation ───────────────────────────────────────────────────
        mb.Entity<MetaValidation>(e =>
        {
            e.ToTable("meta_validations");
            e.HasKey(x => x.ValidationId);
            e.Property(x => x.ValidationId).HasColumnName("validation_id");
            e.Property(x => x.FieldId).HasColumnName("field_id");
            e.Property(x => x.FormId).HasColumnName("form_id");
            e.Property(x => x.RuleType)
                .HasColumnName("rule_type")
                .HasConversion(
                    v => ToSnakeCase(v.ToString()),
                    v => ParseValidationType(v));
            e.Property(x => x.RuleValue).HasColumnName("rule_value");
            e.Property(x => x.ErrorMessage).HasColumnName("error_message").IsRequired();
            e.Property(x => x.DisplayOrder).HasColumnName("display_order");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.HasOne(x => x.Field).WithMany(f => f.Validations)
                .HasForeignKey(x => x.FieldId);
            e.HasOne(x => x.Form).WithMany(f => f.Validations)
                .HasForeignKey(x => x.FormId);
        });
    }

    private static string ToSnakeCase(string s) =>
        string.Concat(s.Select((c, i) => i > 0 && char.IsUpper(c) ? "_" + c : c.ToString()))
              .ToLowerInvariant();

    private static ValidationType ParseValidationType(string s) => s switch
    {
        "required"           => ValidationType.Required,
        "min"                => ValidationType.Min,
        "max"                => ValidationType.Max,
        "min_length"         => ValidationType.MinLength,
        "max_length"         => ValidationType.MaxLength,
        "regex"              => ValidationType.Regex,
        "custom_expression"  => ValidationType.CustomExpression,
        _ => throw new InvalidOperationException($"Unknown validation rule type: '{s}'")
    };
}
