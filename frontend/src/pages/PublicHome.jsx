import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import BookCard from '../components/BookCard';
import { Av, Btn, Spinner } from '../components/ui';

export default function PublicHome() {
  const [books,   setBooks]   = useState([]);
  const [readers, setReaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/books',  { params: { limit: 12, sort: 'popular' } }),
      api.get('/users',  { params: { limit: 6  } }),
    ]).then(([b, u]) => {
      setBooks(b.data.books);
      setReaders(u.data.users);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* ── Hero / Intro (right section of wireframe) ── */}
      <section style={{ background: 'var(--blue-fill)', borderBottom: '0.5px solid var(--border)', padding: '32px 0 28px' }}>
        <div className="container">
          {/* Stacked reader avatars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: -8, marginBottom: 16 }}>
            {readers.slice(0, 4).map((r, i) => (
              <div key={r._id} style={{ marginLeft: i === 0 ? 0 : -10, zIndex: 4 - i }}>
                <Av user={r} size="sm" style={{ border: '2px solid var(--blue-fill)' }} />
              </div>
            ))}
            {readers.length > 4 && (
              <span style={{ marginLeft: 6, fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>
                +{readers.length - 4} readers
              </span>
            )}
          </div>

          <h1 className="h1" style={{ marginBottom: 8, maxWidth: 320 }}>
            Booknverse
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 6, fontWeight: 500 }}>
            Google Library · Access Library
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20, maxWidth: 340 }}>
            Your personal book collection network. Discover books, connect with readers nearby.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/register"><Btn variant="primary">Join free</Btn></Link>
            <Link to="/login"><Btn variant="ghost">Log in</Btn></Link>
          </div>
        </div>
      </section>

      {/* ── Connect readers (center section of wireframe) ── */}
      <section style={{ padding: '24px 0', borderBottom: '0.5px solid var(--border)' }}>
        <div className="container">
          <h2 className="h2" style={{ marginBottom: 4 }}>Connect your nearest Book Readers</h2>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
            Follow readers, share collections, message each other
          </p>

          {/* Reader circles row */}
          <div className="hscroll" style={{ marginBottom: 16, gap: 12 }}>
            {readers.map(r => (
              <Link key={r._id} to={`/profile/${r._id}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <Av user={r} size="lg" />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-1)', textAlign: 'center', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.username}</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{r.collectedCount || 0} books</span>
              </Link>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link to="/register"><Btn variant="primary" size="sm">Connect</Btn></Link>
            <Link to="/readers"><Btn variant="ghost"   size="sm">Discover readers</Btn></Link>
          </div>
        </div>
      </section>

      {/* ── Explore books (left section of wireframe) ── */}
      <section style={{ padding: '24px 0' }}>
        <div className="container">
          <div className="sec-header">
            <h2 className="h2">Explore books</h2>
            <Link to="/register" style={{ fontSize: 13, color: 'var(--blue-text)', fontWeight: 500 }}>
              Explore more →
            </Link>
          </div>

          {loading
            ? <Spinner />
            : <div className="book-grid">
                {books.map(b => <BookCard key={b._id} book={b} />)}
              </div>
          }

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to="/register">
              <Btn variant="secondary">Explore more books</Btn>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
