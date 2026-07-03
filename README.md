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

Use Playwright tag metadata (not test title suffixes):

```ts
test('Home Page', { tag: ['@[19]', '@e2e'] }, async ({ page }) => {
  // test body
});
```
