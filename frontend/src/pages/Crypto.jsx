import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import AppSidebar from '../components/AppSidebar'
import UpgradeGate from '../components/UpgradeGate'

const CRYPTO_DATA = [
  { name: 'Bitcoin',  ticker: 'BTC', price: '$64,281.05', signal: 'BUY',  conf: 88, confLabel: '88% Extreme',  sentiment: 74.2, sentDir: 'up',   change: '+3.42%', pos: true,  color: '#f7931a', icon: '₿' },
  { name: 'Ethereum', ticker: 'ETH', price: '$3,412.19',  signal: 'BUY',  conf: 72, confLabel: '72% Strong',   sentiment: 62.8, sentDir: 'up',   change: '+1.85%', pos: true,  color: '#627eea', icon: '◆' },
  { name: 'Solana',   ticker: 'SOL', price: '$145.33',    signal: 'HOLD', conf: 51, confLabel: '51% Neutral',  sentiment: 48.2, sentDir: 'flat', change: '-0.12%', pos: false, color: '#14f195', icon: '◎' },
  { name: 'BNB',      ticker: 'BNB', price: '$592.41',    signal: 'SELL', conf: 68, confLabel: '68% Pressure', sentiment: 34.9, sentDir: 'down', change: '-2.11%', pos: false, color: '#f3ba2f', icon: '⬡' },
]

function SignalBadge({ signal }) {
  const map = {
    BUY:  { bg: 'rgba(0,108,70,0.1)',    color: '#006c46' },
    HOLD: { bg: 'rgba(227,231,253,0.8)', color: '#424656' },
    SELL: { bg: 'rgba(186,26,26,0.1)',   color: '#ba1a1a' },
  }
  const c = map[signal] || map.HOLD
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, letterSpacing: '0.04em' }}>
      {signal}
    </span>
  )
}

function SentimentIcon({ dir }) {
  if (dir === 'up')   return <span style={{ color: '#0050cb', fontSize: 14 }}>↑</span>
  if (dir === 'down') return <span style={{ color: '#ba1a1a', fontSize: 14 }}>↓</span>
  return <span style={{ color: '#424656', fontSize: 14 }}>—</span>
}

const COIN_META = {
  BTC: { name: 'Bitcoin',  color: '#f7931a', icon: '₿' },
  ETH: { name: 'Ethereum', color: '#627eea', icon: '◆' },
  SOL: { name: 'Solana',   color: '#14f195', icon: '◎' },
  BNB: { name: 'BNB',      color: '#f3ba2f', icon: '⬡' },
  XRP: { name: 'XRP',      color: '#00aae4', icon: '✦' },
  ADA: { name: 'Cardano',  color: '#0033ad', icon: '₳' },
}

