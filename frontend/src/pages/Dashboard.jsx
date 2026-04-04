import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8003/api'
const SYMBOLS = ['AAPL', 'NVDA', 'META', 'MSFT', 'AMZN', 'GOOGL', 'TSLA', 'JPM']
const CRYPTO  = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX']

const CRYPTO_TV = {
  BTC: 'BINANCE:BTCUSDT', ETH: 'BINANCE:ETHUSDT',
  SOL: 'BINANCE:SOLUSDT', BNB: 'BINANCE:BNBUSDT',
  XRP: 'BINANCE:XRPUSDT', ADA: 'BINANCE:ADAUSDT',
  DOGE: 'BINANCE:DOGEUSDT', AVAX: 'BINANCE:AVAXUSDT',
}

const CRYPTO_MOCK = [
  { symbol: 'BTC',  signal: 'BUY',  confidence: 0.78, sentiment_score: 0.312, technical_score: 0.124, price_at_signal: 83241 },
  { symbol: 'ETH',  signal: 'BUY',  confidence: 0.71, sentiment_score: 0.287, technical_score: 0.098, price_at_signal: 1812 },
  { symbol: 'SOL',  signal: 'HOLD', confidence: 0.58, sentiment_score: 0.145, technical_score: -0.032, price_at_signal: 124.50 },
  { symbol: 'BNB',  signal: 'BUY',  confidence: 0.65, sentiment_score: 0.198, technical_score: 0.076, price_at_signal: 598.20 },
  { symbol: 'XRP',  signal: 'HOLD', confidence: 0.49, sentiment_score: -0.087, technical_score: -0.054, price_at_signal: 2.14 },
  { symbol: 'ADA',  signal: 'HOLD', confidence: 0.43, sentiment_score: 0.032, technical_score: -0.098, price_at_signal: 0.724 },
  { symbol: 'DOGE', signal: 'SELL', confidence: 0.62, sentiment_score: -0.234, technical_score: -0.187, price_at_signal: 0.168 },
  { symbol: 'AVAX', signal: 'BUY',  confidence: 0.69, sentiment_score: 0.276, technical_score: 0.112, price_at_signal: 21.40 },
]

function SignalBadge({ signal }) {
  const c = { BUY: ['rgba(0,184,122,0.12)', '#00B87A'], SELL: ['rgba(242,54,69,0.12)', '#F23645'], HOLD: ['rgba(245,166,35,0.12)', '#F5A623'] }[signal] || ['rgba(245,166,35,0.12)', '#F5A623']
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: c[0], color: c[1], letterSpacing: '0.04em' }}>{signal}</span>
}

function ConfBar({ value, signal }) {
  const color = signal === 'BUY' ? '#00B87A' : signal === 'SELL' ? '#F23645' : '#F5A623'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
      <div style={{ flex: 1, height: 5, background: '#E4E8F0', borderRadius: 3 }}>
        <div style={{ height: 5, borderRadius: 3, background: color, width: `${value * 100}%`, transition: 'width 0.8s ease' }}/>
      </div>
      <span style={{ fontSize: 12, color: '#5A6478', width: 40 }}>{(value * 100).toFixed(1)}%</span>
    </div>
  )
}

const MOCK = SYMBOLS.map((sym, i) => ({
  symbol: sym,
  signal: ['BUY','HOLD','BUY','HOLD','BUY','HOLD','HOLD','BUY'][i],
  confidence: [0.71,0.46,0.90,0.75,0.54,0.35,0.52,0.69][i],
  sentiment_score: [0.167,0.220,0.119,0.606,0.527,0.718,0.133,0.487][i],
  technical_score: [-0.056,-0.004,-0.184,-0.148,-0.022,0.053,-0.033,-0.143][i],
  price_at_signal: [255.92,177.39,574.46,373.46,209.77,295.77,360.59,294.60][i],
}))

