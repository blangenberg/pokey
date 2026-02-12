import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders the welcome message', () => {
    render(<App />);
    expect(screen.getByText('Welcome to Pokey.')).toBeDefined();
  });
});
