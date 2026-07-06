import { ManagedIdentityCredential } from '@azure/identity';
import * as sql from 'mssql';
import type { WorkstationSqlServerConfig } from '#/app/workstation/infrastructure/sqlserver/WorkstationSqlServerConfig.js';

const azureSqlScope = 'https://database.windows.net/.default';

export async function createWorkstationSqlServerPool(config: WorkstationSqlServerConfig): Promise<sql.ConnectionPool> {
  const credential = new ManagedIdentityCredential(config.managedIdentityClientId);
  const token = await credential.getToken(azureSqlScope);

  if (!token) {
    throw new Error('Unable to acquire Azure SQL managed identity access token.');
  }

  const pool = new sql.ConnectionPool({
    server: config.server,
    database: config.database,
    port: config.port,
    options: {
      encrypt: config.encrypt,
      trustServerCertificate: config.trustServerCertificate,
    },
    authentication: {
      type: 'azure-active-directory-msi',
      options: {
        clientId: config.managedIdentityClientId,
      },
    },
  } as sql.config);

  return pool.connect();
}
