import { useCallback, useEffect, useState } from 'react';

// Runs an async loader on mount (and whenever `deps` change) and tracks loading / error state.
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    return loader()
      .then((data) => setState({ data, loading: false, error: '' }))
      .catch((err) => setState({ data: null, loading: false, error: err.message }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}

// MySQL returns ISO strings, SQLite-style "YYYY-MM-DD HH:MM:SS"; handle both
export function formatDate(value) {
  if (!value) return '';
  const s = String(value);
  const d = new Date(s.includes('T') ? s : `${s.replace(' ', 'T')}Z`);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
