/// <reference types="node" />
import type { FullConfig, FullResult, Reporter, TestCase, TestResult, TestStep } from '@playwright/test/reporter';
import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';

type Outcome = 'Pass' | 'Fail' | 'Pending';

type ReporterOptions = {
  enabled?: boolean;
  organizationUrl?: string;
  project?: string;
  pat?: string;
  accessToken?: string;
  verificationWorkItemType?: string;
  outcomeField?: string;
  evidenceField?: string;
  evidencePath?: string;
  parentRollupField?: string;
  updateState?: boolean;
  passState?: string;
  failState?: string;
  pendingState?: string;
  apiVersion?: string;
};

type StepRecord = {
  index: number;
  depth: number;
  titlePath: string;
  title: string;
  category: string;
  status: Outcome;
  durationMs: number;
  error?: string;
};

type TestRecord = {
  title: string;
  status: Outcome;
  durationMs: number;
  retry: number;
  error?: string;
  steps: StepRecord[];
};

type VerificationAggregate = {
  workItemId: number;
  outcome: Outcome;
  tests: TestRecord[];
};

type WorkItem = {
  id: number;
  fields: Record<string, unknown>;
  relations?: Array<{ rel?: string; url?: string }>;
};

class AdoVerificationReporter implements Reporter {
  private options: Required<ReporterOptions>;
  private runStartedAt = new Date().toISOString();
  private aggregates = new Map<number, VerificationAggregate>();

  constructor(options: ReporterOptions = {}) {
    this.options = {
      enabled: options.enabled ?? true,
      organizationUrl: (options.organizationUrl ?? '').trim().replace(/\/$/, ''),
      project: (options.project ?? '').trim(),
      pat: (options.pat ?? '').trim(),
      accessToken: (options.accessToken ?? '').trim(),
      verificationWorkItemType: (options.verificationWorkItemType ?? 'Verification').trim(),
      outcomeField: (options.outcomeField ?? '').trim(),
      evidenceField: (options.evidenceField ?? '').trim(),
      evidencePath: (options.evidencePath ?? 'playwright-report/index.html').trim(),
      parentRollupField: (options.parentRollupField ?? '').trim(),
      updateState: options.updateState ?? true,
      passState: (options.passState ?? 'Pass').trim(),
      failState: (options.failState ?? 'Fail').trim(),
      pendingState: (options.pendingState ?? 'Pending').trim(),
      apiVersion: (options.apiVersion ?? '7.1').trim(),
    };
  }

  onBegin(_config: FullConfig): void {
    if (!this.options.enabled) {
      console.log('[ado-verification-reporter] Disabled via configuration.');
      return;
    }

    if (!this.options.organizationUrl || !this.options.project) {
      console.log('[ado-verification-reporter] Missing ADO_ORG_URL or ADO_PROJECT. Reporter will skip updates.');
    }

    if (!this.options.pat && !this.options.accessToken) {
      console.log('[ado-verification-reporter] Missing ADO_PAT or ADO_ACCESS_TOKEN. Reporter will skip updates.');
    }

    if (!this.options.outcomeField) {
      console.log('[ado-verification-reporter] Missing ADO_VERIFICATION_OUTCOME_FIELD. Reporter will skip field updates.');
    }
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    if (!this.options.enabled) {
      return;
    }

    const workItemId = this.extractWorkItemId(test.tags);
    if (!workItemId) {
      return;
    }

    const mappedOutcome = this.mapOutcome(result.status);
    const steps = this.collectStepRecords(result.steps);
    const record: TestRecord = {
      title: test.title,
      status: mappedOutcome,
      durationMs: result.duration,
      retry: result.retry,
      error: result.error?.message,
      steps,
    };

    const existing = this.aggregates.get(workItemId);
    if (!existing) {
      this.aggregates.set(workItemId, {
        workItemId,
        outcome: mappedOutcome,
        tests: [record],
      });
      return;
    }

    existing.outcome = this.mergeOutcome(existing.outcome, mappedOutcome);
    existing.tests.push(record);
  }

