import { describe, it, expect } from 'vitest';
import { statusToAction, toggledStatus, statusActionLabel } from './status-helpers';

describe('statusToAction', () => {
  it('returns "activate" when new status is active', () => {
    expect(statusToAction('active')).toBe('activate');
  });

  it('returns "disable" when new status is disabled', () => {
    expect(statusToAction('disabled')).toBe('disable');
  });

  it('returns "disable" for any non-active string', () => {
    expect(statusToAction('unknown')).toBe('disable');
  });
});

describe('toggledStatus', () => {
  it('returns "disabled" when current is active', () => {
    expect(toggledStatus('active')).toBe('disabled');
  });

  it('returns "active" when current is disabled', () => {
    expect(toggledStatus('disabled')).toBe('active');
  });
});

describe('statusActionLabel', () => {
  it('returns "activated" for activate action', () => {
    expect(statusActionLabel('activate')).toBe('activated');
  });

  it('returns "disabled" for disable action', () => {
    expect(statusActionLabel('disable')).toBe('disabled');
  });
});
