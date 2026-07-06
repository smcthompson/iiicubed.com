import sql from 'mssql';
import type { QueryExecutor, QueryParameters, QueryParameterValue, QueryResult } from '#/app/shared/database/QueryExecutor.js';

function bindParameter(request: sql.Request, name: string, value: QueryParameterValue): void {
  request.input(name, value);
}

export class SqlServerQueryExecutor implements QueryExecutor {
  public constructor(private readonly pool: sql.ConnectionPool) {}

  public async query<TRecord>(sqlText: string, parameters: QueryParameters = {}): Promise<QueryResult<TRecord>> {
    const request = this.pool.request();

    for (const [name, value] of Object.entries(parameters)) {
      bindParameter(request, name, value);
    }

    const result = await request.query<TRecord>(sqlText);

    return {
      records: result.recordset ?? [],
      rowsAffected: result.rowsAffected ?? [],
    };
  }
}