  async onEnd(_result: FullResult): Promise<void> {
    if (!this.options.enabled || this.aggregates.size === 0) {
      return;
    }

    if (!this.isConfiguredForPush()) {
      console.log('[ado-verification-reporter] Reporter is not fully configured. No ADO updates were performed.');
      return;
    }

    // debug: print aggregates summary for troubleshooting
    try {
      const ids = [...this.aggregates.keys()];
      const m = `[ado-verification-reporter] Aggregates: count=${this.aggregates.size} ids=${ids.join(',')}`;
      console.log(m);
      try { fs.mkdirSync(path.resolve('test-results'), { recursive: true }); fs.appendFileSync(path.resolve('test-results/ado-reporter.log'), m + '\n'); } catch (err) { console.debug(`[ado-verification-reporter] Failed to write aggregates log: ${String(err)}`); }
      if (process.env.ADO_VERIFICATION_VERBOSE === 'true') {
        for (const [id, agg] of this.aggregates) {
          const m2 = `[ado-verification-reporter] Aggregate ${id}: outcome=${agg.outcome} tests=${agg.tests.length}`;
          console.log(m2);
          try { fs.appendFileSync(path.resolve('test-results/ado-reporter.log'), m2 + '\n'); } catch (err) { console.debug(`[ado-verification-reporter] Failed to write aggregate entry: ${String(err)}`); }
        }
      }
    } catch (e) {
      console.log(`[ado-verification-reporter] Failed to dump aggregates for debug: ${String(e)}`);
    }

    const parentIds = new Set<number>();

    for (const aggregate of this.aggregates.values()) {
      try {
        const workItem = await this.getWorkItem(aggregate.workItemId, true);
        if (!workItem) {
          console.log(`[ado-verification-reporter] Work item ${aggregate.workItemId} not found.`);
          continue;
        }

        const wiType = String(workItem.fields['System.WorkItemType'] ?? '');
        if (wiType.toLowerCase() !== this.options.verificationWorkItemType.toLowerCase()) {
          console.log(`[ado-verification-reporter] Work item ${aggregate.workItemId} is '${wiType}', expected '${this.options.verificationWorkItemType}'. Skipping.`);
          continue;
        }
        // collect all related work items (any relation type that points to a work item)
        const relatedIds = this.getRelatedWorkItemIds(workItem.relations);
        for (const id of relatedIds) {
          parentIds.add(id);

          // for each related item also walk its hierarchy ancestors so rollups propagate upward
          let current = id;
          while (true) {
            const parent = await this.getWorkItem(current, true);
            if (!parent) break;
            const next = this.getParentId(parent.relations);
            if (!next || parentIds.has(next)) break;
            parentIds.add(next);
            current = next;
          }
        }

        await this.patchVerificationOutcome(aggregate);
      } catch (error) {
        console.log(`[ado-verification-reporter] Failed to update verification item ${aggregate.workItemId}: ${this.stringifyError(error)}`);
      }
    }

    if (!this.options.parentRollupField) {
      return;
    }

    for (const parentId of parentIds) {
      try {
        await this.updateParentRollup(parentId);
      } catch (error) {
        console.log(`[ado-verification-reporter] Failed to update parent rollup for ${parentId}: ${this.stringifyError(error)}`);
      }
    }
  }

  private isConfiguredForPush(): boolean {
    return Boolean(this.options.organizationUrl && this.options.project && (this.options.pat || this.options.accessToken) && this.options.outcomeField);
  }

  private extractWorkItemId(tags: string[]): number | null {
    for (const tag of tags) {
      const match = /^@\[(\d+)\]$/.exec(tag.trim());
      if (match) {
        return Number(match[1]);
      }
    }

    return null;
  }

  private collectStepRecords(steps: TestStep[]): StepRecord[] {
    const records: StepRecord[] = [];
    let index = 1;

    const visit = (step: TestStep, parentPath: string[], depth: number): void => {
      const titlePath = [...parentPath, step.title];
      if (!step.steps.length) {
        records.push({
          index,
          depth,
          titlePath: titlePath.join(' > '),
          title: step.title,
          category: step.category,
          status: step.error ? 'Fail' : 'Pass',
          durationMs: step.duration,
          error: step.error?.message,
        });
        index += 1;
        return;
      }

      for (const child of step.steps) {
        visit(child, titlePath, depth + 1);
      }
    };

    for (const step of steps) {
      visit(step, [], 0);
    }

    return records;
  }

  private mapOutcome(status: TestResult['status']): Outcome {
    if (status === 'passed') {
      return 'Pass';
    }

    if (status === 'skipped') {
      return 'Pending';
    }

    return 'Fail';
  }

