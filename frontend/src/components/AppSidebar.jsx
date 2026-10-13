import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

const NAV = [
  { label: 'Dashboard',     to: '/dashboard', icon: '⊞' },
  { label: 'Market Movers', to: '/market',    icon: '🔥' },
  { label: 'Crypto',        to: '/crypto',    icon: '₿'  },
  { label: 'Portfolio',     to: '/portfolio', icon: '💼' },
  { label: 'Backtest',      to: '/backtest',  icon: '📊' },
  { label: 'Intel Feed',    to: '/intel',     icon: '📰' },
  { label: 'Pricing',       to: '/pricing',   icon: '💳' },
  { label: 'Billing',       to: '/billing',   icon: '🧾' },
]

export default function AppSidebar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside style={{ ...s.sidebar, width: collapsed ? 64 : 220 }}>

      {/* Logo */}
      <div style={{ ...s.logoWrap, justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '0 0 28px' : '0 20px 28px' }}>
        {collapsed ? (
          <Link to="/dashboard" style={{ display: 'flex' }}>
            <Logo variant="icon" height={28} />
          </Link>
        ) : (
          <>
            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center' }}>
              <Logo variant="white" height={28} />
            </Link>
            <span style={s.aiBadge}>AI</span>
          </>
        )}
      </div>

      {/* Nav links */}
      <nav style={s.nav}>
        {NAV.map(item => {
          const active = pathname === item.to || (item.to !== '/dashboard' && pathname.startsWith(item.to))
          return (
            <Link
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              style={{
                ...s.link,
                ...(active ? s.linkActive : {}),
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '9px 0' : '9px 12px',
              }}
            >
              <span style={s.icon}>{item.icon}</span>
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {/* User row */}
      {!collapsed && user && (
        <div style={s.userRow}>
          <div style={s.avatar}>{(user.full_name || user.email || 'U').charAt(0).toUpperCase()}</div>
          <div style={s.userInfo}>
            <p style={s.userName}>{user.full_name || 'Trader'}</p>
            <p style={{
            ...s.userPlan,
            color: user.plan === 'pro' ? '#0066FF' : user.plan === 'premium' ? '#D4870A' : '#00b87c',
          }}>
            {user.plan === 'free' || !user.plan ? 'Free Plan' : user.plan.toUpperCase()}
          </p>
          </div>
        </div>
      )}

      {collapsed && user && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
          <div style={s.avatar} title={user.full_name || user.email}>
            {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Collapse button */}
      <button
        style={{ ...s.collapseBtn, justifyContent: collapsed ? 'center' : 'flex-start' }}
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>{collapsed ? '»' : '«'}</span>
        {!collapsed && <span style={{ fontSize: 13 }}>Collapse</span>}
      </button>

    </aside>
  )
}

const s = {
  sidebar: {
    minHeight: '100vh',
    background: '#161b2b',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 0 16px',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
    overflowX: 'hidden',
    transition: 'width 0.22s ease',
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  aiBadge: {
    fontSize: 9,
    fontWeight: 700,
    color: '#0050cb',
    background: 'rgba(0,80,203,0.18)',
    borderRadius: 4,
    padding: '2px 5px',
    letterSpacing: '0.06em',
    flexShrink: 0,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '0 8px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    color: '#8892b0',
    textDecoration: 'none',
    transition: 'background 0.15s, color 0.15s',
    fontFamily: 'Inter, sans-serif',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
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
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px 8px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
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
  collapseBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    color: '#8892b0',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    marginTop: 4,
    transition: 'color 0.15s',
    whiteSpace: 'nowrap',
  },
}
