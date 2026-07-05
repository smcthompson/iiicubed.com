import { readOptionalEnv, readRequiredEnv } from '#/app/shared/config/readRequiredEnv.js';

export interface WorkstationSqlServerConfig {
  server: string;
  database: string;
  user: string;
  password: string;
  port: number;
  encrypt: boolean;
  trustServerCertificate: boolean;
}

export function loadWorkstationSqlServerConfig(): WorkstationSqlServerConfig {
  return {
    server: readRequiredEnv('WORKSTATION_SQL_SERVER'),
    database: readRequiredEnv('WORKSTATION_SQL_DATABASE'),
    user: readRequiredEnv('WORKSTATION_SQL_USER'),
    password: readRequiredEnv('WORKSTATION_SQL_PASSWORD'),
    port: Number(readOptionalEnv('WORKSTATION_SQL_PORT', '1433')),
    encrypt: readOptionalEnv('WORKSTATION_SQL_ENCRYPT', 'true') === 'true',
    trustServerCertificate: readOptionalEnv('WORKSTATION_SQL_TRUST_SERVER_CERTIFICATE', 'false') === 'true',
  };
}
