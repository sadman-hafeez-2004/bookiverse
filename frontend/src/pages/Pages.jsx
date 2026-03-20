import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore, useToastStore, useOnlineStore } from '../store';
import { Av, Btn, Input, Textarea, Select, Spinner, Empty, Stars } from '../components/ui';
import BookCard from '../components/BookCard';

// ─── Readers ─────────────────────────────────────────────────
export function ReadersPage() {
  const { user: me }  = useAuthStore();
  const { add }       = useToastStore();
  const { online }    = useOnlineStore();
  const [users,   setUsers]   = useState([]);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api.get('/users', { params: { search, limit: 30 } })
        .then(({ data }) => setUsers(data.users))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const startChat = async (userId) => {
    if (!me) return navigate('/login');
    const { data } = await api.post('/chat/conversations', { userId });
    navigate(`/chat/${data.conversation._id}`);
  };

  return (
    <div className="container page">
      <h1 className="h1" style={{ marginBottom: 14 }}>Readers</h1>
      <Input placeholder="Search readers…" value={search}
        onChange={e => setSearch(e.target.value)} style={{ marginBottom: 16 }} />

      {loading ? <Spinner /> : users.filter(u => u._id !== me?._id).map(u => (
        <div key={u._id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: '0.5px solid var(--border)' }}>
          <Link to={`/profile/${u._id}`} style={{ position: 'relative' }}>
            <Av user={u} size="md" />
            {online.has(u._id) && (
              <span style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, background: 'var(--green-400)', borderRadius: '50%', border: '2px solid var(--bg)' }} />
            )}
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link to={`/profile/${u._id}`} style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{u.username}</Link>
            {u.bio && <p style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.bio}</p>}
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{u.collectedCount || 0} books · {u.followersCount || 0} followers</div>
          </div>
          {me && (
            <Btn variant="ghost" size="sm" onClick={() => startChat(u._id)}>Message</Btn>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────
export function SettingsPage() {
  const { user, updateUser, logout } = useAuthStore();
  const { add }    = useToastStore();
  const navigate   = useNavigate();
  const fileRef    = useRef();

  const [form, setForm] = useState({ username: user?.username || '', bio: user?.bio || '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPrev, setAvatarPrev] = useState('');
  const [pBusy, setPBusy] = useState(false);
  const [pErr,  setPErr]  = useState('');

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [wBusy, setWBusy]  = useState(false);
  const [wErr,  setWErr]   = useState('');

  const saveProfile = async (e) => {
    e.preventDefault(); setPErr(''); setPBusy(true);
    try {
      const fd = new FormData();
      fd.append('username', form.username);
      fd.append('bio', form.bio);
      if (avatarFile) fd.append('avatar', avatarFile);
      const { data } = await api.put('/users/me', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser(data.user);
      add('Profile updated!');
      setAvatarFile(null);
    } catch (e) { setPErr(e.response?.data?.message || 'Failed.'); }
    finally { setPBusy(false); }
  };

  const changePw = async (e) => {
    e.preventDefault(); setWErr('');
    if (pwForm.newPassword !== pwForm.confirm) return setWErr('Passwords do not match.');
    if (pwForm.newPassword.length < 6) return setWErr('Minimum 6 characters.');
    setWBusy(true);
    try {
      await api.put('/auth/password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      add('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (e) { setWErr(e.response?.data?.message || 'Failed.'); }
    finally { setWBusy(false); }
  };

  const Sec = ({ title, children }) => (
    <div className="card" style={{ marginBottom: 14, padding: 20 }}>
      <h2 className="h3" style={{ marginBottom: 16, paddingBottom: 10, borderBottom: '0.5px solid var(--border)' }}>{title}</h2>
      {children}
    </div>
  );

  return (
    <div className="container page">
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <h1 className="h1" style={{ marginBottom: 20 }}>Settings</h1>

        <Sec title="Profile">
          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {avatarPrev
                ? <img src={avatarPrev} alt="preview" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '0.5px solid var(--border)' }} />
                : <Av user={user} size="lg" />
              }
              <div>
                <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files[0]; if (f) { setAvatarFile(f); setAvatarPrev(URL.createObjectURL(f)); } }} />
                <Btn variant="ghost" size="sm" type="button" onClick={() => fileRef.current.click()}>Change avatar</Btn>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>JPG, PNG, WebP</p>
              </div>
            </div>
            <Input label="Username" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required />
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="input textarea" value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="About yourself…" maxLength={300} style={{ minHeight: 72 }} />
              <span style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'right' }}>{form.bio.length}/300</span>
            </div>
            {pErr && <p style={{ color: 'var(--rose-800)', fontSize: 13 }}>{pErr}</p>}
            <Btn variant="primary" type="submit" disabled={pBusy}>{pBusy ? 'Saving…' : 'Save profile'}</Btn>
          </form>
        </Sec>

        <Sec title="Change password">
          <form onSubmit={changePw} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input label="Current password" type="password" placeholder="••••••••" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} required />
            <Input label="New password"     type="password" placeholder="Min 6 characters" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} required />
            <Input label="Confirm password" type="password" placeholder="••••••••" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} required />
            {wErr && <p style={{ color: 'var(--rose-800)', fontSize: 13 }}>{wErr}</p>}
            <Btn variant="primary" type="submit" disabled={wBusy}>{wBusy ? 'Updating…' : 'Update password'}</Btn>
          </form>
        </Sec>

        <Sec title="Account">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-2)' }}>Email</span>
              <span>{user?.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-2)' }}>Role</span>
              <span style={{ textTransform: 'capitalize' }}>{user?.role}</span>
            </div>
            <hr className="divider" style={{ margin: '4px 0' }} />
            <Btn variant="danger" onClick={() => { logout(); navigate('/'); }}>Log out</Btn>
          </div>
        </Sec>
      </div>
    </div>
  );
}

