import { Counter, Histogram, Registry } from 'prom-client';

export interface ErrorLogParams {
  message: string;
  code: string;
  className?: string;
  line?: number;
  details?: unknown;
}

export class Observability {
  private readonly registry: Registry;
  private readonly eventCounter: Counter;
  private readonly errorCounter: Counter;
  private readonly latencyHistogram: Histogram;

  constructor(registry?: Registry) {
    this.registry = registry ?? new Registry();

    this.eventCounter = new Counter({
      name: 'pokey_events_total',
      help: 'Total number of events by type',
      labelNames: ['event'] as const,
      registers: [this.registry],
    });

    this.errorCounter = new Counter({
      name: 'pokey_errors_total',
      help: 'Total number of errors by type',
      labelNames: ['error'] as const,
      registers: [this.registry],
    });

    this.latencyHistogram = new Histogram({
      name: 'pokey_request_duration_seconds',
      help: 'Request duration in seconds with P95 and P99 bucket coverage',
      labelNames: ['operation'] as const,
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });
  }

  trackEvent(event: string): void {
    this.eventCounter.inc({ event });
  }

  trackError(error: string): void {
    this.errorCounter.inc({ error });
  }

  startTimer(operation: string): () => void {
    return this.latencyHistogram.startTimer({ operation });
  }

  logError(params: ErrorLogParams): void {
    this.trackError(params.code);

    const entry = {
      level: 'ERROR',
      message: params.message,
      code: params.code,
      className: params.className,
      line: params.line,
      details: params.details,
      timestamp: new Date().toISOString(),
    };

    console.error(JSON.stringify(entry));
  }

  getRegistry(): Registry {
    return this.registry;
  }
}
