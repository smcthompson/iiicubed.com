import 'dotenv/config';
import { SqlServerQueryExecutor, createWorkstationSqlServerPool, loadWorkstationSqlServerConfig, workstationMigrations } from '#/workstation';

interface AppliedMigrationRecord {
  id: string;
}

async function ensureMigrationLedger(queryExecutor: SqlServerQueryExecutor): Promise<void> {
  await queryExecutor.query(`
    IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'workstation')
    BEGIN
      EXEC('CREATE SCHEMA workstation');
    END;

    IF OBJECT_ID('workstation.schema_migrations', 'U') IS NULL
    BEGIN
      CREATE TABLE workstation.schema_migrations (
        id NVARCHAR(128) NOT NULL CONSTRAINT pk_workstation_schema_migrations PRIMARY KEY,
        description NVARCHAR(512) NOT NULL,
        applied_at_utc DATETIME2(0) NOT NULL CONSTRAINT df_workstation_schema_migrations_applied_at_utc DEFAULT SYSUTCDATETIME()
      );
    END;
  `);
}

async function getAppliedMigrationIds(queryExecutor: SqlServerQueryExecutor): Promise<Set<string>> {
  const result = await queryExecutor.query<AppliedMigrationRecord>(`
    SELECT id
    FROM workstation.schema_migrations;
  `);

  return new Set(result.records.map((record) => record.id));
}

async function run(): Promise<void> {
  const config = loadWorkstationSqlServerConfig();
  const pool = await createWorkstationSqlServerPool(config);
  const queryExecutor = new SqlServerQueryExecutor(pool);

  try {
    await ensureMigrationLedger(queryExecutor);
    const appliedMigrationIds = await getAppliedMigrationIds(queryExecutor);

    for (const migration of workstationMigrations) {
      if (appliedMigrationIds.has(migration.id)) {
        // eslint-disable-next-line no-console
        console.log(`Skipping ${migration.id}; already applied.`);
        continue;
      }

      // eslint-disable-next-line no-console
      console.log(`Applying ${migration.id}: ${migration.description}`);

      await queryExecutor.query(
        `
        BEGIN TRY
          BEGIN TRANSACTION;

          ${migration.sql}

          INSERT INTO workstation.schema_migrations (id, description)
          VALUES (@migrationId, @description);

          COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
          IF @@TRANCOUNT > 0
          BEGIN
            ROLLBACK TRANSACTION;
          END;

          THROW;
        END CATCH;
      `,
        {
          migrationId: migration.id,
          description: migration.description,
        },
      );
    }
  } finally {
    await pool.close();
  }
}

run().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
