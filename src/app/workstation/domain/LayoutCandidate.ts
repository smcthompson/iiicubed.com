import type { ConstraintEvaluation } from '#/app/workstation/domain/Constraint.js';

export interface LayoutCandidate {
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
  evaluations: ConstraintEvaluation[];
}
