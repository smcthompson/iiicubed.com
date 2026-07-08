import { readOptionalEnv, readRequiredEnv } from '#/app/shared/config/readRequiredEnv.js';

export interface WorkstationSqlServerConfig {
  server: string;
  database: string;
  // TCP port
  port: number;
  // TLS settings
  encrypt: boolean;
  trustServerCertificate: boolean;
  // Client id for the user-assigned managed identity (optional)
  // If not provided, DefaultAzureCredential will use environment or CLI/SP credentials.
  managedIdentityClientId?: string;
}

export function loadWorkstationSqlServerConfig(): WorkstationSqlServerConfig {
  return {
    server: readRequiredEnv('WORKSTATION_SQL_SERVER'),
    database: readRequiredEnv('WORKSTATION_SQL_DATABASE'),
    port: Number(readOptionalEnv('WORKSTATION_SQL_PORT', '1433')),
    encrypt: readOptionalEnv('WORKSTATION_SQL_ENCRYPT', 'true') === 'true',
    trustServerCertificate: readOptionalEnv('WORKSTATION_SQL_TRUST_SERVER_CERTIFICATE', 'false') === 'true',
    managedIdentityClientId: readOptionalEnv('WORKSTATION_SQL_MANAGED_IDENTITY_CLIENT_ID', ''),
  };
}
