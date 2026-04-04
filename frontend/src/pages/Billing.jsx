import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Billing() {
  const { user, apiFetch } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [sub, setSub]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [portal, setPortal]   = useState(false)

  const isSuccess = new URLSearchParams(location.search).get('session_id')

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const data = await apiFetch('/stripe/subscription')
        setSub(data)
      } catch {}
      finally { setLoading(false) }
    }
    fetchSub()
  }, [apiFetch])

  const handlePortal = async () => {
    setPortal(true)
    try {
      const data = await apiFetch('/stripe/portal', { method: 'POST' })
      window.location.href = data.portal_url
    } catch (err) {
      alert(err.message)
    } finally {
      setPortal(false)
    }
  }

  const planColors = {
    free:    { bg: '#F0F0F0',          color: '#5A6478' },
    pro:     { bg: 'rgba(0,102,255,0.1)', color: '#0066FF' },
    premium: { bg: 'rgba(245,166,35,0.12)', color: '#D4870A' },
  }
  const pc = planColors[user?.plan] || planColors.free

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <Link to="/dashboard" style={s.logo}>
          <div style={s.logoMark}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <span style={s.logoText}>Quantera</span>
        </Link>
        <Link to="/dashboard" style={s.back}>← Back to Dashboard</Link>
      </nav>

      <div style={s.body}>
        {/* Success banner */}
        {isSuccess && (
          <div style={s.successBanner}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00B87A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            🎉 Payment successful! Your plan has been upgraded. Welcome to {user?.plan?.toUpperCase()}!
          </div>
        )}

        <h1 style={s.title}>Billing & Subscription</h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#8A94A6' }}>Loading…</div>
        ) : (
          <div style={s.grid}>
            {/* Current plan */}
            <div style={s.card}>
              <h2 style={s.cardTitle}>Current Plan</h2>
              <div style={s.planRow}>
                <span style={{ ...s.planBadge, background: pc.bg, color: pc.color }}>
                  {user?.plan?.toUpperCase() || 'FREE'}
                </span>
                <span style={{ fontSize: 14, color: sub?.status === 'active' ? '#00B87A' : '#8A94A6' }}>
                  {sub?.status === 'active' ? '● Active' : sub?.status === 'past_due' ? '⚠ Past due' : '● Free tier'}
                </span>
              </div>

              <div style={s.featureList}>
                {user?.plan === 'free' && <>
                  <div style={s.featureItem}>5 signals/day (delayed)</div>
                  <div style={s.featureItem}>US stocks only</div>
                  <div style={s.featureItem}>Basic BUY/HOLD/SELL</div>
                </>}
                {user?.plan === 'pro' && <>
                  <div style={s.featureItem}>✓ Unlimited live signals</div>
                  <div style={s.featureItem}>✓ US stocks + UK equities</div>
                  <div style={s.featureItem}>✓ Full confidence scores</div>
                  <div style={s.featureItem}>✓ Sentiment analysis</div>
                  <div style={s.featureItem}>✓ Email alerts</div>
                </>}
                {user?.plan === 'premium' && <>
                  <div style={s.featureItem}>✓ Everything in Pro</div>
                  <div style={s.featureItem}>✓ Crypto signals</div>
                  <div style={s.featureItem}>✓ REST API access</div>
                  <div style={s.featureItem}>✓ Priority support</div>
                </>}
              </div>

              {sub?.has_subscription ? (
                <button style={s.portalBtn} onClick={handlePortal} disabled={portal}>
                  {portal ? 'Loading…' : 'Manage subscription →'}
                </button>
              ) : (
                <Link to="/pricing" style={s.upgradeBtn}>Upgrade plan →</Link>
              )}
            </div>

            {/* Account info */}
            <div style={s.card}>
              <h2 style={s.cardTitle}>Account</h2>
              <div style={s.infoRow}>
                <span style={s.infoLabel}>Email</span>
                <span style={s.infoVal}>{user?.email}</span>
              </div>
              <div style={s.infoRow}>
                <span style={s.infoLabel}>Name</span>
                <span style={s.infoVal}>{user?.full_name || '—'}</span>
              </div>
              <div style={s.infoRow}>
                <span style={s.infoLabel}>Member since</span>
                <span style={s.infoVal}>{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '—'}</span>
              </div>
              <div style={s.infoRow}>
                <span style={s.infoLabel}>Verified</span>
                <span style={{ ...s.infoVal, color: user?.is_verified ? '#00B87A' : '#F5A623' }}>
                  {user?.is_verified ? '✓ Verified' : '⚠ Unverified'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#F7F9FC', fontFamily: 'DM Sans, sans-serif' },
  nav: { background: 'white', borderBottom: '1px solid #E4E8F0', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' },
  logoMark: { width: 30, height: 30, borderRadius: 8, background: '#0066FF', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 16, fontWeight: 600, color: '#0A0F1E' },
  back: { fontSize: 14, color: '#5A6478', textDecoration: 'none' },
  body: { maxWidth: 900, margin: '0 auto', padding: '48px 32px' },
  successBanner: { background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '14px 20px', marginBottom: 32, fontSize: 14, color: '#166534', display: 'flex', alignItems: 'center', gap: 12 },
  title: { fontSize: 28, fontWeight: 600, color: '#0A0F1E', margin: '0 0 32px', letterSpacing: '-0.02em' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  card: { background: 'white', borderRadius: 12, border: '1px solid #E4E8F0', padding: '28px 24px' },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#5A6478', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 20px' },
  planRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  planBadge: { fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 20, letterSpacing: '0.06em' },
  featureList: { marginBottom: 24 },
  featureItem: { fontSize: 14, color: '#0A0F1E', padding: '5px 0', borderBottom: '1px solid #F0F2F5' },
  portalBtn: { width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid #E4E8F0', background: 'transparent', fontSize: 14, fontWeight: 500, color: '#0A0F1E', cursor: 'pointer' },
  upgradeBtn: { display: 'block', width: '100%', padding: 12, borderRadius: 10, background: '#0066FF', color: 'white', fontSize: 14, fontWeight: 600, textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F0F2F5' },
  infoLabel: { fontSize: 13, color: '#8A94A6' },
  infoVal: { fontSize: 13, color: '#0A0F1E', fontWeight: 500 },
}