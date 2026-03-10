/**
 * Converts a status string ('active' | 'disabled') to the corresponding API action path segment.
 */
export function statusToAction(newStatus: string): 'activate' | 'disable' {
  return newStatus === 'active' ? 'activate' : 'disable';
}

/**
 * Returns the opposite status — the value the toggle will produce on click.
 */
export function toggledStatus(currentStatus: string): string {
  return currentStatus === 'active' ? 'disabled' : 'active';
}

/**
 * Returns a human-readable past-tense description of the status transition for toasts.
 */
export function statusActionLabel(action: 'activate' | 'disable'): string {
  return action === 'activate' ? 'activated' : 'disabled';
}
