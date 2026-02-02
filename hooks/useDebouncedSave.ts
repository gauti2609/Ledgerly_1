import { useState, useEffect, useRef } from 'react';

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

export const useDebouncedSave = <T>(data: T, onSave: (data: T) => Promise<any>, delay = 2000) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const firstMount = useRef(true);
  const timeoutRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (firstMount.current) {
        firstMount.current = false;
        return;
    }

    if (saveStatus !== 'saving') {
        setSaveStatus('unsaved');
    }

    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(async () => {
        setSaveStatus('saving');
        try {
            if (data) {
                await onSave(data);
                setSaveStatus('saved');
            }
        } catch (error) {
            console.error("Failed to save:", error);
            setSaveStatus('error');
        }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, onSave, delay]);

  return { saveStatus };
};