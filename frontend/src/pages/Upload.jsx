import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useToastStore } from '../store';
import { Button, Input, Textarea, Select } from '../components/ui';

const GENRES = ['Fiction','Non-Fiction','Science Fiction','Fantasy','Mystery',
  'Thriller','Romance','Horror','Biography','History','Self-Help','Science','Philosophy','Poetry','Children','Young Adult','Graphic Novel','Other'];

export default function Upload() {
  const { add }      = useToastStore();
  const navigate     = useNavigate();
  const [tab, setTab] = useState('book'); // 'book' | 'author'

  // Book form
  const [bookForm, setBookForm] = useState({ title: '', genre: '', description: '', publishedYear: '', authorId: '' });
  const [coverFile, setCoverFile]   = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [authors, setAuthors] = useState([]);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError]     = useState('');

  // Author form
  const [authorForm, setAuthorForm] = useState({ name: '', bio: '', nationality: '' });
  const [photoFile, setPhotoFile]   = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [authorLoading, setAuthorLoading] = useState(false);
  const [authorError, setAuthorError]     = useState('');

  useEffect(() => {
    api.get('/authors', { params: { limit: 100 } }).then(({ data }) => setAuthors(data.authors));
  }, []);

  const handleCover = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const submitBook = async (e) => {
    e.preventDefault();
    setBookError(''); setBookLoading(true);
    try {
      const fd = new FormData();
      Object.entries(bookForm).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (coverFile) fd.append('coverImage', coverFile);
      const { data } = await api.post('/books', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      add('Book uploaded successfully!');
      navigate(`/books/${data.book._id}`);
    } catch (err) {
      setBookError(err.response?.data?.message || 'Upload failed.');
    } finally { setBookLoading(false); }
  };

  const submitAuthor = async (e) => {
    e.preventDefault();
    setAuthorError(''); setAuthorLoading(true);
    try {
      const fd = new FormData();
      Object.entries(authorForm).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (photoFile) fd.append('photo', photoFile);
      const { data } = await api.post('/authors', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      add(`Author "${data.author.name}" created!`);
      setAuthors(prev => [...prev, data.author]);
      setAuthorForm({ name: '', bio: '', nationality: '' });
      setPhotoFile(null); setPhotoPreview('');
      setTab('book');
      setBookForm(prev => ({ ...prev, authorId: data.author._id }));
    } catch (err) {
      setAuthorError(err.response?.data?.message || 'Failed to create author.');
    } finally { setAuthorLoading(false); }
  };

  const TabBtn = ({ value, label }) => (
    <button
      type="button"
      onClick={() => setTab(value)}
      style={{
        padding: '8px 20px', fontSize: 14, fontWeight: tab === value ? 600 : 400,
        borderBottom: tab === value ? '2px solid var(--blue-btn)' : '2px solid transparent',
        color: tab === value ? 'var(--blue-btn)' : 'var(--text-secondary)',
        background: 'none', border: 'none', borderRadius: 0,
        borderBottom: tab === value ? '2px solid var(--blue-btn)' : '2px solid transparent',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="container page-padding">
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 className="h1" style={{ marginBottom: 6 }}>Upload</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Add a new book or author to the library.</p>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', marginBottom: 28 }}>
          <TabBtn value="book"   label="📚 Upload book" />
          <TabBtn value="author" label="✍️ Add author"  />
        </div>

        {/* Book form */}
        {tab === 'book' && (
          <form onSubmit={submitBook} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Cover upload */}
            <div>
              <div className="form-label" style={{ marginBottom: 8 }}>Book cover</div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 100, aspectRatio: '2/3',
                  background: 'var(--blue-fill)', borderRadius: 'var(--r-md)',
                  border: '0.5px solid var(--border)', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {coverPreview
                    ? <img src={coverPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 24 }}>📖</span>
                  }
                </div>
                <div>
                  <input type="file" accept="image/*" onChange={handleCover} id="cover-input" style={{ display: 'none' }} />
                  <label htmlFor="cover-input">
                    <Button variant="ghost" size="sm" as="span" style={{ cursor: 'pointer' }}>Choose image</Button>
                  </label>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>JPG, PNG or WebP. Shown at 2:3 ratio.</p>
                </div>
              </div>
            </div>

            <Input label="Book title *" placeholder="e.g. The Midnight Library" value={bookForm.title}
              onChange={e => setBookForm(p => ({ ...p, title: e.target.value }))} required />

            <Select label="Genre *" value={bookForm.genre} onChange={e => setBookForm(p => ({ ...p, genre: e.target.value }))} required>
              <option value="">Select a genre…</option>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </Select>

            <div className="form-group">
              <label className="form-label">Author *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="input" value={bookForm.authorId}
                  onChange={e => setBookForm(p => ({ ...p, authorId: e.target.value }))} required style={{ flex: 1 }}>
                  <option value="">Select an author…</option>
                  {authors.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
                <Button variant="ghost" size="sm" type="button" onClick={() => setTab('author')}>
                  + New author
                </Button>
              </div>
            </div>

            <Textarea label="Description" placeholder="What's this book about?" value={bookForm.description}
              onChange={e => setBookForm(p => ({ ...p, description: e.target.value }))} />

            <Input label="Published year" type="number" placeholder="2023" value={bookForm.publishedYear}
              onChange={e => setBookForm(p => ({ ...p, publishedYear: e.target.value }))} />

            {bookError && <p style={{ color: 'var(--rose-800)', fontSize: 13 }}>{bookError}</p>}

            <Button variant="primary" full type="submit" disabled={bookLoading}>
              {bookLoading ? 'Uploading…' : 'Upload book'}
            </Button>
          </form>
        )}

        {/* Author form */}
        {tab === 'author' && (
          <form onSubmit={submitAuthor} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Photo upload */}
            <div>
              <div className="form-label" style={{ marginBottom: 8 }}>Author photo</div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'var(--blue-fill)', border: '0.5px solid var(--border)',
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {photoPreview
                    ? <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 22 }}>👤</span>
                  }
                </div>
                <div>
                  <input type="file" accept="image/*" onChange={handlePhoto} id="photo-input" style={{ display: 'none' }} />
                  <label htmlFor="photo-input">
                    <Button variant="ghost" size="sm" as="span" style={{ cursor: 'pointer' }}>Choose photo</Button>
                  </label>
                </div>
              </div>
            </div>

            <Input label="Author name *" placeholder="e.g. Matt Haig" value={authorForm.name}
              onChange={e => setAuthorForm(p => ({ ...p, name: e.target.value }))} required />

            <Input label="Nationality" placeholder="e.g. British" value={authorForm.nationality}
              onChange={e => setAuthorForm(p => ({ ...p, nationality: e.target.value }))} />

            <Textarea label="Biography" placeholder="Tell us about this author…" value={authorForm.bio}
              onChange={e => setAuthorForm(p => ({ ...p, bio: e.target.value }))} style={{ minHeight: 120 }} />

            {authorError && <p style={{ color: 'var(--rose-800)', fontSize: 13 }}>{authorError}</p>}

            <Button variant="primary" full type="submit" disabled={authorLoading}>
              {authorLoading ? 'Saving…' : 'Save author'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
