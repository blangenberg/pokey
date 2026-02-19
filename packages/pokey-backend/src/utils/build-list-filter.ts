export interface ListFilterParams {
  name?: string;
  id?: string;
  status?: string;
  schemaId?: string;
}

export interface ListFilterResult {
  filterExpression: string | undefined;
  expressionAttributeNames: Record<string, string>;
  expressionAttributeValues: Record<string, unknown>;
}

export function buildListFilter(params: ListFilterParams): ListFilterResult {
  const filters: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};

  if (params.name) {
    filters.push('contains(#n, :nameFilter)');
    expressionAttributeNames['#n'] = 'name';
    expressionAttributeValues[':nameFilter'] = params.name.toLowerCase();
  }

  if (params.id) {
    filters.push('contains(id, :idFilter)');
    expressionAttributeValues[':idFilter'] = params.id.toLowerCase();
  }

  if (params.status) {
    filters.push('#s = :status');
    expressionAttributeNames['#s'] = 'status';
    expressionAttributeValues[':status'] = params.status;
  }

  if (params.schemaId) {
    filters.push('schemaId = :schemaId');
    expressionAttributeValues[':schemaId'] = params.schemaId;
  }

  return {
    filterExpression: filters.length > 0 ? filters.join(' AND ') : undefined,
    expressionAttributeNames,
    expressionAttributeValues,
  };
}
