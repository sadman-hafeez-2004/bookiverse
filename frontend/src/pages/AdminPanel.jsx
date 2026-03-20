import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useToastStore } from '../store';

export function AdminPage() {
  const { add } = useToastStore();
  const [tab, setTab] = useState('overview');

  const Tab = ({ v, l }) => (
    <button onClick={() => setTab(v)} style={{
      padding: '9px 16px', border: 'none', background: 'none', cursor: 'pointer',
      fontSize: 13, fontWeight: tab === v ? 600 : 400, whiteSpace: 'nowrap',
      color: tab === v ? 'var(--blue-btn)' : 'var(--text-2)',
      borderBottom: tab === v ? '2px solid var(--blue-btn)' : '2px solid transparent',
    }}>{l}</button>
  );

  return (
    <>
      <style>{`
        .admin-wrap { width:100%; max-width:1100px; margin:0 auto; padding:16px; box-sizing:border-box; }
        @media(min-width:768px) { .admin-wrap { padding:24px 32px; } }
        .admin-table { width:100%; border-collapse:collapse; font-size:13px; }
        .admin-table th { text-align:left; padding:10px 12px; font-size:11px; font-weight:700; color:var(--text-3); text-transform:uppercase; letter-spacing:0.06em; background:var(--surface-alt); border-bottom:0.5px solid var(--border); }
        .admin-table td { padding:10px 12px; border-bottom:0.5px solid var(--border); color:var(--text-1); vertical-align:middle; }
        .admin-table tr:last-child td { border-bottom:none; }
        .admin-table tr:hover td { background:var(--surface-alt); }
        .ab { display:inline-flex; align-items:center; gap:4px; padding:5px 10px; border-radius:6px; font-size:12px; font-weight:500; cursor:pointer; border:none; transition:all 150ms; }
        .ab-red  { background:var(--rose-50);  color:var(--rose-800);  }
        .ab-blue { background:var(--blue-fill); color:var(--blue-text); }
        .ab-green{ background:var(--green-50);  color:var(--green-800); }
        .ab-gray { background:var(--neutral-100); color:var(--neutral-600); }
        .stat-box { background:var(--surface); border:0.5px solid var(--border); border-radius:12px; padding:18px 20px; }
        .stat-num { font-size:28px; font-weight:800; color:var(--blue-btn); }
        .stat-lbl { font-size:12px; color:var(--text-3); margin-top:3px; }
        .form-row { display:flex; gap:8px; margin-bottom:16px; }
        .badge-active   { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:600; background:var(--green-50); color:var(--green-800); }
        .badge-inactive { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:600; background:var(--neutral-100); color:var(--neutral-600); }
        .badge-info    { background:var(--blue-fill); color:var(--blue-text); }
        .badge-warning { background:#FEF3C7; color:#92400E; }
        .badge-success { background:var(--green-50); color:var(--green-800); }
      `}</style>

      <div className="admin-wrap">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text-1)' }}>Admin Panel</h1>
            <p style={{ fontSize:13, color:'var(--text-3)', marginTop:2 }}>Manage Bookiverse</p>
          </div>
          <span style={{ background:'#FEF3C7', color:'#92400E', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>Admin</span>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', overflowX:'auto', borderBottom:'0.5px solid var(--border)', marginBottom:24, gap:0, scrollbarWidth:'none' }}>
          <Tab v="overview"      l="📊 Overview"      />
          <Tab v="users"         l="👥 Users"         />
          <Tab v="books"         l="📚 Books"         />
          <Tab v="authors"       l="✍️ Authors"       />
          <Tab v="reviews"       l="⭐ Reviews"       />
          <Tab v="genres"        l="🏷️ Genres"        />
          <Tab v="announcements" l="📢 Announcements" />
        </div>

        {tab === 'overview'      && <OverviewTab      add={add} />}
        {tab === 'users'         && <UsersTab         add={add} />}
        {tab === 'books'         && <BooksTab         add={add} />}
        {tab === 'authors'       && <AuthorsTab       add={add} />}
        {tab === 'reviews'       && <ReviewsTab       add={add} />}
        {tab === 'genres'        && <GenresTab        add={add} />}
        {tab === 'announcements' && <AnnouncementsTab add={add} />}
      </div>
    </>
  );
}

// ── Overview ──────────────────────────────────────────────────
function OverviewTab({ add }) {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/admin/stats').then(r => setData(r.data)); }, []);
  if (!data) return <div style={{ textAlign:'center', padding:40, color:'var(--text-3)' }}>Loading…</div>;
  const { stats, recentUsers, recentBooks } = data;
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:12, marginBottom:28 }}>
        {[
          { l:'Users',   v:stats.users   },
          { l:'Books',   v:stats.books   },
          { l:'Authors', v:stats.authors },
          { l:'Reviews', v:stats.reviews },
          { l:'Genres',  v:stats.genres  },
        ].map(({ l, v }) => (
          <div key={l} className="stat-box">
            <div className="stat-num">{v?.toLocaleString()}</div>
            <div className="stat-lbl">{l}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div className="stat-box">
          <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Recent users</div>
          {recentUsers.map(u => (
            <div key={u._id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'0.5px solid var(--border)', fontSize:13 }}>
              <span style={{ color:'var(--text-1)' }}>{u.username}</span>
              <span style={{ color:'var(--text-3)' }}>{new Date(u.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
        <div className="stat-box">
          <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Recent books</div>
          {recentBooks.map(b => (
            <div key={b._id} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'0.5px solid var(--border)', fontSize:13 }}>
              <span style={{ color:'var(--text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:160 }}>{b.title}</span>
              <span style={{ color:'var(--text-3)', flexShrink:0 }}>{new Date(b.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Users ─────────────────────────────────────────────────────
function UsersTab({ add }) {
  const [users, setUsers]     = useState([]);
  const [search, setSearch]   = useState('');
  const [banForm, setBanForm] = useState({ id:'', reason:'' });
  const [showBan, setShowBan] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      api.get('/admin/users', { params:{ search, limit:40 } }).then(r => setUsers(r.data.users));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const changeRole = async (id, role) => {
    const { data } = await api.put(`/admin/users/${id}/role`, { role });
    setUsers(u => u.map(x => x._id===id ? data.user : x));
    add(`Role updated to ${role}`);
  };

  const submitBan = async () => {
    const { data } = await api.put(`/admin/users/${banForm.id}/ban`, { isBanned: true, banReason: banForm.reason });
    setUsers(u => u.map(x => x._id===banForm.id ? data.user : x));
    setShowBan(false); setBanForm({ id:'', reason:'' });
    add('User banned.');
  };

  const unban = async (id) => {
    const { data } = await api.put(`/admin/users/${id}/ban`, { isBanned: false });
    setUsers(u => u.map(x => x._id===id ? data.user : x));
    add('User unbanned.');
  };

  const del = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await api.delete(`/admin/users/${id}`);
    setUsers(u => u.filter(x => x._id!==id));
    add('User deleted.');
  };

  return (
    <div>
      {showBan && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}>
          <div style={{ background:'var(--surface)', borderRadius:12, padding:24, width:'90%', maxWidth:400 }}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:14 }}>Ban user</div>
            <textarea className="input" value={banForm.reason} onChange={e => setBanForm(p=>({...p,reason:e.target.value}))}
              placeholder="Reason for ban…" style={{ minHeight:80, marginBottom:12 }} />
            <div style={{ display:'flex', gap:8 }}>
              <button className="ab ab-red" onClick={submitBan} style={{ flex:1, justifyContent:'center' }}>Confirm ban</button>
              <button className="ab ab-gray" onClick={() => setShowBan(false)} style={{ flex:1, justifyContent:'center' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="form-row">
        <input className="input" placeholder="Search users…" value={search} onChange={e=>setSearch(e.target.value)} style={{ maxWidth:300 }} />
      </div>
      <div style={{ background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:10, overflow:'auto' }}>
        <table className="admin-table">
          <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td><Link to={`/profile/${u._id}`} style={{ fontWeight:600, color:'var(--blue-text)' }}>{u.username}</Link></td>
                <td style={{ color:'var(--text-2)' }}>{u.email}</td>
                <td>
                  <select value={u.role} onChange={e=>changeRole(u._id,e.target.value)}
                    style={{ background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:6, padding:'3px 6px', fontSize:12, color:'var(--text-1)' }}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  {u.isBanned
                    ? <span className="badge-inactive">Banned</span>
                    : <span className="badge-active">Active</span>
                  }
                </td>
                <td style={{ color:'var(--text-3)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <div style={{ display:'flex', gap:6 }}>
                    {u.isBanned
                      ? <button className="ab ab-green" onClick={()=>unban(u._id)}>Unban</button>
                      : <button className="ab ab-gray"  onClick={()=>{ setBanForm({id:u._id,reason:''}); setShowBan(true); }}>Ban</button>
                    }
                    <button className="ab ab-red" onClick={()=>del(u._id,u.username)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users.length && <div style={{ padding:32, textAlign:'center', color:'var(--text-3)' }}>No users found</div>}
      </div>
    </div>
  );
}

// ── Books ─────────────────────────────────────────────────────
function BooksTab({ add }) {
  const [books, setBooks]   = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      api.get('/admin/books', { params:{ search, limit:40 } }).then(r => setBooks(r.data.books));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const toggleFeature = async (id, current) => {
    const { data } = await api.put(`/admin/books/${id}/feature`, { isFeatured: !current });
    setBooks(b => b.map(x => x._id===id ? data.book : x));
    add(data.message);
  };

  const del = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    await api.delete(`/admin/books/${id}`);
    setBooks(b => b.filter(x => x._id!==id));
    add('Book deleted.');
  };

  return (
    <div>
      <div className="form-row">
        <input className="input" placeholder="Search books…" value={search} onChange={e=>setSearch(e.target.value)} style={{ maxWidth:300 }} />
      </div>
      <div style={{ background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:10, overflow:'auto' }}>
        <table className="admin-table">
          <thead><tr><th>Book</th><th>Author</th><th>Genre</th><th>Rating</th><th>Featured</th><th>Actions</th></tr></thead>
          <tbody>
            {books.map(b => (
              <tr key={b._id}>
                <td>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <div style={{ width:28, height:40, borderRadius:3, background:'var(--blue-fill)', overflow:'hidden', flexShrink:0 }}>
                      {b.coverImage && <img src={b.coverImage} alt={b.title} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>}
                    </div>
                    <Link to={`/books/${b._id}`} style={{ fontWeight:600, color:'var(--blue-text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:160 }}>{b.title}</Link>
                  </div>
                </td>
                <td style={{ color:'var(--text-2)' }}>{b.author?.name}</td>
                <td><span style={{ background:'var(--blue-fill)', color:'var(--blue-text)', padding:'2px 7px', borderRadius:20, fontSize:11, fontWeight:600 }}>{b.genre}</span></td>
                <td style={{ color:'var(--text-2)' }}>★ {b.averageRating?.toFixed(1)||'—'}</td>
                <td>{b.isFeatured ? <span className="badge-active">Yes</span> : <span className="badge-inactive">No</span>}</td>
                <td>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="ab ab-blue" onClick={()=>toggleFeature(b._id, b.isFeatured)}>
                      {b.isFeatured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button className="ab ab-red" onClick={()=>del(b._id,b.title)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!books.length && <div style={{ padding:32, textAlign:'center', color:'var(--text-3)' }}>No books found</div>}
      </div>
    </div>
  );
}

// ── Authors ───────────────────────────────────────────────────
function AuthorsTab({ add }) {
  const [authors, setAuthors] = useState([]);
  const [search,  setSearch]  = useState('');
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ name:'', bio:'', nationality:'' });

  useEffect(() => {
    const t = setTimeout(() => {
      api.get('/admin/authors', { params:{ search, limit:40 } }).then(r => setAuthors(r.data.authors));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const startEdit = (a) => { setEditing(a._id); setForm({ name:a.name, bio:a.bio||'', nationality:a.nationality||'' }); };

  const saveEdit = async () => {
    const { data } = await api.put(`/admin/authors/${editing}`, form);
    setAuthors(a => a.map(x => x._id===editing ? data.author : x));
    setEditing(null); add('Author updated!');
  };

  const del = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await api.delete(`/admin/authors/${id}`);
    setAuthors(a => a.filter(x => x._id!==id));
    add('Author deleted.');
  };

  return (
    <div>
      <div className="form-row">
        <input className="input" placeholder="Search authors…" value={search} onChange={e=>setSearch(e.target.value)} style={{ maxWidth:300 }} />
      </div>
      <div style={{ background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:10, overflow:'auto' }}>
        <table className="admin-table">
          <thead><tr><th>Author</th><th>Books</th><th>Nationality</th><th>Added by</th><th>Actions</th></tr></thead>
          <tbody>
            {authors.map(a => (
              <tr key={a._id}>
                <td>
                  {editing === a._id ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      <input className="input" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={{ padding:'4px 8px', fontSize:13 }} />
                      <input className="input" value={form.nationality} onChange={e=>setForm(p=>({...p,nationality:e.target.value}))} placeholder="Nationality" style={{ padding:'4px 8px', fontSize:13 }} />
                      <textarea className="input" value={form.bio} onChange={e=>setForm(p=>({...p,bio:e.target.value}))} placeholder="Bio" style={{ minHeight:60, fontSize:12 }} />
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="ab ab-green" onClick={saveEdit}>Save</button>
                        <button className="ab ab-gray"  onClick={()=>setEditing(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--blue-fill)', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                        {a.photo ? <img src={a.photo} alt={a.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : '✍'}
                      </div>
                      <span style={{ fontWeight:600 }}>{a.name}</span>
                    </div>
                  )}
                </td>
                <td style={{ color:'var(--text-2)' }}>{a.booksCount||0}</td>
                <td style={{ color:'var(--text-2)' }}>{a.nationality||'—'}</td>
                <td style={{ color:'var(--text-3)' }}>{a.uploadedBy?.username||'—'}</td>
                <td>
                  {editing !== a._id && (
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="ab ab-blue" onClick={()=>startEdit(a)}>Edit</button>
                      <button className="ab ab-red"  onClick={()=>del(a._id,a.name)}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!authors.length && <div style={{ padding:32, textAlign:'center', color:'var(--text-3)' }}>No authors found</div>}
      </div>
    </div>
  );
}

// ── Reviews ───────────────────────────────────────────────────
function ReviewsTab({ add }) {
  const [reviews, setReviews] = useState([]);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);

  useEffect(() => {
    api.get('/admin/reviews', { params:{ page, limit:20 } }).then(r => {
      setReviews(r.data.reviews); setTotal(r.data.total);
    });
  }, [page]);

  const del = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    await api.delete(`/admin/reviews/${id}`);
    setReviews(r => r.filter(x => x._id!==id));
    add('Review deleted.');
  };

  return (
    <div>
      <div style={{ fontSize:13, color:'var(--text-3)', marginBottom:14 }}>{total} total reviews</div>
      <div style={{ background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:10, overflow:'auto' }}>
        <table className="admin-table">
          <thead><tr><th>User</th><th>Book</th><th>Rating</th><th>Review</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r._id}>
                <td style={{ fontWeight:600, color:'var(--text-1)' }}>{r.user?.username||'—'}</td>
                <td style={{ color:'var(--blue-text)', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.book?.title||'—'}</td>
                <td><span style={{ color:'#F59E0B', fontWeight:700 }}>{'★'.repeat(r.rating)}</span></td>
                <td style={{ color:'var(--text-2)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.text||'—'}</td>
                <td style={{ color:'var(--text-3)', whiteSpace:'nowrap' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td><button className="ab ab-red" onClick={()=>del(r._id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!reviews.length && <div style={{ padding:32, textAlign:'center', color:'var(--text-3)' }}>No reviews found</div>}
      </div>
      {total > 20 && (
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:16 }}>
          <button className="ab ab-gray" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
          <span style={{ padding:'5px 10px', fontSize:13, color:'var(--text-2)' }}>Page {page}</span>
          <button className="ab ab-gray" disabled={page*20>=total} onClick={()=>setPage(p=>p+1)}>Next →</button>
        </div>
      )}
    </div>
  );
}

// ── Genres ────────────────────────────────────────────────────
function GenresTab({ add }) {
  const [genres,  setGenres]  = useState([]);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState('');

  useEffect(() => { api.get('/admin/genres').then(r => setGenres(r.data.genres)); }, []);

  const create = async () => {
    if (!newName.trim()) return;
    const { data } = await api.post('/admin/genres', { name: newName.trim() });
    setGenres(g => [...g, data.genre]);
    setNewName('');
    add(`Genre "${data.genre.name}" added!`);
  };

  const save = async (id) => {
    const { data } = await api.put(`/admin/genres/${id}`, { name: editVal });
    setGenres(g => g.map(x => x._id===id ? data.genre : x));
    setEditing(null); add('Genre updated!');
  };

  const del = async (id, name) => {
    if (!window.confirm(`Delete genre "${name}"?`)) return;
    await api.delete(`/admin/genres/${id}`);
    setGenres(g => g.filter(x => x._id!==id));
    add('Genre deleted.');
  };

  return (
    <div>
      {/* Add new genre */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        <input className="input" value={newName} onChange={e=>setNewName(e.target.value)}
          placeholder="New genre name…" style={{ maxWidth:260 }}
          onKeyDown={e => e.key==='Enter' && create()} />
        <button className="ab ab-blue" onClick={create} style={{ padding:'9px 18px', fontSize:14 }}>Add genre</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:10 }}>
        {genres.map(g => (
          <div key={g._id} style={{ background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:8, padding:'10px 12px', display:'flex', alignItems:'center', gap:8 }}>
            {editing === g._id ? (
              <>
                <input className="input" value={editVal} onChange={e=>setEditVal(e.target.value)}
                  style={{ flex:1, padding:'4px 8px', fontSize:13 }}
                  onKeyDown={e => e.key==='Enter' && save(g._id)} />
                <button className="ab ab-green" onClick={()=>save(g._id)}>✓</button>
                <button className="ab ab-gray"  onClick={()=>setEditing(null)}>✕</button>
              </>
            ) : (
              <>
                <span style={{ flex:1, fontSize:14, fontWeight:500, color:'var(--text-1)' }}>{g.name}</span>
                {g.isDefault && <span style={{ fontSize:10, color:'var(--text-3)', background:'var(--surface-alt)', padding:'2px 6px', borderRadius:10 }}>default</span>}
                {!g.isDefault && (
                  <>
                    <button className="ab ab-blue" style={{ padding:'3px 8px' }} onClick={()=>{ setEditing(g._id); setEditVal(g.name); }}>Edit</button>
                    <button className="ab ab-red"  style={{ padding:'3px 8px' }} onClick={()=>del(g._id,g.name)}>✕</button>
                  </>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Announcements ─────────────────────────────────────────────
function AnnouncementsTab({ add }) {
  const [anns, setAnns] = useState([]);
  const [form, setForm] = useState({ title:'', message:'', type:'info' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { api.get('/admin/announcements').then(r => setAnns(r.data.announcements)); }, []);

  const create = async () => {
    if (!form.title.trim() || !form.message.trim()) return add('Title and message required.', 'error');
    const { data } = await api.post('/admin/announcements', form);
    setAnns(a => [data.announcement, ...a]);
    setForm({ title:'', message:'', type:'info' });
    setShowForm(false);
    add('Announcement sent!');
  };

  const toggle = async (id) => {
    const { data } = await api.put(`/admin/announcements/${id}/toggle`);
    setAnns(a => a.map(x => x._id===id ? data.announcement : x));
    add(data.message);
  };

  const del = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    await api.delete(`/admin/announcements/${id}`);
    setAnns(a => a.filter(x => x._id!==id));
    add('Deleted.');
  };

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <button className="ab ab-blue" onClick={()=>setShowForm(s=>!s)} style={{ padding:'9px 18px', fontSize:14 }}>
          {showForm ? 'Cancel' : '+ New announcement'}
        </button>
      </div>

      {showForm && (
        <div style={{ background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:10, padding:20, marginBottom:20 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <input className="input" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Title…" />
            <textarea className="input" value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))} placeholder="Message…" style={{ minHeight:80 }} />
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <label style={{ fontSize:13, color:'var(--text-2)' }}>Type:</label>
              {['info','warning','success'].map(t => (
                <button key={t} onClick={()=>setForm(p=>({...p,type:t}))} style={{
                  padding:'5px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:600,
                  background: form.type===t
                    ? t==='info' ? 'var(--blue-btn)' : t==='warning' ? '#D97706' : 'var(--green-400)'
                    : 'var(--surface-alt)',
                  color: form.type===t ? '#fff' : 'var(--text-2)',
                }}>{t}</button>
              ))}
            </div>
            <button className="ab ab-blue" onClick={create} style={{ padding:'10px 24px', fontSize:14, alignSelf:'flex-start' }}>
              Send announcement
            </button>
          </div>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {anns.map(a => (
          <div key={a._id} style={{
            background:'var(--surface)', border:'0.5px solid var(--border)',
            borderLeft: `3px solid ${a.type==='info' ? 'var(--blue-btn)' : a.type==='warning' ? '#D97706' : 'var(--green-400)'}`,
            borderRadius:8, padding:'14px 16px',
            opacity: a.active ? 1 : 0.5,
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:14, color:'var(--text-1)', marginBottom:4 }}>{a.title}</div>
                <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.5 }}>{a.message}</p>
                <div style={{ display:'flex', gap:8, marginTop:8, alignItems:'center' }}>
                  <span className={`badge-${a.type}`} style={{ padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600 }}>{a.type}</span>
                  {a.active ? <span className="badge-active">Active</span> : <span className="badge-inactive">Inactive</span>}
                  <span style={{ fontSize:11, color:'var(--text-3)' }}>{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <button className="ab ab-gray" onClick={()=>toggle(a._id)}>{a.active ? 'Deactivate' : 'Activate'}</button>
                <button className="ab ab-red"  onClick={()=>del(a._id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
        {!anns.length && <div style={{ textAlign:'center', padding:40, color:'var(--text-3)' }}>No announcements yet</div>}
      </div>
    </div>
  );
}
