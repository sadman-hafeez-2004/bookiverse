import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore, useToastStore } from '../store';
import { Button, Spinner, EmptyState } from '../components/ui';
import BookCard from '../components/BookCard';

export default function AuthorDetail() {
  const { id }          = useParams();
  const { user }        = useAuthStore();
  const { add }         = useToastStore();
  const [author, setAuthor] = useState(null);
  const [books,  setBooks]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ name: '', bio: '', nationality: '' });
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/authors/${id}`);
        setAuthor(data.author);
        setBooks(data.books);
        setForm({ name: data.author.name, bio: data.author.bio || '', nationality: data.author.nationality || '' });
      } finally { setLoading(false); }
    };
    load();
  }, [id]);

  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put(`/authors/${id}`, form);
      setAuthor(data.author);
      setEditing(false);
      add('Author updated!');
    } catch (err) {
      add(err.response?.data?.message || 'Update failed.', 'error');
    } finally { setSaving(false); }
  };

  const canEdit = user && (user.role === 'admin' || author?.uploadedBy?._id === user._id);

  if (loading) return <div className="container page-padding"><Spinner /></div>;
  if (!author) return <div className="container page-padding"><p>Author not found.</p></div>;

  return (
    <div className="container page-padding">
      {/* Author header */}
      <div className="card" style={{ marginBottom: 32, padding: 28 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Photo */}
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'var(--blue-fill)', border: '0.5px solid var(--border)',
            overflow: 'hidden', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, color: 'var(--text-muted)',
          }}>
            {author.photo
              ? <img src={author.photo} alt={author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : '✍'
            }
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            {editing ? (
              <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Author name" required />
                <input className="input" value={form.nationality} onChange={e => setForm(p => ({ ...p, nationality: e.target.value }))} placeholder="Nationality" />
                <textarea className="input textarea" value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Biography…" style={{ minHeight: 100 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="primary" size="sm" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
                  <Button variant="ghost" size="sm" type="button" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                  <h1 className="h1">{author.name}</h1>
                  {canEdit && (
                    <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Button>
                  )}
                </div>
                {author.nationality && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>📍 {author.nationality}</p>
                )}
                {author.bio && (
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 600 }}>{author.bio}</p>
                )}
                <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
                  <div style={{ background: 'var(--blue-fill)', borderRadius: 'var(--r-md)', padding: '8px 14px' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--blue-text)' }}>{author.booksCount || books.length}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Books</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'flex-end', paddingBottom: 6 }}>
                    Added by <Link to={`/profile/${author.uploadedBy?._id}`} style={{ color: 'var(--blue-text)' }}>{author.uploadedBy?.username}</Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Books */}
      <h2 className="h2" style={{ marginBottom: 16 }}>Books by {author.name}</h2>
      {books.length === 0
        ? <EmptyState icon="📖" title="No books yet" description="No books have been uploaded for this author." />
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: 14 }}>
            {books.map(b => <BookCard key={b._id} book={b} />)}
          </div>
        )
      }
    </div>
  );
}
