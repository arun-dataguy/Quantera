import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import UpgradeGate from '../components/UpgradeGate'

const PERIODS = [
  { value: '3mo', label: '3 Mo' },
  { value: '6mo', label: '6 Mo' },
  { value: '1y',  label: '1 Yr' },
  { value: '2y',  label: '2 Yr' },
]

function SignalBadge({ signal }) {
  const map = {
    BUY:  ['rgba(0,184,122,0.12)', '#00B87A'],
    SELL: ['rgba(242,54,69,0.12)',  '#F23645'],
    HOLD: ['rgba(245,166,35,0.12)', '#F5A623'],
  }
  const [bg, color] = map[signal] || map.HOLD
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
      background: bg, color, letterSpacing: '0.04em' }}>
      {signal}
    </span>
  )
}

function AccPill({ value }) {
  if (value == null) return <span style={{ color: '#8A94A6', fontSize: 12 }}>—</span>
  const pct = Math.round(value * 100)
  const color = pct >= 60 ? '#00B87A' : pct >= 50 ? '#F5A623' : '#F23645'
  return <span style={{ fontSize: 13, fontWeight: 700, color }}>{pct}%</span>
}

function EquityCurve({ data, finalReturn }) {
  if (!data || data.length < 2) return (
    <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#8A94A6', fontSize: 13 }}>No BUY signals in this period</span>
    </div>
  )

  const W = 560, H = 160, PL = 48, PR = 16, PT = 12, PB = 28
  const plotW = W - PL - PR
  const plotH = H - PT - PB

  const min   = Math.min(...data)
  const max   = Math.max(...data)
  const range = max - min || 0.001
  const toX   = (i) => PL + (i / (data.length - 1)) * plotW
  const toY   = (v) => PT + plotH - ((v - min) / range) * plotH

  const pts       = data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
  const areaClose = `${toX(data.length - 1)},${PT + plotH} ${PL},${PT + plotH}`
  const isPos     = finalReturn >= 0
  const lineColor = isPos ? '#00B87A' : '#F23645'
  const fillColor = isPos ? 'rgba(0,184,122,0.08)' : 'rgba(242,54,69,0.08)'

  // Baseline at equity = 1.0
  const baseY = toY(1.0)

  // Y axis labels
  const yLabels = [min, (min + max) / 2, max].map(v => ({
    y: toY(v),
    label: `${((v - 1) * 100).toFixed(1)}%`,
  }))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* Y axis labels */}
      {yLabels.map((l, i) => (
        <text key={i} x={PL - 6} y={l.y + 4} textAnchor="end"
          fontSize={9} fill="#8A94A6">{l.label}</text>
      ))}
      {/* Baseline at 1.0 */}
      {baseY >= PT && baseY <= PT + plotH && (
        <line x1={PL} y1={baseY} x2={PL + plotW} y2={baseY}
          stroke="#E4E8F0" strokeWidth={1} strokeDasharray="3,3" />
      )}
      {/* Area fill */}
      <polygon points={`${pts} ${areaClose}`} fill={fillColor} />
      {/* Line */}
      <polyline points={pts} fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" />
      {/* Start/end dots */}
      <circle cx={toX(0)} cy={toY(data[0])} r={3} fill={lineColor} />
      <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1])} r={3} fill={lineColor} />
    </svg>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={s.statCard}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#8A94A6', letterSpacing: '0.06em',
        textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || '#0A0F1E', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#8A94A6', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export default function Backtest() {
  const { apiFetch } = useAuth()

  const [period,    setPeriod]    = useState('1y')
  const [loading,   setLoading]   = useState(false)
  const [data,      setData]      = useState(null)
  const [error,     setError]     = useState(null)
  const [gated,     setGated]     = useState(false)
  const [selected,  setSelected]  = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail,    setDetail]    = useState(null)

  const runSummary = useCallback(async (p) => {
    setLoading(true)
    setError(null)
    setData(null)
    setDetail(null)
    setSelected(null)
    try {
      const res = await apiFetch(`/backtest/summary?period=${p}&market=core`)
      setData(res)
      const first = Object.keys(res.by_symbol).find(k => !res.by_symbol[k].error)
      if (first) {
        setSelected(first)
        setDetail(res.by_symbol[first])
      }
    } catch (e) {
      if (e.planGated) { setGated(true); return }
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => { runSummary('1y') }, [])

  const selectSymbol = useCallback(async (sym) => {
    setSelected(sym)
    if (data?.by_symbol?.[sym] && !data.by_symbol[sym].error) {
      setDetail(data.by_symbol[sym])
      return
    }
    setDetailLoading(true)
    try {
      const res = await apiFetch(`/backtest/run?symbol=${sym}&period=${period}`)
      setDetail(res)
    } catch (e) {
      setDetail({ error: e.message, symbol: sym })
    } finally {
      setDetailLoading(false)
    }
  }, [data, period, apiFetch])

  const summary = data?.summary
  const bySymbol = data?.by_symbol || {}
  const symbols  = Object.keys(bySymbol).filter(k => !bySymbol[k]?.error)

  return (
    <div style={s.page}>
      {/* ── Navbar ── */}
      <nav style={s.nav}>
        <div style={s.navLeft}>
          <Logo height={28} />
          <div style={s.navLinks}>
            <Link to="/dashboard" style={s.navLink}>← Dashboard</Link>
          </div>
        </div>
        <div style={s.navRight}>
          <span style={s.navTitle}>Strategy Backtest</span>
        </div>
      </nav>

      <div style={s.body}>
        {/* ── Header bar ── */}
        <div style={s.headerBar}>
          <div>
            <h1 style={s.pageTitle}>Signal Backtest</h1>
            <p style={s.pageSub}>Walk-forward technical accuracy across core 8 stocks — pure RSI/MACD/SMA,
              no sentiment (historical news unavailable)</p>
          </div>
          <div style={s.controls}>
            <div style={s.periodGroup}>
              {PERIODS.map(p => (
                <button key={p.value}
                  style={{ ...s.periodBtn, ...(period === p.value ? s.periodBtnActive : {}) }}
                  onClick={() => { setPeriod(p.value); runSummary(p.value) }}>
                  {p.label}
                </button>
              ))}
            </div>
            <button style={s.runBtn} onClick={() => runSummary(period)} disabled={loading}>
              {loading ? 'Running…' : '↺ Re-run'}
            </button>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div style={s.loadingCard}>
            <div style={s.spinner} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0F1E' }}>Running backtest…</div>
              <div style={{ fontSize: 12, color: '#8A94A6', marginTop: 4 }}>
                Fetching {period} of price history for 8 stocks. This takes ~10–15 seconds.
              </div>
            </div>
          </div>
        )}

        {/* ── Plan gate ── */}
        {gated && !loading && <UpgradeGate requiredPlan="premium" feature="the backtesting engine" />}

        {/* ── Error ── */}
        {error && !loading && !gated && (
          <div style={{ ...s.loadingCard, background: '#FFF5F5', border: '1px solid #FCA5A5' }}>
            <span style={{ fontSize: 20 }}>⚠</span>
            <div style={{ fontSize: 13, color: '#991B1B' }}>{error}</div>
          </div>
        )}

        {/* ── Results ── */}
        {!loading && data && (
          <>
            {/* Summary cards */}
            <div style={s.statsGrid}>
              <StatCard
                label="Overall Accuracy (5d)"
                value={summary?.overall_accuracy_5d != null
                  ? `${Math.round(summary.overall_accuracy_5d * 100)}%` : '—'}
                sub="BUY + SELL signals vs 5-day outcome"
                color={summary?.overall_accuracy_5d >= 0.6 ? '#00B87A' :
                       summary?.overall_accuracy_5d >= 0.5 ? '#F5A623' : '#F23645'}
              />
              <StatCard
                label="Actionable Signals"
                value={summary?.total_actionable?.toLocaleString() ?? '—'}
                sub={`of ${summary?.total_signals?.toLocaleString()} total (${period})`}
              />
              <StatCard
                label="Avg BUY Return (5d)"
                value={summary?.avg_buy_return_5d != null
                  ? `${summary.avg_buy_return_5d > 0 ? '+' : ''}${summary.avg_buy_return_5d}%` : '—'}
                sub="Average 5-day return per BUY signal"
                color={summary?.avg_buy_return_5d > 0 ? '#00B87A' : '#F23645'}
              />
              <StatCard
                label="Symbols Analyzed"
                value={`${data.symbols_run} / 8`}
                sub="Core watchlist stocks"
              />
            </div>

            {/* Main content */}
            <div style={s.mainGrid}>
              {/* Left: symbol table */}
              <div style={s.tableCard}>
                <div style={s.cardHeader}>
                  <span style={s.cardTitle}>Per-Symbol Results</span>
                  <span style={s.cardSub}>Click a row for equity curve + signal log</span>
                </div>
                <table style={s.table}>
                  <thead>
                    <tr style={{ background: '#F7F9FC' }}>
                      {['Symbol', 'Signals', 'BUY Acc', 'SELL Acc', 'Avg 5d Ret', 'Final Ret', 'Max DD'].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {symbols.map(sym => {
                      const r = bySymbol[sym]
                      return (
                        <tr key={sym}
                          style={{ ...s.tr, background: selected === sym ? '#F0F6FF' : 'white', cursor: 'pointer' }}
                          onClick={() => selectSymbol(sym)}>
                          <td style={s.td}>
                            <strong style={{ color: selected === sym ? '#0066FF' : '#0A0F1E' }}>{sym}</strong>
                          </td>
                          <td style={s.td}>
                            <span style={{ color: '#5A6478' }}>{r.actionable_signals}</span>
                          </td>
                          <td style={s.td}><AccPill value={r.buy_accuracy_5d} /></td>
                          <td style={s.td}><AccPill value={r.sell_accuracy_5d} /></td>
                          <td style={s.td}>
                            {r.avg_buy_return_5d != null
                              ? <span style={{ color: r.avg_buy_return_5d >= 0 ? '#00B87A' : '#F23645', fontWeight: 600 }}>
                                  {r.avg_buy_return_5d > 0 ? '+' : ''}{r.avg_buy_return_5d}%
                                </span>
                              : '—'}
                          </td>
                          <td style={s.td}>
                            <span style={{ color: r.final_return_pct >= 0 ? '#00B87A' : '#F23645', fontWeight: 600 }}>
                              {r.final_return_pct > 0 ? '+' : ''}{r.final_return_pct}%
                            </span>
                          </td>
                          <td style={s.td}>
                            <span style={{ color: '#F23645' }}>{r.max_drawdown_pct}%</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Right: equity curve + signal log */}
              <div style={s.rightCol}>
                {detailLoading ? (
                  <div style={s.detailPlaceholder}><div style={s.spinner} /></div>
                ) : detail && !detail.error ? (
                  <>
                    {/* Equity curve */}
                    <div style={s.curveCard}>
                      <div style={s.cardHeader}>
                        <div>
                          <span style={s.cardTitle}>{detail.symbol} — BUY Signal Equity Curve</span>
                          <div style={{ fontSize: 11, color: '#8A94A6', marginTop: 2 }}>
                            Cumulative return following every BUY signal at 5-day exit
                          </div>
                        </div>
                        <span style={{
                          fontSize: 18, fontWeight: 700,
                          color: detail.final_return_pct >= 0 ? '#00B87A' : '#F23645',
                        }}>
                          {detail.final_return_pct > 0 ? '+' : ''}{detail.final_return_pct}%
                        </span>
                      </div>
                      <div style={{ padding: '8px 12px 12px' }}>
                        <EquityCurve data={detail.equity_curve} finalReturn={detail.final_return_pct} />
                      </div>
                      <div style={s.curveStats}>
                        <div style={s.curveStat}>
                          <span style={s.curveStatLabel}>BUY Acc 5d</span>
                          <AccPill value={detail.buy_accuracy_5d} />
                        </div>
                        <div style={s.curveStat}>
                          <span style={s.curveStatLabel}>SELL Acc 5d</span>
                          <AccPill value={detail.sell_accuracy_5d} />
                        </div>
                        <div style={s.curveStat}>
                          <span style={s.curveStatLabel}>Max Drawdown</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#F23645' }}>
                            {detail.max_drawdown_pct}%
                          </span>
                        </div>
                        <div style={s.curveStat}>
                          <span style={s.curveStatLabel}>Total Signals</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0A0F1E' }}>
                            {detail.total_signals}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Signal log */}
                    <div style={s.logCard}>
                      <div style={s.cardHeader}>
                        <span style={s.cardTitle}>Recent Signal Log</span>
                        <span style={s.cardSub}>Last {detail.recent_signals?.length} actionable signals</span>
                      </div>
                      <div style={{ overflowY: 'auto', maxHeight: 260 }}>
                        <table style={s.table}>
                          <thead>
                            <tr style={{ background: '#F7F9FC' }}>
                              {['Date', 'Signal', 'Price', '1d', '5d', '10d', 'Result'].map(h => (
                                <th key={h} style={s.th}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[...(detail.recent_signals || [])].reverse().map((sig, i) => (
                              <tr key={i} style={s.tr}>
                                <td style={s.td}>
                                  <span style={{ fontSize: 11, color: '#5A6478' }}>{sig.date}</span>
                                </td>
                                <td style={s.td}><SignalBadge signal={sig.signal} /></td>
                                <td style={s.td}>
                                  <span style={{ fontWeight: 500 }}>${sig.price}</span>
                                </td>
                                <td style={s.td}>
                                  <span style={{ color: sig.return_1d >= 0 ? '#00B87A' : '#F23645', fontSize: 12 }}>
                                    {(sig.return_1d * 100).toFixed(1)}%
                                  </span>
                                </td>
                                <td style={s.td}>
                                  <span style={{ color: sig.return_5d >= 0 ? '#00B87A' : '#F23645', fontSize: 12, fontWeight: 600 }}>
                                    {(sig.return_5d * 100).toFixed(1)}%
                                  </span>
                                </td>
                                <td style={s.td}>
                                  <span style={{ color: sig.return_10d >= 0 ? '#00B87A' : '#F23645', fontSize: 12 }}>
                                    {(sig.return_10d * 100).toFixed(1)}%
                                  </span>
                                </td>
                                <td style={s.td}>
                                  <span style={{ fontSize: 14 }}>
                                    {sig.correct_5d === true ? '✓' : sig.correct_5d === false ? '✗' : '—'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={s.detailPlaceholder}>
                    <span style={{ fontSize: 13, color: '#8A94A6' }}>
                      {detail?.error ?? 'Select a symbol to view its equity curve and signal log'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Disclaimer */}
            <div style={s.disclaimer}>
              <strong>Methodology:</strong> Walk-forward backtest using 60-day rolling windows. Signals generated
              daily with RSI(14) + MACD(12/26) + SMA(20). Accuracy measured at 5-day forward return. Sentiment
              excluded (NewsAPI is real-time only). Past signal performance does not guarantee future results.
              Not financial advice.
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

const s = {
  page:    { minHeight: '100vh', background: '#F7F9FC', fontFamily: 'DM Sans, sans-serif' },
  nav:     { background: 'white', borderBottom: '1px solid #E4E8F0', padding: '0 24px', height: 52,
             display: 'flex', alignItems: 'center', justifyContent: 'space-between',
             position: 'sticky', top: 0, zIndex: 100 },
  navLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  navLinks:{ display: 'flex', gap: 16 },
  navLink: { fontSize: 13, color: '#5A6478', textDecoration: 'none', fontWeight: 500 },
  navRight:{ display: 'flex', alignItems: 'center' },
  navTitle:{ fontSize: 14, fontWeight: 600, color: '#0A0F1E' },

  body: { padding: '24px', maxWidth: 1400, margin: '0 auto' },

  headerBar: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
               gap: 16, marginBottom: 24, flexWrap: 'wrap' },
  pageTitle: { fontSize: 22, fontWeight: 700, color: '#0A0F1E', margin: 0 },
  pageSub:   { fontSize: 12, color: '#8A94A6', marginTop: 4, maxWidth: 520 },

  controls:     { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  periodGroup:  { display: 'flex', background: '#F7F9FC', borderRadius: 8,
                  border: '1px solid #E4E8F0', padding: 3, gap: 2 },
  periodBtn:    { padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: 12,
                  fontWeight: 500, color: '#5A6478', cursor: 'pointer', background: 'transparent',
                  fontFamily: 'DM Sans, sans-serif' },
  periodBtnActive: { background: 'white', color: '#0066FF', fontWeight: 600,
                     boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  runBtn: { padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0066FF',
            color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif' },

  loadingCard: { display: 'flex', alignItems: 'center', gap: 16, padding: '24px',
                 background: 'white', borderRadius: 12, border: '1px solid #E4E8F0',
                 marginBottom: 24 },
  spinner: { width: 20, height: 20, border: '2.5px solid #E4E8F0',
             borderTopColor: '#0066FF', borderRadius: '50%', flexShrink: 0,
             animation: 'spin 0.7s linear infinite' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 },
  statCard:  { background: 'white', borderRadius: 12, border: '1px solid #E4E8F0', padding: '20px 24px' },

  mainGrid:  { display: 'grid', gridTemplateColumns: '1fr 440px', gap: 16, marginBottom: 20 },

  tableCard: { background: 'white', borderRadius: 12, border: '1px solid #E4E8F0', overflow: 'hidden' },
  cardHeader:{ padding: '14px 20px', borderBottom: '1px solid #E4E8F0',
               display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#0A0F1E' },
  cardSub:   { fontSize: 11, color: '#8A94A6' },

  table: { width: '100%', borderCollapse: 'collapse' },
  th:    { padding: '9px 16px', fontSize: 10, fontWeight: 600, color: '#8A94A6',
           textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left',
           borderBottom: '1px solid #E4E8F0' },
  tr:    { borderBottom: '1px solid #F0F2F5' },
  td:    { padding: '12px 16px', fontSize: 13, color: '#0A0F1E' },

  rightCol: { display: 'flex', flexDirection: 'column', gap: 16 },

  curveCard: { background: 'white', borderRadius: 12, border: '1px solid #E4E8F0', overflow: 'hidden' },
  curveStats:{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0,
               borderTop: '1px solid #F0F2F5' },
  curveStat: { padding: '10px 14px', borderRight: '1px solid #F0F2F5',
               display: 'flex', flexDirection: 'column', gap: 4 },
  curveStatLabel: { fontSize: 9, fontWeight: 600, color: '#8A94A6',
                    textTransform: 'uppercase', letterSpacing: '0.06em' },

  logCard:  { background: 'white', borderRadius: 12, border: '1px solid #E4E8F0',
              overflow: 'hidden', flex: 1 },

  detailPlaceholder: { background: 'white', borderRadius: 12, border: '1px solid #E4E8F0',
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 40, minHeight: 200 },

  disclaimer: { fontSize: 11, color: '#8A94A6', lineHeight: 1.7, padding: '16px 20px',
                background: 'white', borderRadius: 12, border: '1px solid #E4E8F0' },
}
