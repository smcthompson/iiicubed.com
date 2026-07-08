import { GetWorkstationFoundationStatus, SqlServerQueryExecutor, createWorkstationSqlServerPool, loadWorkstationSqlServerConfig, SqlServerConstraintRepository, SqlServerLayoutCandidateRepository, SqlServerProductRepository } from '#/workstation';

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
