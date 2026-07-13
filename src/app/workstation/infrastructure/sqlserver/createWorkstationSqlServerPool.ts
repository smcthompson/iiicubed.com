import { DefaultAzureCredential } from '@azure/identity';
import sql from 'mssql';
import type { WorkstationSqlServerConfig } from '#/workstation';

const azureSqlScope = 'https://database.windows.net/.default';

function hasSqlPasswordCredentials(config: WorkstationSqlServerConfig): boolean {
  return Boolean(config.username && config.password);
}

function createSqlPasswordPoolConfig(config: WorkstationSqlServerConfig): sql.config {
  if (!config.username || !config.password) {
    throw new Error('WORKSTATION_SQL_USER and WORKSTATION_SQL_PASSWORD are required when WORKSTATION_SQL_AUTHENTICATION=sql-password.');
  }

  return {
    server: config.server,
    database: config.database,
    port: config.port,
    user: config.username,
    password: config.password,
    options: {
      encrypt: config.encrypt,
      trustServerCertificate: config.trustServerCertificate,
    },
  } as sql.config;
}

async function createAzureTokenPoolConfig(config: WorkstationSqlServerConfig): Promise<sql.config> {
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

  return {
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
}

async function createPoolConfig(config: WorkstationSqlServerConfig): Promise<sql.config> {
  if (config.authenticationMode === 'sql-password') {
    return createSqlPasswordPoolConfig(config);
  }

  if (config.authenticationMode === 'azure-token') {
    return createAzureTokenPoolConfig(config);
  }

  if (process.env.NODE_ENV === 'development' && hasSqlPasswordCredentials(config)) {
    return createSqlPasswordPoolConfig(config);
  }

  return createAzureTokenPoolConfig(config);
}

export async function createWorkstationSqlServerPool(config: WorkstationSqlServerConfig): Promise<sql.ConnectionPool> {
  const poolConfig = await createPoolConfig(config);
  return new sql.ConnectionPool(poolConfig).connect();
}
