export class DateTimeUtil {
  /** Returns the current instant as a UTC ISO-8601 string. */
  now(): string {
    return new Date().toISOString();
  }
}
