import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore, useToastStore } from '../store';
import { Av, Btn, Spinner, Empty, Stars, StarPicker, Textarea } from '../components/ui';

const GENRES = [
  'Fiction','Non-Fiction','Science Fiction','Fantasy','Mystery','Thriller',
  'Romance','Horror','Biography','History','Self-Help','Science','Philosophy',
  'Poetry','Children','Young Adult','Graphic Novel','Other',
];

export default function BookDetail() {
  const { id }   = useParams();
  const { user } = useAuthStore();
  const { add }  = useToastStore();
  const navigate = useNavigate();

  const [book,      setBook]      = useState(null);
  const [collected, setCollected] = useState(false);
  const [reviews,   setReviews]   = useState([]);
  const [myReview,  setMyReview]  = useState(null);
  const [loading,   setLoading]   = useState(true);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating,     setRating]     = useState(0);
  const [text,       setText]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editing,   setEditing]   = useState(false);
  const [editForm,  setEditForm]  = useState({});
  const [coverFile, setCoverFile] = useState(null);
  const [coverPrev, setCoverPrev] = useState('');
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/books/${id}`),
      api.get(`/books/${id}/reviews`),
    ]).then(([b, r]) => {
      setBook(b.data.book);
      setCollected(b.data.isCollected);
      setEditForm({
        title:         b.data.book.title,
        genre:         b.data.book.genre,
        description:   b.data.book.description || '',
        publishedYear: b.data.book.publishedYear || '',
      });
      setReviews(r.data.reviews);
      if (r.data.myReviewId) {
        const mine = r.data.reviews.find(rv => rv._id === r.data.myReviewId);
        if (mine) { setMyReview(mine); setRating(mine.rating); setText(mine.text || ''); }
      }
    }).catch(() => setBook(null))
    .finally(() => setLoading(false));
  }, [id]);

  const toggleCollect = async () => {
    if (!user) return navigate('/login');
    try {
      const { data } = await api.post(`/books/${id}/collect`);
      setCollected(data.collected);
      // FIX: update collectionsCount immediately in state
      setBook(b => ({ ...b, collectionsCount: (b.collectionsCount || 0) + (data.collected ? 1 : -1) }));
      add(data.message);
    } catch (err) {
      add(err.response?.data?.message || 'Failed', 'error');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!rating) return add('Please select a rating', 'error');
    setSubmitting(true);
    try {
      if (myReview) {
        const { data } = await api.put(`/books/reviews/${myReview._id}`, { rating, text });
        // FIX: update review in list immediately
        setReviews(rs => rs.map(r => r._id === myReview._id ? data.review : r));
        setMyReview(data.review);
        add('Review updated!');
      } else {
        const { data } = await api.post(`/books/${id}/reviews`, { rating, text });
        // FIX: add new review to top immediately & increment count
        setReviews(rs => [data.review, ...rs]);
        setMyReview(data.review);
        setBook(b => ({ ...b, reviewsCount: (b.reviewsCount || 0) + 1 }));
        add('Review posted!');
      }
      setShowReviewForm(false);
    } catch (e) { add(e.response?.data?.message || 'Failed', 'error'); }
    finally { setSubmitting(false); }
  };

  const toggleLike = async (reviewId) => {
    if (!user) return navigate('/login');
    try {
      const { data } = await api.post(`/books/reviews/${reviewId}/like`);
      // FIX: update likesCount in state immediately
      setReviews(rs => rs.map(r => r._id === reviewId ? { ...r, likesCount: data.likesCount } : r));
    } catch (err) {
      add(err.response?.data?.message || 'Failed', 'error');
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(editForm).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      if (coverFile) fd.append('coverImage', coverFile);
      const { data } = await api.put(`/books/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      // FIX: update full book state immediately after edit
      setBook(data.book);
      setEditing(false);
      setCoverFile(null); setCoverPrev('');
      add('Book updated!');
    } catch (e) { add(e.response?.data?.message || 'Update failed', 'error'); }
    finally { setSaving(false); }
  };

  const deleteBook = async () => {
    if (!window.confirm('Delete this book?')) return;
    try {
      await api.delete(`/books/${id}`);
      add('Book deleted.');
      // FIX: navigate home after successful delete
      navigate('/');
    } catch (err) {
      add(err.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <span className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );
  if (!book) return <div className="container page"><p>Book not found.</p></div>;

  const canEdit = user && (user.role === 'admin' || book.uploadedBy?._id === user._id);

  return (
    <div className="container page">

      {/* ── Book header ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>

        <div style={{ flexShrink: 0 }}>
          <div style={{ width: 130, aspectRatio: '2/3', background: 'var(--blue-fill)', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '0.5px solid var(--border)' }}>
            {(coverPrev || book.coverImage)
              ? <img src={coverPrev || book.coverImage} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 36 }}>📖</div>
            }
          </div>
          <Btn variant={collected ? 'ghost' : 'primary'} full style={{ marginTop: 10 }} onClick={toggleCollect}>
            {collected ? '✓ Collected' : '+ Collect'}
          </Btn>
        </div>

        <div style={{ flex: 1, minWidth: 180 }}>
          {editing ? (
            <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input className="input" value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} placeholder="Title" required />
              <select className="input" value={editForm.genre} onChange={e => setEditForm(p => ({ ...p, genre: e.target.value }))} required>
                {GENRES.map(g => <option key={g}>{g}</option>)}
              </select>
              <textarea className="input textarea" value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} placeholder="Description" style={{ minHeight: 70 }} />
              <input className="input" type="number" value={editForm.publishedYear} onChange={e => setEditForm(p => ({ ...p, publishedYear: e.target.value }))} placeholder="Year" />
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>Change cover</label>
                <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { setCoverFile(f); setCoverPrev(URL.createObjectURL(f)); } }} className="input" style={{ padding: 6 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="primary" type="submit" size="sm" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
                <Btn variant="ghost" type="button" size="sm" onClick={() => { setEditing(false); setCoverFile(null); setCoverPrev(''); }}>Cancel</Btn>
              </div>
            </form>
          ) : (
            <>
              <span className="tag" style={{ marginBottom: 8, display: 'inline-block' }}>{book.genre}</span>
              <h1 className="h1" style={{ marginBottom: 4 }}>{book.title}</h1>
              <Link to={`/authors/${book.author?._id}`} style={{ color: 'var(--blue-text)', fontSize: 14, fontWeight: 500 }}>
                {book.author?.name}
              </Link>
              {book.publishedYear && (
                <span style={{ color: 'var(--text-3)', fontSize: 13, marginLeft: 8 }}>{book.publishedYear}</span>
              )}
              <div style={{ display: 'flex', gap: 12, margin: '10px 0', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Stars rating={Math.round(book.averageRating || 0)} />
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{book.averageRating?.toFixed(1) || '—'}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{book.reviewsCount || 0} reviews</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{book.collectionsCount || 0} collected</span>
              </div>
              {book.description && (
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 10 }}>{book.description}</p>
              )}
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                Uploaded by{' '}
                <Link to={`/profile/${book.uploadedBy?._id}`} style={{ color: 'var(--blue-text)' }}>{book.uploadedBy?.username}</Link>
              </p>
              {canEdit && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <Btn variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit book</Btn>
                  <Btn variant="danger" size="sm" onClick={deleteBook}>Delete</Btn>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Author bio ── */}
      {book.author?.bio && (
        <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {book.author.photo && (
            <img src={book.author.photo} alt={book.author.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          )}
          <div>
            <Link to={`/authors/${book.author._id}`} style={{ fontWeight: 600, fontSize: 14, color: 'var(--blue-text)' }}>{book.author.name}</Link>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginTop: 3 }}>
              {book.author.bio.slice(0, 200)}{book.author.bio.length > 200 ? '…' : ''}
            </p>
          </div>
        </div>
      )}

      {/* ── Reviews ── */}
      <div>
        <div className="sec-header">
          <h2 className="h2">Reviews</h2>
          {user && !showReviewForm && (
            <Btn variant="secondary" size="sm" onClick={() => setShowReviewForm(true)}>
              {myReview ? 'Edit review' : 'Write review'}
            </Btn>
          )}
        </div>

        {showReviewForm && (
          <div className="card" style={{ marginBottom: 16 }}>
            <form onSubmit={submitReview} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div className="form-label" style={{ marginBottom: 8 }}>Rating</div>
                <StarPicker value={rating} onChange={setRating} />
              </div>
              <Textarea placeholder="Share your thoughts…" value={text} onChange={e => setText(e.target.value)} />
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="primary" type="submit" size="sm" disabled={submitting}>{submitting ? 'Posting…' : myReview ? 'Update' : 'Post'}</Btn>
                <Btn variant="ghost"   type="button" size="sm" onClick={() => setShowReviewForm(false)}>Cancel</Btn>
              </div>
            </form>
          </div>
        )}

        {reviews.length === 0
          ? <Empty icon="✍️" title="No reviews yet" desc="Be the first to review!" />
          : reviews.map(r => (
            <div key={r._id} style={{ padding: '14px 0', borderBottom: '0.5px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <Link to={`/profile/${r.user?._id}`}><Av user={r.user} size="sm" /></Link>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                    <Link to={`/profile/${r.user?._id}`} style={{ fontWeight: 600, fontSize: 13 }}>{r.user?.username}</Link>
                    <Stars rating={r.rating} />
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.text && <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{r.text}</p>}
                  <button onClick={() => toggleLike(r._id)} style={{
                    background: 'none', border: 'none', fontSize: 12, color: 'var(--text-3)',
                    cursor: 'pointer', marginTop: 6, padding: 0,
                  }}>♡ {r.likesCount || 0}</button>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
