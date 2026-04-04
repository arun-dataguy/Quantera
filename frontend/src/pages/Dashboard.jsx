import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8003/api'

const SYMBOLS = ['AAPL', 'NVDA', 'META', 'MSFT', 'AMZN', 'GOOGL', 'TSLA', 'JPM']

function SignalBadge({ signal }) {
  const colors = {
    BUY:  { bg: 'rgba(0,184,122,0.12)', color: '#00B87A' },
    SELL: { bg: 'rgba(242,54,69,0.12)',  color: '#F23645' },
    HOLD: { bg: 'rgba(245,166,35,0.12)', color: '#F5A623' },
  }
  const c = colors[signal] || colors.HOLD
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
      background: c.bg, color: c.color, letterSpacing: '0.04em' }}>
      {signal}
    </span>
  )
}

function ConfBar({ value, signal }) {
  const color = signal === 'BUY' ? '#00B87A' : signal === 'SELL' ? '#F23645' : '#F5A623'
  return (
    <div style={{ flex: 1, margin: '0 12px' }}>
      <div style={{ height: 4, background: '#E4E8F0', borderRadius: 2 }}>
        <div style={{ height: 4, borderRadius: 2, background: color, width: `${value * 100}%`, transition: 'width 0.8s ease' }}/>
      </div>
      <div style={{ fontSize: 11, color: '#8A94A6', marginTop: 3 }}>{(value * 100).toFixed(1)}%</div>
    </div>
  )
}

