import * as sql from 'mssql';
import { ManagedIdentityCredential } from '@azure/identity';
import { WorkstationSqlServerConfig, loadWorkstationSqlServerConfig } from '#/app/workstation/infrastructure/sqlserver/WorkstationSqlServerConfig.js';
import type { QueryExecutor, QueryParameters, QueryResult } from '#/app/shared/database/QueryExecutor.js';

const TOKEN_SCOPE = 'https://database.windows.net/.default';

export class MssqlManagedIdentityClient implements QueryExecutor {
  private pool?: sql.ConnectionPool;
  private credential: ManagedIdentityCredential;
  private config: WorkstationSqlServerConfig;

  constructor(config?: WorkstationSqlServerConfig) {
    this.config = config ?? loadWorkstationSqlServerConfig();
    // This application requires a user-assigned managed identity client id
    if (!this.config.managedIdentityClientId) {
      throw new Error('managedIdentityClientId is required for user-assigned managed identity');
    }
    this.credential = new ManagedIdentityCredential(this.config.managedIdentityClientId);
  }

  private async acquireAccessToken(): Promise<string> {
    const token = await this.credential.getToken(TOKEN_SCOPE);
    if (!token || !token.token) throw new Error('Failed to acquire access token for SQL');
    return token.token;
  }

  private async ensurePool(): Promise<sql.ConnectionPool> {
    if (this.pool && this.pool.connected) return this.pool;

    const accessToken = await this.acquireAccessToken();

    const config = {
      server: this.config.server,
      database: this.config.database,
      port: this.config.port,
      options: {
        encrypt: this.config.encrypt,
        trustServerCertificate: this.config.trustServerCertificate,
      },
      // Tell the tedious driver to use an AAD access token
      authentication: {
        type: 'azure-active-directory-access-token',
        options: {
          token: accessToken,
        },
      },
    } as sql.config;

    this.pool = await new sql.ConnectionPool(config).connect();
    // Renew token on error or after timeout — simple approach: attach error handler to invalidate pool
    this.pool.on('error', () => {
      try {
        this.pool?.close();
      } catch (error) {
        console.error('Error closing SQL connection pool after error', error);
      }
      this.pool = undefined;
    });

    return this.pool;
  }

  public async query<TRecord>(sqlText: string, parameters?: QueryParameters): Promise<QueryResult<TRecord>> {
    const pool = await this.ensurePool();
    const request = pool.request();

    if (parameters) {
      for (const [key, value] of Object.entries(parameters)) {
        // mssql infers type from JS value; use `input(name, value)` overload
        request.input(key, value as unknown);
      }
    }

    const result = await request.query(sqlText);
    return {
      records: result.recordset as unknown as TRecord[],
      rowsAffected: result.rowsAffected,
    };
  }
}

export function createMssqlManagedIdentityClient(config?: WorkstationSqlServerConfig) {
  return new MssqlManagedIdentityClient(config);
}
