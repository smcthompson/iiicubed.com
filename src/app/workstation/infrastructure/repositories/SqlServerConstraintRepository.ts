import type { QueryExecutor } from '#/shared';
import type { ConstraintDefinition, ConstraintOperator, ConstraintRepository } from '#/workstation';

interface ConstraintRecord {
  id: string;
  name: string;
  requirement: string;
  operator: ConstraintOperator;
  targetValue: number | boolean | string;
  unit: string;
  hardConstraint: boolean;
  weight: number;
}

function toConstraintDefinition(record: ConstraintRecord): ConstraintDefinition {
  return {
    id: record.id,
    name: record.name,
    requirement: record.requirement,
    operator: record.operator,
    targetValue: record.targetValue,
    unit: record.unit,
    hardConstraint: record.hardConstraint,
    weight: record.weight,
  };
}

export class SqlServerConstraintRepository implements ConstraintRepository {
  public constructor(private readonly queryExecutor: QueryExecutor) {}

  public async findActiveConstraints(): Promise<ConstraintDefinition[]> {
    const result = await this.queryExecutor.query<ConstraintRecord>(`
      SELECT
        id,
        name,
        requirement,
        operator,
        target_value AS targetValue,
        unit,
        hard_constraint AS hardConstraint,
        weight
      FROM workstation.constraints
      WHERE active = 1
      ORDER BY hard_constraint DESC, weight DESC, name;
    `);

    return result.records.map(toConstraintDefinition);
  }

  public async findConstraintById(id: string): Promise<ConstraintDefinition | null> {
    const result = await this.queryExecutor.query<ConstraintRecord>(
      `
        SELECT
          id,
          name,
          requirement,
          operator,
          target_value AS targetValue,
          unit,
          hard_constraint AS hardConstraint,
          weight
        FROM workstation.constraints
        WHERE id = @id;
      `,
      { id },
    );

    return result.records[0] ? toConstraintDefinition(result.records[0]) : null;
  }
}
