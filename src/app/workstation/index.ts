export { getWorkstationApplication } from '#/app/workstation/WorkstationApplication.js';
export type { WorkstationApplication } from '#/app/workstation/WorkstationApplication.js';
export { workstationRoutes } from '#/app/workstation/presentation/routes/workstationRoutes.js';

// Application
export { GetWorkstationFoundationStatus } from '#/app/workstation/application/GetWorkstationFoundationStatus.js';
export type { WorkstationFoundationStatus, WorkstationFoundationStatusDependencies } from '#/app/workstation/application/GetWorkstationFoundationStatus.js';

// Domain
export type { LayoutCandidate } from '#/app/workstation/domain/LayoutCandidate.js';
export type { ConstraintDefinition, ConstraintEvaluation, ConstraintOperator } from '#/app/workstation/domain/Constraint.js';
export type { Product, ProductCategory, ProductStatus } from '#/app/workstation/domain/Product.js';

// Domain repositories (interfaces)
export type { ProductRepository, ProductSearchCriteria } from '#/app/workstation/domain/repositories/ProductRepository.js';
export type { ConstraintRepository } from '#/app/workstation/domain/repositories/ConstraintRepository.js';
export type { LayoutCandidateRepository } from '#/app/workstation/domain/repositories/LayoutCandidateRepository.js';

// Infrastructure - SQL Server
export { type WorkstationSqlServerConfig, loadWorkstationSqlServerConfig } from '#/app/workstation/infrastructure/sqlserver/WorkstationSqlServerConfig.js';
export { createWorkstationSqlServerPool } from '#/app/workstation/infrastructure/sqlserver/createWorkstationSqlServerPool.js';
export { SqlServerQueryExecutor } from '#/app/workstation/infrastructure/sqlserver/SqlServerQueryExecutor.js';
export { MssqlManagedIdentityClient, createMssqlManagedIdentityClient } from '#/app/workstation/infrastructure/sqlserver/MssqlManagedIdentityClient.js';

// Infrastructure - repositories
export { SqlServerConstraintRepository } from '#/app/workstation/infrastructure/repositories/SqlServerConstraintRepository.js';
export { SqlServerLayoutCandidateRepository } from '#/app/workstation/infrastructure/repositories/SqlServerLayoutCandidateRepository.js';
export { SqlServerProductRepository } from '#/app/workstation/infrastructure/repositories/SqlServerProductRepository.js';

// Migrations (exports for tooling)
export { type WorkstationMigration } from '#/app/workstation/infrastructure/sqlserver/migrations/WorkstationMigration.js';
export { createWorkstationDatabase } from '#/app/workstation/infrastructure/sqlserver/migrations/001_create_workstation_database.js';
export { seedWorkstationReferenceData } from '#/app/workstation/infrastructure/sqlserver/migrations/002_seed_workstation_reference_data.js';
export { workstationMigrations } from '#/app/workstation/infrastructure/sqlserver/migrations/workstationMigrations.js';
