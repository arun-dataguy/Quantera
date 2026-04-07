import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import TradingViewChart from '../components/TradingViewChart'

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
  const [signals, setSignals]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [stats, setStats]             = useState({ buy: 0, hold: 0, sell: 0, avgConf: 0 })
  const [selected, setSelected]       = useState('AAPL')
  const [upgrading, setUpgrading]     = useState(false)
  const [tab, setTab]                 = useState('signals') // 'signals' | 'chart' | 'crypto'
  const [activeMarket, setActiveMarket] = useState('stocks') // 'stocks' | 'crypto'
  const [cryptoSignals, setCryptoSignals] = useState(CRYPTO_MOCK)
  const [paperTrading, setPaperTrading] = useState(null) // ticker being paper-traded

  useEffect(() => {
    const fetchSignals = async () => {
      setLoading(true)
      try {
        const data = await apiFetch('/signals/latest?market=stocks')
        setSignals(data.signals || [])
        setStats({
          buy:  data.signals.filter(s => s.signal === 'BUY').length,
          hold: data.signals.filter(s => s.signal === 'HOLD').length,
          sell: data.signals.filter(s => s.signal === 'SELL').length,
          avgConf: data.signals.length
            ? (data.signals.reduce((a, s) => a + s.confidence, 0) / data.signals.length * 100).toFixed(1)
            : 0,
        })
      } catch (err) {
        console.error('Signal fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSignals()
    const interval = setInterval(fetchSignals, 30 * 60 * 1000) // refresh every 30 mins
    return () => clearInterval(interval)
  }, [])

  const handlePaperTrade = useCallback(async (sig) => {
    if (sig.signal === 'HOLD') return
    setPaperTrading(sig.symbol)
    try {
      await apiFetch('/wallet/trade', {
        method: 'POST',
        body: JSON.stringify({
          ticker: sig.symbol,
          action: sig.signal,
          signal_confidence: sig.confidence,
          price: sig.price,   // pass signal price as fallback if yfinance fails
        }),
      })
      // Brief confirmation flash
      setTimeout(() => setPaperTrading(null), 800)
    } catch (e) {
      alert(`Paper trade failed: ${e.message}`)
      setPaperTrading(null)
    }
  }, [apiFetch])

  const handleUpgrade = async (plan) => {
    setUpgrading(true)
    try {
      const data = await apiFetch('/stripe/checkout', { method: 'POST', body: JSON.stringify({ plan }) })
      window.location.href = data.checkout_url
    } catch (err) { alert(err.message) }
    finally { setUpgrading(false) }
  }

  const visible  = signals  // Beta: show all signals to everyone
  const selected_sig = signals.find(s => s.symbol === selected)

  return (
    <div style={s.page}>
      {/* ── Navbar ── */}
      <nav style={s.nav}>
        <div style={s.navLeft}>
          <Logo height={30} />
          <div style={s.navTabs}>
            <button style={{ ...s.navTab, ...(tab==='signals' ? s.navTabActive : {}) }} onClick={() => { setTab('signals'); setActiveMarket('stocks') }}>
              📈 Stocks
            </button>
            <button style={{ ...s.navTab, ...(tab==='crypto' ? s.navTabActive : {}) }} onClick={() => setTab('crypto')}>
              ₿ Crypto
            </button>
            <button style={{ ...s.navTab, ...(tab==='chart' ? s.navTabActive : {}) }} onClick={() => setTab('chart')}>Chart</button>
            <Link to="/market" style={s.navTab}>🔥 Market</Link>
            <Link to="/intel" style={{ ...s.navTab, position: 'relative' }}>
              📰 Intel
              <span style={{ position: 'absolute', top: -4, right: -4, background: '#006c46', color: 'white', fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 4 }}>NEW</span>
            </Link>
            <Link to="/pricing" style={s.navTab}>Pricing</Link>
            <Link to="/billing" style={s.navTab}>Billing</Link>
            <Link to="/portfolio" style={s.navTab}>Portfolio</Link>
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
          <span style={{ ...s.statNum, color: '#00B87A' }}>{stats.buy}</span>
          <span style={s.statLabel}>BUY</span>
        </div>
        <div style={s.statDivider}/>
        <div style={s.stat}>
          <span style={{ ...s.statNum, color: '#F5A623' }}>{stats.hold}</span>
          <span style={s.statLabel}>HOLD</span>
        </div>
        <div style={s.statDivider}/>
        <div style={s.stat}>
          <span style={{ ...s.statNum, color: '#F23645' }}>{stats.sell}</span>
          <span style={s.statLabel}>SELL</span>
        </div>
        <div style={s.statDivider}/>
        <div style={s.stat}>
          <span style={s.statNum}>{stats.avgConf}%</span>
          <span style={s.statLabel}>AVG CONF</span>
        </div>
        <div style={s.statDivider}/>
        <div style={s.stat}>
          <span style={{ ...s.statNum, fontSize: 13, color: '#00B87A' }}>● LIVE</span>
          <span style={s.statLabel}>UPDATES 30M</span>
        </div>
        <div style={s.betaBadge}>🎉 Beta — All features free</div>
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
                        ${selected_sig.price?.toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
                <span style={{ fontSize: 12, color: '#8A94A6' }}>Powered by TradingView</span>
              </div>
              <TradingViewChart
                key={selected}
                symbol={selected}
                exchange={CRYPTO_TV[selected] ? CRYPTO_TV[selected].split(':')[0] : 'NASDAQ'}
                height={480}
              />
            </div>
          </div>
        )}

        {/* ── CRYPTO TAB ── */}
        {tab === 'crypto' && (
          <> {/* Beta: crypto open to everyone */}
          {true && (
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
                            <strong>${sig.price >= 1000
                              ? sig.price.toLocaleString()
                              : sig.price?.toFixed(3)}
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
                <TradingViewChart
                  key={selected}
                  symbol={CRYPTO_TV[selected] ? CRYPTO_TV[selected].split(':')[1] : 'BTCUSDT'}
                  exchange={CRYPTO_TV[selected] ? CRYPTO_TV[selected].split(':')[0] : 'BINANCE'}
                  height={320}
                />
                <button style={s.fullChartBtn} onClick={() => setTab('chart')}>Open full chart →</button>
              </div>
            </div>
          )}
          </>
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
                      <th style={s.th}>Paper Trade</th>
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
                        <td style={s.td}><span style={{ fontWeight: 500 }}>${sig.price?.toFixed(2)}</span></td>
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
                        <td style={s.td}>
                          {sig.signal !== 'HOLD' ? (
                            <button
                              style={{
                                ...s.paperBtn,
                                background: paperTrading === sig.symbol ? '#dcfce7' : (sig.signal === 'BUY' ? '#dcfce7' : '#fee2e2'),
                                color: sig.signal === 'BUY' ? '#166534' : '#991b1b',
                              }}
                              onClick={() => handlePaperTrade(sig)}
                              disabled={paperTrading === sig.symbol}
                            >
                              {paperTrading === sig.symbol ? '✓ Done' : `Paper ${sig.signal}`}
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: '#8A94A6' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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
              <TradingViewChart key={selected} symbol={selected} height={320} />
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
  betaBadge: { marginLeft: 'auto', padding: '4px 14px', borderRadius: 20, background: 'rgba(0,184,122,0.12)', color: '#00875a', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' },
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
  paperBtn: { padding: '5px 10px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' },
}   