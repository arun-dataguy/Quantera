import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppSidebar from '../components/AppSidebar'
import TradingViewChart from '../components/TradingViewChart'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8003/api'

function SignalBadge({ signal, size = 'md' }) {
  if (!signal) return null
  const cfg = {
    BUY:  { bg: 'rgba(0,184,122,0.12)', color: '#00b87c', label: 'BUY' },
    SELL: { bg: 'rgba(242,54,69,0.12)',  color: '#f23645', label: 'SELL' },
    HOLD: { bg: 'rgba(245,166,35,0.12)', color: '#f5a623', label: 'HOLD' },
  }[signal] || { bg: '#f3f4f6', color: '#6b7280', label: signal }
  const fontSize = size === 'lg' ? 13 : 11
  const padding  = size === 'lg' ? '5px 14px' : '3px 10px'
  return (
    <span style={{ fontSize, fontWeight: 700, padding, borderRadius: 6, background: cfg.bg, color: cfg.color, letterSpacing: '0.06em' }}>
      {cfg.label}
    </span>
  )
}

function Metric({ label, value, sub }) {
  return (
    <div style={s.metric}>
      <p style={s.metricLabel}>{label}</p>
      <p style={s.metricValue}>{value ?? 'N/A'}</p>
      {sub && <p style={s.metricSub}>{sub}</p>}
    </div>
  )
}

function ConfBar({ value, signal }) {
  const color = signal === 'BUY' ? '#00b87c' : signal === 'SELL' ? '#f23645' : '#f5a623'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: '#e4e8f0', borderRadius: 3 }}>
        <div style={{ height: 6, borderRadius: 3, background: color, width: `${(value || 0) * 100}%`, transition: 'width 0.8s' }} />
      </div>
      <span style={{ fontSize: 13, color: '#5a6478', width: 44 }}>{((value || 0) * 100).toFixed(1)}%</span>
    </div>
  )
}

