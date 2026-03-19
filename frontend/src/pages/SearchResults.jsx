import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { Spinner, Avatar, EmptyState } from '../components/ui';
import BookCard from '../components/BookCard';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q      = searchParams.get('q') || '';
  const [tab,  setTab]    = useState('books');
  const [books,   setBooks]   = useState([]);
  const [authors, setAuthors] = useState([]);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) return;
    const load = async () => {
      setLoading(true);
      try {
        const [bRes, aRes, uRes] = await Promise.all([
          api.get('/books',   { params: { search: q, limit: 24 } }),
          api.get('/authors', { params: { search: q, limit: 12 } }),
          api.get('/users',   { params: { search: q, limit: 12 } }),
        ]);
        setBooks(bRes.data.books);
        setAuthors(aRes.data.authors);
        setUsers(uRes.data.users);
      } finally { setLoading(false); }
    };
    load();
  }, [q]);

  const TabBtn = ({ value, label, count }) => (
    <button
      onClick={() => setTab(value)}
      style={{
        padding: '8px 18px', fontSize: 14, background: 'none', border: 'none',
        borderBottom: tab === value ? '2px solid var(--blue-btn)' : '2px solid transparent',
        color: tab === value ? 'var(--blue-btn)' : 'var(--text-secondary)',
        fontWeight: tab === value ? 600 : 400, cursor: 'pointer',
      }}
    >
      {label} {count > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({count})</span>}
    </button>
  );

  if (!q) return (
    <div className="container page-padding">
      <EmptyState icon="🔍" title="Search Booknverse" description="Search for books, authors, and readers." />
    </div>
  );

  return (
    <div className="container page-padding">
      <h1 className="h1" style={{ marginBottom: 4 }}>Search results</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
        Results for <strong>"{q}"</strong>
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', marginBottom: 24 }}>
        <TabBtn value="books"   label="Books"   count={books.length} />
        <TabBtn value="authors" label="Authors" count={authors.length} />
        <TabBtn value="readers" label="Readers" count={users.length} />
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Books */}
          {tab === 'books' && (
            books.length === 0
              ? <EmptyState icon="📚" title="No books found" description={`No books match "${q}"`} />
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: 14 }}>
                  {books.map(b => <BookCard key={b._id} book={b} />)}
                </div>
              )
          )}

          {/* Authors */}
          {tab === 'authors' && (
            authors.length === 0
              ? <EmptyState icon="✍️" title="No authors found" description={`No authors match "${q}"`} />
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                  {authors.map(a => (
                    <Link key={a._id} to={`/authors/${a._id}`} style={{ textDecoration: 'none' }}>
                      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 14, transition: 'border-color 150ms' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div style={{
                          width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                          background: 'var(--blue-fill)', border: '0.5px solid var(--border)',
                          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                        }}>
                          {a.photo
                            ? <img src={a.photo} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : '✍'
                          }
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                          {a.nationality && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.nationality}</div>}
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{a.booksCount || 0} books</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
          )}

          {/* Readers */}
          {tab === 'readers' && (
            users.length === 0
              ? <EmptyState icon="👤" title="No readers found" description={`No readers match "${q}"`} />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {users.map(u => (
                    <Link key={u._id} to={`/profile/${u._id}`} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 0', borderBottom: '0.5px solid var(--border)', textDecoration: 'none' }}>
                      <Avatar user={u} size="md" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{u.username}</div>
                        {u.bio && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{u.bio.slice(0, 80)}{u.bio.length > 80 ? '…' : ''}</div>}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{u.collectedCount || 0} books · {u.followersCount || 0} followers</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
          )}
        </>
      )}
    </div>
  );
}
