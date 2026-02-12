import type { Handler, HandlerRequest, HandlerResponse } from './types';

interface LambdaEvent {
  pathParameters?: Record<string, string | undefined> | null;
  queryStringParameters?: Record<string, string | undefined> | null;
  body?: string | null;
}

interface LambdaResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export function lambdaAdapter(handler: Handler): (event: LambdaEvent) => Promise<LambdaResult> {
  return async (event: LambdaEvent): Promise<LambdaResult> => {
    const request: HandlerRequest = {
      pathParameters: event.pathParameters ?? {},
      queryParameters: event.queryStringParameters ?? {},
      body: event.body ? (JSON.parse(event.body) as unknown) : undefined,
    };

    let response: HandlerResponse;
    try {
      response = await handler(request);
    } catch (error) {
      console.error('Unhandled handler error:', error);
      response = {
        statusCode: 500,
        body: { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      };
    }

    return {
      statusCode: response.statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response.body),
    };
  };
}
