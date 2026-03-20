import { useState, useEffect } from 'react';
import api from '../lib/api';

// Default genres as fallback if DB fetch fails
const DEFAULT_GENRES = [
  'Fiction','Non-Fiction','Science Fiction','Fantasy','Mystery','Thriller',
  'Romance','Horror','Biography','History','Self-Help','Science','Philosophy',
  'Poetry','Children','Young Adult','Graphic Novel','Other',
];

// Cache genres in memory so we don't fetch on every page
let cachedGenres = null;
let fetchPromise = null;

export function useGenres() {
  const [genres,  setGenres]  = useState(cachedGenres || DEFAULT_GENRES);
  const [loading, setLoading] = useState(!cachedGenres);

  useEffect(() => {
    if (cachedGenres) return; // already cached

    // Reuse existing promise if already fetching
    if (!fetchPromise) {
      fetchPromise = api.get('/admin/genres/all')
        .then(({ data }) => {
          // Merge DB genres with defaults (no duplicates)
          const dbNames    = data.genres.map(g => g.name);
          const allGenres  = [...new Set([...DEFAULT_GENRES, ...dbNames])];
          cachedGenres     = allGenres;
          fetchPromise     = null;
          return allGenres;
        })
        .catch(() => {
          fetchPromise = null;
          return DEFAULT_GENRES;
        });
    }

    fetchPromise.then(genres => {
      setGenres(genres);
      setLoading(false);
    });
  }, []);

  // Call this after adding a new genre to refresh the cache
  const refresh = () => {
    cachedGenres = null;
    fetchPromise = null;
    setLoading(true);
    api.get('/admin/genres/all')
      .then(({ data }) => {
        const dbNames   = data.genres.map(g => g.name);
        const allGenres = [...new Set([...DEFAULT_GENRES, ...dbNames])];
        cachedGenres    = allGenres;
        setGenres(allGenres);
      })
      .catch(() => setGenres(DEFAULT_GENRES))
      .finally(() => setLoading(false));
  };

  return { genres, loading, refresh };
}
