export type QueryParameterValue = string | number | boolean | Date | null;

export type QueryParameters = Record<string, QueryParameterValue>;

export interface QueryResult<TRecord> {
  records: TRecord[];
  rowsAffected: number[];
}

export interface QueryExecutor {
  query<TRecord>(sqlText: string, parameters?: QueryParameters): Promise<QueryResult<TRecord>>;
}
