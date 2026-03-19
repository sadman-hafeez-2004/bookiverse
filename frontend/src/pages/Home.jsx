import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store';
import BookCard from '../components/BookCard';
import { Av, Btn, Spinner, Empty } from '../components/ui';

const GENRES = ['All','Fiction','Non-Fiction','Science Fiction','Fantasy','Mystery',
  'Thriller','Romance','Horror','Biography','History','Self-Help','Science','Philosophy'];

/* Sliding banner */
function Banner({ books }) {
  const [idx, setIdx] = useState(0);
  const timer = useRef();

  useEffect(() => {
    if (!books.length) return;
    timer.current = setInterval(() => setIdx(i => (i + 1) % books.length), 3500);
    return () => clearInterval(timer.current);
  }, [books.length]);

  if (!books.length) return null;
  const book = books[idx];

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: 16 }}>
      {/* image */}
      <div style={{ width: '100%', aspectRatio: '16/7', background: 'var(--blue-fill)', overflow: 'hidden', position: 'relative' }}>
        {book.coverImage
          ? <img src={book.coverImage} alt={book.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--blue-fill) 0%, var(--blue-200) 100%)' }} />
        }
        {/* overlay text */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 14px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{book.title}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{book.author?.name}</div>
        </div>
      </div>
      {/* dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '8px 0' }}>
        {books.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} style={{
            width: i === idx ? 18 : 6, height: 6, borderRadius: 3, border: 'none', padding: 0, cursor: 'pointer',
            background: i === idx ? 'var(--blue-btn)' : 'var(--border-strong)',
            transition: 'all 200ms',
          }} />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuthStore();
  const [books,   setBooks]   = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genre,   setGenre]   = useState('All');
  const [sort,    setSort]    = useState('newest');
  const [bannerBooks, setBannerBooks] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/books', { params: { sort: 'popular', limit: 5 } }),
      api.get('/users', { params: { limit: 6 } }),
    ]).then(([b, u]) => {
      setBannerBooks(b.data.books);
      setTopUsers(u.data.users.filter(u => u._id !== user?._id).slice(0, 3));
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { sort, limit: 20 };
    if (genre !== 'All') params.genre = genre;
    api.get('/books', { params }).then(({ data }) => {
      setBooks(data.books);
    }).finally(() => setLoading(false));
  }, [genre, sort]);

  return (
    <div className="container page">

      {/* ── Sliding banner (Page 1 wireframe top) ── */}
      <Banner books={bannerBooks} />

      {/* ── Category tabs (horizontal scroll) ── */}
      <div className="hscroll" style={{ marginBottom: 16, paddingBottom: 8 }}>
        {GENRES.map(g => (
          <button key={g} onClick={() => setGenre(g)} style={{
            flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: genre === g ? 'var(--blue-btn)' : 'var(--surface)',
            color: genre === g ? '#fff' : 'var(--text-2)',
            fontSize: 13, fontWeight: genre === g ? 600 : 400,
            border: genre === g ? 'none' : '0.5px solid var(--border)',
          }}>{g}</button>
        ))}
      </div>

      {/* ── Sort row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 className="h2">{genre === 'All' ? 'All books' : genre}</h2>
        <select className="input" value={sort} onChange={e => setSort(e.target.value)}
          style={{ width: 'auto', padding: '5px 10px', fontSize: 13 }}>
          <option value="newest">Newest</option>
          <option value="popular">Popular</option>
          <option value="topRated">Top rated</option>
        </select>
      </div>

      {/* ── Main layout: books + sidebar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>

        {/* Desktop: side by side */}
        <style>{`@media (min-width: 768px) { .home-grid { grid-template-columns: 1fr 220px !important; } }`}</style>
        <div className="home-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>

          {/* Book grid */}
          <div>
            {loading
              ? <Spinner />
              : books.length === 0
                ? <Empty icon="📚" title="No books found" desc="Try a different genre" action={<Link to="/upload"><Btn variant="primary">Upload a book</Btn></Link>} />
                : <div className="book-grid">{books.map(b => <BookCard key={b._id} book={b} />)}</div>
            }

            {/* Explore more button (wireframe bottom) */}
            {!loading && books.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Btn variant="secondary" onClick={() => api.get('/books', { params: { sort, limit: 40, genre: genre !== 'All' ? genre : undefined } }).then(({ data }) => setBooks(data.books))}>
                  Explore more
                </Btn>
              </div>
            )}
          </div>

          {/* Sidebar — user stats + top readers (wireframe center panel) */}
          <aside>
            {/* My stats */}
            <div className="card" style={{ marginBottom: 14 }}>
              <Link to={`/profile/${user?._id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Av user={user} size="md" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.username}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{user?.collectedCount || 0} books</div>
                </div>
              </Link>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[{ v: user?.followersCount || 0, l: 'Followers' }, { v: user?.followingCount || 0, l: 'Following' }].map(({ v, l }) => (
                  <div key={l} style={{ background: 'var(--blue-fill)', borderRadius: 'var(--r-md)', padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--blue-text)' }}>{v}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top readers (user circles from wireframe) */}
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Readers</div>
              {topUsers.map(r => (
                <Link key={r._id} to={`/profile/${r._id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
                  <Av user={r} size="sm" />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.collectedCount || 0} books</div>
                  </div>
                </Link>
              ))}
              <Link to="/readers" style={{ fontSize: 12, color: 'var(--blue-text)', display: 'block', marginTop: 10 }}>See all readers →</Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
