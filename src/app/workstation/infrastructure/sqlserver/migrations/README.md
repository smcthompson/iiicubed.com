# Workstation SQL Server migrations

This folder contains the SQL Server database milestone for the workstation constraint framework.

## Run migrations

```bash
npm run workstation:migrate
```

The migration runner uses the existing workstation SQL Server configuration:

- `WORKSTATION_SQL_SERVER`
- `WORKSTATION_SQL_DATABASE`
- `WORKSTATION_SQL_PORT`
- `WORKSTATION_SQL_ENCRYPT`
- `WORKSTATION_SQL_TRUST_SERVER_CERTIFICATE`
- `WORKSTATION_SQL_MANAGED_IDENTITY_CLIENT_ID`

## Current migrations

1. `001_create_workstation_database` creates the `workstation` schema, migration ledger, normalized product/mechanical/source/price/constraint/layout tables, and key indexes.
2. `002_seed_workstation_reference_data` seeds the first workstation facts and evaluations from the mechanical layout options and schema-design notes.

## Design notes

The schema intentionally separates product facts from layout evaluations:

- `workstation.products` stores catalog identity and product status.
- `workstation.monitor_specs`, `workstation.monitor_mechanics`, and `workstation.center_device_mechanics` store measured or sourced facts.
- `workstation.constraints` stores reusable solver rules.
- `workstation.layout_candidates` stores ranked generated configurations.
- `workstation.layout_constraint_evaluations` stores per-layout scoring details.

This lets the application add new product facts without overwriting historical layout scoring runs.
