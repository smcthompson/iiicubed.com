import { createWorkstationDatabase } from '#/app/workstation/infrastructure/sqlserver/migrations/001_create_workstation_database.js';
import { seedWorkstationReferenceData } from '#/app/workstation/infrastructure/sqlserver/migrations/002_seed_workstation_reference_data.js';
import type { WorkstationMigration } from '#/app/workstation/infrastructure/sqlserver/migrations/WorkstationMigration.js';

export const workstationMigrations: readonly WorkstationMigration[] = [createWorkstationDatabase, seedWorkstationReferenceData];
