import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from './use-pagination';

describe('usePagination', () => {
  it('starts with empty state', () => {
    const { result } = renderHook(() => usePagination());

    expect(result.current.currentToken).toBeUndefined();
    expect(result.current.nextToken).toBeUndefined();
    expect(result.current.previousTokens).toEqual([]);
    expect(result.current.canGoBack).toBe(false);
    expect(result.current.canGoNext).toBe(false);
  });

  it('canGoNext becomes true when nextToken is set', () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setNextToken('page-2');
    });

    expect(result.current.canGoNext).toBe(true);
    expect(result.current.nextToken).toBe('page-2');
  });

  it('goNext advances the page and pushes current onto previousTokens', () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setNextToken('page-2');
    });
    act(() => {
      result.current.goNext();
    });

    expect(result.current.currentToken).toBe('page-2');
    expect(result.current.previousTokens).toEqual([]);
    expect(result.current.canGoBack).toBe(false);
    expect(result.current.canGoNext).toBe(false);
  });

  it('navigating forward multiple times builds previousTokens stack', () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setNextToken('page-2');
    });
    act(() => {
      result.current.goNext();
    });

    act(() => {
      result.current.setNextToken('page-3');
    });
    act(() => {
      result.current.goNext();
    });

    expect(result.current.currentToken).toBe('page-3');
    expect(result.current.previousTokens).toEqual(['page-2']);
    expect(result.current.canGoBack).toBe(true);
  });

  it('goBack pops from previousTokens', () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setNextToken('page-2');
    });
    act(() => {
      result.current.goNext();
    });
    act(() => {
      result.current.setNextToken('page-3');
    });
    act(() => {
      result.current.goNext();
    });

    act(() => {
      result.current.goBack();
    });

    expect(result.current.currentToken).toBe('page-2');
    expect(result.current.previousTokens).toEqual([]);
    expect(result.current.canGoBack).toBe(false);
  });

  it('goBack to the very first page sets currentToken to undefined', () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setNextToken('page-2');
    });
    act(() => {
      result.current.goNext();
    });

    act(() => {
      result.current.goBack();
    });

    expect(result.current.currentToken).toBeUndefined();
    expect(result.current.previousTokens).toEqual([]);
  });

  it('reset clears everything', () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setNextToken('page-2');
    });
    act(() => {
      result.current.goNext();
    });
    act(() => {
      result.current.setNextToken('page-3');
    });
    act(() => {
      result.current.goNext();
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.currentToken).toBeUndefined();
    expect(result.current.nextToken).toBeUndefined();
    expect(result.current.previousTokens).toEqual([]);
    expect(result.current.canGoBack).toBe(false);
    expect(result.current.canGoNext).toBe(false);
  });

  it('goNext clears nextToken (awaiting new data)', () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setNextToken('page-2');
    });
    act(() => {
      result.current.goNext();
    });

    expect(result.current.nextToken).toBeUndefined();
    expect(result.current.canGoNext).toBe(false);
  });
});