// ─── Author Detail ────────────────────────────────────────────
export function AuthorDetailPage() {
  const { id }   = useParams();
  const { user } = useAuthStore();
  const { add }  = useToastStore();
  const [author, setAuthor] = useState(null);
  const [books,  setBooks]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', nationality: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/authors/${id}`).then(({ data }) => {
      setAuthor(data.author);
      setBooks(data.books);
      setForm({ name: data.author.name, bio: data.author.bio || '', nationality: data.author.nationality || '' });
    }).finally(() => setLoading(false));
  }, [id]);

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const { data } = await api.put(`/authors/${id}`, form);
      setAuthor(data.author); setEditing(false); add('Updated!');
    } catch (e) { add(e.response?.data?.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <Spinner />;
  if (!author)  return <div className="container page"><p>Not found.</p></div>;

  const canEdit = user && (user.role === 'admin' || author.uploadedBy?._id === user._id);

  return (
    <div className="container page">
      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--blue-fill)', border: '0.5px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
            {author.photo ? <img src={author.photo} alt={author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '✍'}
          </div>
          <div style={{ flex: 1 }}>
            {editing ? (
              <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                <input className="input" value={form.nationality} onChange={e => setForm(p => ({ ...p, nationality: e.target.value }))} placeholder="Nationality" />
                <textarea className="input textarea" value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} style={{ minHeight: 80 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn variant="primary" size="sm" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Btn>
                  <Btn variant="ghost" size="sm" type="button" onClick={() => setEditing(false)}>Cancel</Btn>
                </div>
              </form>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                  <h1 className="h1">{author.name}</h1>
                  {canEdit && <Btn variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Btn>}
                </div>
                {author.nationality && <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 6 }}>📍 {author.nationality}</p>}
                {author.bio && <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>{author.bio}</p>}
                <div style={{ marginTop: 10, background: 'var(--blue-fill)', borderRadius: 'var(--r-md)', padding: '8px 12px', display: 'inline-block' }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--blue-text)' }}>{books.length}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 4 }}>books</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <h2 className="h2" style={{ marginBottom: 14 }}>Books by {author.name}</h2>
      {books.length === 0
        ? <Empty icon="📖" title="No books yet" />
        : <div className="book-grid">{books.map(b => <BookCard key={b._id} book={b} />)}</div>
      }
    </div>
  );
}

// ─── Search ───────────────────────────────────────────────────
export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [tab, setTab] = useState('books');
  const [books,   setBooks]   = useState([]);
  const [authors, setAuthors] = useState([]);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) return;
    setLoading(true);
    Promise.all([
      api.get('/books',   { params: { search: q, limit: 24 } }),
      api.get('/authors', { params: { search: q, limit: 12 } }),
      api.get('/users',   { params: { search: q, limit: 12 } }),
    ]).then(([b, a, u]) => {
      setBooks(b.data.books); setAuthors(a.data.authors); setUsers(u.data.users);
    }).finally(() => setLoading(false));
  }, [q]);

  const T = ({ v, l, n }) => (
    <button onClick={() => setTab(v)} style={{
      padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14,
      fontWeight: tab === v ? 600 : 400, color: tab === v ? 'var(--blue-btn)' : 'var(--text-2)',
      borderBottom: tab === v ? '2px solid var(--blue-btn)' : '2px solid transparent',
    }}>{l} {n > 0 && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>({n})</span>}</button>
  );

  return (
    <div className="container page">
      <h1 className="h1" style={{ marginBottom: 4 }}>Search results</h1>
      <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 16 }}>for "{q}"</p>
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', marginBottom: 20 }}>
        <T v="books"   l="Books"   n={books.length} />
        <T v="authors" l="Authors" n={authors.length} />
        <T v="readers" l="Readers" n={users.length} />
      </div>
      {loading ? <Spinner /> : (
        <>
          {tab === 'books'   && (books.length === 0   ? <Empty icon="📚" title="No books found" /> : <div className="book-grid">{books.map(b => <BookCard key={b._id} book={b} />)}</div>)}
          {tab === 'authors' && (authors.length === 0 ? <Empty icon="✍️" title="No authors found" /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {authors.map(a => (
                <Link key={a._id} to={`/authors/${a._id}`} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--blue-fill)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {a.photo ? <img src={a.photo} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '✍'}
                  </div>
                  <div><div style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{a.booksCount || 0} books</div></div>
                </Link>
              ))}
            </div>
          ))}
          {tab === 'readers' && (users.length === 0 ? <Empty icon="👤" title="No readers found" /> : (
            users.map(u => (
              <Link key={u._id} to={`/profile/${u._id}`} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: '0.5px solid var(--border)' }}>
                <Av user={u} size="md" />
                <div><div style={{ fontWeight: 600, fontSize: 14 }}>{u.username}</div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>{u.collectedCount || 0} books · {u.followersCount || 0} followers</div></div>
              </Link>
            ))
          ))}
        </>
      )}
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────
export function AdminPage() {
  const { add }   = useToastStore();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data.stats));
  }, []);

  useEffect(() => {
    if (tab === 'users') api.get('/admin/users', { params: { search, limit: 40 } }).then(({ data }) => setUsers(data.users));
    if (tab === 'books') api.get('/books',        { params: { search, limit: 40 } }).then(({ data }) => setBooks(data.books));
  }, [tab, search]);

  const delUser = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await api.delete(`/admin/users/${id}`);
    setUsers(u => u.filter(x => x._id !== id)); add('User deleted.');
  };
  const delBook = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    await api.delete(`/admin/books/${id}`);
    setBooks(b => b.filter(x => x._id !== id)); add('Book deleted.');
  };
  const setRole = async (id, role) => {
    const { data } = await api.put(`/admin/users/${id}/role`, { role });
    setUsers(u => u.map(x => x._id === id ? data.user : x));
    add(`Role → ${role}`);
  };

  const T = ({ v, l }) => (
    <button onClick={() => { setTab(v); setSearch(''); }} style={{
      padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14,
      fontWeight: tab === v ? 600 : 400, color: tab === v ? 'var(--blue-btn)' : 'var(--text-2)',
      borderBottom: tab === v ? '2px solid var(--blue-btn)' : '2px solid transparent',
    }}>{l}</button>
  );

  const Stat = ({ l, v, bg = 'var(--blue-fill)', tc = 'var(--blue-text)' }) => (
    <div style={{ background: bg, borderRadius: 'var(--r-lg)', padding: '16px 18px', border: '0.5px solid var(--border)' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: tc }}>{(v || 0).toLocaleString()}</div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{l}</div>
    </div>
  );

  return (
    <div className="container page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="h1">Admin panel</h1>
        <span className="tag tag-amber">Admin</span>
      </div>

      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', marginBottom: 24 }}>
        <T v="overview" l="Overview" />
        <T v="users"    l="Users"    />
        <T v="books"    l="Books"    />
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          <Stat l="Users"   v={stats?.users}   />
          <Stat l="Books"   v={stats?.books}   bg="var(--green-50)"  tc="var(--green-800)" />
          <Stat l="Authors" v={stats?.authors} bg="#FEF3C7"          tc="#92400E" />
          <Stat l="Reviews" v={stats?.reviews} bg="var(--rose-50)"   tc="var(--rose-800)" />
        </div>
      )}

      {tab === 'users' && (
        <>
          <input className="input" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300, marginBottom: 16 }} />
          {users.map(u => (
            <div key={u._id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid var(--border)', flexWrap: 'wrap' }}>
              <Av user={u} size="sm" />
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{u.username}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{u.email}</div>
              </div>
              <select className="input" value={u.role} onChange={e => setRole(u._id, e.target.value)}
                style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <Btn variant="danger" size="sm" onClick={() => delUser(u._id, u.username)}>Delete</Btn>
            </div>
          ))}
        </>
      )}

      {tab === 'books' && (
        <>
          <input className="input" placeholder="Search books…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300, marginBottom: 16 }} />
          {books.map(b => (
            <div key={b._id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid var(--border)', flexWrap: 'wrap' }}>
              <div style={{ width: 36, height: 52, borderRadius: 4, background: 'var(--blue-fill)', overflow: 'hidden', flexShrink: 0 }}>
                {b.coverImage && <img src={b.coverImage} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 100 }}>
                <Link to={`/books/${b._id}`} style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{b.title}</Link>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{b.author?.name} · {b.genre}</div>
              </div>
              <Btn variant="danger" size="sm" onClick={() => delBook(b._id, b.title)}>Delete</Btn>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
