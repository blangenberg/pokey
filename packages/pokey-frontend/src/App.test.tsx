import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders the page shell with header, sub-header, and tabs', () => {
    render(<App />);
    expect(screen.getAllByText('Pokey').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Schemas').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Configs').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('LOCAL')).toBeDefined();
    expect(screen.getByText('Local Developer')).toBeDefined();
  });
});
