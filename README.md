# iiicubed.com

Professional portfolio site highlighting my work.

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

TODO

## Authentication: Service Principal (sp-iiicubed-workstation)

The application uses `DefaultAzureCredential` so it can authenticate via multiple mechanisms. For short-term local development and CI without `az login` at runtime, this repository is configured to use a Service Principal named `sp-iiicubed-workstation`.

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
- You must run these SQL commands as the server's Azure AD admin (your server shows `iiicubed.com@gmail.com` as AD admin).

Runtime configuration (no `az login` required)

- Locally (temporarily) set env vars in PowerShell:

```powershell
$env:AZURE_TENANT_ID="your-tenant-id"
$env:AZURE_CLIENT_ID="your-appId"
$env:AZURE_CLIENT_SECRET="your-client-secret"
```

- In Bash:

```bash
export AZURE_TENANT_ID=your-tenant-id
export AZURE_CLIENT_ID=your-appId
export AZURE_CLIENT_SECRET=your-client-secret
```

Pipeline & self-hosted agent

- Store `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and `AZURE_CLIENT_SECRET` as secret pipeline variables or in a variable group backed by Azure Key Vault. The self-hosted agent will inject them into job environments and `DefaultAzureCredential` will pick them up automatically.
- If you run the agent as a container, pass a secure env file (do not commit) to `docker run --env-file .agent-env`.

Quick token test (client credentials)

```bash
curl -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=YOUR_CLIENT_ID&scope=https%3A%2F%2Fdatabase.windows.net%2F.default&client_secret=YOUR_CLIENT_SECRET&grant_type=client_credentials" \
  "https://login.microsoftonline.com/YOUR_TENANT_ID/oauth2/v2.0/token"
```

Node test script

- Create `test-sql-token.cjs` at the repository root to verify token acquisition and a simple `SELECT 1` using the SP credentials with `DefaultAzureCredential` (example script in repo tasks or ask me to add it). Install dependencies `npm install @azure/identity mssql` and run:

```bash
node test-sql-token.cjs
```

Security

- Keep the client secret only in secure storage (pipeline secrets, local OS secret store, or Azure Key Vault). Do not commit the secret or `.agent-env` to source control.

Alternatives

- Certificate-based service principal: no plaintext secret; requires secure distribution of private key.
- Federated credentials (OIDC) from Azure DevOps: allow pipeline jobs to exchange OIDC tokens for AAD tokens without storing secrets; I can help configure this if you prefer zero-secret pipelines.
- Managed Identity: requires Azure-hosted runtime (IMDS) and is not suitable for local development without an Azure VM.

Use Playwright tag metadata (not test title suffixes):

```ts
test('Home Page', { tag: ['@[19]', '@e2e'] }, async ({ page }) => {
  // test body
});
```
