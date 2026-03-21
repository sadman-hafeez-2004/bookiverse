import { useState, useEffect } from 'react';
import api from '../lib/api';

// Hardcoded fallback shown if the API call fails
const DEFAULT_GENRES = [
  'Fiction','Non-Fiction','Science Fiction','Fantasy','Mystery','Thriller',
  'Romance','Horror','Biography','History','Self-Help','Science','Philosophy',
  'Poetry','Children','Young Adult','Graphic Novel','Other',
];

// Module-level cache so all components share the same genre list
let cachedGenres = null;
let fetchPromise = null;
const listeners  = new Set();

// Call this after any genre add/edit/delete to force a fresh fetch
export function invalidateGenreCache() {
  cachedGenres = null;
  fetchPromise  = null;
}

function notifyListeners(genres) {
  listeners.forEach(fn => fn(genres));
}

// FIX: fetch ALL genres (default + custom) from DB
// /admin/genres/all is a public route that returns every genre in the DB
async function fetchGenres() {
  if (fetchPromise) return fetchPromise;

  fetchPromise = api.get('/admin/genres/all')
    .then(({ data }) => {
      const dbNames = data.genres.map(g => g.name);
      // Merge defaults + DB genres, no duplicates
      const merged  = [...new Set([...DEFAULT_GENRES, ...dbNames])];
      cachedGenres  = merged;
      fetchPromise  = null;
      return merged;
    })
    .catch(() => {
      fetchPromise = null;
      cachedGenres = DEFAULT_GENRES;
      return DEFAULT_GENRES;
    });

  return fetchPromise;
}

export function useGenres() {
  const [genres,  setGenres]  = useState(cachedGenres || DEFAULT_GENRES);
  const [loading, setLoading] = useState(!cachedGenres);

  useEffect(() => {
    const listener = (newGenres) => setGenres(newGenres);
    listeners.add(listener);

    if (!cachedGenres) {
      fetchGenres().then(g => {
        setGenres(g);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => listeners.delete(listener);
  }, []);

  const refresh = () => {
    invalidateGenreCache();
    setLoading(true);
    fetchGenres().then(g => {
      setGenres(g);
      setLoading(false);
      notifyListeners(g);
    });
  };

  return { genres, loading, refresh };
}
