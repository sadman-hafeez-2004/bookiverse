import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Av, Spinner } from '../components/ui';

export default function PublicHome() {
  const [books,   setBooks]   = useState([]);
  const [authors, setAuthors] = useState([]);
  const [readers, setReaders] = useState([]);
  const [stats,   setStats]   = useState({ books: 0, authors: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/books',   { params: { limit: 6, sort: 'popular' } }),
      api.get('/authors', { params: { limit: 4 } }),
      api.get('/users',   { params: { limit: 6 } }),
    ]).then(([b, a, u]) => {
      setBooks(b.data.books);
      setAuthors(a.data.authors.slice(0, 4));
      setReaders(u.data.users);
      // Use real total counts from API response, not just the slice length
      setStats({
        books:   b.data.total   || b.data.books.length,
        authors: a.data.total   || a.data.authors.length,
        users:   u.data.total   || u.data.users.length,
      });
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ overflowX: 'hidden' }}>

      {/* ══════════════════════════════════════════
          PART 1 — Hero full screen
      ══════════════════════════════════════════ */}
      <section style={{
        width: '100%', minHeight: '100vh', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/home-background.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat', filter: 'brightness(0.45)', zIndex: 0,
        }} />

        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center',
          padding: '60px 24px', width: '100%', maxWidth: 580,
        }}>
          <h1 style={{
            fontSize: 46, fontWeight: 800, color: '#ffffff',
            letterSpacing: '-1px', marginBottom: 10,
            textShadow: '0 2px 20px rgba(0,0,0,0.5)',
          }}>
            Bookiverse
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 40, fontWeight: 400 }}>
            Your personal book collection network
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}>
            <Link to="/register" style={{
              padding: '14px 36px', background: 'var(--blue-btn)', color: '#fff',
              borderRadius: 'var(--r-xl)', fontWeight: 700, fontSize: 15,
              border: '2px solid transparent', whiteSpace: 'nowrap',
            }}>
              Create Library
            </Link>
            <Link to="/login" style={{
              padding: '14px 36px', background: 'transparent', color: '#fff',
              borderRadius: 'var(--r-xl)', fontWeight: 700, fontSize: 15,
              border: '2px solid rgba(255,255,255,0.75)', whiteSpace: 'nowrap',
            }}>
              Access Library
            </Link>
          </div>

          {readers.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {readers.slice(0, 5).map((r, i) => (
                  <div key={r._id} style={{
                    marginLeft: i === 0 ? 0 : -12, zIndex: 5 - i,
                    width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
                    border: '2.5px solid rgba(255,255,255,0.7)', flexShrink: 0,
                    background: 'var(--blue-fill)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {r.avatar
                      ? <img src={r.avatar} alt={r.username}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue-text)' }}>
                          {r.username?.slice(0, 2).toUpperCase()}
                        </span>
                    }
                  </div>
                ))}
                <span style={{ marginLeft: 14, fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                  Join {stats.users}+ readers
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PART 2 — About / Features
      ══════════════════════════════════════════ */}
      <section style={{
        width: '100%', minHeight: '100vh', background: 'var(--surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 24px', borderBottom: '0.5px solid var(--border)',
      }}>
        <div style={{ maxWidth: 540, width: '100%', textAlign: 'center' }}>
          <p style={{
            fontSize: 12, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--blue-btn)', marginBottom: 14,
          }}>
            About Bookiverse
          </p>
          <h2 style={{
            fontSize: 30, fontWeight: 800, color: 'var(--text-1)',
            letterSpacing: '-0.5px', marginBottom: 16, lineHeight: 1.25,
          }}>
            Connect your nearest Book Readers
          </h2>
          <p style={{
            fontSize: 15, color: 'var(--text-2)', lineHeight: 1.8,
            marginBottom: 48, maxWidth: 420, margin: '0 auto 48px',
          }}>
            Bookiverse is a personal book collection network where you can discover books,
            build your library, connect with readers around you, and share your passion for reading.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
            {[
              { label: 'Share',    desc: 'Share your collection' },
              { label: 'Connect',  desc: 'Find nearby readers'   },
              { label: 'Discover', desc: 'Explore new books'     },
            ].map(({ label, desc }) => (
              <div key={label} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                padding: '20px 28px', background: 'var(--blue-fill)',
                borderRadius: 'var(--r-xl)', border: '0.5px solid var(--border)',
                minWidth: 130, cursor: 'default',
              }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--blue-btn)' }}>{label}</span>
                <span style={{ fontSize: 12, color: 'var(--text-2)', textAlign: 'center' }}>{desc}</span>
              </div>
            ))}
          </div>

          {/* ── Live Stats from DB ── */}
          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
            {loading ? (
              <Spinner />
            ) : (
              [
                { v: stats.books,   l: 'Books'   },
                { v: stats.authors, l: 'Authors' },
                { v: stats.users,   l: 'Readers' },
              ].map(({ v, l }) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--blue-btn)' }}>
                    {v > 0 ? `${v}+` : '0'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{l}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PART 3 + PART 4 — Authors & Books
      ══════════════════════════════════════════ */}
      <div className="parts-34-wrapper">

        {/* ── PART 3 — Author cards ── */}
        <section className="part-3">
          <div style={{ padding: '48px 28px' }}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--blue-btn)', marginBottom: 8,
            }}>Authors</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', marginBottom: 24, letterSpacing: '-0.3px' }}>
              Author Bio
            </h2>

            {loading ? <Spinner /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {authors.length === 0
                  ? <p style={{ color: 'var(--text-3)', fontSize: 14 }}>No authors yet.</p>
                  : authors.map(a => (
                    <Link key={a._id} to={`/authors/${a._id}`} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
                      background: 'var(--surface)', border: '0.5px solid var(--border)',
                      borderRadius: 'var(--r-lg)', height: 80, transition: 'border-color 150ms',
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue-400)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                        background: 'var(--blue-fill)', border: '0.5px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                      }}>
                        {a.photo
                          ? <img src={a.photo} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : '✍'
                        }
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontWeight: 700, fontSize: 14, color: 'var(--text-1)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3,
                        }}>{a.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                          {a.booksCount || 0} books uploaded
                        </div>
                      </div>
                    </Link>
                  ))
                }
              </div>
            )}
          </div>
        </section>

        {/* ── PART 4 — Book grid ── */}
        <section className="part-4">
          <div style={{ padding: '48px 28px' }}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--blue-btn)', marginBottom: 8,
            }}>Books</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', marginBottom: 24, letterSpacing: '-0.3px' }}>
              Popular books
            </h2>

            {loading ? <Spinner /> : books.length === 0
              ? <p style={{ color: 'var(--text-3)', fontSize: 14 }}>No books yet.</p>
              : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gridTemplateRows: 'repeat(2, 1fr)',
                  gap: 12,
                }}>
                  {books.slice(0, 6).map(b => (
                    <Link key={b._id} to={`/books/${b._id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        background: 'var(--surface)', border: '0.5px solid var(--border)',
                        borderRadius: 'var(--r-lg)', overflow: 'hidden',
                        display: 'flex', flexDirection: 'column', height: '100%',
                        transition: 'border-color 150ms, transform 150ms',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue-400)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        <div style={{
                          width: '100%', height: 140, background: 'var(--blue-fill)',
                          overflow: 'hidden', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                        }}>
                          {b.coverImage
                            ? <img src={b.coverImage} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            : '📖'
                          }
                        </div>
                        <div style={{ padding: '8px 10px', flex: 1 }}>
                          <div style={{
                            fontSize: 12, fontWeight: 700, color: 'var(--text-1)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3,
                          }}>{b.title}</div>
                          <div style={{
                            fontSize: 11, color: 'var(--text-3)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>{b.author?.name || 'Unknown'}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            }
          </div>
        </section>
      </div>

      {/* ══════════════════════════════════════════
          EXPLORE MORE
      ══════════════════════════════════════════ */}
      <div style={{
        width: '100%', padding: '40px 24px',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        background: 'var(--bg)', borderTop: '0.5px solid var(--border)',
      }}>
        <Link to="/register" style={{
          display: 'inline-block', padding: '14px 48px',
          background: 'transparent', color: 'var(--blue-btn)',
          border: '2px solid var(--blue-btn)', borderRadius: 'var(--r-xl)',
          fontWeight: 700, fontSize: 15, transition: 'all 150ms', textAlign: 'center',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--blue-btn)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--blue-btn)'; }}
        >
          Explore More
        </Link>
      </div>

      <style>{`
        .parts-34-wrapper { display: flex; flex-direction: column; width: 100%; }
        .part-3 { width: 100%; background: var(--bg); border-bottom: 0.5px solid var(--border); }
        .part-4 { width: 100%; background: var(--bg); }
        @media (min-width: 768px) {
          .parts-34-wrapper { flex-direction: row; align-items: stretch; }
          .part-3 { width: 40%; border-bottom: none; border-right: 0.5px solid var(--border); }
          .part-4 { width: 60%; }
        }
      `}</style>
    </div>
  );
}