  private mergeOutcome(current: Outcome, incoming: Outcome): Outcome {
    const rank: Record<Outcome, number> = {
      Fail: 3,
      Pending: 2,
      Pass: 1,
    };

    return rank[incoming] > rank[current] ? incoming : current;
  }

  private mapOutcomeToState(outcome: Outcome): string {
    if (outcome === 'Pass') {
      return this.options.passState;
    }

    if (outcome === 'Fail') {
      return this.options.failState;
    }

    return this.options.pendingState;
  }
  private async patchVerificationOutcome(aggregate: VerificationAggregate): Promise<void> {
    // Build base operations (exclude outcome field initially so we can retry different labels if the project's picklist rejects our value)
    const baseOperations: Array<{ op: 'add' | 'replace'; path: string; value: unknown }> = [];

    if (this.options.updateState) {
      baseOperations.push({
        op: 'add',
        path: '/fields/System.State',
        value: this.mapOutcomeToState(aggregate.outcome),
      });
    }

    // Add a concise history entry so updates are visible in the work item activity
    baseOperations.push({
      op: 'add',
      path: '/fields/System.History',
      value: `Playwright run updated by reporter on ${new Date().toISOString()} (started ${this.runStartedAt}). Outcome: ${aggregate.outcome}. Tests: ${aggregate.tests.length}`,
    });

    // If configured, upload the Playwright HTML report as an attachment and set the evidence field
    if (this.options.evidenceField) {
      try {
        const reportPath = path.resolve(this.options.evidencePath);
        const attachUrl = await this.uploadAttachment(reportPath);
        if (attachUrl) {
          // set evidence field to the attachment URL
          baseOperations.push({
            op: 'add',
            path: `/fields/${this.options.evidenceField}`,
            value: attachUrl,
          });

          // add an AttachedFile relation so the attachment appears on the work item
          baseOperations.push({
            op: 'add',
            path: '/relations/-',
            value: {
              rel: 'AttachedFile',
              url: attachUrl,
              attributes: { comment: 'Playwright HTML report' },
            },
          });
        }
      } catch (err) {
        console.log(`[ado-verification-reporter] Failed to upload attachment: ${this.stringifyError(err)}`);
      }
    }

    // Attempt to choose an allowed picklist value for the outcome field if it is a picklist
    let chosenOutcome: string | null = null;
    if (this.options.outcomeField) {
      try {
        const allowed = await this.getFieldPicklistValues(this.options.outcomeField);
        if (allowed.length) {
          const target = aggregate.outcome.toLowerCase();
          // try to find a close match
          chosenOutcome = allowed.find((v) => v.toLowerCase() === target) ?? allowed.find((v) => v.toLowerCase().includes(target)) ?? allowed.find((v) => target.includes(v.toLowerCase())) ?? allowed[0];
        }
      } catch (err) {
        console.log(`[ado-verification-reporter] Failed to fetch picklist for ${this.options.outcomeField}: ${this.stringifyError(err)}`);
      }
    }

    const ops = [...baseOperations];
    if (chosenOutcome) {
      ops.unshift({ op: 'add', path: `/fields/${this.options.outcomeField}`, value: chosenOutcome });
    }

    try {
      await this.patchWorkItem(aggregate.workItemId, ops);
      return;
    } catch (err) {
      const text = String(err instanceof Error ? err.message : err);
      // if the error is due to System.State, retry without State
      if (this.options.updateState && /Failed to set System.State|RuleValidationException/.test(text)) {
        const opsNoState = ops.filter((o) => o.path !== '/fields/System.State');
        try {
          await this.patchWorkItem(aggregate.workItemId, opsNoState);
          return;
        } catch (err2) {
          console.log(`[ado-verification-reporter] Retry without state failed: ${this.stringifyError(err2)}`);
        }
      }
      console.log(`[ado-verification-reporter] Failed to update verification item ${aggregate.workItemId}: ${this.stringifyError(err)}`);
    }

    return;
  }

