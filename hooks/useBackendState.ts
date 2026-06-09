import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { getStateCollectionRemote, putStateCollectionRemote } from '../services/apiClient';
import { readJson, writeJson } from '../services/storage';

const isMeaningful = (value: unknown) => Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined;

export const useBackendState = <T,>(
  localStorageKey: string,
  collection: string,
  initialValue: T
): readonly [T, Dispatch<SetStateAction<T>>, { backendReady: boolean; backendError: string }] => {
  const [value, setValue] = useState<T>(() => readJson(localStorageKey, initialValue));
  const [backendReady, setBackendReady] = useState(false);
  const [backendError, setBackendError] = useState('');
  const hydrated = useRef(false);
  const latest = useRef(value);

  useEffect(() => {
    latest.current = value;
    writeJson(localStorageKey, value);
  }, [localStorageKey, value]);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      try {
        const remote = await getStateCollectionRemote<T>(collection);
        if (cancelled) return;
        if (isMeaningful(remote)) {
          setValue(remote as T);
        } else if (isMeaningful(latest.current)) {
          await putStateCollectionRemote(collection, latest.current);
        }
        hydrated.current = true;
        setBackendReady(true);
        setBackendError('');
      } catch (error) {
        if (cancelled) return;
        hydrated.current = true;
        setBackendReady(false);
        setBackendError(error instanceof Error ? error.message : String(error));
      }
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, [collection]);

  useEffect(() => {
    if (!hydrated.current) return;
    putStateCollectionRemote(collection, value).catch(error => {
      setBackendReady(false);
      setBackendError(error instanceof Error ? error.message : String(error));
    });
  }, [collection, value]);

  return [value, setValue, { backendReady, backendError }] as const;
};
