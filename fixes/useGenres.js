import { useState, useEffect } from 'react';
import api from '../lib/api';

const DEFAULT_GENRES = [
  'Fiction','Non-Fiction','Science Fiction','Fantasy','Mystery','Thriller',
  'Romance','Horror','Biography','History','Self-Help','Science','Philosophy',
  'Poetry','Children','Young Adult','Graphic Novel','Other',
];

let cachedGenres = null;
let fetchPromise = null;
const listeners = new Set();

export function invalidateGenreCache() {
  cachedGenres = null;
  fetchPromise  = null;
}

function notifyListeners(genres) {
  listeners.forEach(fn => fn(genres));
}

async function fetchGenres() {
  if (fetchPromise) return fetchPromise;
  fetchPromise = api.get('/admin/genres/all')
    .then(({ data }) => {
      const dbNames   = data.genres.map(g => g.name);
      const merged    = [...new Set([...DEFAULT_GENRES, ...dbNames])];
      cachedGenres    = merged;
      fetchPromise    = null;
      return merged;
    })
    .catch(() => {
      fetchPromise = null;
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
        notifyListeners(g);
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
