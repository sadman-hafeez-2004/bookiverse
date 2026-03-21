import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store';
import { Spinner, Btn } from '../components/ui';
import { useGenres } from '../hooks/useGenres';

function AnnouncementBanner() {
  const [anns, setAnns]           = useState([]);
  const [dismissed, setDismissed] = useState([]);
  useEffect(() => {
    api.get('/admin/announcements/active').then(r => setAnns(r.data.announcements)).catch(() => {});
  }, []);
  const visible = anns.filter(a => !dismissed.includes(a._id));
  if (!visible.length) return null;
  const colors = { info: 'var(--blue-btn)', warning: '#D97706', success: 'var(--green-400)' };
  const bgs    = { info: 'var(--blue-fill)', warning: '#FEF3C7', success: 'var(--green-50)' };
  const texts  = { info: 'var(--blue-text)', warning: '#92400E', success: 'var(--green-800)' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
      {visible.map(a => (
        <div key={a._id} style={{
          background: bgs[a.type] || bgs.info,
          borderLeft: `3px solid ${colors[a.type] || colors.info}`,
          borderRadius: 'var(--r-md)', padding: '10px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: texts[a.type] || texts.info }}>{a.title}</div>
            <div style={{ fontSize: 12, color: texts[a.type] || texts.info, marginTop: 2, opacity: 0.85 }}>{a.message}</div>
          </div>
          <button onClick={() => setDismissed(d => [...d, a._id])} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
            color: texts[a.type] || texts.info, flexShrink: 0, padding: 0, lineHeight: 1,
          }}>✕</button>
        </div>
      ))}
    </div>
  );
}

const SLIDES = ['/banners/slide-1.jpg', '/banners/slide-2.jpg', '/banners/slide-3.jpg'];

function Banner() {
  const [idx, setIdx] = useState(0);
  const timer = useRef();
  useEffect(() => {
    timer.current = setInterval(() => setIdx(i => (i + 1) % SLIDES.length), 3500);
    return () => clearInterval(timer.current);
  }, []);
  return (
    <div style={{ width: '100%', borderRadius: 10, overflow: 'hidden', marginBottom: 20, border: '0.5px solid var(--border)', background: 'var(--blue-fill)' }}>
      <div style={{ width: '100%', aspectRatio: '16/6', position: 'relative', overflow: 'hidden' }}>
        {SLIDES.map((src, i) => (
          <img key={src} src={src} alt={`slide ${i + 1}`} style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: i === idx ? 1 : 0, transition: 'opacity 600ms',
          }} onError={e => e.target.style.opacity = 0} />
        ))}
        <div style={{ position: 'absolute', inset: 0, zIndex: -1, background: 'linear-gradient(135deg,var(--blue-fill),var(--blue-200))' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '10px 0' }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} style={{
            width: i === idx ? 20 : 7, height: 7, borderRadius: 4, border: 'none',
            padding: 0, cursor: 'pointer', transition: 'all 250ms',
            background: i === idx ? 'var(--blue-btn)' : 'var(--border-strong)',
          }} />
        ))}
      </div>
    </div>
  );
}