export default function Dashboard() {
  const { user, logout, isPro, apiFetch } = useAuth()
  const navigate  = useNavigate()
  const isPremium = user?.plan === 'premium'
  const [signals, setSignals]         = useState(MOCK)
  const [selected, setSelected]       = useState('AAPL')
  const [upgrading, setUpgrading]     = useState(false)
  const [tab, setTab]                 = useState('signals') // 'signals' | 'chart' | 'crypto'
  const [activeMarket, setActiveMarket] = useState('stocks') // 'stocks' | 'crypto'
  const [cryptoSignals, setCryptoSignals] = useState(CRYPTO_MOCK)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('http://localhost:8001/api/v1/signals/latest?limit=20')
        const data = await res.json()
        if (data?.signals?.length) setSignals(data.signals)
      } catch {}
    }
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [])

  const handleUpgrade = async (plan) => {
    setUpgrading(true)
    try {
      const data = await apiFetch('/stripe/checkout', { method: 'POST', body: JSON.stringify({ plan }) })
      window.location.href = data.checkout_url
    } catch (err) { alert(err.message) }
    finally { setUpgrading(false) }
  }

  const visible  = isPro ? signals : signals.slice(0, 5)
  const selected_sig = signals.find(s => s.symbol === selected)
  const buyCount  = signals.filter(s => s.signal === 'BUY').length
  const holdCount = signals.filter(s => s.signal === 'HOLD').length
  const avgConf   = signals.length ? (signals.reduce((a, b) => a + b.confidence, 0) / signals.length * 100).toFixed(1) : 0

  return (
    <div style={s.page}>
      {/* ── Navbar ── */}
      <nav style={s.nav}>
        <div style={s.navLeft}>
          <div style={s.logoMark}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <span style={s.navLogo}>Quantera</span>
          <div style={s.navTabs}>
            <button style={{ ...s.navTab, ...(tab==='signals' ? s.navTabActive : {}) }} onClick={() => { setTab('signals'); setActiveMarket('stocks') }}>
              📈 Stocks
            </button>
            <button style={{ ...s.navTab, ...(tab==='crypto' ? s.navTabActive : {}) }} onClick={() => setTab('crypto')}
              title={!isPremium ? 'Premium plan required' : ''}>
              {!isPremium && '🔒 '}₿ Crypto
            </button>
            <button style={{ ...s.navTab, ...(tab==='chart' ? s.navTabActive : {}) }} onClick={() => setTab('chart')}>Chart</button>
            <Link to="/pricing" style={s.navTab}>Pricing</Link>
            <Link to="/billing" style={s.navTab}>Billing</Link>
          </div>
        </div>
        <div style={s.navRight}>
          <span style={{ ...s.planBadge, background: isPro ? 'rgba(0,102,255,0.1)' : '#F0F0F0', color: isPro ? '#0066FF' : '#5A6478' }}>
            {user?.plan?.toUpperCase() || 'FREE'}
          </span>
          <span style={s.navUser}>{user?.full_name?.split(' ')[0] || user?.email}</span>
          <button style={s.logoutBtn} onClick={async () => { await logout(); navigate('/login') }}>Sign out</button>
        </div>
      </nav>

      {/* ── Stats bar ── */}
      <div style={s.statsBar}>
        <div style={s.stat}>
          <span style={{ ...s.statNum, color: '#00B87A' }}>{buyCount}</span>
          <span style={s.statLabel}>BUY</span>
        </div>
        <div style={s.statDivider}/>
        <div style={s.stat}>
          <span style={{ ...s.statNum, color: '#F5A623' }}>{holdCount}</span>
          <span style={s.statLabel}>HOLD</span>
        </div>
        <div style={s.statDivider}/>
        <div style={s.stat}>
          <span style={{ ...s.statNum, color: '#F23645' }}>{signals.filter(s => s.signal==='SELL').length}</span>
          <span style={s.statLabel}>SELL</span>
        </div>
        <div style={s.statDivider}/>
        <div style={s.stat}>
          <span style={s.statNum}>{avgConf}%</span>
          <span style={s.statLabel}>AVG CONF</span>
        </div>
        <div style={s.statDivider}/>
        <div style={s.stat}>
          <span style={{ ...s.statNum, fontSize: 13, color: '#00B87A' }}>● LIVE</span>
          <span style={s.statLabel}>UPDATES 30M</span>
        </div>
        {!isPro && (
          <button style={s.upgradeBarBtn} onClick={() => handleUpgrade('pro')} disabled={upgrading}>
            {upgrading ? 'Loading…' : '⚡ Upgrade to Pro — $9.99/mo'}
          </button>
        )}
      </div>

      <div style={s.body}>

        {/* ── CHART TAB ── */}
        {tab === 'chart' && (
          <div style={s.chartSection}>
            {/* Symbol picker */}
            <div style={s.symbolBar}>
              {SYMBOLS.map(sym => {
                const sig = signals.find(s => s.symbol === sym)
                return (
                  <button key={sym} onClick={() => setSelected(sym)}
                    style={{ ...s.symCard, borderColor: selected === sym ? '#0066FF' : '#E4E8F0', background: selected === sym ? '#F0F6FF' : 'white' }}>
                    <span style={s.symName}>{sym}</span>
                    {sig && <SignalBadge signal={sig.signal}/>}
                    {sig && <span style={{ fontSize: 12, color: '#5A6478' }}>{(sig.confidence*100).toFixed(0)}%</span>}
                  </button>
                )
              })}
            </div>

            {/* Chart + signal info */}
            <div style={s.chartWrap}>
              <div style={s.chartTopBar}>
                <div style={s.chartTopLeft}>
                  <strong style={{ fontSize: 16, color: '#0A0F1E' }}>{selected}</strong>
                  {selected_sig && (
                    <>
                      <SignalBadge signal={selected_sig.signal}/>
                      <span style={{ fontSize: 13, color: '#5A6478' }}>{(selected_sig.confidence*100).toFixed(1)}% confidence</span>
                      <span style={{ fontSize: 13, color: selected_sig.sentiment_score >= 0 ? '#00B87A' : '#F23645' }}>
                        Sentiment: {selected_sig.sentiment_score >= 0 ? '+' : ''}{selected_sig.sentiment_score?.toFixed(3)}
                      </span>
                      <span style={{ fontSize: 13, color: '#5A6478' }}>
                        ${selected_sig.price_at_signal?.toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
                <span style={{ fontSize: 12, color: '#8A94A6' }}>Powered by TradingView</span>
              </div>
              <iframe
                key={selected}
                src={`https://www.tradingview.com/widgetembed/?frameElementId=tv_${selected}&symbol=${CRYPTO_TV[selected] || `NASDAQ:${selected}`}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&theme=light&style=1&timezone=exchange&withdateranges=1&showpopupbutton=1&studies=RSI%40tv-basicstudies%1FMACD%40tv-basicstudies&locale=en`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* ── CRYPTO TAB ── */}
        {tab === 'crypto' && (
          !isPremium ? (
            <div style={s.gateCard}>
              <div style={s.gateIcon}>₿</div>
              <h2 style={s.gateTitle}>Crypto Signals — Premium Only</h2>
              <p style={s.gateSub}>Get AI-powered BUY/HOLD/SELL signals for BTC, ETH, SOL, BNB and more. Upgrade to Premium to unlock.</p>
              <div style={s.cryptoPreview}>
                {CRYPTO_MOCK.slice(0,4).map((c, i) => (
                  <div key={i} style={s.cryptoPreviewCard}>
                    <span style={s.cryptoSym}>{c.symbol}</span>
                    <div style={{ filter: 'blur(4px)' }}><SignalBadge signal={c.signal}/></div>
                    <span style={{ fontSize: 12, color: '#8A94A6', filter: 'blur(4px)' }}>{(c.confidence*100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
              <button style={s.gateBtn} onClick={() => handleUpgrade('premium')}>
                Unlock Crypto — $29.99/mo
              </button>
              <p style={s.gateDisclaimer}>Not financial advice. Crypto trading involves significant risk.</p>
            </div>
          ) : (
            <div style={s.signalsSection}>
              <div style={s.tableCard}>
                <div style={s.tableTopBar}>
                  <div style={s.tableTopLeft}>
                    <span style={s.liveDot}/>
                    <span style={s.tableTitle}>Live Crypto Signals</span>
                    <span style={s.tableSub}>BTC · ETH · SOL · BNB · XRP · ADA · DOGE · AVAX</span>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={s.table}>
                    <thead>
                      <tr style={{ background: '#F7F9FC' }}>
                        <th style={s.th}>Coin</th>
                        <th style={s.th}>Signal</th>
                        <th style={s.th}>Confidence</th>
                        <th style={s.th}>Price (USD)</th>
                        <th style={s.th}>Sentiment</th>
                        <th style={s.th}>Technical</th>
                        <th style={s.th}>Chart</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cryptoSignals.map((sig, i) => (
                        <tr key={i} style={{ ...s.tr, background: selected === sig.symbol ? '#F0F6FF' : 'white' }}>
                          <td style={s.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F7F9FC', border: '1px solid #E4E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0066FF' }}>
                                {sig.symbol.charAt(0)}
                              </div>
                              <strong style={{ fontSize: 14, color: '#0A0F1E' }}>{sig.symbol}</strong>
                            </div>
                          </td>
                          <td style={s.td}><SignalBadge signal={sig.signal}/></td>
                          <td style={s.td}><ConfBar value={sig.confidence} signal={sig.signal}/></td>
                          <td style={s.td}>
                            <strong>${sig.price_at_signal >= 1000
                              ? sig.price_at_signal.toLocaleString()
                              : sig.price_at_signal.toFixed(3)}
                            </strong>
                          </td>
                          <td style={s.td}>
                            <span style={{ color: sig.sentiment_score >= 0 ? '#00B87A' : '#F23645', fontWeight: 500 }}>
                              {sig.sentiment_score >= 0 ? '+' : ''}{sig.sentiment_score.toFixed(3)}
                            </span>
                          </td>
                          <td style={s.td}>
                            <span style={{ color: sig.technical_score >= 0 ? '#00B87A' : '#F23645', fontWeight: 500 }}>
                              {sig.technical_score >= 0 ? '+' : ''}{sig.technical_score.toFixed(3)}
                            </span>
                          </td>
                          <td style={s.td}>
                            <button style={s.viewBtn} onClick={() => {
                              setSelected(sig.symbol)
                              setTab('chart')
                            }}>View →</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Crypto mini chart */}
              <div style={s.miniChart}>
                <div style={s.miniChartHeader}>
                  <strong style={{ fontSize: 14, color: '#0A0F1E' }}>
                    {CRYPTO_TV[selected] ? selected : 'BTC'} Live
                  </strong>
                  {cryptoSignals.find(c => c.symbol === selected) && (
                    <SignalBadge signal={cryptoSignals.find(c => c.symbol === selected).signal}/>
                  )}
                </div>
                <iframe
                  key={selected}
                  src={`https://www.tradingview.com/widgetembed/?frameElementId=crypto_${selected}&symbol=${CRYPTO_TV[selected] || 'BINANCE:BTCUSDT'}&interval=D&hidesidetoolbar=1&theme=light&style=1&locale=en`}
                  style={{ width: '100%', height: 320, border: 'none' }}
                  allowFullScreen
                />
                <button style={s.fullChartBtn} onClick={() => setTab('chart')}>Open full chart →</button>
              </div>
            </div>
          )
        )}

        {/* ── SIGNALS TAB ── */}
        {tab === 'signals' && (
          <div style={s.signalsSection}>
            <div style={s.tableCard}>
              <div style={s.tableTopBar}>
                <div style={s.tableTopLeft}>
                  <span style={s.liveDot}/>
                  <span style={s.tableTitle}>Live AI Signals</span>
                  <span style={s.tableSub}>Powered by LSTM + LightGBM + NewsAPI sentiment</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {SYMBOLS.map(sym => (
                    <button key={sym} onClick={() => { setSelected(sym); setTab('chart') }}
                      style={{ ...s.quickSym, background: selected === sym ? '#0066FF' : 'transparent', color: selected === sym ? 'white' : '#5A6478' }}>
                      {sym}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={s.table}>
                  <thead>
                    <tr style={{ background: '#F7F9FC' }}>
                      <th style={s.th}>Symbol</th>
                      <th style={s.th}>Signal</th>
                      <th style={s.th}>Confidence</th>
                      <th style={s.th}>Price</th>
                      <th style={s.th}>Sentiment</th>
                      <th style={s.th}>Technical</th>
                      <th style={s.th}>Chart</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((sig, i) => (
                      <tr key={i} style={{ ...s.tr, background: selected === sig.symbol ? '#F0F6FF' : 'white' }}>
                        <td style={s.td}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: '#0A0F1E' }}>{sig.symbol}</span>
                        </td>
                        <td style={s.td}><SignalBadge signal={sig.signal}/></td>
                        <td style={s.td}><ConfBar value={sig.confidence} signal={sig.signal}/></td>
                        <td style={s.td}><span style={{ fontWeight: 500 }}>${sig.price_at_signal?.toFixed(2)}</span></td>
                        <td style={s.td}>
                          <span style={{ color: sig.sentiment_score >= 0 ? '#00B87A' : '#F23645', fontWeight: 500 }}>
                            {sig.sentiment_score >= 0 ? '+' : ''}{sig.sentiment_score?.toFixed(3)}
                          </span>
                        </td>
                        <td style={s.td}>
                          <span style={{ color: sig.technical_score >= 0 ? '#00B87A' : '#F23645', fontWeight: 500 }}>
                            {sig.technical_score >= 0 ? '+' : ''}{sig.technical_score?.toFixed(3)}
                          </span>
                        </td>
                        <td style={s.td}>
                          <button style={s.viewBtn} onClick={() => { setSelected(sig.symbol); setTab('chart') }}>
                            View →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!isPro && (
                <div style={s.lockBanner}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#0A0F1E', marginBottom: 4 }}>
                      🔒 {signals.length - 5} more signals locked
                    </div>
                    <div style={{ fontSize: 13, color: '#5A6478' }}>
                      Upgrade to Pro to unlock all signals, live data, and email alerts
                    </div>
                  </div>
                  <button style={s.lockBtn} onClick={() => handleUpgrade('pro')} disabled={upgrading}>
                    {upgrading ? 'Loading…' : 'Upgrade to Pro — $9.99/mo'}
                  </button>
                </div>
              )}
            </div>

            {/* Mini chart preview */}
            <div style={s.miniChart}>
              <div style={s.miniChartHeader}>
                <strong style={{ fontSize: 14, color: '#0A0F1E' }}>{selected} — Quick View</strong>
                {selected_sig && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SignalBadge signal={selected_sig.signal}/>
                    <span style={{ fontSize: 12, color: '#5A6478' }}>{(selected_sig.confidence*100).toFixed(1)}% conf</span>
                  </div>
                )}
              </div>
              <iframe
                key={selected}
                src={`https://www.tradingview.com/widgetembed/?frameElementId=mini_${selected}&symbol=NASDAQ:${selected}&interval=D&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=f1f3f6&theme=light&style=1&timezone=exchange&withdateranges=0&showpopupbutton=0&locale=en`}
                style={{ width: '100%', height: 320, border: 'none' }}
                allowFullScreen
              />
              <button style={s.fullChartBtn} onClick={() => setTab('chart')}>
                Open full chart →
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#F7F9FC', fontFamily: 'DM Sans, sans-serif' },
  nav: { background: 'white', borderBottom: '1px solid #E4E8F0', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 },
  navLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  logoMark: { width: 28, height: 28, borderRadius: 7, background: '#0066FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  navLogo: { fontSize: 15, fontWeight: 700, color: '#0A0F1E', marginRight: 8 },
  navTabs: { display: 'flex', gap: 2 },
  navTab: { padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent', fontSize: 13, fontWeight: 500, color: '#5A6478', cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center' },
  navTabActive: { background: '#F0F6FF', color: '#0066FF' },
  navRight: { display: 'flex', alignItems: 'center', gap: 12 },
  planBadge: { fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.08em' },
  navUser: { fontSize: 13, color: '#5A6478' },
  logoutBtn: { padding: '6px 14px', borderRadius: 7, border: '1px solid #E4E8F0', background: 'transparent', fontSize: 12, color: '#5A6478', cursor: 'pointer' },
  statsBar: { background: 'white', borderBottom: '1px solid #E4E8F0', padding: '0 24px', height: 44, display: 'flex', alignItems: 'center', gap: 0 },
  stat: { display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px' },
  statNum: { fontSize: 15, fontWeight: 600, color: '#0A0F1E' },
  statLabel: { fontSize: 10, color: '#8A94A6', fontWeight: 600, letterSpacing: '0.06em' },
  statDivider: { width: 1, height: 20, background: '#E4E8F0' },
  upgradeBarBtn: { marginLeft: 'auto', padding: '6px 16px', borderRadius: 8, border: 'none', background: '#0066FF', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  body: { padding: '20px 24px', maxWidth: 1600, margin: '0 auto' },
  // Chart tab
  chartSection: { display: 'flex', flexDirection: 'column', gap: 16 },
  symbolBar: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  symCard: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, border: '1.5px solid #E4E8F0', background: 'white', cursor: 'pointer', transition: 'all 0.15s' },
  symName: { fontSize: 13, fontWeight: 700, color: '#0A0F1E' },
  chartWrap: { background: 'white', borderRadius: 12, border: '1px solid #E4E8F0', overflow: 'hidden', height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' },
  chartTopBar: { padding: '12px 18px', borderBottom: '1px solid #E4E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  chartTopLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  // Signals tab
  signalsSection: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 },
  tableCard: { background: 'white', borderRadius: 12, border: '1px solid #E4E8F0', overflow: 'hidden' },
  tableTopBar: { padding: '14px 20px', borderBottom: '1px solid #E4E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  tableTopLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  liveDot: { width: 8, height: 8, borderRadius: '50%', background: '#00B87A', animation: 'pulse 2s infinite', flexShrink: 0 },
  tableTitle: { fontSize: 14, fontWeight: 600, color: '#0A0F1E' },
  tableSub: { fontSize: 12, color: '#8A94A6' },
  quickSym: { padding: '4px 10px', borderRadius: 6, border: '1px solid #E4E8F0', fontSize: 11, fontWeight: 600, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 18px', fontSize: 11, fontWeight: 600, color: '#8A94A6', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', borderBottom: '1px solid #E4E8F0' },
  tr: { borderBottom: '1px solid #F0F2F5', cursor: 'pointer', transition: 'background 0.15s' },
  td: { padding: '14px 18px', fontSize: 13, color: '#0A0F1E' },
  viewBtn: { padding: '5px 12px', borderRadius: 6, border: '1px solid #E4E8F0', background: 'transparent', fontSize: 12, color: '#0066FF', cursor: 'pointer', fontWeight: 500 },
  lockBanner: { padding: '18px 20px', background: 'linear-gradient(135deg,#F0F6FF,#E8F1FF)', borderTop: '1px solid #C7DEFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  lockBtn: { padding: '10px 20px', borderRadius: 10, border: 'none', background: '#0066FF', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  miniChart: { background: 'white', borderRadius: 12, border: '1px solid #E4E8F0', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  miniChartHeader: { padding: '14px 16px', borderBottom: '1px solid #E4E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  fullChartBtn: { margin: 12, padding: '10px', borderRadius: 8, border: '1.5px solid #0066FF', background: 'transparent', color: '#0066FF', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  // Crypto gate
  gateCard: { background: 'white', borderRadius: 16, border: '1px solid #E4E8F0', padding: '60px 40px', textAlign: 'center', maxWidth: 600, margin: '40px auto' },
  gateIcon: { fontSize: 48, marginBottom: 16 },
  gateTitle: { fontSize: 24, fontWeight: 600, color: '#0A0F1E', margin: '0 0 12px' },
  gateSub: { fontSize: 15, color: '#5A6478', lineHeight: 1.7, margin: '0 0 32px' },
  cryptoPreview: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 32 },
  cryptoPreviewCard: { background: '#F7F9FC', borderRadius: 10, border: '1px solid #E4E8F0', padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  cryptoSym: { fontSize: 13, fontWeight: 700, color: '#0A0F1E' },
  gateBtn: { padding: '14px 32px', borderRadius: 10, border: 'none', background: '#0066FF', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 16 },
  gateDisclaimer: { fontSize: 12, color: '#8A94A6' },
}   