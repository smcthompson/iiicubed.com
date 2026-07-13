import type { LayoutCandidate } from '#/workstation';

export interface LayoutCandidateRepository {
  findRankedLayoutCandidates(limit?: number): Promise<LayoutCandidate[]>;
  findLayoutCandidateById(id: string): Promise<LayoutCandidate | null>;
}
