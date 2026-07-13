import sql from 'mssql';
import { DefaultAzureCredential } from '@azure/identity';
import { WorkstationSqlServerConfig, loadWorkstationSqlServerConfig } from '#/workstation';
import type { QueryExecutor, QueryParameters, QueryResult } from '#/shared';

const TOKEN_SCOPE = 'https://database.windows.net/.default';

export class AzureSqlTokenClient implements QueryExecutor {
  private pool?: sql.ConnectionPool;
  private credential: DefaultAzureCredential;
  private config: WorkstationSqlServerConfig;

  constructor(config?: WorkstationSqlServerConfig) {
    this.config = config ?? loadWorkstationSqlServerConfig();

    if (this.config.authenticationMode === 'sql-password') {
      throw new Error('AzureSqlTokenClient only supports Azure token authentication. Use createWorkstationSqlServerPool for SQL password authentication.');
    }

    // Use DefaultAzureCredential so local dev fallbacks (Azure CLI / VS Code)
    // are available while still supporting user-assigned managed identity in Azure.
    // The managedIdentityClientId is optional — when present it will prefer the
    // user-assigned managed identity; otherwise DefaultAzureCredential will
    // fall back to environment/service principal or CLI credentials.
    if (this.config.managedIdentityClientId) {
      this.credential = new DefaultAzureCredential({ managedIdentityClientId: this.config.managedIdentityClientId });
    } else {
      this.credential = new DefaultAzureCredential();
    }
  }

  private async acquireAccessToken(): Promise<string> {
    try {
      const token = await this.credential.getToken(TOKEN_SCOPE);
      if (!token || !token.token) throw new Error('Failed to acquire access token for SQL');
      return token.token;
    } catch (err) {
      throw new Error(`Failed to acquire access token for SQL: ${String(err)}`);
    }
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

export function createAzureSqlTokenClient(config?: WorkstationSqlServerConfig) {
  return new AzureSqlTokenClient(config);
}