export default function Crypto() {
  const { apiFetch } = useAuth()
  const [signals, setSignals] = useState([])
  const [loading, setLoading] = useState(true)
  const [gated, setGated]     = useState(false)

  useEffect(() => {
    apiFetch('/signals/latest?market=crypto')
      .then(data => setSignals(data.signals || []))
      .catch(err => {
        if (err.planGated) setGated(true)
      })
      .finally(() => setLoading(false))
  }, [apiFetch])

  return (
    <div style={s.root}>
      <AppSidebar />
      <div style={s.body}>
        <main style={s.main}>
          <div style={s.pageHeader}>
            <div>
              <h1 style={s.pageTitle}>Crypto Signals</h1>
              <p style={s.pageSubtitle}>AI analysis for the top digital assets — sentiment, momentum, and technical signals in real-time.</p>
            </div>
            <div style={s.liveMarketBadge}>
              <span style={s.liveDot}/>
              Live Markets
            </div>
          </div>

          {loading && <p style={{ color: '#5A6478', fontSize: 14 }}>Loading signals…</p>}

          {gated && <UpgradeGate requiredPlan="premium" feature="crypto signals" />}

          {!loading && !gated && signals.length > 0 && (
            <div style={s.terminalSection}>
              <div style={s.terminalHeader}>
                <h2 style={s.terminalTitle}>Premium Signal Terminal</h2>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={s.table}>
                  <thead>
                    <tr style={s.thead}>
                      {['ASSET', 'PRICE (USD)', 'SIGNAL', 'CONFIDENCE', 'SENTIMENT', '24H CHANGE'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {signals.map((row) => {
                      const meta = COIN_META[row.symbol] || { name: row.symbol, color: '#888', icon: '◉' }
                      const pos  = (row.change_pct || 0) >= 0
                      return (
                        <tr key={row.symbol} style={s.tr}>
                          <td style={s.td}>
                            <div style={s.assetCell}>
                              <div style={{ ...s.assetIcon, background: meta.color + '1a', color: meta.color }}>
                                {meta.icon}
                              </div>
                              <div>
                                <div style={s.assetName}>{meta.name}</div>
                                <div style={s.assetTicker}>{row.symbol}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ ...s.td, fontFamily: 'monospace', fontWeight: 600 }}>
                            ${row.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={s.td}><SignalBadge signal={row.signal}/></td>
                          <td style={s.td}>
                            <div style={s.confBar}>
                              <div style={{ ...s.confBarFill, width: (row.confidence * 100) + '%' }}/>
                            </div>
                            <div style={s.confLabel}>{(row.confidence * 100).toFixed(0)}%</div>
                          </td>
                          <td style={s.td}>
                            <span style={{ fontSize: 13 }}>
                              {row.sentiment_score != null ? row.sentiment_score.toFixed(3) : '—'}
                            </span>
                          </td>
                          <td style={{ ...s.td, fontWeight: 700, color: pos ? '#006c46' : '#ba1a1a' }}>
                            {pos ? '+' : ''}{row.change_pct?.toFixed(2)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer style={s.footer}>
        <div>
          <span style={s.footerBrand}>Quantera AI</span>
          <p style={s.footerCopy}>© {new Date().getFullYear()} Quantera AI. Editorial Precision in Trading.</p>
        </div>
        <div style={s.footerLinks}>
          <Link to="/privacy" style={s.footerLink}>Privacy Policy</Link>
          <Link to="/terms" style={s.footerLink}>Terms of Service</Link>
          <Link to="/pricing" style={s.footerLink}>Pricing</Link>
        </div>
      </footer>
    </div>
  )
}

const s = {
  root: { minHeight: '100vh', background: '#faf8ff', fontFamily: 'Inter, sans-serif', display: 'flex' },
  body: { display: 'flex', flex: 1, minWidth: 0 },
  sidebar: { width: 240, background: '#faf8ff', display: 'flex', flexDirection: 'column', padding: '24px 16px', position: 'sticky', top: 64, height: 'calc(100vh - 64px)', flexShrink: 0 },
  sidebarTop: { padding: '0 16px 20px' },
  sidebarTitle: { fontSize: 16, fontWeight: 900, color: '#161b2b', margin: 0 },
  sidebarPlan: { fontSize: 12, color: '#424656', margin: '2px 0 0' },
  sideNav: { display: 'flex', flexDirection: 'column', gap: 4 },
  sideNavItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#424656', textDecoration: 'none', letterSpacing: '-0.01em', transition: 'all 0.15s' },
  sideNavItemActive: { background: 'rgba(0,80,203,0.1)', color: '#0050cb', fontWeight: 700 },
  sideNavIcon: { fontSize: 16, flexShrink: 0 },
  sidebarBottom: { marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 16 },
  newTradeBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', borderRadius: 12, background: '#0050cb', color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 700 },
  userRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px' },
  userAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#dee1f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#0050cb', flexShrink: 0 },
  userNameText: { fontSize: 12, fontWeight: 700, color: '#161b2b', margin: 0 },
  userPlanText: { fontSize: 10, color: '#424656', margin: 0 },
  main: { flex: 1, background: '#f2f3ff', padding: '32px', overflowY: 'auto' },
  pageHeader: { marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 },
  pageTitle: { fontSize: 36, fontWeight: 800, color: '#161b2b', margin: '0 0 8px', letterSpacing: '-0.03em' },
  pageSubtitle: { fontSize: 14, color: '#424656', maxWidth: 560, margin: 0, lineHeight: 1.6 },
  liveMarketBadge: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, background: '#ffffff', fontSize: 13, fontWeight: 500, color: '#161b2b', boxShadow: '0 1px 4px rgba(0,84,214,0.06)', border: '1px solid rgba(194,198,216,0.1)' },
  liveDot: { width: 8, height: 8, borderRadius: '50%', background: '#006c46', animation: 'pulse 2s infinite', flexShrink: 0 },
  // Locked state
  lockedSection: { background: '#ffffff', borderRadius: 12, padding: '48px 32px', textAlign: 'center', marginBottom: 32 },
  lockedInner: { maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  btcIcon: { width: 72, height: 72, borderRadius: 16, background: 'rgba(243,186,47,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#f3ba2f' },
  lockedTitle: { fontSize: 26, fontWeight: 800, color: '#161b2b', margin: 0, letterSpacing: '-0.025em' },
  lockedSub: { fontSize: 14, color: '#424656', lineHeight: 1.7, margin: 0 },
  blurGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', margin: '8px 0' },
  blurCard: { background: '#f2f3ff', borderRadius: 10, padding: '16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  blurContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  blurSym: { fontSize: 13, fontWeight: 700, color: '#161b2b' },
  unlockBtn: { padding: '14px 32px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #0050cb, #0066ff)', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  trialText: { fontSize: 10, fontWeight: 700, color: '#727687', letterSpacing: '0.1em' },
  // Premium terminal
  terminalSection: { background: '#ffffff', borderRadius: 12, overflow: 'hidden' },
  terminalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(194,198,216,0.15)' },
  terminalTitle: { fontSize: 16, fontWeight: 700, color: '#161b2b', margin: 0, letterSpacing: '-0.02em' },
  iconBtn: { padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(194,198,216,0.2)', background: 'transparent', fontSize: 12, fontWeight: 600, color: '#424656', cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#faf8ff' },
  th: { padding: '12px 24px', fontSize: 11, fontWeight: 700, color: '#424656', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', borderBottom: '1px solid rgba(194,198,216,0.15)' },
  tr: { borderBottom: '1px solid rgba(194,198,216,0.1)', transition: 'background 0.15s' },
  td: { padding: '20px 24px', fontSize: 13, color: '#161b2b', verticalAlign: 'middle' },
  assetCell: { display: 'flex', alignItems: 'center', gap: 12 },
  assetIcon: { width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 },
  assetName: { fontSize: 13, fontWeight: 700, color: '#161b2b' },
  assetTicker: { fontSize: 10, color: '#424656', marginTop: 2 },
  confBar: { width: 100, height: 6, background: '#f2f3ff', borderRadius: 3, overflow: 'hidden' },
  confBarFill: { height: 6, background: '#0050cb', borderRadius: 3, transition: 'width 0.8s ease' },
  confLabel: { fontSize: 10, marginTop: 4, fontWeight: 500, color: '#424656' },
  sentRow: { display: 'flex', alignItems: 'center', gap: 6 },
  moreBtn: { padding: '6px', borderRadius: 8, border: 'none', background: 'transparent', fontSize: 16, cursor: 'pointer', color: '#424656' },
  footer: { background: '#f2f3ff', padding: '48px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 },
  footerBrand: { fontSize: 13, fontWeight: 700, color: '#161b2b' },
  footerCopy: { fontSize: 12, color: '#424656', margin: '4px 0 0' },
  footerLinks: { display: 'flex', gap: 28 },
  footerLink: { fontSize: 12, color: '#424656', textDecoration: 'none' },
}
