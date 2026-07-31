# Metadata-driven platform — build plan
**Stack:** Angular 18 (Studio + runtime renderer) · .NET Core 8 (engine + API) · PostgreSQL (metadata + host data)

---

## 1. Solution structure

```
/platform
  /src
    Platform.Domain          # entities, enums, no dependencies
    Platform.Metadata        # EF Core DbContext for metadata tables, migrations
    Platform.Engine          # form renderer, rule evaluator, workflow engine, validator
    Platform.Api             # ASP.NET Core Web API — Studio CRUD + runtime endpoints
    Platform.Etl              # background jobs (Quartz.NET / Hangfire)
  /studio                    # Angular app — design-time authoring UI
  /runtime-lib                # Angular library — dynamic form/report renderer, published as npm pkg
  /db
    001_core.sql
    002_forms.sql
    003_rules.sql
    004_workflows.sql
    005_validations.sql
    006_etl.sql
    007_reporting.sql
```

Two Angular projects on purpose: **Studio** is what your team uses to *design* forms/rules/workflows. **runtime-lib** is what host apps import to *render* what Studio produced. Keeping them separate means a host app's bundle only ships the renderer, not the whole authoring UI.

---

## 2. Database migrations (`/db`)

Each module is its own numbered `.sql` file, run in order via `dotnet ef database update` or plain `psql`. This is the artifact host teams actually run against their own Postgres instance — it **is** the product surface, so keep it clean and idempotent (`CREATE TABLE IF NOT EXISTS`).

```sql
-- 001_core.sql
CREATE TABLE meta_tenants (
  tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

CREATE TABLE meta_entities (
  entity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES meta_tenants(tenant_id),
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE meta_fields (
  field_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES meta_entities(entity_id),
  name TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('string','number','boolean','date','enum')),
  is_required BOOLEAN DEFAULT FALSE,
  options_json JSONB
);
```

Repeat this pattern per module (`forms`, `rule_conditions`, `workflow_steps`, etc.) using the table list from earlier. Every table gets a `tenant_id` or inherits it via `entity_id` — multi-tenancy is not optional if more than one host app will ever share metadata infra.

---

## 3. Backend (.NET Core) — build order

| Order | Component | What it does |
|---|---|---|
| 1 | `Platform.Metadata` | EF Core `DbContext` mapped 1:1 to the SQL schema. Code-first migrations kept in sync with `/db` scripts. |
| 2 | `Platform.Api` — Studio CRUD | Plain REST endpoints: `POST /entities`, `POST /forms`, `POST /rules`, etc. This is what the Angular Studio calls to save designs. |
| 3 | `Platform.Engine.FormRenderer` | Given `entity_id`, returns a JSON form schema (fields + layout + validation refs). Host apps request this once per form load. |
| 4 | `Platform.Engine.Validator` | Given `entity_id` + submitted data, runs `validations` table rules server-side, returns structured errors. |
| 5 | `Platform.Engine.RuleEvaluator` | Given `entity_id` + data, evaluates `rule_conditions`, fires `rule_actions`. Pure function — no side effects, returns an actions list the caller applies. |
| 6 | `Platform.Engine.WorkflowEngine` | Creates/advances `workflow_instances`, checks `assigned_role` against the caller's claims, enforces `workflow_transitions`. |
| 7 | `Platform.Etl` | Background jobs reading `etl_mappings`, running on a schedule (Quartz.NET), writing into the host entity's actual data table. |
| 8 | `Platform.Engine.ReportBuilder` | Given `report_id`, dynamically builds a parameterized SQL query from `report_columns` + filters, returns rows for the dashboard widget. |

**Key implementation note:** every engine component takes `entity_id` and reads metadata fresh (or from a short-lived cache) — never hardcode entity/field names in engine code. That's what makes it reusable across Loan Origination, Stress Testing, whatever comes next.

---

## 4. Frontend (Angular) — build order

**Studio app**
1. Entity/field builder — CRUD screens over `meta_entities`/`meta_fields`
2. Form designer — drag-and-drop field placement, writes `form_fields`/`form_layouts`
3. Rule builder — condition/action builder UI, writes `rules`/`rule_conditions`/`rule_actions`
4. Workflow designer — step/transition builder, ideally a visual graph (Angular + a lightweight graph lib)
5. Report/dashboard designer — column picker + chart type selector

**Runtime library** (published internally, consumed by host Angular apps)
1. `<dynamic-form [entityId]="...">` — fetches form schema, renders Angular reactive form dynamically from JSON (use `FormGroup` built at runtime, not compile-time typed forms)
2. `<dynamic-report [reportId]="...">` — fetches report data, renders via a charting lib (ngx-charts or similar)
3. A thin `PlatformClientService` wrapping all API calls — this is the entire integration surface a host Angular app needs to import

---

## 5. Phased roadmap

| Phase | Weeks | Scope | Exit criteria |
|---|---|---|---|
| 0 | 1 | Schema + `Platform.Metadata` + Studio entity/field CRUD | Can define "LoanApplication" entity with fields via Studio, see it in Postgres |
| 1 | 2 | Forms + Validations | A form built in Studio renders live in a test Angular host app via `<dynamic-form>`, validates on submit |
| 2 | 2 | Rules | Submitting the form triggers a rule (e.g. auto-flag high DTI), visible in the response |
| 3 | 2 | Workflows | Submitted record creates a workflow instance, an "approver" role can advance it through steps |
| 4 | 1–2 | Reporting/dashboards | A dashboard widget shows live counts/aggregates from submitted records |
| 5 | 2 | ETL | A scheduled job pulls from a mock external source into the entity's data table |

**Total MVP: ~10 weeks** for all six modules at demo depth. Phases 0–3 (~5 weeks) alone already form a complete, demonstrable loop — design a loan form → render it → validate → rule-flag → route for approval. That's the strongest standalone milestone if you need something interview-ready sooner.

---

## 6. What to build first, concretely

Given the phase table above: **Phase 0 + Phase 1**, because it proves the entire architecture (Studio writes metadata → engine reads metadata → Angular renders from metadata) with the smallest module. Rules, workflows, and reporting are all the *same pattern* repeated — once forms works end-to-end, the rest is largely applying the same recipe to new tables.
