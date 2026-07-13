export type ConstraintOperator = '<=' | '>=' | '=' | '!=' | 'minimize_abs_delta' | 'maximize' | 'minimize';

export interface ConstraintDefinition {
  id: string;
  name: string;
  requirement: string;
  operator: ConstraintOperator;
  targetValue: number | boolean | string;
  unit: string;
  hardConstraint: boolean;
  weight: number;
}

export interface ConstraintEvaluation {
  constraintId: string;
  passed: boolean;
  actualValue: number | boolean | string | null;
  scoreImpact: number;
  notes?: string;
}
