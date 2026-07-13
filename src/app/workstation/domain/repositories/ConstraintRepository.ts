import type { ConstraintDefinition } from '#/workstation';

export interface ConstraintRepository {
  findActiveConstraints(): Promise<ConstraintDefinition[]>;
  findConstraintById(id: string): Promise<ConstraintDefinition | null>;
}
