import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncState<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'success'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: string };

/** Runs an async loader with loading, success and error states, plus a retry function. */
export function useAsync<T>(loader: (force: boolean) => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const requestId = useRef(0);

  const run = useCallback((force: boolean) => {
    const id = ++requestId.current;
    setState({ status: 'loading' });
    loader(force)
      .then((data) => id === requestId.current && setState({ status: 'success', data }))
      .catch((e: unknown) =>
        id === requestId.current &&
        setState({ status: 'error', error: e instanceof Error ? e.message : 'Something went wrong.' }),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run(false);
    return () => {
      requestId.current++;
    };
  }, [run]);

  return { ...state, reload: () => run(true) };
}
