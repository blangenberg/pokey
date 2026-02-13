import { DynamoDBClient, CreateTableCommand, ListTablesCommand, type CreateTableCommandInput } from '@aws-sdk/client-dynamodb';
import { LOCAL_DYNAMODB_ENDPOINT, DEFAULT_REGION, SCHEMAS_TABLE, CONFIGURATIONS_TABLE } from '../packages/pokey-backend/src/constants';

const schemasTableDef: CreateTableCommandInput = {
  TableName: SCHEMAS_TABLE,
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'name', AttributeType: 'S' },
    { AttributeName: 'status', AttributeType: 'S' },
    { AttributeName: 'createdAt', AttributeType: 'S' },
  ],
  KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'schemas-name-index',
      KeySchema: [{ AttributeName: 'name', KeyType: 'HASH' }],
      Projection: { ProjectionType: 'ALL' },
    },
    {
      IndexName: 'schemas-status-index',
      KeySchema: [
        { AttributeName: 'status', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
    },
  ],
  BillingMode: 'PAY_PER_REQUEST',
};

const configurationsTableDef: CreateTableCommandInput = {
  TableName: CONFIGURATIONS_TABLE,
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'name', AttributeType: 'S' },
    { AttributeName: 'schemaId', AttributeType: 'S' },
    { AttributeName: 'createdAt', AttributeType: 'S' },
  ],
  KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'configs-name-index',
      KeySchema: [{ AttributeName: 'name', KeyType: 'HASH' }],
      Projection: { ProjectionType: 'ALL' },
    },
    {
      IndexName: 'configs-schemaId-index',
      KeySchema: [
        { AttributeName: 'schemaId', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
    },
  ],
  BillingMode: 'PAY_PER_REQUEST',
};

export async function setupTables(): Promise<void> {
  const endpoint = process.env['DYNAMODB_ENDPOINT'] || LOCAL_DYNAMODB_ENDPOINT;
  const region = process.env['AWS_REGION_NAME'] || DEFAULT_REGION;

  const client = new DynamoDBClient({ region, endpoint });

  const existing = await client.send(new ListTablesCommand({}));
  const tableNames = existing.TableNames ?? [];

  for (const tableDef of [schemasTableDef, configurationsTableDef]) {
    const name = tableDef.TableName ?? 'unknown';
    if (tableNames.includes(name)) {
      console.log(`Table "${name}" already exists — skipping.`);
    } else {
      await client.send(new CreateTableCommand(tableDef));
      console.log(`Table "${name}" created.`);
    }
  }
}

// Allow running as a standalone script
const isMainModule = process.argv[1]?.includes('init-db-schema');
if (isMainModule) {
  setupTables().catch((err: unknown) => {
    console.error('Failed to set up tables:', err);
    process.exit(1);
  });
}
