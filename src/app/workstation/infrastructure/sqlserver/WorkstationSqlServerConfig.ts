import { readOptionalEnv, readRequiredEnv } from '#/shared';

export type WorkstationSqlAuthenticationMode = 'auto' | 'azure-token' | 'sql-password';

export interface WorkstationSqlServerConfig {
  server: string;
  database: string;
  // TCP port
  port: number;
  // TLS settings
  encrypt: boolean;
  trustServerCertificate: boolean;
  authenticationMode: WorkstationSqlAuthenticationMode;
  // SQL Server authentication for local development or contained users.
  username?: string;
  password?: string;
  // Client id for the user-assigned managed identity (optional)
  // If not provided, DefaultAzureCredential will use environment or CLI/SP credentials.
  managedIdentityClientId?: string;
}

function readAuthenticationMode(): WorkstationSqlAuthenticationMode {
  const configuredMode = readOptionalEnv('WORKSTATION_SQL_AUTHENTICATION', 'auto');

  if (configuredMode !== 'auto' && configuredMode !== 'azure-token' && configuredMode !== 'sql-password') {
    throw new Error(`Unknown WORKSTATION_SQL_AUTHENTICATION: ${configuredMode}`);
  }

  return configuredMode;
}

export function loadWorkstationSqlServerConfig(): WorkstationSqlServerConfig {
  return {
    server: readRequiredEnv('WORKSTATION_SQL_SERVER'),
    database: readRequiredEnv('WORKSTATION_SQL_DATABASE'),
    port: Number(readOptionalEnv('WORKSTATION_SQL_PORT', '1433')),
    encrypt: readOptionalEnv('WORKSTATION_SQL_ENCRYPT', 'true') === 'true',
    trustServerCertificate: readOptionalEnv('WORKSTATION_SQL_TRUST_SERVER_CERTIFICATE', 'false') === 'true',
    authenticationMode: readAuthenticationMode(),
    username: readOptionalEnv('WORKSTATION_SQL_USER', ''),
    password: readOptionalEnv('WORKSTATION_SQL_PASSWORD', ''),
    managedIdentityClientId: readOptionalEnv('WORKSTATION_SQL_MANAGED_IDENTITY_CLIENT_ID', ''),
  };
}
