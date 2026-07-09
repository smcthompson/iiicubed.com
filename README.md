# iiicubed.com

Professional portfolio site highlighting my work.

## Environment configuration

The application loads environment variables with `dotenv` in this order:

1. `.env` for common values.
2. `.env.<NODE_ENV>` for environment-specific overrides.

For example, when `NODE_ENV=development`, `.env` is loaded first and `.env.development` overrides any duplicate values. Supported `NODE_ENV` values are `development`, `test`, and `production`.

Do not commit real `.env*` files. Use local files for secrets and machine-specific configuration.

### Local workstation SQL Server configuration

For local development, the workstation app can use SQL Server authentication against a local Microsoft SQL Server database:

```dotenv
NODE_ENV=development
WORKSTATION_SQL_SERVER=localhost
WORKSTATION_SQL_DATABASE=workstation
WORKSTATION_SQL_PORT=1433
WORKSTATION_SQL_ENCRYPT=false
WORKSTATION_SQL_TRUST_SERVER_CERTIFICATE=true
WORKSTATION_SQL_AUTHENTICATION=sql-password
WORKSTATION_SQL_USER=workstation_app
WORKSTATION_SQL_PASSWORD=your-local-password
```

Create the local login/user in SQL Server as a local development account:

```sql
CREATE DATABASE workstation;
GO
USE workstation;
GO
CREATE LOGIN workstation_app WITH PASSWORD = 'your-local-password';
CREATE USER workstation_app FOR LOGIN workstation_app;
ALTER ROLE db_datareader ADD MEMBER workstation_app;
ALTER ROLE db_datawriter ADD MEMBER workstation_app;
GO
```

The default authentication mode is `auto`. In `development`, if `WORKSTATION_SQL_USER` and `WORKSTATION_SQL_PASSWORD` are present, the SQL pool uses SQL Server username/password authentication. Otherwise it falls back to Azure token authentication through `DefaultAzureCredential`.

Windows Integrated Authentication would also be a reasonable local scheme, but the current `mssql`/`tedious` setup does not support it cleanly without adding another driver dependency such as `msnodesqlv8`. For now, a local in-database SQL user is the simplest option without expanding dependencies.

## Playwright ADO Verification Reporter

The Playwright config includes a custom reporter at `tests/reporters/ado-verification-reporter.ts` that mimics the `@[<id>]` behavior from `playwright-azure-reporter` for Verification work items.

### How it works

- Reads each test's tags and finds `@[<id>]`.
- Treats `<id>` as an Azure DevOps work item id.
- Updates the Verification item with outcome, optional state mapping, test-step field content, and optional details/step outcome fields.
- Finds the parent issue via hierarchy links.
- Recomputes and updates a parent rollup field when configured.

### Required environment variables

- `ADO_ORG_URL`: Example `https://dev.azure.com/smcthompson`
- `ADO_PROJECT`: Project name
- `ADO_VERIFICATION_OUTCOME_FIELD`: Reference name of the Verification outcome field to patch (example: `Custom.AutomationOutcome`)

Authentication (choose one):

- `ADO_PAT`: PAT token for ADO REST
- `ADO_ACCESS_TOKEN`: Bearer token (for pipeline/system token scenarios)

### Optional environment variables

- `ADO_VERIFICATION_WIT`: Defaults to `Verification`
- `ADO_PARENT_ROLLUP_FIELD`: Parent issue field for rollup text
  - The reporter will walk the parent hierarchy and update this rollup field on all ancestor items so verification results propagate up to feature/epic work items.
- `ADO_VERIFICATION_EVIDENCE_FIELD`: Reference name for evidence URL field (example: `Custom.EvidenceURL`). Reporter will upload `playwright-report/index.html` as an attachment and set this field to the attachment URL when configured.
- `ADO_VERIFICATION_UPDATE_STATE`: Defaults to `true`; set `false` to skip `System.State` updates
- `ADO_VERIFICATION_PASS_STATE`: Defaults to `Pass`
- `ADO_VERIFICATION_FAIL_STATE`: Defaults to `Fail`
- `ADO_VERIFICATION_PENDING_STATE`: Defaults to `Pending`
- `ADO_API_VERSION`: Defaults to `7.1`
- `ADO_VERIFICATION_REPORTER_ENABLED`: Set to `false` to disable reporter

### Tag format in tests

Use Playwright tag metadata, not test title suffixes:

```ts
test('Home Page', { tag: ['@[19]', '@e2e'] }, async ({ page }) => {
  // test body
});
```

## Authentication: Service Principal (sp-iiicubed-workstation)

The application uses `DefaultAzureCredential` so it can authenticate via multiple mechanisms. For cloud-hosted environments, this repository can use a Service Principal named `sp-iiicubed-workstation`.

Create the service principal (one-time):

```bash
az ad sp create-for-rbac --name "sp-iiicubed-workstation" --skip-assignment -o json
```

Save the returned `appId` (client id), `password` (client secret) and `tenant` values. Configure these as secure environment variables for local runs and in your pipeline:

- `AZURE_TENANT_ID` — tenant id
- `AZURE_CLIENT_ID` — appId
- `AZURE_CLIENT_SECRET` — client secret

Create a contained database user for the service principal and grant the minimal roles required (connect as the Azure AD admin for the server):

```sql
USE workstation;
CREATE USER [sp-iiicubed-workstation] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [sp-iiicubed-workstation];
ALTER ROLE db_datawriter ADD MEMBER [sp-iiicubed-workstation];
```

Notes:

- Use the `appId` or the name `sp-iiicubed-workstation` as the database principal name; using the `appId` avoids ambiguity.
- You must run these SQL commands as the server's Azure AD admin.

Runtime configuration for Azure token authentication:

```dotenv
WORKSTATION_SQL_AUTHENTICATION=azure-token
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-appId
AZURE_CLIENT_SECRET=your-client-secret
```

Pipeline & self-hosted agent

- Store `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and `AZURE_CLIENT_SECRET` as secret pipeline variables or in a variable group backed by Azure Key Vault. The self-hosted agent will inject them into job environments and `DefaultAzureCredential` will pick them up automatically.
- If you run the agent as a container, pass a secure env file (do not commit) to `docker run --env-file .agent-env`.

Alternatives

- Certificate-based service principal: no plaintext secret; requires secure distribution of private key.
- Federated credentials (OIDC) from Azure DevOps: allow pipeline jobs to exchange OIDC tokens for AAD tokens without storing secrets.
- Managed Identity: requires Azure-hosted runtime (IMDS) and is not suitable for local development without an Azure VM.