export default function Dashboard() {
  const { user, logout, isPro, apiFetch } = useAuth()
  const navigate = useNavigate()
  const [signals, setSignals]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState('AAPL')
  const [upgrading, setUpgrading] = useState(false)

  // Load signals from VaultTrade API
  useEffect(() => {
    const fetchSignals = async () => {
      setLoading(true)
      try {
        const res = await fetch('http://localhost:8001/api/v1/signals/latest?limit=20')
        const data = await res.json()
        setSignals(data.signals || data || [])
      } catch {
        // Fallback mock data if VaultTrade not running
        setSignals(SYMBOLS.map(sym => ({
          symbol: sym,
          signal: ['BUY', 'HOLD', 'BUY', 'HOLD', 'BUY', 'HOLD', 'HOLD', 'BUY'][SYMBOLS.indexOf(sym)],
          confidence: [0.71, 0.46, 0.90, 0.75, 0.54, 0.35, 0.52, 0.69][SYMBOLS.indexOf(sym)],
          sentiment_score: [0.167, 0.220, 0.119, 0.606, 0.527, 0.718, 0.133, 0.487][SYMBOLS.indexOf(sym)],
          technical_score: [-0.056, -0.004, -0.184, -0.148, -0.022, 0.053, -0.033, -0.143][SYMBOLS.indexOf(sym)],
          price_at_signal: [255.92, 177.39, 574.46, 373.46, 209.77, 295.77, 360.59, 294.60][SYMBOLS.indexOf(sym)],
        })))
      } finally {
        setLoading(false)
      }
    }
    fetchSignals()
    const interval = setInterval(fetchSignals, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleUpgrade = async (plan) => {
    setUpgrading(true)
    try {
      const data = await apiFetch('/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      })
      window.location.href = data.checkout_url
    } catch (err) {
      alert(err.message)
    } finally {
      setUpgrading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const visibleSignals = isPro ? signals : signals.slice(0, 5)
  const buyCount  = signals.filter(s => s.signal === 'BUY').length
  const sellCount = signals.filter(s => s.signal === 'SELL').length
  const holdCount = signals.filter(s => s.signal === 'HOLD').length

  return (
    <div style={s.page}>
      {/* Navbar */}
      <nav style={s.nav}>
        <Link to="/" style={s.navLogo}>
          <div style={s.logoMark}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <span style={s.navLogoText}>Quantera</span>
        </Link>
        <div style={s.navRight}>
          <span style={{ ...s.planBadge, background: isPro ? 'rgba(0,102,255,0.1)' : '#F0F0F0', color: isPro ? '#0066FF' : '#5A6478' }}>
            {user?.plan?.toUpperCase() || 'FREE'}
          </span>
          <span style={s.navUser}>{user?.full_name || user?.email}</span>
          <button style={s.logoutBtn} onClick={handleLogout}>Sign out</button>
        </div>
      </nav>

      <div style={s.body}>
        {/* Stats row */}
        <div style={s.statsRow}>
          <div style={s.statCard}>
            <div style={{ ...s.statNum, color: '#00B87A' }}>{buyCount}</div>
            <div style={s.statLabel}>BUY signals</div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statNum, color: '#F5A623' }}>{holdCount}</div>
            <div style={s.statLabel}>HOLD signals</div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statNum, color: '#F23645' }}>{sellCount}</div>
            <div style={s.statLabel}>SELL signals</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statNum}>{signals.length > 0 ? (signals.reduce((a,b) => a + b.confidence, 0) / signals.length * 100).toFixed(1) : 0}%</div>
            <div style={s.statLabel}>Avg confidence</div>
          </div>
        </div>

        <div style={s.mainGrid}>
          {/* Signals table */}
          <div style={s.tableCard}>
            <div style={s.tableHeader}>
              <h2 style={s.tableTitle}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00B87A', display: 'inline-block', marginRight: 8, animation: 'pulse 2s infinite' }}/>
                Live Signals
              </h2>
              <span style={s.lastUpdate}>Updates every 30 min</span>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#8A94A6', fontFamily: 'DM Sans, sans-serif' }}>Loading signals…</div>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={s.th}>Symbol</th>
                    <th style={s.th}>Signal</th>
                    <th style={s.th}>Confidence</th>
                    <th style={s.th}>Price</th>
                    <th style={s.th}>Sentiment</th>
                    <th style={s.th}>Technical</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSignals.map((sig, i) => (
                    <tr key={i} style={{ ...s.tr, background: selected === sig.symbol ? '#F0F6FF' : 'white' }}
                      onClick={() => setSelected(sig.symbol)}>
                      <td style={s.td}><strong style={{ fontFamily: 'DM Sans, sans-serif' }}>{sig.symbol}</strong></td>
                      <td style={s.td}><SignalBadge signal={sig.signal}/></td>
                      <td style={{ ...s.td, minWidth: 140 }}><ConfBar value={sig.confidence} signal={sig.signal}/></td>
                      <td style={s.td}>${sig.price_at_signal?.toFixed(2)}</td>
                      <td style={{ ...s.td, color: sig.sentiment_score >= 0 ? '#00B87A' : '#F23645' }}>
                        {sig.sentiment_score >= 0 ? '+' : ''}{sig.sentiment_score?.toFixed(3)}
                      </td>
                      <td style={{ ...s.td, color: sig.technical_score >= 0 ? '#00B87A' : '#F23645' }}>
                        {sig.technical_score >= 0 ? '+' : ''}{sig.technical_score?.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Upgrade banner for free users */}
            {!isPro && (
              <div style={s.upgradeBanner}>
                <div>
                  <div style={{ fontWeight: 600, color: '#0A0F1E', marginBottom: 4, fontFamily: 'DM Sans, sans-serif' }}>
                    🔒 {signals.length - 5} more signals available on Pro
                  </div>
                  <div style={{ fontSize: 13, color: '#5A6478', fontFamily: 'DM Sans, sans-serif' }}>
                    Upgrade to see all signals, confidence scores, and sentiment data
                  </div>
                </div>
                <button style={s.upgradeBtn} onClick={() => handleUpgrade('pro')} disabled={upgrading}>
                  {upgrading ? 'Loading…' : 'Upgrade to Pro — $9.99/mo'}
                </button>
              </div>
            )}
          </div>

          {/* TradingView chart */}
          <div style={s.chartCard}>
            <div style={s.chartHeader}>
              <h3 style={s.chartTitle}>{selected} Chart</h3>
              <div style={s.symbolPicker}>
                {SYMBOLS.map(sym => (
                  <button key={sym} onClick={() => setSelected(sym)}
                    style={{ ...s.symBtn, background: selected === sym ? '#0066FF' : 'transparent', color: selected === sym ? 'white' : '#5A6478' }}>
                    {sym}
                  </button>
                ))}
              </div>
            </div>
            <div style={s.tvWrap}>
              <iframe
                key={selected}
                src={`https://www.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=NASDAQ:${selected}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=F1F3F6&theme=light&style=1&timezone=exchange&withdateranges=1&showpopupbutton=1&studies=RSI%40tv-basicstudies%1FMACD%40tv-basicstudies&locale=en`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allowTransparency
                scrolling="no"
                allowFullScreen
              />
            </div>
            {/* Signal overlay for selected symbol */}
            {signals.find(s => s.symbol === selected) && (
              <div style={s.signalOverlay}>
                {(() => {
                  const sig = signals.find(s => s.symbol === selected)
                  return (
                    <>
                      <span style={{ fontSize: 13, color: '#5A6478', fontFamily: 'DM Sans, sans-serif' }}>AI Signal:</span>
                      <SignalBadge signal={sig.signal}/>
                      <span style={{ fontSize: 13, color: '#5A6478', fontFamily: 'DM Sans, sans-serif' }}>{(sig.confidence * 100).toFixed(1)}% confidence</span>
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#F7F9FC', fontFamily: 'DM Sans, sans-serif' },
  nav: { background: 'white', borderBottom: '1px solid #E4E8F0', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 },
  navLogo: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' },
  logoMark: { width: 30, height: 30, borderRadius: 8, background: '#0066FF', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  navLogoText: { fontSize: 16, fontWeight: 600, color: '#0A0F1E' },
  navRight: { display: 'flex', alignItems: 'center', gap: 16 },
  planBadge: { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.06em' },
  navUser: { fontSize: 14, color: '#5A6478' },
  logoutBtn: { padding: '7px 16px', borderRadius: 8, border: '1.5px solid #E4E8F0', background: 'transparent', fontSize: 13, color: '#5A6478', cursor: 'pointer' },
  body: { maxWidth: 1400, margin: '0 auto', padding: '28px 32px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 },
  statCard: { background: 'white', borderRadius: 12, border: '1px solid #E4E8F0', padding: '20px 24px', textAlign: 'center' },
  statNum: { fontSize: 32, fontWeight: 300, color: '#0A0F1E', letterSpacing: '-0.02em', lineHeight: 1 },
  statLabel: { fontSize: 12, color: '#8A94A6', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em' },
  mainGrid: { display: 'grid', gridTemplateColumns: '1fr 420px', gap: 24 },
  tableCard: { background: 'white', borderRadius: 12, border: '1px solid #E4E8F0', overflow: 'hidden' },
  tableHeader: { padding: '18px 24px', borderBottom: '1px solid #E4E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  tableTitle: { fontSize: 15, fontWeight: 600, color: '#0A0F1E', margin: 0, display: 'flex', alignItems: 'center' },
  lastUpdate: { fontSize: 12, color: '#8A94A6' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#F7F9FC' },
  th: { padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#8A94A6', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', borderBottom: '1px solid #E4E8F0' },
  tr: { borderBottom: '1px solid #F0F2F5', cursor: 'pointer', transition: 'background 0.15s' },
  td: { padding: '12px 16px', fontSize: 13, color: '#0A0F1E' },
  upgradeBanner: { padding: '20px 24px', background: 'linear-gradient(135deg, #F0F6FF 0%, #E8F1FF 100%)', borderTop: '1px solid #C7DEFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  upgradeBtn: { padding: '10px 20px', borderRadius: 10, border: 'none', background: '#0066FF', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  chartCard: { background: 'white', borderRadius: 12, border: '1px solid #E4E8F0', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  chartHeader: { padding: '14px 18px', borderBottom: '1px solid #E4E8F0' },
  chartTitle: { fontSize: 14, fontWeight: 600, color: '#0A0F1E', margin: '0 0 10px' },
  symbolPicker: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  symBtn: { padding: '4px 10px', borderRadius: 6, border: '1px solid #E4E8F0', fontSize: 12, fontWeight: 500, cursor: 'pointer' },
  tvWrap: { flex: 1, minHeight: 400 },
  signalOverlay: { padding: '12px 18px', borderTop: '1px solid #E4E8F0', display: 'flex', alignItems: 'center', gap: 12, background: '#FAFBFC' },
}