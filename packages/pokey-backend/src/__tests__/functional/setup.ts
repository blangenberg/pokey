import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers';
import { DynamoDBClient, CreateTableCommand, type CreateTableCommandInput } from '@aws-sdk/client-dynamodb';
import { DataLayer } from '../../data-layer';
import { Observability } from '../../observability';
import { DateTimeUtil, UuidUtil } from 'pokey-common';
import { DEFAULT_REGION, SCHEMAS_TABLE, CONFIGURATIONS_TABLE } from '../../constants';
import type { HandlerDependencies } from '../../adapters/types';

const DYNAMODB_PORT = 8000;

const schemasTableDef: CreateTableCommandInput = {
  TableName: SCHEMAS_TABLE,
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'name', AttributeType: 'S' },
    { AttributeName: 'status', AttributeType: 'S' },
    { AttributeName: 'updatedAt', AttributeType: 'S' },
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
        { AttributeName: 'updatedAt', KeyType: 'RANGE' },
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
    { AttributeName: 'updatedAt', AttributeType: 'S' },
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
        { AttributeName: 'updatedAt', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
    },
  ],
  BillingMode: 'PAY_PER_REQUEST',
};

let container: StartedTestContainer | undefined;
let endpoint: string;

process.env['AWS_ACCESS_KEY_ID'] = 'test';
process.env['AWS_SECRET_ACCESS_KEY'] = 'test';

export async function startContainer(): Promise<void> {
  container = await new GenericContainer('amazon/dynamodb-local')
    .withExposedPorts(DYNAMODB_PORT)
    .withCommand(['-jar', 'DynamoDBLocal.jar', '-sharedDb', '-inMemory'])
    .withWaitStrategy(Wait.forListeningPorts())
    .start();

  const mappedPort = container.getMappedPort(DYNAMODB_PORT);
  const host = container.getHost();
  endpoint = `http://${host}:${String(mappedPort)}`;

  const credentials = { accessKeyId: 'test', secretAccessKey: 'test' };
  const client = new DynamoDBClient({ region: DEFAULT_REGION, endpoint, credentials });
  for (const tableDef of [schemasTableDef, configurationsTableDef]) {
    await client.send(new CreateTableCommand(tableDef));
  }
}

export async function stopContainer(): Promise<void> {
  if (container) {
    await container.stop();
    container = undefined;
  }
}

export function createRealDependencies(): HandlerDependencies {
  return {
    dataLayer: new DataLayer({ region: DEFAULT_REGION, endpoint }),
    observability: new Observability(),
    dateTime: new DateTimeUtil(),
    uuid: new UuidUtil(),
  };
}
