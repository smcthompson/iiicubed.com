import type { LayoutCandidate } from '#/app/workstation/domain/LayoutCandidate.js';

export interface LayoutCandidateRepository {
  findRankedLayoutCandidates(limit?: number): Promise<LayoutCandidate[]>;
  findLayoutCandidateById(id: string): Promise<LayoutCandidate | null>;
}
