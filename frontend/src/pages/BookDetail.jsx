import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore, useToastStore } from '../store';
import { useGenres } from '../hooks/useGenres';
import { Av, Btn, Spinner, Empty, Stars, StarPicker, Textarea } from '../components/ui';

export default function BookDetail() {
  const { id }     = useParams();
  const { user }   = useAuthStore();
  const { add }    = useToastStore();
  const navigate   = useNavigate();
  const { genres } = useGenres();

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
  const [editForm,  setEditForm]  = useState({
    title: '', genre: '', description: '', publishedYear: '', authorId: '',
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPrev, setCoverPrev] = useState('');
  const [saving,    setSaving]    = useState(false);

  // ── Author search in edit form ────────────────────────────
  const [allAuthors,      setAllAuthors]      = useState([]);
  const [authorQuery,     setAuthorQuery]     = useState('');
  const [selectedAuthor,  setSelectedAuthor]  = useState(null);
  const [showAuthorDrop,  setShowAuthorDrop]  = useState(false);
  const authorDropRef = useRef();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (authorDropRef.current && !authorDropRef.current.contains(e.target)) {
        setShowAuthorDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load all authors for search
  useEffect(() => {
    api.get('/authors', { params: { limit: 500 } })
      .then(({ data }) => setAllAuthors(data.authors));
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/books/${id}`),
      api.get(`/books/${id}/reviews`),
    ]).then(([b, r]) => {
      const bk = b.data.book;
      setBook(bk);
      setCollected(b.data.isCollected);
      setEditForm({
        title:         bk.title,
        genre:         bk.genre,
        description:   bk.description || '',
        publishedYear: bk.publishedYear || '',
        authorId:      bk.author?._id || '',
      });
      // pre-fill selected author
      setSelectedAuthor(bk.author || null);
      setAuthorQuery(bk.author?.name || '');

      setReviews(r.data.reviews);
      if (r.data.myReviewId) {
        const mine = r.data.reviews.find(rv => rv._id === r.data.myReviewId);
        if (mine) { setMyReview(mine); setRating(mine.rating); setText(mine.text || ''); }
      }
    }).catch(() => setBook(null))
    .finally(() => setLoading(false));
  }, [id]);

  // Filter authors by search query
  const filteredAuthors = authorQuery.trim()
    ? allAuthors.filter(a => a.name.toLowerCase().includes(authorQuery.toLowerCase()))
    : allAuthors.slice(0, 8);

  const selectAuthor = (author) => {
    setSelectedAuthor(author);
    setAuthorQuery(author.name);
    setEditForm(p => ({ ...p, authorId: author._id }));
    setShowAuthorDrop(false);
  };

  const clearAuthor = () => {
    setSelectedAuthor(null);
    setAuthorQuery('');
    setEditForm(p => ({ ...p, authorId: '' }));
  };

  const toggleCollect = async () => {
    if (!user) return navigate('/login');
    try {
      const { data } = await api.post(`/books/${id}/collect`);
      setCollected(data.collected);
      setBook(b => ({ ...b, collectionsCount: (b.collectionsCount || 0) + (data.collected ? 1 : -1) }));
      add(data.message);
    } catch (err) { add(err.response?.data?.message || 'Failed', 'error'); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!rating) return add('Please select a rating', 'error');
    setSubmitting(true);
    try {
      if (myReview) {
        const { data } = await api.put(`/books/reviews/${myReview._id}`, { rating, text });
        setReviews(rs => rs.map(r => r._id === myReview._id ? data.review : r));
        setMyReview(data.review);
        add('Review updated!');
      } else {
        const { data } = await api.post(`/books/${id}/reviews`, { rating, text });
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
      setReviews(rs => rs.map(r => r._id === reviewId ? { ...r, likesCount: data.likesCount } : r));
    } catch (err) { add(err.response?.data?.message || 'Failed', 'error'); }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) return add('Title is required', 'error');
    if (!editForm.genre)        return add('Please select a genre', 'error');
    if (!editForm.authorId)     return add('Please select an author', 'error');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title',    editForm.title.trim());
      fd.append('genre',    editForm.genre);
      fd.append('authorId', editForm.authorId);
      fd.append('description', editForm.description || '');
      if (editForm.publishedYear) fd.append('publishedYear', editForm.publishedYear);
      if (coverFile) fd.append('coverImage', coverFile);

      const { data } = await api.put(`/books/${id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setBook(data.book);
      setEditForm({
        title:         data.book.title,
        genre:         data.book.genre,
        description:   data.book.description || '',
        publishedYear: data.book.publishedYear || '',
        authorId:      data.book.author?._id || '',
      });
      setSelectedAuthor(data.book.author || null);
      setAuthorQuery(data.book.author?.name || '');
      setEditing(false);
      setCoverFile(null);
      setCoverPrev('');
      add('Book updated!');
    } catch (e) { add(e.response?.data?.message || 'Update failed', 'error'); }
    finally { setSaving(false); }
  };

  const cancelEdit = () => {
    if (book) {
      setEditForm({
        title:         book.title,
        genre:         book.genre,
        description:   book.description || '',
        publishedYear: book.publishedYear || '',
        authorId:      book.author?._id || '',
      });
      setSelectedAuthor(book.author || null);
      setAuthorQuery(book.author?.name || '');
    }
    setCoverFile(null);
    setCoverPrev('');
    setEditing(false);
  };

  const deleteBook = async () => {
    if (!window.confirm('Delete this book?')) return;
    try {
      await api.delete(`/books/${id}`);
      add('Book deleted.');
      navigate('/');
    } catch (err) { add(err.response?.data?.message || 'Failed to delete', 'error'); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <span className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );
  if (!book) return <div className="container page"><p>Book not found.</p></div>;

  const canEdit = user && (user.role === 'admin' || book.uploadedBy?._id === user._id);

  return (
    <>
      <style>{`
        .author-drop-edit {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          background: var(--surface);
          border: 0.5px solid var(--border-strong);
          border-radius: var(--r-md);
          max-height: 200px; overflow-y: auto;
          z-index: 300;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
        }
        .author-opt-edit {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; cursor: pointer; font-size: 13px;
          color: var(--text-1); border-bottom: 0.5px solid var(--border);
          transition: background 100ms;
        }
        .author-opt-edit:last-child { border-bottom: none; }
        .author-opt-edit:hover { background: var(--blue-fill); }
        .author-photo-sm {
          width: 28px; height: 28px; border-radius: 50%;
          background: var(--blue-fill); flex-shrink: 0;
          overflow: hidden; display: flex; align-items: center;
          justify-content: center; font-size: 11px;
          font-weight: 700; color: var(--blue-text);
        }
        .author-photo-sm img { width: 100%; height: 100%; object-fit: cover; }
        .author-chip-edit {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 12px;
          background: var(--blue-fill);
          border: 0.5px solid var(--blue-400);
          border-radius: var(--r-md);
        }
      `}</style>

      <div className="container page">

        {/* ── Book header ── */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>

          {/* Cover */}
          <div style={{ flexShrink: 0 }}>
            <div style={{
              width: 130, aspectRatio: '2/3',
              background: 'var(--blue-fill)',
              borderRadius: 'var(--r-lg)',
              overflow: 'hidden',
              border: '0.5px solid var(--border)',
            }}>
              {(coverPrev || book.coverImage)
                ? <img src={coverPrev || book.coverImage} alt={book.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 36 }}>📖</div>
              }
            </div>
            <Btn variant={collected ? 'ghost' : 'primary'} full style={{ marginTop: 10 }} onClick={toggleCollect}>
              {collected ? '✓ Collected' : '+ Collect'}
            </Btn>
          </div>

          {/* Info / Edit form */}
          <div style={{ flex: 1, minWidth: 180 }}>
            {editing ? (
              /* ══ EDIT FORM ══ */
              <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Title */}
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Title *</label>
                  <input
                    className="input"
                    value={editForm.title}
                    onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Book title"
                    required
                  />
                </div>

                {/* Genre dropdown */}
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Genre *</label>
                  <select
                    className="input"
                    value={editForm.genre}
                    onChange={e => setEditForm(p => ({ ...p, genre: e.target.value }))}
                    required
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">Select genre…</option>
                    {genres.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* ✅ Author search/change */}
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
                    Author *
                  </label>

                  {selectedAuthor ? (
                    /* Selected author chip */
                    <div className="author-chip-edit">
                      <div className="author-photo-sm">
                        {selectedAuthor.photo
                          ? <img src={selectedAuthor.photo} alt={selectedAuthor.name} />
                          : selectedAuthor.name?.slice(0, 2).toUpperCase()
                        }
                      </div>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--blue-text)' }}>
                        {selectedAuthor.name}
                      </span>
                      <button
                        type="button"
                        onClick={clearAuthor}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 14, color: 'var(--text-3)', padding: 0, lineHeight: 1,
                        }}
                        title="Change author"
                      >
                        ✕ Change
                      </button>
                    </div>
                  ) : (
                    /* Author search dropdown */
                    <div ref={authorDropRef} style={{ position: 'relative' }}>
                      <input
                        className="input"
                        placeholder="Search author name…"
                        value={authorQuery}
                        onChange={e => { setAuthorQuery(e.target.value); setShowAuthorDrop(true); }}
                        onFocus={() => setShowAuthorDrop(true)}
                      />
                      {showAuthorDrop && (
                        <div className="author-drop-edit">
                          {filteredAuthors.length === 0 ? (
                            <div style={{ padding: '12px', fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>
                              No author found for "{authorQuery}"
                            </div>
                          ) : filteredAuthors.map(a => (
                            <div key={a._id} className="author-opt-edit" onClick={() => selectAuthor(a)}>
                              <div className="author-photo-sm">
                                {a.photo
                                  ? <img src={a.photo} alt={a.name} />
                                  : a.name?.slice(0, 2).toUpperCase()
                                }
                              </div>
                              <div>
                                <div style={{ fontWeight: 600 }}>{a.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                                  {a.booksCount || 0} books{a.nationality ? ` · ${a.nationality}` : ''}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Description</label>
                  <textarea
                    className="input textarea"
                    value={editForm.description}
                    onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Description"
                    style={{ minHeight: 70 }}
                  />
                </div>

                {/* Published Year */}
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Published year</label>
                  <input
                    className="input"
                    type="number"
                    value={editForm.publishedYear}
                    onChange={e => setEditForm(p => ({ ...p, publishedYear: e.target.value }))}
                    placeholder="e.g. 2024"
                    min="0"
                    max={new Date().getFullYear() + 1}
                  />
                </div>

                {/* Cover upload */}
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Change cover</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="input"
                    style={{ padding: 6 }}
                    onChange={e => {
                      const f = e.target.files[0];
                      if (f) { setCoverFile(f); setCoverPrev(URL.createObjectURL(f)); }
                    }}
                  />
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn variant="primary" type="submit" size="sm" disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </Btn>
                  <Btn variant="ghost" type="button" size="sm" onClick={cancelEdit}>
                    Cancel
                  </Btn>
                </div>
              </form>

            ) : (
              /* ══ VIEW MODE ══ */
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
                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 10 }}>
                    {book.description}
                  </p>
                )}

                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  Uploaded by{' '}
                  <Link to={`/profile/${book.uploadedBy?._id}`} style={{ color: 'var(--blue-text)' }}>
                    {book.uploadedBy?.username}
                  </Link>
                </p>

                {canEdit && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <Btn variant="ghost"  size="sm" onClick={() => setEditing(true)}>Edit book</Btn>
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
              <img src={book.author.photo} alt={book.author.name}
                style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            )}
            <div>
              <Link to={`/authors/${book.author._id}`} style={{ fontWeight: 600, fontSize: 14, color: 'var(--blue-text)' }}>
                {book.author.name}
              </Link>
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
                  <Btn variant="primary" type="submit" size="sm" disabled={submitting}>
                    {submitting ? 'Posting…' : myReview ? 'Update' : 'Post'}
                  </Btn>
                  <Btn variant="ghost" type="button" size="sm" onClick={() => setShowReviewForm(false)}>Cancel</Btn>
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
                      background: 'none', border: 'none', fontSize: 12,
                      color: 'var(--text-3)', cursor: 'pointer', marginTop: 6, padding: 0,
                    }}>♡ {r.likesCount || 0}</button>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </>
  );
}
