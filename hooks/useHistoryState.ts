import { useState, useCallback } from 'react';

export const useHistoryState = <T>(initialState: T) => {
    const [historyState, setHistoryState] = useState<{
        history: T[];
        currentIndex: number;
    }>({
        history: [initialState],
        currentIndex: 0
    });

    const { history, currentIndex } = historyState;

    const setState = useCallback((newState: T | ((prevState: T) => T), overwrite = false) => {
        setHistoryState(prev => {
            const currentState = prev.history[prev.currentIndex];
            const nextState = typeof newState === 'function'
                // @ts-ignore
                ? newState(currentState)
                : newState;

            // Prevent adding a new state if it's identical to the current one
            if (!overwrite && JSON.stringify(nextState) === JSON.stringify(currentState)) {
                return prev;
            }

            const newHistory = prev.history.slice(0, prev.currentIndex + 1);
            newHistory.push(nextState);

            return {
                history: newHistory,
                currentIndex: newHistory.length - 1
            };
        });
    }, []);

    const undo = useCallback(() => {
        setHistoryState(prev => {
            if (prev.currentIndex > 0) {
                return {
                    ...prev,
                    currentIndex: prev.currentIndex - 1
                };
            }
            return prev;
        });
    }, []);

    const redo = useCallback(() => {
        setHistoryState(prev => {
            if (prev.currentIndex < prev.history.length - 1) {
                return {
                    ...prev,
                    currentIndex: prev.currentIndex + 1
                };
            }
            return prev;
        });
    }, []);

    return {
        state: history[currentIndex],
        setState,
        undo,
        redo,
        canUndo: currentIndex > 0,
        canRedo: currentIndex < history.length - 1,
    };
};