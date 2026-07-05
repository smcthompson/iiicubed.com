import type { ConstraintDefinition } from '#/app/workstation/domain/Constraint.js';

export interface ConstraintRepository {
  findActiveConstraints(): Promise<ConstraintDefinition[]>;
  findConstraintById(id: string): Promise<ConstraintDefinition | null>;
}
