import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

const NAV = [
  { label: 'Dashboard',     to: '/dashboard',       icon: '⊞' },
  { label: 'Market Movers', to: '/market',           icon: '🔥' },
  { label: 'Crypto',        to: '/crypto',           icon: '₿'  },
  { label: 'Portfolio',     to: '/portfolio',        icon: '💼' },
  { label: 'Intel Feed',    to: '/intel',            icon: '📰' },
  { label: 'Pricing',       to: '/pricing',          icon: '💳' },
]

export default function AppSidebar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  return (
    <aside style={s.sidebar}>
      {/* Logo */}
      <div style={s.logoWrap}>
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center' }}>
          <Logo variant="white" height={28} />
        </Link>
        <span style={s.aiBadge}>AI</span>
      </div>

      {/* Nav links */}
      <nav style={s.nav}>
        {NAV.map(item => {
          const active = pathname === item.to || (item.to !== '/dashboard' && pathname.startsWith(item.to))
          return (
            <Link
              key={item.to}
              to={item.to}
              style={{ ...s.link, ...(active ? s.linkActive : {}) }}
            >
              <span style={s.icon}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* User + logout */}
      <div style={s.bottom}>
        {user && (
          <div style={s.userRow}>
            <div style={s.avatar}>{(user.full_name || user.email || 'U').charAt(0).toUpperCase()}</div>
            <div style={s.userInfo}>
              <p style={s.userName}>{user.full_name || 'Trader'}</p>
              <p style={s.userPlan}>Beta — Full Access</p>
            </div>
          </div>
        )}
        <button style={s.logoutBtn} onClick={logout}>Sign out</button>
      </div>
    </aside>
  )
}

const s = {
  sidebar: {
    width: 220,
    minHeight: '100vh',
    background: '#161b2b',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 0 20px',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 20px 28px',
  },
  aiBadge: {
    fontSize: 9,
    fontWeight: 700,
    color: '#0050cb',
    background: 'rgba(0,80,203,0.18)',
    borderRadius: 4,
    padding: '2px 5px',
    letterSpacing: '0.06em',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '0 12px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    color: '#8892b0',
    textDecoration: 'none',
    transition: 'background 0.15s, color 0.15s',
    fontFamily: 'Inter, sans-serif',
  },
  linkActive: {
    background: 'rgba(255,255,255,0.08)',
    color: '#ffffff',
    fontWeight: 600,
  },
  icon: {
    fontSize: 15,
    width: 20,
    textAlign: 'center',
    flexShrink: 0,
  },
  bottom: {
    padding: '16px 12px 0',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 4px',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'rgba(0,80,203,0.4)',
    color: 'white',
    fontSize: 13,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userInfo: { display: 'flex', flexDirection: 'column', gap: 1, overflow: 'hidden' },
  userName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#e2e8f0',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userPlan: { fontSize: 11, color: '#00b87c', margin: 0, fontWeight: 600 },
  logoutBtn: {
    width: '100%',
    padding: '8px 12px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    color: '#8892b0',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    textAlign: 'left',
  },
}
