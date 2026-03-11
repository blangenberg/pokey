import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  BatchGetCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

export interface DataLayerConfig {
  region: string;
  endpoint?: string;
}

export interface QueryOptions {
  tableName: string;
  indexName?: string;
  keyConditionExpression: string;
  expressionAttributeValues: Record<string, unknown>;
  expressionAttributeNames?: Record<string, string>;
  filterExpression?: string;
  limit?: number;
  exclusiveStartKey?: Record<string, unknown>;
  projectionExpression?: string;
  scanIndexForward?: boolean;
}

export interface ScanOptions {
  tableName: string;
  limit?: number;
  exclusiveStartKey?: Record<string, unknown>;
  filterExpression?: string;
  expressionAttributeValues?: Record<string, unknown>;
  expressionAttributeNames?: Record<string, string>;
  projectionExpression?: string;
}

export interface PagedResult<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, unknown>;
}

export class DataLayer {
  private readonly client: DynamoDBDocumentClient;

  constructor(config: DataLayerConfig) {
    const dynamoClient = new DynamoDBClient({
      region: config.region,
      ...(config.endpoint ? { endpoint: config.endpoint } : {}),
    });

    this.client = DynamoDBDocumentClient.from(dynamoClient, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }

  async get<T>(tableName: string, key: Record<string, unknown>): Promise<T | undefined> {
    const result = await this.client.send(new GetCommand({ TableName: tableName, Key: key }));
    return result.Item as T | undefined;
  }

  async batchGet<T>(tableName: string, keys: Record<string, unknown>[]): Promise<T[]> {
    if (keys.length === 0) return [];

    const results: T[] = [];
    let unprocessed: Record<string, unknown>[] | undefined = keys;
    const maxAttempts = 4;

    for (let attempt = 0; unprocessed && unprocessed.length > 0 && attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 50 * Math.pow(2, attempt)));
      }

      const response = await this.client.send(
        new BatchGetCommand({
          RequestItems: { [tableName]: { Keys: unprocessed } },
        }),
      );

      results.push(...((response.Responses?.[tableName] ?? []) as T[]));
      unprocessed = response.UnprocessedKeys?.[tableName]?.Keys as Record<string, unknown>[] | undefined;
    }

    return results;
  }

  async put(tableName: string, item: Record<string, unknown>): Promise<void> {
    await this.client.send(new PutCommand({ TableName: tableName, Item: item }));
  }

  async query<T>(options: QueryOptions): Promise<PagedResult<T>> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: options.tableName,
        IndexName: options.indexName,
        KeyConditionExpression: options.keyConditionExpression,
        ExpressionAttributeValues: options.expressionAttributeValues,
        ExpressionAttributeNames: options.expressionAttributeNames,
        FilterExpression: options.filterExpression,
        Limit: options.limit,
        ExclusiveStartKey: options.exclusiveStartKey,
        ProjectionExpression: options.projectionExpression,
        ScanIndexForward: options.scanIndexForward,
      }),
    );

    return {
      items: (result.Items ?? []) as T[],
      lastEvaluatedKey: result.LastEvaluatedKey as Record<string, unknown> | undefined,
    };
  }

  async scan<T>(options: ScanOptions): Promise<PagedResult<T>> {
    const result = await this.client.send(
      new ScanCommand({
        TableName: options.tableName,
        Limit: options.limit,
        ExclusiveStartKey: options.exclusiveStartKey,
        FilterExpression: options.filterExpression,
        ExpressionAttributeValues: options.expressionAttributeValues,
        ExpressionAttributeNames: options.expressionAttributeNames,
        ProjectionExpression: options.projectionExpression,
      }),
    );

    return {
      items: (result.Items ?? []) as T[],
      lastEvaluatedKey: result.LastEvaluatedKey as Record<string, unknown> | undefined,
    };
  }

  async update(tableName: string, key: Record<string, unknown>, updates: Record<string, unknown>): Promise<void> {
    const updateExpressions: string[] = [];
    const expressionAttributeValues: Record<string, unknown> = {};
    const expressionAttributeNames: Record<string, string> = {};

    for (const [field, value] of Object.entries(updates)) {
      const attrName = `#${field}`;
      const attrValue = `:${field}`;
      expressionAttributeNames[attrName] = field;
      expressionAttributeValues[attrValue] = value;
      updateExpressions.push(`${attrName} = ${attrValue}`);
    }

    await this.client.send(
      new UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      }),
    );
  }

  async delete(tableName: string, key: Record<string, unknown>): Promise<void> {
    await this.client.send(new DeleteCommand({ TableName: tableName, Key: key }));
  }
}