  private async getFieldPicklistValues(fieldRef: string): Promise<string[]> {
    try {
      const field = await this.request<Record<string, unknown>>('GET', `/_apis/wit/fields/${encodeURIComponent(fieldRef)}?api-version=${encodeURIComponent(this.options.apiVersion)}`);
      let picklistId: string | null = null;
      if (field) {
        if (typeof field['picklistId'] === 'string') picklistId = field['picklistId'] as string;
        else if (field['picklist'] && typeof field['picklist'] === 'object') {
          const p = field['picklist'] as Record<string, unknown>;
          if (typeof p['id'] === 'string') picklistId = p['id'] as string;
        }
      }
      if (!picklistId) return [];

      // try picklists API
      try {
        const picklist = await this.request<Record<string, unknown>>('GET', `/_apis/wit/picklists/${encodeURIComponent(picklistId)}?api-version=${encodeURIComponent(this.options.apiVersion)}`);
        const itemsRaw = picklist?.['items'] ?? picklist?.['values'] ?? picklist?.['allowedValues'] ?? [];
        if (!Array.isArray(itemsRaw)) return [];
        return itemsRaw.map((item) => {
          if (item && typeof item === 'object') {
            const it = item as Record<string, unknown>;
            return String(it['value'] ?? it['name'] ?? '');
          }
          return String(item ?? '');
        }).filter(Boolean);
      } catch {
        return [];
      }
    } catch (err) {
      console.debug(`[ado-verification-reporter] getFieldPicklistValues failed: ${String(err)}`);
      return [];
    }
  }


  private async updateParentRollup(parentId: number): Promise<void> {
    const parent = await this.getWorkItem(parentId, true);
    if (!parent) {
      return;
    }

    const childIds = this.getChildIds(parent.relations);
    if (!childIds.length) {
      return;
    }

    const children = await this.getWorkItems(childIds);
    const relevant = children.filter((wi) => {
      const wiType = String(wi.fields['System.WorkItemType'] ?? '');
      return wiType.toLowerCase() === this.options.verificationWorkItemType.toLowerCase();
    });

    const counts = {
      total: relevant.length,
      pass: 0,
      fail: 0,
      pending: 0,
      unknown: 0,
    };

    for (const wi of relevant) {
      const value = String(wi.fields[this.options.outcomeField] ?? '')
        .trim()
        .toLowerCase();
      if (value === 'pass' || value === 'passed') {
        counts.pass += 1;
      } else if (value === 'fail' || value === 'failed') {
        counts.fail += 1;
      } else if (value === 'pending' || value === 'not run') {
        counts.pending += 1;
      } else {
        counts.unknown += 1;
      }
    }

    const rollup = `Verification Rollup | Total: ${counts.total} | Pass: ${counts.pass} | Fail: ${counts.fail} | Pending: ${counts.pending} | Unknown: ${counts.unknown} | Updated: ${new Date().toISOString()}`;

    await this.patchWorkItem(parentId, [
      {
        op: 'add',
        path: `/fields/${this.options.parentRollupField}`,
        value: rollup,
      },
      {
        op: 'add',
        path: '/fields/System.History',
        value: `Verification rollup updated by Playwright reporter: ${rollup}`,
      },
    ]);
  }

  private getParentId(relations: WorkItem['relations'] = []): number | null {
    const relation = relations.find((r) => r.rel === 'System.LinkTypes.Hierarchy-Reverse' && r.url);
    if (!relation?.url) {
      return null;
    }

    return this.parseWorkItemIdFromUrl(relation.url);
  }

  private getChildIds(relations: WorkItem['relations'] = []): number[] {
    const ids: number[] = [];

    for (const relation of relations) {
      if (relation.rel !== 'System.LinkTypes.Hierarchy-Forward' || !relation.url) {
        continue;
      }

      const id = this.parseWorkItemIdFromUrl(relation.url);
      if (id) {
        ids.push(id);
      }
    }

    return ids;
  }

  private getRelatedWorkItemIds(relations: WorkItem['relations'] = []): number[] {
    const ids: number[] = [];
    for (const rel of relations) {
      if (!rel?.url) continue;
      const id = this.parseWorkItemIdFromUrl(rel.url);
      if (id) ids.push(id);
    }
    return ids;
  }

  private parseWorkItemIdFromUrl(url: string): number | null {
    const match = /\/workItems\/(\d+)$/i.exec(url);
    if (!match) {
      return null;
    }

    return Number(match[1]);
  }

