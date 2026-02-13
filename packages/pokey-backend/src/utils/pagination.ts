/**
 * Encode a DynamoDB LastEvaluatedKey into a cursor token (base64 JSON).
 */
export function encodeNextToken(lastEvaluatedKey: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64');
}

/**
 * Decode a cursor token back into a DynamoDB ExclusiveStartKey.
 * Returns undefined if the token is falsy or unparseable.
 */
export function decodeNextToken(token: string | undefined): Record<string, unknown> | undefined {
  if (!token) {
    return undefined;
  }
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString('utf-8')) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}