function CategorySection({ allBooks, genres }) {
  const byGenre = genres
    .map(g => ({ genre: g, books: allBooks.filter(b => b.genre === g).slice(0, 4) }))
    .filter(g => g.books.length > 0);
  if (!byGenre.length) return null;
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
        Browse by category
      </div>
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 10, WebkitOverflowScrolling: 'touch' }}>
        {byGenre.map(({ genre, books }) => (
          <div key={genre} style={{ flexShrink: 0, width: 200, background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '12px 10px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue-btn)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>{genre}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[0, 1, 2, 3].map(i => books[i] ? (
                <Link key={books[i]._id} to={`/books/${books[i]._id}`} style={{ display: 'block', width: '100%', minWidth: 0 }}>
                  <div style={{ width: '100%', paddingTop: '150%', position: 'relative', background: 'var(--blue-fill)', borderRadius: 4, overflow: 'hidden' }}>
                    {books[i].coverImage
                      ? <img src={books[i].coverImage} alt={books[i].title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📖</div>
                    }
                  </div>
                </Link>
              ) : (
                <div key={i} style={{ width: '100%', paddingTop: '150%', background: 'var(--surface-alt)', borderRadius: 4, border: '0.5px dashed var(--border)' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadersSection({ readers }) {
  if (!readers.length) return null;
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Readers</div>
        <Link to="/readers" style={{ fontSize: 12, color: 'var(--blue-text)', fontWeight: 500 }}>See all →</Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {readers.map(r => (
          <Link key={r._id} to={`/profile/${r._id}`} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: 10, height: 72, textDecoration: 'none',
            transition: 'border-color 150ms, transform 150ms',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue-400)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateX(0)'; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--blue-fill)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {r.avatar
                ? <img src={r.avatar} alt={r.username} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--blue-text)' }}>{r.username?.slice(0, 2).toUpperCase()}</span>
              }
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{r.username}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{r.collectedCount || 0} books</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// প্রতিবার কতটি বই load হবে
const PAGE_SIZE = 20;

export default function Home() {
  const { user }   = useAuthStore();
  const { genres } = useGenres();

  const [allBooks,    setAllBooks]    = useState([]);
  const [readers,     setReaders]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab,   setActiveTab]   = useState('All');
  const [sort,        setSort]        = useState('newest');
  const [page,        setPage]        = useState(1);
  const [total,       setTotal]       = useState(0);

  // tab বা sort বদলালে শুরু থেকে load করে
  useEffect(() => {
    setLoading(true);
    setAllBooks([]);
    setPage(1);

    const genre = activeTab === 'All' ? undefined : activeTab;

    Promise.all([
      api.get('/books', {
        params: { limit: PAGE_SIZE, page: 1, sort, ...(genre && { genre }) },
      }),
      api.get('/users', { params: { limit: 6 } }),
    ]).then(([b, u]) => {
      setAllBooks(b.data.books);
      setTotal(b.data.total);
      setReaders(u.data.users.filter(u => u._id !== user?._id).slice(0, 5));
    }).finally(() => setLoading(false));
  }, [activeTab, sort]);

  // genre delete হলে tab reset
  useEffect(() => {
    if (activeTab !== 'All' && !genres.includes(activeTab)) {
      setActiveTab('All');
    }
  }, [genres]);

  // Load more — পরের page fetch করে list-এ যোগ করে
  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const genre    = activeTab === 'All' ? undefined : activeTab;
    try {
      const { data } = await api.get('/books', {
        params: { limit: PAGE_SIZE, page: nextPage, sort, ...(genre && { genre }) },
      });
      setAllBooks(prev => [...prev, ...data.books]);
      setTotal(data.total);
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, page, activeTab, sort]);

  const hasMore = allBooks.length < total;

  return (
    <>
      <style>{`
        .hw { width:100%; max-width:1100px; margin:0 auto; padding:16px 16px 40px; box-sizing:border-box; overflow-x:hidden; }
        @media(min-width:640px)  { .hw { padding:20px 20px 48px; } }
        @media(min-width:768px)  { .hw { padding:24px 24px 56px; } }
        @media(min-width:1024px) { .hw { padding:28px 32px 64px; } }
        .ctabs { display:flex; gap:8px; overflow-x:auto; padding-bottom:6px; margin-bottom:20px; scrollbar-width:none; }
        .ctabs::-webkit-scrollbar { display:none; }
        .bg { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:12px; width:100%; }
        @media(min-width:480px)  { .bg { grid-template-columns:repeat(3, minmax(0,1fr)); gap:14px; } }
        @media(min-width:768px)  { .bg { grid-template-columns:repeat(4, minmax(0,1fr)); gap:16px; } }
        @media(min-width:1024px) { .bg { grid-template-columns:repeat(5, minmax(0,1fr)); gap:18px; } }
        .bl { display:block; text-decoration:none; min-width:0; width:100%; overflow:hidden; }
        .bc { width:100%; min-width:0; background:var(--surface); border:0.5px solid var(--border); border-radius:8px; overflow:hidden; display:flex; flex-direction:column; transition:transform 150ms, border-color 150ms; }
        .bc:hover { transform:translateY(-2px); border-color:var(--blue-400); }
        .bimg { width:100%; padding-top:150%; position:relative; background:var(--blue-fill); overflow:hidden; flex-shrink:0; }
        .bimg img { position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; display:block; }
        .bimg .noc { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:24px; }
        .bi { padding:7px 8px 10px; flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
        .bt { font-size:12px; font-weight:700; color:var(--text-1); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ba { font-size:11px; color:var(--text-2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .bo { font-size:10px; color:var(--text-3); font-weight:500; }
      `}</style>

      <div className="hw">
        <AnnouncementBanner />
        <Banner />

        {/* Category tabs */}
        <div className="ctabs">
          {['All', ...genres].map(g => (
            <button key={g} onClick={() => setActiveTab(g)} style={{
              flexShrink: 0, padding: '7px 16px', borderRadius: 20,
              border: activeTab === g ? 'none' : '0.5px solid var(--border)',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms',
              background: activeTab === g ? 'var(--blue-btn)' : 'var(--surface)',
              color: activeTab === g ? '#fff' : 'var(--text-2)',
              fontSize: 13, fontWeight: activeTab === g ? 600 : 400,
            }}>{g}</button>
          ))}
        </div>

        {!loading && <CategorySection allBooks={allBooks} genres={genres} />}
        {!loading && <ReadersSection readers={readers} />}

        {/* Books grid */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>
                All books
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>
                {activeTab === 'All' ? 'All books' : activeTab}
                <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 400, marginLeft: 8 }}>
                  ({loading ? '…' : total} total)
                </span>
              </h2>
            </div>
            <select className="input" value={sort} onChange={e => setSort(e.target.value)}
              style={{ width: 'auto', padding: '6px 10px', fontSize: 13, flexShrink: 0 }}>
              <option value="newest">Newest</option>
              <option value="popular">Most collected</option>
              <option value="topRated">Top rated</option>
            </select>
          </div>

          {loading ? (
            <Spinner />
          ) : allBooks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-3)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📚</div>
              <div style={{ fontWeight: 600 }}>No books found</div>
              <p style={{ fontSize: 13, marginTop: 6 }}>Try a different category</p>
            </div>
          ) : (
            <>
              <div className="bg">
                {allBooks.map(b => (
                  <a key={b._id} href={`/books/${b._id}`} className="bl">
                    <div className="bc">
                      <div className="bimg">
                        {b.coverImage
                          ? <img src={b.coverImage} alt={b.title} loading="lazy" />
                          : <div className="noc">📖</div>
                        }
                      </div>
                      <div className="bi">
                        <div className="bt">{b.title}</div>
                        <div className="ba">{b.author?.name || 'Unknown'}</div>
                        <div className="bo">Owned by {b.collectionsCount || 0} readers</div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>

              {/* Load More — সব বই শেষ না হওয়া পর্যন্ত দেখায় */}
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: 28 }}>
                  <Btn
                    variant="secondary"
                    onClick={loadMore}
                    disabled={loadingMore}
                    style={{ minWidth: 200 }}
                  >
                    {loadingMore
                      ? 'Loading…'
                      : `Load more (${allBooks.length} / ${total} shown)`
                    }
                  </Btn>
                </div>
              )}

              {/* সব বই দেখা হয়ে গেলে message */}
              {!hasMore && total > PAGE_SIZE && (
                <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-3)' }}>
                  ✓ All {total} books shown
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
