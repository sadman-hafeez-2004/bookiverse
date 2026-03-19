import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore, useToastStore } from '../store';
import { Av, Btn, Spinner, Empty, Stars } from '../components/ui';
import BookCard from '../components/BookCard';

export default function Profile() {
  const { id }       = useParams();
  const { user: me } = useAuthStore();
  const { add }      = useToastStore();
  const navigate     = useNavigate();

  const [profile,   setProfile]   = useState(null);
  const [books,     setBooks]     = useState([]);
  const [reviews,   setReviews]   = useState([]);
  const [following, setFollowing] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('all'); // all | ratings

  const isOwn = me?._id === id;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/users/${id}`),
      api.get(`/users/${id}/collection`),
    ]).then(([p, c]) => {
      setProfile(p.data.user);
      setFollowing(p.data.isFollowing);
      setBooks(c.data.collections.map(x => x.book).filter(Boolean));
    }).finally(() => setLoading(false));
  }, [id]);

  const toggleFollow = async () => {
    if (!me) return navigate('/login');
    const { data } = await api.post(`/users/${id}/follow`);
    setFollowing(data.following);
    setProfile(p => ({ ...p, followersCount: p.followersCount + (data.following ? 1 : -1) }));
    add(data.message);
  };

  const startChat = async () => {
    if (!me) return navigate('/login');
    const { data } = await api.post('/chat/conversations', { userId: id });
    navigate(`/chat/${data.conversation._id}`);
  };

  if (loading) return <Spinner />;
  if (!profile) return <div className="container page"><p>User not found.</p></div>;

  return (
    <div className="container page">

      {/* ── Profile header (Page 3 wireframe) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingBottom: 20, borderBottom: '0.5px solid var(--border)', marginBottom: 20 }}>

        {/* Large avatar */}
        <div style={{ marginBottom: 12 }}>
          <Av user={profile} size="2xl" />
        </div>

        {/* Name + book count */}
        <h1 className="h1" style={{ marginBottom: 2 }}>{profile.username}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 4 }}>
          {profile.collectedCount || 0} books collected
        </p>
        {profile.bio && (
          <p style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 320, marginBottom: 8 }}>{profile.bio}</p>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
          {[
            { v: profile.collectedCount || 0, l: 'Books'     },
            { v: profile.followersCount  || 0, l: 'Followers' },
            { v: profile.followingCount  || 0, l: 'Following' },
          ].map(({ v, l }) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{v}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Follow + Message — visitor only (wireframe spec) */}
        {!isOwn && me && (
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant={following ? 'ghost' : 'primary'} onClick={toggleFollow}>
              {following ? 'Following' : 'Follow'}
            </Btn>
            <Btn variant="secondary" onClick={startChat}>Message</Btn>
          </div>
        )}

        {/* Edit button — own profile only */}
        {isOwn && (
          <Link to="/settings"><Btn variant="ghost" size="sm">Edit profile</Btn></Link>
        )}
      </div>

      {/* ── Tabs: All | Ratings (wireframe Page 3) ── */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', marginBottom: 16 }}>
        {[{ v: 'all', l: 'All' }, { v: 'ratings', l: 'Ratings' }].map(({ v, l }) => (
          <button key={v} onClick={() => setTab(v)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14,
            fontWeight: tab === v ? 600 : 400,
            color: tab === v ? 'var(--blue-btn)' : 'var(--text-2)',
            borderBottom: tab === v ? '2px solid var(--blue-btn)' : '2px solid transparent',
          }}>{l}</button>
        ))}
      </div>

      {/* ── Book collection grid ── */}
      {tab === 'all' && (
        books.length === 0
          ? <Empty icon="📚" title="No books collected"
              desc={isOwn ? 'Start collecting books!' : `${profile.username} hasn't collected any books yet.`}
              action={isOwn ? <Link to="/"><Btn variant="primary">Browse books</Btn></Link> : null}
            />
          : <div className="book-grid">{books.map(b => <BookCard key={b._id} book={b} />)}</div>
      )}

      {/* ── Ratings tab ── */}
      {tab === 'ratings' && (
        <ReviewsByUser userId={id} />
      )}
    </div>
  );
}

function ReviewsByUser({ userId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch reviews by fetching user collection books and checking
    api.get(`/users/${userId}/collection`).then(({ data }) => {
      const bookIds = data.collections.map(c => c.book?._id).filter(Boolean);
      // Fetch reviews for each book by this user
      Promise.all(
        bookIds.slice(0, 12).map(bId =>
          api.get(`/books/${bId}/reviews`).then(r =>
            r.data.reviews.filter(rv => rv.user?._id === userId || rv.user === userId)
          )
        )
      ).then(results => {
        setReviews(results.flat());
      }).finally(() => setLoading(false));
    }).catch(() => setLoading(false));
  }, [userId]);

  if (loading) return <Spinner />;
  if (!reviews.length) return <Empty icon="✍️" title="No reviews yet" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {reviews.map(r => (
        <div key={r._id} className="card">
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            {r.book?.coverImage && (
              <img src={r.book.coverImage} alt={r.book?.title}
                style={{ width: 44, height: 64, objectFit: 'cover', borderRadius: 'var(--r-sm)', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <Link to={`/books/${r.book?._id}`} style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{r.book?.title || 'Book'}</Link>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '4px 0' }}>
                <Stars rating={r.rating} />
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              {r.text && <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{r.text}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