export default function StockDetail() {
  const { symbol } = useParams()
  const { apiFetch } = useAuth()
  const [stock, setStock]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    setError(null)

    fetch(`${API}/market/stock/${symbol.toUpperCase()}`)
      .then(r => r.json())
      .then(data => { setStock(data); setLoading(false) })
      .catch(e  => { setError(e.message); setLoading(false) })
  }, [symbol])

  const sym = symbol?.toUpperCase() || ''
  const isUp = (stock?.change_pct ?? 0) >= 0

  return (
    <div style={s.root}>
      <AppSidebar />

      <main style={s.main}>
        {/* Breadcrumb */}
        <div style={s.breadcrumb}>
          <Link to="/dashboard" style={s.breadLink}>Dashboard</Link>
          <span style={s.breadSep}>/</span>
          <Link to="/market" style={s.breadLink}>Market</Link>
          <span style={s.breadSep}>/</span>
          <span style={s.breadCurrent}>{sym}</span>
        </div>

        {loading && (
          <div style={s.center}>
            <div style={s.spinner} />
            <p style={{ color: '#767b93', marginTop: 16 }}>Loading {sym}…</p>
          </div>
        )}

        {error && (
          <div style={s.errorBox}>
            Could not load data for {sym}. <Link to="/market" style={{ color: '#0050cb' }}>Back to Market</Link>
          </div>
        )}

        {stock && !loading && (
          <>
            {/* ── Header ── */}
            <div style={s.header}>
              <div style={s.headerLeft}>
                <div style={s.symbolBadge}>{sym.charAt(0)}</div>
                <div>
                  <div style={s.nameRow}>
                    <h1 style={s.companyName}>{stock.name}</h1>
                    <span style={s.exchangeBadge}>{stock.exchange}</span>
                    {stock.sector && <span style={s.sectorBadge}>{stock.sector}</span>}
                  </div>
                  <div style={s.symbolRow}>
                    <span style={s.symText}>{sym}</span>
                    {stock.ai_signal && <SignalBadge signal={stock.ai_signal} size="lg" />}
                  </div>
                </div>
              </div>

              <div style={s.priceBlock}>
                {stock.price ? (
                  <>
                    <p style={s.price}>${stock.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p style={{ ...s.change, color: isUp ? '#00b87c' : '#f23645' }}>
                      {isUp ? '▲' : '▼'} {Math.abs(stock.change ?? 0).toFixed(2)} ({isUp ? '+' : ''}{stock.change_pct?.toFixed(2)}%)
                    </p>
                  </>
                ) : (
                  <p style={s.price}>—</p>
                )}
              </div>
            </div>

            {/* ── Chart ── */}
            <div style={s.chartCard}>
              <TradingViewChart symbol={sym} exchange={stock.exchange === 'NMS' ? 'NASDAQ' : stock.exchange || 'NASDAQ'} height={460} />
            </div>

            {/* ── Metrics + AI Signal ── */}
            <div style={s.grid2}>
              {/* Key metrics */}
              <div style={s.card}>
                <h2 style={s.cardTitle}>Key Metrics</h2>
                <div style={s.metricsGrid}>
                  <Metric label="Market Cap"    value={stock.market_cap} />
                  <Metric label="P/E Ratio"     value={stock.pe_ratio}   sub={`Fwd: ${stock.forward_pe ?? 'N/A'}`} />
                  <Metric label="EPS (TTM)"     value={stock.eps ? `$${stock.eps}` : 'N/A'} />
                  <Metric label="Revenue"       value={stock.revenue} />
                  <Metric label="Profit Margin" value={stock.profit_margin} />
                  <Metric label="Beta"          value={stock.beta} />
                  <Metric label="52W High"      value={stock.week_52_high ? `$${stock.week_52_high}` : 'N/A'} />
                  <Metric label="52W Low"       value={stock.week_52_low  ? `$${stock.week_52_low}`  : 'N/A'} />
                  <Metric label="Dividend Yield" value={stock.dividend_yield} />
                  <Metric label="Avg Volume"    value={stock.avg_volume ? (stock.avg_volume / 1e6).toFixed(1) + 'M' : 'N/A'} />
                </div>
              </div>

              {/* AI Signal card */}
              <div style={s.card}>
                <h2 style={s.cardTitle}>AI Analysis</h2>
                {stock.ai_signal ? (
                  <div style={s.aiCard}>
                    <div style={s.aiSignalRow}>
                      <SignalBadge signal={stock.ai_signal} size="lg" />
                      <span style={s.aiLabel}>Quantera AI Signal</span>
                    </div>
                    <div style={s.aiMetric}>
                      <div style={s.aiMetricLabel}>
                        <span>Confidence</span>
                        <span style={{ fontWeight: 700 }}>{((stock.ai_confidence || 0) * 100).toFixed(1)}%</span>
                      </div>
                      <ConfBar value={stock.ai_confidence} signal={stock.ai_signal} />
                    </div>
                    <div style={s.aiMetric}>
                      <div style={s.aiMetricLabel}>
                        <span>Sentiment Score</span>
                        <span style={{ fontWeight: 700, color: (stock.ai_sentiment || 0) >= 0 ? '#00b87c' : '#f23645' }}>
                          {(stock.ai_sentiment || 0) >= 0 ? '+' : ''}{stock.ai_sentiment?.toFixed(3)}
                        </span>
                      </div>
                      <div style={{ height: 6, background: '#e4e8f0', borderRadius: 3 }}>
                        <div style={{
                          height: 6, borderRadius: 3,
                          background: (stock.ai_sentiment || 0) >= 0 ? '#00b87c' : '#f23645',
                          width: `${Math.min(Math.abs(stock.ai_sentiment || 0) * 200, 100)}%`,
                        }} />
                      </div>
                    </div>
                    <p style={s.aiDisclaimer}>
                      AI signals are generated by LSTM + LightGBM models using technical and sentiment data.
                      Not financial advice. Past performance does not guarantee future results.
                    </p>
                  </div>
                ) : (
                  <div style={s.noSignal}>
                    <p style={s.noSignalText}>No AI signal yet for {sym}.</p>
                    <p style={{ fontSize: 12, color: '#9ca3af' }}>Signal coverage is expanding. Check back soon.</p>
                  </div>
                )}

                {/* Company info */}
                {stock.description && (
                  <div style={s.descSection}>
                    <h3 style={s.descTitle}>About {stock.name?.split(' ')[0]}</h3>
                    <p style={s.descText}>{stock.description}</p>
                    <div style={s.companyMeta}>
                      {stock.industry  && <span style={s.tag}>{stock.industry}</span>}
                      {stock.employees && <span style={s.tag}>{(stock.employees / 1000).toFixed(0)}K employees</span>}
                      {stock.website   && <a href={stock.website} style={s.tag} target="_blank" rel="noopener noreferrer">Website ↗</a>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Paper Trade CTA ── */}
            {stock.ai_signal && (
              <div style={s.tradeCta}>
                <div>
                  <p style={s.tradeCtaTitle}>Paper trade {sym}</p>
                  <p style={s.tradeCtaSub}>Use your virtual $10,000 portfolio — no real money involved.</p>
                </div>
                <Link to="/dashboard" style={s.tradeBtn}>
                  Go to Dashboard → Paper Trade
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

const s = {
  root:  { display: 'flex', minHeight: '100vh', background: '#f4f6fb', fontFamily: 'Inter, sans-serif' },
  main:  { flex: 1, padding: '32px 36px', minWidth: 0, overflowY: 'auto' },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, fontSize: 13 },
  breadLink:  { color: '#0050cb', textDecoration: 'none', fontWeight: 500 },
  breadSep:   { color: '#c2c6d8' },
  breadCurrent: { color: '#424656', fontWeight: 600 },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  spinner: { width: 36, height: 36, border: '3px solid #e4e8f0', borderTop: '3px solid #0050cb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  errorBox: { padding: '16px 20px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, color: '#b91c1c', fontSize: 14 },
  // Header
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 20, flexWrap: 'wrap' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  symbolBadge: { width: 52, height: 52, borderRadius: 14, background: '#0050cb', color: 'white', fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  nameRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 },
  companyName: { fontSize: 22, fontWeight: 800, color: '#161b2b', margin: 0, letterSpacing: '-0.02em' },
  exchangeBadge: { fontSize: 11, fontWeight: 700, color: '#0050cb', background: '#e8effe', padding: '3px 8px', borderRadius: 5 },
  sectorBadge: { fontSize: 11, fontWeight: 600, color: '#767b93', background: '#f0f2fa', padding: '3px 8px', borderRadius: 5 },
  symbolRow: { display: 'flex', alignItems: 'center', gap: 10 },
  symText: { fontSize: 15, fontWeight: 700, color: '#424656' },
  priceBlock: { textAlign: 'right' },
  price: { fontSize: 32, fontWeight: 800, color: '#161b2b', margin: '0 0 4px', letterSpacing: '-0.03em' },
  change: { fontSize: 15, fontWeight: 600, margin: 0 },
  // Chart
  chartCard: { background: 'white', borderRadius: 16, padding: 20, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  // Grid
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 },
  card:  { background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#161b2b', margin: '0 0 20px', letterSpacing: '-0.01em' },
  // Metrics
  metricsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  metric: { display: 'flex', flexDirection: 'column', gap: 2 },
  metricLabel: { fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 },
  metricValue: { fontSize: 16, fontWeight: 700, color: '#161b2b', margin: 0 },
  metricSub:   { fontSize: 11, color: '#9ca3af', margin: 0 },
  // AI card
  aiCard: { display: 'flex', flexDirection: 'column', gap: 20 },
  aiSignalRow: { display: 'flex', alignItems: 'center', gap: 12 },
  aiLabel: { fontSize: 13, color: '#767b93', fontWeight: 500 },
  aiMetric: { display: 'flex', flexDirection: 'column', gap: 8 },
  aiMetricLabel: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#424656' },
  aiDisclaimer: { fontSize: 11, color: '#9ca3af', lineHeight: 1.6, margin: 0, paddingTop: 8, borderTop: '1px solid #f0f2fa' },
  noSignal: { padding: '24px', background: '#f9fafb', borderRadius: 12, textAlign: 'center' },
  noSignalText: { fontSize: 14, color: '#424656', margin: '0 0 4px', fontWeight: 600 },
  // Description
  descSection: { borderTop: '1px solid #f0f2fa', paddingTop: 20, marginTop: 4 },
  descTitle: { fontSize: 13, fontWeight: 700, color: '#161b2b', margin: '0 0 10px' },
  descText:  { fontSize: 13, color: '#424656', lineHeight: 1.7, margin: '0 0 12px' },
  companyMeta: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  tag: { fontSize: 11, fontWeight: 600, color: '#424656', background: '#f0f2fa', padding: '4px 10px', borderRadius: 6, textDecoration: 'none' },
  // Paper trade CTA
  tradeCta: { background: '#0050cb', borderRadius: 16, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' },
  tradeCtaTitle: { fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 4px' },
  tradeCtaSub:   { fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0 },
  tradeBtn: { padding: '10px 20px', background: 'white', color: '#0050cb', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap' },
}