  private async getWorkItems(ids: number[]): Promise<WorkItem[]> {
    if (!ids.length) {
      return [];
    }

    const joined = ids.join(',');
    const path = `/_apis/wit/workitems?ids=${encodeURIComponent(joined)}&$expand=relations&api-version=${encodeURIComponent(this.options.apiVersion)}`;
    const payload = await this.request<{ value: WorkItem[] }>('GET', path);
    return payload.value ?? [];
  }

  private async getWorkItem(id: number, expandRelations = false): Promise<WorkItem | null> {
    const expand = expandRelations ? '&$expand=relations' : '';
    const path = `/_apis/wit/workitems/${id}?api-version=${encodeURIComponent(this.options.apiVersion)}${expand}`;

    try {
      return await this.request<WorkItem>('GET', path);
    } catch {
      return null;
    }
  }

  private async patchWorkItem(id: number, operations: Array<{ op: 'add' | 'replace'; path: string; value: unknown }>): Promise<void> {
    const path = `/_apis/wit/workitems/${id}?api-version=${encodeURIComponent(this.options.apiVersion)}`;
    await this.request('PATCH', path, operations, 'application/json-patch+json');
  }

  private async request<T = unknown>(method: 'GET' | 'POST' | 'PATCH', apiPath: string, body?: unknown, contentType = 'application/json'): Promise<T> {
    const url = `${this.options.organizationUrl}/${this.options.project}${apiPath}`;
    const headers = this.buildAuthHeaders(contentType);
    const verbose = process.env.ADO_VERIFICATION_VERBOSE === 'true' || process.env.ADO_VERIFICATION_VERBOSE === '1';
    if (verbose) {
      const m = `[ado-verification-reporter] REQUEST ${method} ${url} body=${body ? JSON.stringify(body) : '<none>'}`;
      console.log(m);
      try {
        fs.appendFileSync(path.resolve('test-results/ado-reporter.log'), m + '\n');
      } catch (err) {
        console.debug(`[ado-verification-reporter] Failed to write request log: ${String(err)}`);
      }
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    if (!response.ok) {
      const err = `ADO API ${method} ${url} failed (${response.status}): ${text}`;
      try { fs.appendFileSync(path.resolve('test-results/ado-reporter.log'), err + '\n'); } catch (e) { console.debug(`[ado-verification-reporter] Failed to write error log: ${String(e)}`); }
      throw new Error(err);
    }

    if (response.status === 204) {
      if (verbose) console.log(`[ado-verification-reporter] RESPONSE ${method} ${url} status=${response.status} (no content)`);
      return {} as T;
    }

    if (verbose) {
      const m = `[ado-verification-reporter] RESPONSE ${method} ${url} status=${response.status} body=${text}`;
      console.log(m);
      try {
        fs.appendFileSync(path.resolve('test-results/ado-reporter.log'), m + '\n');
      } catch (err) {
        console.debug(`[ado-verification-reporter] Failed to write response log: ${String(err)}`);
      }
    }

    try {
      return JSON.parse(text) as T;
    } catch (e) {
      console.debug(`[ado-verification-reporter] JSON parse failed: ${String(e)}`);
      return (text as unknown) as T;
    }
  }

  private async uploadAttachment(filePath: string): Promise<string | null> {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const filename = path.basename(filePath);
      const urlPath = `/_apis/wit/attachments?fileName=${encodeURIComponent(filename)}&api-version=${encodeURIComponent(this.options.apiVersion)}`;
      const url = `${this.options.organizationUrl}/${this.options.project}${urlPath}`;
      const headers = this.buildAuthHeaders('application/octet-stream');
      const data = await fs.promises.readFile(filePath);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: data,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Attachment upload failed (${response.status}): ${text}`);
      }

      const json = await response.json();
      // API returns a url to the uploaded attachment
      return String(json.url ?? json.value?.url ?? '');
    } catch (err) {
      console.log(`[ado-verification-reporter] uploadAttachment error: ${this.stringifyError(err)}`);
      return null;
    }
  }

  private buildAuthHeaders(contentType: string): Record<string, string> {
    if (this.options.pat) {
      const basic = Buffer.from(`:${this.options.pat}`, 'utf8').toString('base64');
      return {
        Authorization: `Basic ${basic}`,
        'Content-Type': contentType,
      };
    }

    return {
      Authorization: `Bearer ${this.options.accessToken}`,
      'Content-Type': contentType,
    };
  }

  private stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}

export default AdoVerificationReporter;
