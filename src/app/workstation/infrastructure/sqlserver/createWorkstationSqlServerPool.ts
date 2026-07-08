import { DefaultAzureCredential } from '@azure/identity';
import sql from 'mssql';
import type { WorkstationSqlServerConfig } from '#/workstation';

const azureSqlScope = 'https://database.windows.net/.default';

export async function createWorkstationSqlServerPool(config: WorkstationSqlServerConfig): Promise<sql.ConnectionPool> {
  // Use DefaultAzureCredential so local dev (Azure CLI / VS Code) and
  // managed identity (IMDS) are both supported. When running in Azure,
  // DefaultAzureCredential will prefer the assigned managed identity.
  // Prefer a user-assigned managed identity when configured; otherwise
  // allow DefaultAzureCredential to fall back to environment/CLI/SP credentials.
  const credential = config.managedIdentityClientId ? new DefaultAzureCredential({ managedIdentityClientId: config.managedIdentityClientId }) : new DefaultAzureCredential();
  let token;
  try {
    token = await credential.getToken(azureSqlScope);
  } catch (err) {
    throw new Error(`Unable to acquire Azure SQL access token: ${String(err)}`);
  }

  if (!token) {
    throw new Error('Unable to acquire Azure SQL access token.');
  }

  // Build a config that uses an AAD access token for authentication.
  const poolConfig = {
    server: config.server,
    database: config.database,
    port: config.port,
    options: {
      encrypt: config.encrypt,
      trustServerCertificate: config.trustServerCertificate,
    },
    authentication: {
      type: 'azure-active-directory-access-token',
      options: {
        token: token.token,
      },
    },
  } as sql.config;

  // Use the mssql helper `connect` which returns a connected ConnectionPool.
  const pool = await sql.connect(poolConfig);
  return pool;
}
