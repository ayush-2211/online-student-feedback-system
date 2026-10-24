// A tiny hash-based router built on React hooks (so URLs look like  /#/courses  and survive a refresh).
import { useEffect, useState } from 'react';

const currentPath = () => window.location.hash.replace(/^#/, '') || '/';

export function useHashPath() {
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const onChange = () => setPath(currentPath());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return path;
}

export const navigate = (to) => {
  window.location.hash = to;
};

// match('/feedback/:courseId', '/feedback/4')  ->  { courseId: '4' }   (or null when it does not match)
export function match(pattern, path) {
  const p = pattern.split('/');
  const a = path.split('/');
  if (p.length !== a.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(a[i]);
    else if (p[i] !== a[i]) return null;
  }
  return params;
}
