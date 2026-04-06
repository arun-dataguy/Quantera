import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppSidebar from '../components/AppSidebar'

const STARTING_BALANCE = 10000

export default function Portfolio() {
  const { apiFetch, user } = useAuth()
  const [portfolio, setPortfolio] = useState(null)
  const [trades, setTrades]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [tradeLoading, setTradeLoading] = useState(null)
  const [resetting, setResetting] = useState(false)
  const [error, setError]         = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  const loadPortfolio = useCallback(async () => {
    try {
      const [port, tradeList] = await Promise.all([
        apiFetch('/wallet/portfolio'),
        apiFetch('/wallet/trades'),
      ])
      setPortfolio(port)
      setTrades(tradeList)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => { loadPortfolio() }, [loadPortfolio])

  const handleSell = async (ticker) => {
    const pos = portfolio?.positions?.find(p => p.ticker === ticker)
    setTradeLoading(ticker)
    try {
      await apiFetch('/wallet/trade', {
        method: 'POST',
        body: JSON.stringify({
          ticker,
          action: 'SELL',
          price: pos?.current_price || pos?.avg_price,  // pass known price so yfinance isn't needed
        }),
      })
      await loadPortfolio()
    } catch (e) { alert(e.message) }
    finally { setTradeLoading(null) }
  }

  const handleReset = async () => {
    if (!window.confirm('Reset portfolio to $10,000? All positions and trades will be wiped.')) return
    setResetting(true)
    try {
      await apiFetch('/wallet/reset', { method: 'POST' })
      await loadPortfolio()
    } catch (e) { alert(e.message) }
    finally { setResetting(false) }
  }

  const pnlColor = (v) => v > 0 ? '#00b87c' : v < 0 ? '#e53935' : '#424656'
  const pnlSign  = (v) => v > 0 ? '+' : ''

  return (
    <div style={s.root}>
      <AppSidebar />

      {/* Main content */}
      <main style={s.main}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Paper Trading Portfolio</h1>
            <p style={s.subtitle}>Virtual $10,000 — for research purposes only. Not real money.</p>
          </div>
          <button style={s.resetBtn} onClick={handleReset} disabled={resetting}>
            {resetting ? 'Resetting…' : 'Reset Portfolio'}
          </button>
        </div>

        {/* Disclaimer */}
        <div style={s.legalBanner}>
          <span style={s.legalIcon}>⚠️</span>
          <span style={s.legalText}>
            Paper trading only. This portfolio uses virtual money for educational and research purposes. No real funds are involved. Not financial advice.
          </span>
        </div>

        {loading ? (
          <div style={s.loading}>Loading portfolio…</div>
        ) : error ? (
          <div style={s.errorBox}>{error}</div>
        ) : portfolio ? (
          <>
            {/* Stat cards */}
            <div style={s.statsGrid}>
              <StatCard
                label="Total Portfolio Value"
                value={`$${portfolio.total_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                sub={`Started at $${STARTING_BALANCE.toLocaleString()}`}
                highlight
              />
              <StatCard
                label="Cash Available"
                value={`$${portfolio.cash_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                sub="Available to trade"
              />
              <StatCard
                label="Invested Value"
                value={`$${portfolio.invested_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                sub={`${portfolio.positions.length} position${portfolio.positions.length !== 1 ? 's' : ''}`}
              />
              <StatCard
                label="Total P&L"
                value={`${pnlSign(portfolio.total_pnl)}$${Math.abs(portfolio.total_pnl).toFixed(2)}`}
                sub={`${pnlSign(portfolio.total_pnl_pct)}${portfolio.total_pnl_pct.toFixed(2)}%`}
                valueColor={pnlColor(portfolio.total_pnl)}
              />
            </div>

            {/* Tabs */}
            <div style={s.tabs}>
              {['overview', 'history'].map(tab => (
                <button
                  key={tab}
                  style={{ ...s.tab, ...(activeTab === tab ? s.tabActive : {}) }}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'overview' ? 'Open Positions' : 'Trade History'}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <>
                {portfolio.positions.length === 0 ? (
                  <div style={s.emptyState}>
                    <div style={s.emptyIcon}>📊</div>
                    <p style={s.emptyTitle}>No open positions</p>
                    <p style={s.emptyText}>Go to the Dashboard and click "Paper Trade" on any signal to start building your virtual portfolio.</p>
                    <Link to="/dashboard" style={s.emptyBtn}>Go to Dashboard</Link>
                  </div>
                ) : (
                  <table style={s.table}>
                    <thead>
                      <tr>
                        {['Ticker', 'Qty', 'Avg Price', 'Current', 'Market Value', 'Unrealised P&L', 'Action'].map(h => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.positions.map(pos => (
                        <tr key={pos.ticker} style={s.tr}>
                          <td style={{ ...s.td, fontWeight: 700, color: '#161b2b' }}>{pos.ticker}</td>
                          <td style={s.td}>{pos.quantity}</td>
                          <td style={s.td}>${pos.avg_price.toFixed(4)}</td>
                          <td style={s.td}>${pos.current_price.toFixed(4)}</td>
                          <td style={{ ...s.td, fontWeight: 600 }}>${pos.market_value.toFixed(2)}</td>
                          <td style={{ ...s.td, color: pnlColor(pos.unrealized_pnl), fontWeight: 600 }}>
                            {pnlSign(pos.unrealized_pnl)}${Math.abs(pos.unrealized_pnl).toFixed(2)}
                            <span style={{ fontSize: 11, opacity: 0.8, marginLeft: 4 }}>
                              ({pnlSign(pos.pct_change)}{pos.pct_change.toFixed(1)}%)
                            </span>
                          </td>
                          <td style={s.td}>
                            <button
                              style={s.sellBtn}
                              onClick={() => handleSell(pos.ticker)}
                              disabled={tradeLoading === pos.ticker}
                            >
                              {tradeLoading === pos.ticker ? '…' : 'Sell All'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {activeTab === 'history' && (
              <>
                {trades.length === 0 ? (
                  <div style={s.emptyState}>
                    <div style={s.emptyIcon}>📋</div>
                    <p style={s.emptyTitle}>No trades yet</p>
                    <p style={s.emptyText}>Your executed paper trades will appear here.</p>
                  </div>
                ) : (
                  <table style={s.table}>
                    <thead>
                      <tr>
                        {['Date', 'Ticker', 'Action', 'Qty', 'Price', 'Total', 'Signal Conf.'].map(h => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map(t => (
                        <tr key={t.id} style={s.tr}>
                          <td style={{ ...s.td, fontSize: 12, color: '#767b93' }}>
                            {t.executed_at ? new Date(t.executed_at).toLocaleString() : '—'}
                          </td>
                          <td style={{ ...s.td, fontWeight: 700, color: '#161b2b' }}>{t.ticker}</td>
                          <td style={s.td}>
                            <span style={{
                              ...s.badge,
                              background: t.action === 'BUY' ? '#dcfce7' : '#fee2e2',
                              color: t.action === 'BUY' ? '#166534' : '#991b1b',
                            }}>{t.action}</span>
                          </td>
                          <td style={s.td}>{t.quantity}</td>
                          <td style={s.td}>${t.price.toFixed(4)}</td>
                          <td style={{ ...s.td, fontWeight: 600 }}>${t.total_value.toFixed(2)}</td>
                          <td style={s.td}>
                            {t.signal_confidence != null ? (
                              <span style={{
                                ...s.badge,
                                background: t.signal_confidence >= 75 ? '#dbeafe' : '#f3f4f6',
                                color: t.signal_confidence >= 75 ? '#1d4ed8' : '#6b7280',
                              }}>
                                {t.signal_confidence.toFixed(1)}%
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </>
        ) : null}
      </main>
    </div>
  )
}

function StatCard({ label, value, sub, highlight, valueColor }) {
  return (
    <div style={{ ...s.statCard, ...(highlight ? s.statCardHighlight : {}) }}>
      <p style={s.statLabel}>{label}</p>
      <p style={{ ...s.statValue, color: valueColor || (highlight ? '#0050cb' : '#161b2b') }}>{value}</p>
      {sub && <p style={s.statSub}>{sub}</p>}
    </div>
  )
}

const s = {
  root: {
    display: 'flex', minHeight: '100vh', background: '#f8f9ff',
    fontFamily: 'Inter, sans-serif',
  },
  sidebar: {
    width: 220, background: '#161b2b', display: 'flex', flexDirection: 'column',
    padding: '28px 0', flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
  },
  brand: {
    fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: '-0.04em',
    padding: '0 24px 32px',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  navLink: {
    display: 'block', padding: '10px 24px', fontSize: 14, fontWeight: 500,
    color: 'rgba(255,255,255,0.55)', textDecoration: 'none', borderRadius: '0 8px 8px 0',
    marginRight: 8, transition: 'all 0.15s',
  },
  navLinkActive: {
    color: 'white', background: 'rgba(0,80,203,0.3)', fontWeight: 600,
    borderLeft: '3px solid #0050cb',
  },
  sidebarFooter: { padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' },
  userEmail: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, wordBreak: 'break-all' },
  planBadge: {
    display: 'inline-block', padding: '2px 8px', borderRadius: 4,
    background: 'rgba(0,80,203,0.3)', color: '#7cacff', fontSize: 10, fontWeight: 700,
  },
  main: { flex: 1, padding: '40px 48px', overflowY: 'auto' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: 800, color: '#161b2b', margin: '0 0 4px', letterSpacing: '-0.03em' },
  subtitle: { fontSize: 13, color: '#767b93', margin: 0 },
  resetBtn: {
    padding: '10px 20px', borderRadius: 8, border: '1.5px solid #e0e3f0',
    background: 'white', color: '#e53935', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  },
  legalBanner: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
    background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, marginBottom: 32,
  },
  legalIcon: { fontSize: 16, flexShrink: 0 },
  legalText: { fontSize: 12, color: '#92400e', lineHeight: 1.5 },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32,
  },
  statCard: {
    background: 'white', borderRadius: 12, padding: '20px 24px',
    border: '1px solid #eceef5',
  },
  statCardHighlight: {
    border: '2px solid #0050cb', boxShadow: '0 4px 16px rgba(0,80,203,0.08)',
  },
  statLabel: { fontSize: 11, fontWeight: 600, color: '#767b93', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' },
  statValue: { fontSize: 26, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.02em' },
  statSub: { fontSize: 12, color: '#767b93', margin: 0 },
  tabs: { display: 'flex', gap: 4, marginBottom: 16, background: '#f0f2fa', padding: 4, borderRadius: 10, width: 'fit-content' },
  tab: {
    padding: '8px 20px', borderRadius: 8, border: 'none', background: 'transparent',
    color: '#424656', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  },
  tabActive: { background: 'white', color: '#0050cb', fontWeight: 700, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #eceef5' },
  th: { padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#767b93', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'left', background: '#f8f9ff', borderBottom: '1px solid #eceef5' },
  tr: { borderBottom: '1px solid #f0f2fa' },
  td: { padding: '14px 16px', fontSize: 13, color: '#424656' },
  sellBtn: {
    padding: '6px 14px', borderRadius: 6, border: 'none',
    background: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  },
  badge: { display: 'inline-block', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 },
  loading: { padding: 80, textAlign: 'center', color: '#767b93', fontSize: 15 },
  errorBox: { padding: 20, background: '#fee2e2', borderRadius: 8, color: '#991b1b', fontSize: 13 },
  emptyState: { textAlign: 'center', padding: '80px 40px' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#161b2b', margin: '0 0 8px' },
  emptyText: { fontSize: 14, color: '#767b93', margin: '0 0 24px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' },
  emptyBtn: {
    display: 'inline-block', padding: '12px 28px', borderRadius: 8,
    background: 'linear-gradient(135deg, #0050cb, #0066ff)', color: 'white',
    fontSize: 14, fontWeight: 600, textDecoration: 'none',
  },
}
