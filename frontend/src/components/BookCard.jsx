import { Link } from 'react-router-dom';
import { Stars } from './ui';

export default function BookCard({ book }) {
  return (
    <Link to={`/books/${book._id}`}>
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--r-lg)', overflow: 'hidden',
        transition: 'border-color 150ms',
      }}>
        {/* Cover image - 2:3 ratio */}
        <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--blue-fill)', overflow: 'hidden', position: 'relative' }}>
          {book.coverImage
            ? <img src={book.coverImage} alt={book.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📖</div>
          }
          {/* Genre badge overlay */}
          <span style={{
            position: 'absolute', bottom: 6, left: 6,
            background: 'rgba(0,0,0,0.55)', color: '#fff',
            fontSize: 10, fontWeight: 600, borderRadius: 20, padding: '2px 7px',
          }}>{book.genre}</span>
        </div>

        {/* Info */}
        <div style={{ padding: '8px 10px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
            {book.title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
            {book.author?.name || 'Unknown'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Stars rating={book.averageRating || 0} />
            <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{book.collectionsCount || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
