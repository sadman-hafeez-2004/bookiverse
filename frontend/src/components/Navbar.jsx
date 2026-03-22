import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';

// ── SVG Icons ─────────────────────────────────────────────────
function Icon({ size = 22, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const HomeIcon    = () => <Icon><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></Icon>;
const UploadIcon  = () => <Icon><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Icon>;
const ReadersIcon = () => <Icon><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></Icon>;
const MsgIcon     = () => <Icon><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></Icon>;
const ProfileIcon = () => <Icon><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></Icon>;
const MenuIcon    = () => <Icon><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></Icon>;
const SearchIcon  = () => <Icon size={18}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Icon>;

// ── Main Navbar ───────────────────────────────────────────────
export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate         = useNavigate();
  const [q, setQ]                       = useState('');
  const [menuOpen, setMenuOpen]         = useState(false); // desktop
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // mobile
  const menuRef       = useRef(); // desktop ref
  const mobileMenuRef = useRef(); // mobile ref ← separate

  // Close each dropdown on outside click independently
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    setQ('');
  };

  const handleLogout = () => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate('/');
  };

  const closeAll = () => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
  };

  // Nav items (logged-in only)
  const navItems = user ? [
    { to: '/',                    label: 'Home',     icon: <HomeIcon />    },
    { to: '/upload',              label: 'Upload',   icon: <UploadIcon />  },
    { to: '/readers',             label: 'Readers',  icon: <ReadersIcon /> },
    { to: '/chat',                label: 'Messages', icon: <MsgIcon />     },
    { to: `/profile/${user._id}`, label: 'Profile',  icon: user.avatar
        ? <img src={user.avatar} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
        : <ProfileIcon />
    },
  ] : [];

  // ── Dropdown menu — used by both desktop and mobile ──
  const DropdownMenu = ({ upward = false }) => (
    <div style={{
      position: 'absolute',
      ...(upward ? { bottom: 'calc(100% + 8px)' } : { top: 'calc(100% + 8px)' }),
      right: 0,
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      minWidth: 190,
      boxShadow: upward
        ? '0 -8px 24px rgba(0,0,0,0.10)'
        : '0 8px 24px rgba(0,0,0,0.10)',
      zIndex: 400,
      overflow: 'hidden',
    }}>
      {/* User info */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '0.5px solid var(--border)',
        background: 'var(--surface-alt)',
      }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{user?.username}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{user?.email}</div>
      </div>

      {/* Settings + Admin links */}
      {[
        { to: '/settings', label: 'Settings' },
        ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin panel' }] : []),
      ].map(({ to, label }) => (
        <Link
          key={to}
          to={to}
          onClick={closeAll}  // ✅ closes both menus
          style={{
            display: 'block', padding: '11px 16px',
            fontSize: 14, color: 'var(--text-1)',
            borderBottom: '0.5px solid var(--border)',
            transition: 'background 100ms',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-alt)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {label}
        </Link>
      ))}

      {/* Logout */}
      <button
        onClick={handleLogout}  // ✅ closes both + logs out
        style={{
          display: 'block', width: '100%', padding: '11px 16px',
          fontSize: 14, color: 'var(--rose-800)',
          background: 'transparent', border: 'none',
          textAlign: 'left', cursor: 'pointer',
          transition: 'background 100ms',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--rose-50)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        Log out
      </button>
    </div>
  );

  return (
    <>
      {/* ══ TOP BAR — Logo + Search (all screen sizes) ══ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'var(--surface)',
        borderBottom: '0.5px solid var(--border)',
      }}>
        <div className="container" style={{
          display: 'flex', alignItems: 'center', gap: 10, height: 52,
        }}>

          {/* Logo */}
          <Link to="/" style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <img
            src="../../public/logo.png"   
            alt="Bookiverse"
            style={{
              height: 36,        
              width: 'auto',     
              objectFit: 'contain',
            }}
          />
          </Link>

          {/* Search */}
          <form onSubmit={onSearch} style={{ flex: 1, display: 'flex', gap: 6 }}>
            <input
              className="input"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search books, authors, readers…"
              style={{ flex: 1, padding: '7px 12px', fontSize: 13 }}
            />
            <button type="submit" style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '7px 12px', flexShrink: 0,
              background: 'var(--blue-btn)', color: '#fff',
              border: 'none', borderRadius: 'var(--r-md)',
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}>
              <SearchIcon />
              <span className="search-label">Search</span>
            </button>
          </form>

          {/* ── DESKTOP NAV (768px+) ── */}
          {user ? (
            <nav className="desktop-nav">
              {navItems.map(({ to, label, icon }) => (
                <NavLink
                  key={to} to={to} end={to === '/'}
                  title={label}
                  style={({ isActive }) => ({
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 2,
                    padding: '5px 10px', borderRadius: 'var(--r-md)',
                    color: isActive ? 'var(--blue-btn)' : 'var(--text-2)',
                    textDecoration: 'none', fontSize: 10, fontWeight: 500,
                    transition: 'all 150ms', background: 'transparent',
                  })}
                >
                  {icon}
                  {label}
                </NavLink>
              ))}

              {/* Desktop hamburger — uses menuRef + menuOpen */}
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  title="More"
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 2,
                    padding: '5px 10px', borderRadius: 'var(--r-md)',
                    color: menuOpen ? 'var(--blue-btn)' : 'var(--text-2)',
                    background: menuOpen ? 'var(--surface-alt)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    fontSize: 10, fontWeight: 500,
                  }}
                >
                  <MenuIcon />
                  More
                </button>
                {menuOpen && <DropdownMenu upward={false} />}
              </div>
            </nav>
          ) : (
            <div className="desktop-nav" style={{ gap: 8 }}>
              <button onClick={() => navigate('/login')}    className="btn btn-ghost btn-sm">Log in</button>
              <button onClick={() => navigate('/register')} className="btn btn-primary btn-sm">Sign up</button>
            </div>
          )}
        </div>
      </header>

      {/* ══ MOBILE BOTTOM NAV (below 768px) ══ */}
      {user && (
        <nav className="mobile-bottom-nav">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to} to={to} end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3, flex: 1,
                color: isActive ? 'var(--blue-btn)' : 'var(--text-2)',
                textDecoration: 'none', fontSize: 10, fontWeight: 500,
                padding: '5px 0',
              })}
            >
              {icon}
              {label}
            </NavLink>
          ))}

          {/* Mobile hamburger — uses mobileMenuRef + mobileMenuOpen ✅ */}
          <div ref={mobileMenuRef} style={{ position: 'relative', flex: 1 }}>
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3, width: '100%',
                color: mobileMenuOpen ? 'var(--blue-btn)' : 'var(--text-2)', // ✅ mobileMenuOpen
                background: 'transparent', border: 'none',
                cursor: 'pointer', fontSize: 10, fontWeight: 500,
                padding: '5px 0',
              }}
            >
              <MenuIcon />
              More
            </button>
            {mobileMenuOpen && <DropdownMenu upward={true} />}
          </div>
        </nav>
      )}

      {/* ── Responsive CSS ── */}
      <style>{`
        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 2px;
          flex-shrink: 0;
        }
        .mobile-bottom-nav {
          display: none;
        }
        .search-label { display: inline; }

        @media (max-width: 767px) {
          .desktop-nav { display: none !important; }
          .search-label { display: none !important; }
          .mobile-bottom-nav {
            display: flex !important;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            z-index: 200;
            background: var(--surface);
            border-top: 0.5px solid var(--border);
            padding: 4px 8px;
            padding-bottom: max(4px, env(safe-area-inset-bottom));
            align-items: center;
            justify-content: space-around;
          }
          body {
            padding-top: 52px !important;
            padding-bottom: 60px !important;
          }
        }

        @media (min-width: 768px) {
          body {
            padding-top: 52px !important;
            padding-bottom: 0 !important;
          }
          .desktop-nav a:hover {
            background: var(--surface-alt) !important;
            color: var(--blue-btn) !important;
          }
        }
      `}</style>
    </>
  );
}
