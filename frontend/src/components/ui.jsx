import { useToastStore } from '../store';

export const Btn = ({ variant = 'primary', size = '', full, className = '', children, ...p }) => (
  <button className={`btn btn-${variant}${size ? ' btn-' + size : ''}${full ? ' btn-full' : ''} ${className}`} {...p}>
    {children}
  </button>
);

export const Input = ({ label, error, className = '', ...p }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <input className={`input ${className}`} {...p} />
    {error && <span className="form-error">{error}</span>}
  </div>
);

export const Textarea = ({ label, error, className = '', ...p }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <textarea className={`input textarea ${className}`} {...p} />
    {error && <span className="form-error">{error}</span>}
  </div>
);

export const Select = ({ label, error, children, ...p }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <select className="input" {...p}>{children}</select>
    {error && <span className="form-error">{error}</span>}
  </div>
);

/* Avatar — shows img if src, otherwise initials */
export const Av = ({ user, size = 'sm', className = '' }) => {
  const initials = (user?.username || '?').slice(0, 2).toUpperCase();
  const cls = `avatar av-${size} ${className}`;
  if (user?.avatar) {
    return <img src={user.avatar} alt={user.username} className={cls} style={{ objectFit: 'cover' }} />;
  }
  return <span className={cls}>{initials}</span>;
};

export const Spinner = ({ size = 22 }) => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
    <span className="spinner" style={{ width: size, height: size }} />
  </div>
);

export const Stars = ({ rating = 0, max = 5 }) => (
  <span className="stars" style={{ fontSize: 13 }}>
    {'★'.repeat(Math.round(rating))}{'☆'.repeat(Math.max(0, max - Math.round(rating)))}
  </span>
);

export const StarPicker = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[1,2,3,4,5].map(s => (
      <button key={s} type="button" onClick={() => onChange(s)}
        style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', lineHeight: 1,
          color: s <= value ? 'var(--amber-400)' : 'var(--border-strong)' }}>★</button>
    ))}
  </div>
);

export const Empty = ({ icon = '📚', title, desc, action }) => (
  <div className="empty">
    <div className="empty-icon">{icon}</div>
    <div className="h3">{title}</div>
    {desc && <p>{desc}</p>}
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>
);

export const Toasts = () => {
  const { toasts } = useToastStore();
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
      ))}
    </div>
  );
};
