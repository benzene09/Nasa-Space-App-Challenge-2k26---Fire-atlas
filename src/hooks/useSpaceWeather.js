import { useCallback, useEffect, useState } from 'react';
import { fetchFlares } from '../utils/spaceWeather';

/** Loads DONKI solar flares once, with a manual refresh. */
export function useSpaceWeather(days = 30) {
  const [state, setState] = useState({ loading: true, flares: [], source: null, live: false, asOf: null, errors: [] });

  const load = useCallback(
    async (force = false) => {
      setState((s) => ({ ...s, loading: true }));
      const result = await fetchFlares(days, force === true);
      setState({ loading: false, ...result });
    },
    [days],
  );

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: () => load(true) };
}
