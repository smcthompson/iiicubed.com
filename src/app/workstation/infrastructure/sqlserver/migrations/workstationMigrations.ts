import { WorkstationMigration, createWorkstationDatabase, seedWorkstationReferenceData } from '#/workstation';

export const workstationMigrations: readonly WorkstationMigration[] = [createWorkstationDatabase, seedWorkstationReferenceData];
