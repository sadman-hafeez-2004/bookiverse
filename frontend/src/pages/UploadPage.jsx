import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useToastStore } from '../store';
import { useGenres } from '../hooks/useGenres';

export function UploadPage() {
  const { add }             = useToastStore();
  const navigate            = useNavigate();
  const { genres }          = useGenres();
  const [tab, setTab]       = useState('book');

  const coverRef          = useRef();
  const photoRef          = useRef();
  const authorDropdownRef = useRef();

  const [bookForm, setBookForm] = useState({
    title: '', genre: '', description: '', publishedYear: '', authorId: ''
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPrev, setCoverPrev] = useState('');
  const [bookBusy,  setBookBusy]  = useState(false);
  const [bookErr,   setBookErr]   = useState('');

  const [allAuthors,     setAllAuthors]     = useState([]);
  const [authorQuery,    setAuthorQuery]    = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [showDropdown,   setShowDropdown]   = useState(false);

  const [aForm,      setAForm]      = useState({ name: '', bio: '', nationality: '' });
  const [photoFile,  setPhotoFile]  = useState(null);
  const [photoPrev,  setPhotoPrev]  = useState('');
  const [aBusy,      setABusy]      = useState(false);
  const [aErr,       setAErr]       = useState('');
  const [dupWarning, setDupWarning] = useState('');

  useEffect(() => {
    api.get('/authors', { params: { limit: 500 } })
      .then(({ data }) => setAllAuthors(data.authors));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (authorDropdownRef.current && !authorDropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredAuthors = authorQuery.trim()
    ? allAuthors.filter(a => a.name.toLowerCase().includes(authorQuery.toLowerCase()))
    : allAuthors.slice(0, 8);

  const selectAuthor = (author) => {
    setSelectedAuthor(author);
    setAuthorQuery(author.name);
    setBookForm(p => ({ ...p, authorId: author._id }));
    setShowDropdown(false);
  };

  const clearAuthor = () => {
    setSelectedAuthor(null);
    setAuthorQuery('');
    setBookForm(p => ({ ...p, authorId: '' }));
  };

  const checkDuplicate = (name) => {
    if (!name.trim()) { setDupWarning(''); return; }
    const found = allAuthors.find(a => a.name.toLowerCase() === name.toLowerCase());
    setDupWarning(found ? `"${found.name}" already exists. Select them in the Book tab.` : '');
  };

  const submitBook = async (e) => {
    e.preventDefault();
    if (!bookForm.title.trim()) return setBookErr('Title is required.');
    if (!bookForm.genre)        return setBookErr('Please select a category.');
    if (!bookForm.authorId)     return setBookErr('Please select an author.');

    setBookErr(''); setBookBusy(true);
    try {
      const fd = new FormData();
      fd.append('title',    bookForm.title.trim());
      fd.append('genre',    bookForm.genre);
      fd.append('authorId', bookForm.authorId);
      if (bookForm.description)   fd.append('description',   bookForm.description);
      if (bookForm.publishedYear) fd.append('publishedYear', bookForm.publishedYear);
      if (coverFile) fd.append('coverImage', coverFile);

      const { data } = await api.post('/books', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setAllAuthors(prev => prev.map(a =>
        a._id === bookForm.authorId ? { ...a, booksCount: (a.booksCount || 0) + 1 } : a
      ));

      add('Book uploaded!');
      navigate(`/books/${data.book._id}`);
    } catch (err) {
      setBookErr(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setBookBusy(false);
    }
  };

  const submitAuthor = async (e) => {
    e.preventDefault();
    if (dupWarning) return add('Author already exists. Select them in the Book tab.', 'error');
    setAErr(''); setABusy(true);
    try {
      const fd = new FormData();
      if (aForm.name)        fd.append('name',        aForm.name.trim());
      if (aForm.bio)         fd.append('bio',         aForm.bio);
      if (aForm.nationality) fd.append('nationality', aForm.nationality);
      if (photoFile)         fd.append('photo',       photoFile);

      const { data } = await api.post('/authors', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      add(`Author "${data.author.name}" added!`);
      setAllAuthors(prev => [...prev, data.author]);
      selectAuthor(data.author);
      setAForm({ name: '', bio: '', nationality: '' });
      setPhotoFile(null); setPhotoPrev('');
      setDupWarning('');
      setTab('book');
    } catch (err) {
      setAErr(err.response?.data?.message || 'Failed to save author.');
    } finally {
      setABusy(false);
    }
  };

  const BookIcon = ({ active }) => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={active ? 'var(--blue-btn)' : 'var(--text-2)'}
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );

  const AuthorIcon = ({ active }) => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={active ? 'var(--blue-btn)' : 'var(--text-2)'}
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  const Tab = ({ v, label, icon }) => {
    const isActive = tab === v;
    return (
      <button type="button" onClick={() => setTab(v)} style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '10px 22px', border: 'none', background: 'none',
        cursor: 'pointer', fontSize: 14,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? 'var(--blue-btn)' : 'var(--text-2)',
        borderBottom: isActive ? '2px solid var(--blue-btn)' : '2px solid transparent',
        transition: 'color 150ms',
      }}>
        {icon === 'book'   && <BookIcon   active={isActive} />}
        {icon === 'author' && <AuthorIcon active={isActive} />}
        {label}
      </button>
    );
  };

  return (
    <>
      <style>{`
        .up-wrap { width:100%; max-width:520px; margin:0 auto; padding:20px 16px 60px; box-sizing:border-box; }
        @media(min-width:640px){ .up-wrap { padding:28px 24px 72px; } }
        .cover-box { width:110px; aspect-ratio:2/3; background:var(--surface-alt); border:2px dashed var(--border-strong); border-radius:var(--r-lg); overflow:hidden; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; transition:border-color 150ms,background 150ms; flex-shrink:0; position:relative; }
        .cover-box:hover { border-color:var(--blue-btn); background:var(--blue-fill); }
        .cover-box img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
        .cover-box .plus { font-size:32px; font-weight:300; color:var(--text-3); line-height:1; }
        .cover-box .hint { font-size:11px; color:var(--text-3); text-align:center; padding:0 8px; }
        .photo-circle { width:120px; height:120px; border-radius:50%; background:var(--surface-alt); border:2px dashed var(--border-strong); overflow:hidden; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; transition:border-color 150ms,background 150ms; margin:0 auto 24px; position:relative; }
        .photo-circle:hover { border-color:var(--blue-btn); background:var(--blue-fill); }
        .photo-circle img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
        .photo-circle .plus { font-size:32px; font-weight:300; color:var(--text-3); line-height:1; }
        .photo-circle .hint { font-size:11px; color:var(--text-3); }
        .author-drop { position:absolute; top:calc(100% + 4px); left:0; right:0; background:var(--surface); border:0.5px solid var(--border-strong); border-radius:var(--r-md); max-height:220px; overflow-y:auto; z-index:200; box-shadow:0 4px 20px rgba(0,0,0,0.1); }
        .author-opt { display:flex; align-items:center; gap:10px; padding:10px 12px; cursor:pointer; font-size:13px; color:var(--text-1); border-bottom:0.5px solid var(--border); transition:background 100ms; }
        .author-opt:last-child { border-bottom:none; }
        .author-opt:hover { background:var(--blue-fill); }
        .author-opt-photo { width:30px; height:30px; border-radius:50%; background:var(--blue-fill); flex-shrink:0; overflow:hidden; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:var(--blue-text); }
        .author-opt-photo img { width:100%; height:100%; object-fit:cover; }
        .no-author-found { padding:14px 12px; font-size:13px; color:var(--text-3); text-align:center; }
        .up-field { display:flex; flex-direction:column; gap:5px; }
        .up-label { font-size:13px; font-weight:500; color:var(--text-2); }
        .up-input { width:100%; background:var(--surface); border:0.5px solid var(--border-strong); border-radius:var(--r-md); padding:10px 12px; font-size:14px; color:var(--text-1); outline:none; transition:border-color 150ms; box-sizing:border-box; font-family:inherit; }
        .up-input:focus { border-color:var(--blue-400); }
        .up-input::placeholder { color:var(--text-3); }
        .up-textarea { resize:vertical; min-height:90px; }
        .up-btn { width:100%; padding:13px; background:var(--blue-btn); color:#fff; border:none; border-radius:var(--r-xl); font-size:15px; font-weight:600; cursor:pointer; transition:background 150ms; font-family:inherit; }
        .up-btn:hover { background:var(--blue-btn-h); }
        .up-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .up-err  { font-size:13px; color:var(--rose-800); background:var(--rose-50); padding:10px 14px; border-radius:var(--r-md); border-left:3px solid var(--rose-400); }
        .up-warn { font-size:13px; color:#D97706; background:#FEF3C7; padding:8px 12px; border-radius:var(--r-md); }
        .author-chip { display:flex; align-items:center; gap:8px; padding:8px 12px; background:var(--blue-fill); border:0.5px solid var(--blue-400); border-radius:var(--r-md); }
      `}</style>

      <div className="up-wrap">
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Upload</h1>
        <p style={{ color: 'var(--text-2)', marginBottom: 20, fontSize: 14 }}>Add a book or new author to the library.</p>

        <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', marginBottom: 24 }}>
          <Tab v="book"   label="Book"   icon="book"   />
          <Tab v="author" label="Author" icon="author" />
        </div>

        {tab === 'book' && (
          <form onSubmit={submitBook} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files[0]; if (f) { setCoverFile(f); setCoverPrev(URL.createObjectURL(f)); } }} />
              <div className="cover-box" onClick={() => coverRef.current.click()}>
                {coverPrev ? <img src={coverPrev} alt="cover" /> : <><div className="plus">+</div><div className="hint">Cover image</div></>}
              </div>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <div className="up-field">
                  <label className="up-label">Book title *</label>
                  <input className="up-input" placeholder="e.g. The Midnight Library"
                    value={bookForm.title} onChange={e => setBookForm(p => ({ ...p, title: e.target.value }))} required />
                </div>
              </div>
            </div>

            {/* FIX: genre dropdown now includes ALL genres from DB */}
            <div className="up-field">
              <label className="up-label">Category *</label>
              <select className="up-input" value={bookForm.genre}
                onChange={e => setBookForm(p => ({ ...p, genre: e.target.value }))} required>
                <option value="">Select category…</option>
                {genres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="up-field">
              <label className="up-label">Author *</label>
              {selectedAuthor ? (
                <div className="author-chip">
                  <div className="author-opt-photo">
                    {selectedAuthor.photo ? <img src={selectedAuthor.photo} alt={selectedAuthor.name} /> : selectedAuthor.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--blue-text)' }}>{selectedAuthor.name}</span>
                  <button type="button" onClick={clearAuthor} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-3)', padding: 0, lineHeight: 1 }}>✕</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <div ref={authorDropdownRef} style={{ flex: 1, position: 'relative' }}>
                    <input className="up-input" placeholder="Search author name…" value={authorQuery}
                      onChange={e => { setAuthorQuery(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)} />
                    {showDropdown && (
                      <div className="author-drop">
                        {filteredAuthors.length === 0 ? (
                          <div className="no-author-found">No author found for "{authorQuery}"</div>
                        ) : filteredAuthors.map(a => (
                          <div key={a._id} className="author-opt" onClick={() => selectAuthor(a)}>
                            <div className="author-opt-photo">
                              {a.photo ? <img src={a.photo} alt={a.name} /> : a.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{a.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{a.booksCount || 0} books{a.nationality ? ` · ${a.nationality}` : ''}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => setTab('author')} style={{
                    padding: '10px 14px', borderRadius: 'var(--r-md)', border: '0.5px solid var(--border-strong)',
                    background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 13,
                    fontWeight: 500, whiteSpace: 'nowrap', fontFamily: 'inherit',
                  }}>+ New</button>
                </div>
              )}
            </div>

            <div className="up-field">
              <label className="up-label">Description</label>
              <textarea className="up-input up-textarea" placeholder="What's this book about?"
                value={bookForm.description} onChange={e => setBookForm(p => ({ ...p, description: e.target.value }))} />
            </div>

            <div className="up-field">
              <label className="up-label">Published year</label>
              <input className="up-input" type="number" placeholder="e.g. 2024"
                min="0" max={new Date().getFullYear() + 1}
                value={bookForm.publishedYear} onChange={e => setBookForm(p => ({ ...p, publishedYear: e.target.value }))} />
            </div>

            {bookErr && <p className="up-err">{bookErr}</p>}
            <button className="up-btn" type="submit" disabled={bookBusy}>
              {bookBusy ? 'Uploading…' : 'Upload Book'}
            </button>
          </form>
        )}

        {tab === 'author' && (
          <form onSubmit={submitAuthor} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files[0]; if (f) { setPhotoFile(f); setPhotoPrev(URL.createObjectURL(f)); } }} />
            <div className="photo-circle" onClick={() => photoRef.current.click()}>
              {photoPrev ? <img src={photoPrev} alt="author" /> : <><div className="plus">+</div><div className="hint">Photo</div></>}
            </div>

            <div className="up-field">
              <label className="up-label">Author name *</label>
              <input className="up-input" placeholder="e.g. Matt Haig" value={aForm.name}
                onChange={e => { setAForm(p => ({ ...p, name: e.target.value })); checkDuplicate(e.target.value); }} required />
              {dupWarning && <div className="up-warn">⚠ {dupWarning}</div>}
            </div>

            <div className="up-field">
              <label className="up-label">Nationality</label>
              <input className="up-input" placeholder="e.g. British" value={aForm.nationality}
                onChange={e => setAForm(p => ({ ...p, nationality: e.target.value }))} />
            </div>

            <div className="up-field">
              <label className="up-label">Biography</label>
              <textarea className="up-input up-textarea" placeholder="Tell us about this author…"
                value={aForm.bio} onChange={e => setAForm(p => ({ ...p, bio: e.target.value }))} style={{ minHeight: 120 }} />
            </div>

            {aErr && <p className="up-err">{aErr}</p>}
            <button className="up-btn" type="submit" disabled={aBusy || !!dupWarning}
              style={{ background: dupWarning ? 'var(--neutral-400)' : 'var(--blue-btn)' }}>
              {aBusy ? 'Saving…' : 'Save Author'}
            </button>
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
              After saving, you'll return to the book form to select this author.
            </p>
          </form>
        )}
      </div>
    </>
  );
}
