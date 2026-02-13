import { v4 as uuidv4 } from 'uuid';

export class UuidUtil {
  /** Generates a new UUID v4. */
  generate(): string {
    return uuidv4();
  }
}
