import { GetWorkstationFoundationStatus } from '#/app/workstation/application/GetWorkstationFoundationStatus.js';
import { SqlServerQueryExecutor } from '#/app/workstation/infrastructure/sqlserver/SqlServerQueryExecutor.js';
import { createWorkstationSqlServerPool } from '#/app/workstation/infrastructure/sqlserver/createWorkstationSqlServerPool.js';
import { loadWorkstationSqlServerConfig } from '#/app/workstation/infrastructure/sqlserver/WorkstationSqlServerConfig.js';
import { SqlServerConstraintRepository } from '#/app/workstation/infrastructure/repositories/SqlServerConstraintRepository.js';
import { SqlServerLayoutCandidateRepository } from '#/app/workstation/infrastructure/repositories/SqlServerLayoutCandidateRepository.js';
import { SqlServerProductRepository } from '#/app/workstation/infrastructure/repositories/SqlServerProductRepository.js';

export interface WorkstationApplication {
  getFoundationStatus: GetWorkstationFoundationStatus;
}

let cachedApplication: Promise<WorkstationApplication> | null = null;

export function getWorkstationApplication(): Promise<WorkstationApplication> {
  cachedApplication ??= createWorkstationApplication();

  return cachedApplication;
}

async function createWorkstationApplication(): Promise<WorkstationApplication> {
  const config = loadWorkstationSqlServerConfig();
  const pool = await createWorkstationSqlServerPool(config);
  const queryExecutor = new SqlServerQueryExecutor(pool);

  const productRepository = new SqlServerProductRepository(queryExecutor);
  const constraintRepository = new SqlServerConstraintRepository(queryExecutor);
  const layoutCandidateRepository = new SqlServerLayoutCandidateRepository(queryExecutor);

  return {
    getFoundationStatus: new GetWorkstationFoundationStatus({
      productRepository,
      constraintRepository,
      layoutCandidateRepository,
    }),
  };
}
