import type { QueryExecutor } from '#/app/shared/database/QueryExecutor.js';
import type { LayoutCandidate } from '#/app/workstation/domain/LayoutCandidate.js';
import type { LayoutCandidateRepository } from '#/app/workstation/domain/repositories/LayoutCandidateRepository.js';

interface LayoutCandidateRecord {
  id: string;
  name: string;
  leftMonitorId: string;
  centerDeviceId: string;
  rightMonitorId: string;
  topMonitorId: string;
  lowerRowWidthMm: number;
  topWidthMm: number;
  widthDeltaMm: number;
  sidePortraitHeightMm: number;
  centerStackHeightMm: number;
  sideHeightDeltaMm: number;
  score: number;
}

function toLayoutCandidate(record: LayoutCandidateRecord): LayoutCandidate {
  return {
    id: record.id,
    name: record.name,
    leftMonitorId: record.leftMonitorId,
    centerDeviceId: record.centerDeviceId,
    rightMonitorId: record.rightMonitorId,
    topMonitorId: record.topMonitorId,
    lowerRowWidthMm: record.lowerRowWidthMm,
    topWidthMm: record.topWidthMm,
    widthDeltaMm: record.widthDeltaMm,
    sidePortraitHeightMm: record.sidePortraitHeightMm,
    centerStackHeightMm: record.centerStackHeightMm,
    sideHeightDeltaMm: record.sideHeightDeltaMm,
    score: record.score,
    evaluations: [],
  };
}

export class SqlServerLayoutCandidateRepository implements LayoutCandidateRepository {
  public constructor(private readonly queryExecutor: QueryExecutor) {}

  public async findRankedLayoutCandidates(limit = 25): Promise<LayoutCandidate[]> {
    const result = await this.queryExecutor.query<LayoutCandidateRecord>(
      `
        SELECT TOP (@limit)
          id,
          name,
          left_monitor_id AS leftMonitorId,
          center_device_id AS centerDeviceId,
          right_monitor_id AS rightMonitorId,
          top_monitor_id AS topMonitorId,
          lower_row_width_mm AS lowerRowWidthMm,
          top_width_mm AS topWidthMm,
          width_delta_mm AS widthDeltaMm,
          side_portrait_height_mm AS sidePortraitHeightMm,
          center_stack_height_mm AS centerStackHeightMm,
          side_height_delta_mm AS sideHeightDeltaMm,
          score
        FROM workstation.layout_candidates
        ORDER BY score DESC, ABS(width_delta_mm), ABS(side_height_delta_mm);
      `,
      { limit },
    );

    return result.records.map(toLayoutCandidate);
  }

  public async findLayoutCandidateById(id: string): Promise<LayoutCandidate | null> {
    const result = await this.queryExecutor.query<LayoutCandidateRecord>(
      `
        SELECT
          id,
          name,
          left_monitor_id AS leftMonitorId,
          center_device_id AS centerDeviceId,
          right_monitor_id AS rightMonitorId,
          top_monitor_id AS topMonitorId,
          lower_row_width_mm AS lowerRowWidthMm,
          top_width_mm AS topWidthMm,
          width_delta_mm AS widthDeltaMm,
          side_portrait_height_mm AS sidePortraitHeightMm,
          center_stack_height_mm AS centerStackHeightMm,
          side_height_delta_mm AS sideHeightDeltaMm,
          score
        FROM workstation.layout_candidates
        WHERE id = @id;
      `,
      { id },
    );

    return result.records[0] ? toLayoutCandidate(result.records[0]) : null;
  }
}
