import { useCallback, useState } from 'react';

export interface PaginationState {
  previousTokens: string[];
  currentToken: string | undefined;
  nextToken: string | undefined;
}

export interface PaginationActions {
  goNext: () => void;
  goBack: () => void;
  reset: () => void;
  setNextToken: (token: string | undefined) => void;
  canGoBack: boolean;
  canGoNext: boolean;
}

const INITIAL_STATE: PaginationState = {
  previousTokens: [],
  currentToken: undefined,
  nextToken: undefined,
};

export function usePagination(): PaginationState & PaginationActions {
  const [state, setState] = useState<PaginationState>(INITIAL_STATE);

  const goNext = useCallback((): void => {
    setState((prev) => ({
      previousTokens: prev.currentToken ? [...prev.previousTokens, prev.currentToken] : prev.previousTokens,
      currentToken: prev.nextToken,
      nextToken: undefined,
    }));
  }, []);

  const goBack = useCallback((): void => {
    setState((prev) => {
      const tokens = [...prev.previousTokens];
      const previousToken = tokens.pop();
      return {
        previousTokens: tokens,
        currentToken: previousToken,
        nextToken: undefined,
      };
    });
  }, []);

  const reset = useCallback((): void => {
    setState(INITIAL_STATE);
  }, []);

  const setNextToken = useCallback((token: string | undefined): void => {
    setState((prev) => ({ ...prev, nextToken: token }));
  }, []);

  return {
    ...state,
    goNext,
    goBack,
    reset,
    setNextToken,
    canGoBack: state.previousTokens.length > 0,
    canGoNext: state.nextToken !== undefined,
  };
}
