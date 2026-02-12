import type { Request, Response } from 'express';
import type { Handler, HandlerRequest, HandlerResponse } from './types';

export function expressAdapter(handler: Handler): (req: Request, res: Response) => void {
  return (req: Request, res: Response): void => {
    const request: HandlerRequest = {
      pathParameters: req.params as Record<string, string | undefined>,
      queryParameters: req.query as Record<string, string | undefined>,
      body: req.body as unknown,
    };

    handler(request)
      .then((response: HandlerResponse) => {
        res.status(response.statusCode).json(response.body);
      })
      .catch((error: unknown) => {
        console.error('Unhandled handler error:', error);
        res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
      });
  };
}
