# Metadata-Driven Platform — Developer Setup

A full-stack platform where forms, validation rules, and workflows are designed in a Studio UI and rendered dynamically in host Angular apps — without touching source code.

**Stack:** Angular 21 (Studio + runtime-lib) · .NET 10 (API + Engine) · PostgreSQL 16

---

## Prerequisites

| Tool | Version |
|------|---------|
| .NET SDK | ≥ 10.0 |
| Node.js | ≥ 20 |
| Angular CLI | ≥ 21 |
| Docker + Docker Compose | any recent |

---

## Quick Start

### 1. Start PostgreSQL

```powershell
docker compose up -d
```

Starts `platform_postgres` on `localhost:5432`. Schema migrations run automatically from `db/` on first start.

### 2. Start the .NET API

```powershell
cd platform
dotnet run --project src/Platform.Api
# API: http://localhost:5100
# OpenAPI spec: http://localhost:5100/openapi/v1.json
```

### 3. Start the Angular Studio

```powershell
cd studio
npm install
ng serve
# Studio: http://localhost:4200
```

---

## Project Structure

```
platform/
  src/
    Platform.Domain/        # POCOs, enums, DTOs — no dependencies
    Platform.Metadata/      # EF Core DbContext, tenant filter
    Platform.Engine/        # FormRendererService, ValidatorService
    Platform.Api/           # REST API (Studio CRUD + runtime endpoints)
    Platform.Etl/           # Scaffolded — Phase 5

studio/
  src/app/
    features/
      entities/             # Entity list + Field manager
      forms/                # Form list + Form designer (CDK drag-drop)
    services/               # EntityApiService, FormApiService, TenantService
    models/                 # Shared TypeScript interfaces
  projects/
    runtime-lib/            # Angular library — DynamicFormComponent, PlatformClientService

db/
  001_core.sql              # meta_tenants, meta_entities, meta_fields
  002_forms.sql             # meta_forms, meta_form_sections, meta_form_fields
  005_validations.sql       # meta_validations
```

---

## API Reference

### Studio CRUD

| Endpoint | Purpose |
|----------|---------|
| `GET/POST/PUT/DELETE /api/entities` | Entity management |
| `GET/POST/PUT/DELETE /api/entities/{id}/fields` | Field management |
| `GET/POST/PUT/DELETE /api/forms` | Form management |
| `GET/POST/PUT/DELETE /api/forms/{id}/sections` | Section management |
| `GET/POST/PUT/DELETE /api/forms/{id}/fields` | Field placement |
| `GET/POST/PUT/DELETE /api/forms/{id}/validations` | Validation rules |

### Runtime (consumed by `<plat-dynamic-form>`)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/runtime/forms/{formId}/schema` | Returns `FormSchemaDto` |
| `POST /api/runtime/forms/{formId}/validate` | Returns `ValidationResultDto` |

**All requests require `X-Tenant-Id: <uuid>` header.**

---

## Using the runtime-lib in a host app

```typescript
// app.config.ts
import { PlatformRuntimeModule } from 'runtime-lib';

providers: [
  ...PlatformRuntimeModule.forRoot({
    apiUrl: 'http://your-api-host',
    tenantId: 'your-tenant-uuid'
  }).providers!
]
```

```html
<!-- any template -->
<plat-dynamic-form
  [formId]="'your-form-uuid'"
  (submitted)="onSubmit($event)"
  (validationFailed)="onErrors($event)">
</plat-dynamic-form>
```

---

## Phase Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Schema + Metadata + Entity/Field CRUD | ✅ Complete |
| 1 | Forms + Validations + `<plat-dynamic-form>` | ✅ Complete |
| 2 | Rules (condition/action evaluator) | 📋 Next |
| 3 | Workflows (steps, transitions, roles) | 📋 Planned |
| 4 | Reporting/dashboards | 📋 Planned |
| 5 | ETL background jobs | 📋 Planned |

---

## Multi-tenancy

All requests must include `X-Tenant-Id: <uuid>`. EF Core applies a global query filter so all metadata queries are automatically scoped. Phase 3 will replace the header with JWT claim extraction.
