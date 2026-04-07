import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppSidebar from '../components/AppSidebar'

function SignalBadge({ signal }) {
  if (!signal) return null
  const c = {
    BUY:  { bg: '#dcfce7', color: '#166534' },
    SELL: { bg: '#fee2e2', color: '#991b1b' },
    HOLD: { bg: '#fef9c3', color: '#854d0e' },
  }[signal] || { bg: '#f3f4f6', color: '#6b7280' }
  return (
    <span style={{ ...s.badge, background: c.bg, color: c.color }}>{signal}</span>
  )
}

function ChangeCell({ pct, abs }) {
  const pos = pct >= 0
  return (
    <span style={{ color: pos ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: 13 }}>
      {pos ? '+' : ''}{abs != null ? `$${Math.abs(abs).toFixed(2)}  ` : ''}{pos ? '+' : ''}{pct?.toFixed(2)}%
    </span>
  )
}

function IndexCard({ idx }) {
  const pos = idx.change_pct >= 0
  return (
    <div style={s.indexCard}>
      <p style={s.indexName}>{idx.name}</p>
      <p style={{ ...s.indexPrice, color: pos ? '#16a34a' : '#dc2626' }}>
        {idx.price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
      <p style={{ fontSize: 12, color: pos ? '#16a34a' : '#dc2626', margin: 0, fontWeight: 600 }}>
        {pos ? '▲' : '▼'} {Math.abs(idx.change_pct)?.toFixed(2)}%
      </p>
    </div>
  )
}

export default function Market() {
  const { apiFetch, user } = useAuth()
  const navigate = useNavigate()
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('gainers')
  const [searchQ, setSearchQ]   = useState('')
  const [results, setResults]   = useState([])
  const [searching, setSearching] = useState(false)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

  const loadMovers = useCallback(async () => {
    try {
      const d = await apiFetch('/market/movers')
      setData(d)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [apiFetch])

  useEffect(() => { loadMovers() }, [loadMovers])

  // Search debounce
  useEffect(() => {
    if (!searchQ.trim()) { setResults([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await apiFetch(`/market/search?q=${encodeURIComponent(searchQ)}`)
        setResults(r || [])
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 350)
  }, [searchQ, apiFetch])

  const tableData = activeTab === 'gainers' ? data?.gainers
                  : activeTab === 'losers'  ? data?.losers
                  : data?.actives

  return (
    <div style={s.root}>
      <AppSidebar />

      {/* ── Main ── */}
      <div style={s.main}>
        {/* Top bar with search */}
        <div style={s.topBar}>
          <div style={s.searchWrap} ref={searchRef}>
            <span style={s.searchIcon}>🔍</span>
            <input
              style={s.searchInput}
              placeholder="Search company or stock symbol..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
            {searching && <span style={s.searchSpinner}>⟳</span>}
            {results.length > 0 && searchQ && (
              <div style={s.searchDropdown}>
                {results.map(r => (
                  <div key={r.symbol} style={s.searchResult}
                    onClick={() => {
                      setSearchQ('')
                      setResults([])
                      navigate(`/stock/${r.symbol}`)
                    }}>
                    <div style={s.searchResultLeft}>
                      <span style={s.searchSym}>{r.symbol}</span>
                      <span style={s.searchName}>{r.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={s.searchExchange}>{r.exchange}</span>
                      {r.signal && <SignalBadge signal={r.signal} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={s.topBarRight}>
            <button style={s.refreshBtn} onClick={loadMovers}>↻ Refresh</button>
            <span style={s.betaChip}>🎉 Beta — Free</span>
          </div>
        </div>

        {/* ── Market Indices strip ── */}
        <div style={s.indicesRow}>
          {loading ? (
            [0,1,2,3].map(i => <div key={i} style={s.indexCardSkeleton}/>)
          ) : (
            data?.indices?.map(idx => <IndexCard key={idx.symbol} idx={idx} />)
          )}
        </div>

        {/* ── Page header ── */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>Market Movers</h1>
            <p style={s.pageSub}>
              Real-time top gainers, losers and most active stocks · AI signals highlighted
              {data?.updated && (
                <span style={s.updatedAt}> · Updated {new Date(data.updated).toLocaleTimeString()}</span>
              )}
            </p>
          </div>
        </div>

        {/* ── Quick feature cards ── */}
        <div style={s.featureCards}>
          {[
            { icon: '📈', label: 'Top Gainers',   tab: 'gainers', color: '#16a34a' },
            { icon: '📉', label: 'Top Losers',    tab: 'losers',  color: '#dc2626' },
            { icon: '🔥', label: 'Most Active',   tab: 'actives', color: '#ea580c' },
            { icon: '⚡', label: 'AI Signals',    tab: null,      color: '#0050cb', link: '/dashboard' },
            { icon: '💼', label: 'My Portfolio',  tab: null,      color: '#7c3aed', link: '/portfolio' },
            { icon: '📰', label: 'Intel Feed',    tab: null,      color: '#0891b2', link: '/intel' },
          ].map(card => (
            card.link ? (
              <Link key={card.label} to={card.link} style={s.featureCard}>
                <span style={{ ...s.featureCardIcon, color: card.color }}>{card.icon}</span>
                <span style={s.featureCardLabel}>{card.label}</span>
              </Link>
            ) : (
              <button key={card.label} style={{
                ...s.featureCard,
                ...(activeTab === card.tab ? s.featureCardActive : {}),
              }} onClick={() => setActiveTab(card.tab)}>
                <span style={{ ...s.featureCardIcon, color: card.color }}>{card.icon}</span>
                <span style={s.featureCardLabel}>{card.label}</span>
              </button>
            )
          ))}
        </div>

        {/* ── Main tables ── */}
        {loading ? (
          <div style={s.loadingBox}>
            <div style={s.spinner}/>
            <p style={{ color: '#767b93', fontSize: 14, margin: 0 }}>Fetching live market data…</p>
          </div>
        ) : (
          <div style={s.tablesGrid}>
            {/* Left: selected tab table */}
            <div style={s.tableCard}>
              <div style={s.tableCardHeader}>
                <div style={s.tableCardTitle}>
                  <span style={{
                    color: activeTab === 'gainers' ? '#16a34a' : activeTab === 'losers' ? '#dc2626' : '#ea580c',
                    fontSize: 16, marginRight: 8,
                  }}>
                    {activeTab === 'gainers' ? '▲' : activeTab === 'losers' ? '▼' : '🔥'}
                  </span>
                  {activeTab === 'gainers' ? 'Top Gainers' : activeTab === 'losers' ? 'Top Losers' : 'Most Active'}
                </div>
                <span style={s.tableCardDate}>
                  Updated {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <MoverTable rows={tableData} />
            </div>

            {/* Right: always show the opposite */}
            <div style={s.tableCard}>
              <div style={s.tableCardHeader}>
                <div style={s.tableCardTitle}>
                  <span style={{ color: activeTab === 'gainers' ? '#dc2626' : '#16a34a', fontSize: 16, marginRight: 8 }}>
                    {activeTab === 'gainers' ? '▼' : '▲'}
                  </span>
                  {activeTab === 'gainers' ? 'Top Losers' : 'Top Gainers'}
                </div>
                <span style={s.tableCardDate}>
                  Updated {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <MoverTable rows={activeTab === 'gainers' ? data?.losers : data?.gainers} />
            </div>
          </div>
        )}

        {/* ── Most Active (always shown below) ── */}
        {!loading && (
          <div style={{ ...s.tableCard, marginTop: 24 }}>
            <div style={s.tableCardHeader}>
              <div style={s.tableCardTitle}>
                <span style={{ color: '#ea580c', fontSize: 16, marginRight: 8 }}>🔥</span>
                Most Active
              </div>
            </div>
            <MoverTable rows={data?.actives} compact />
          </div>
        )}
      </div>
    </div>
  )
}

function MoverTable({ rows, compact }) {
  if (!rows?.length) return <div style={{ padding: 32, color: '#767b93', textAlign: 'center' }}>No data available</div>

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={s.table}>
        <thead>
          <tr style={s.thead}>
            <th style={s.th}>#</th>
            <th style={s.th}>Symbol</th>
            {!compact && <th style={s.th}>Name</th>}
            <th style={{ ...s.th, textAlign: 'right' }}>Price</th>
            <th style={{ ...s.th, textAlign: 'right' }}>Change</th>
            <th style={{ ...s.th, textAlign: 'right' }}>Volume</th>
            <th style={{ ...s.th, textAlign: 'center' }}>AI Signal</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.symbol} style={s.tr}>
              <td style={{ ...s.td, color: '#9ca3af', width: 32 }}>{i + 1}</td>
              <td style={s.td}>
                <Link to={`/stock/${row.symbol}`} style={{ ...s.symPill, textDecoration: 'none' }}>{row.symbol}</Link>
              </td>
              {!compact && (
                <td style={{ ...s.td, color: '#374151', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.name}
                </td>
              )}
              <td style={{ ...s.td, textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>
                ${row.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td style={{ ...s.td, textAlign: 'right' }}>
                <ChangeCell pct={row.change_pct} />
              </td>
              <td style={{ ...s.td, textAlign: 'right', color: '#6b7280', fontSize: 12 }}>
                {row.volume}
              </td>
              <td style={{ ...s.td, textAlign: 'center' }}>
                {row.signal
                  ? <SignalBadge signal={row.signal} />
                  : <span style={{ color: '#d1d5db', fontSize: 11 }}>—</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const s = {
  root: { display: 'flex', minHeight: '100vh', background: '#f8f9ff', fontFamily: 'Inter, sans-serif' },

  // Sidebar
  sidebar: { width: 220, background: '#0a1628', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 },
  sidebarLogo: { padding: '24px 16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  sideNav: { display: 'flex', flexDirection: 'column', gap: 2, padding: '16px 8px', flex: 1 },
  sideLink: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'all 0.15s' },
  sideLinkActive: { background: 'rgba(0,80,203,0.25)', color: 'white', fontWeight: 600, borderLeft: '3px solid #0050cb' },
  sideLinkIcon: { fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 },
  sidebarBottom: { padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.07)' },
  userChip: { display: 'flex', alignItems: 'center', gap: 10 },
  userAvatar: { width: 32, height: 32, borderRadius: '50%', background: '#0050cb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  userName: { fontSize: 12, fontWeight: 600, color: 'white', margin: 0 },
  userPlan: { fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0 },

  // Main
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topBar: { background: 'white', borderBottom: '1px solid #eceef5', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 40 },
  searchWrap: { flex: 1, maxWidth: 520, position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 14, fontSize: 14, color: '#9ca3af', pointerEvents: 'none' },
  searchInput: { width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, border: '1.5px solid #eceef5', fontSize: 14, fontFamily: 'Inter, sans-serif', background: '#f8f9ff', outline: 'none', color: '#161b2b' },
  searchSpinner: { position: 'absolute', right: 12, color: '#9ca3af', fontSize: 16, animation: 'spin 1s linear infinite' },
  searchDropdown: { position: 'absolute', top: '110%', left: 0, right: 0, background: 'white', border: '1px solid #eceef5', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden' },
  searchResult: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', transition: 'background 0.1s' },
  searchResultLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  searchSym: { fontSize: 13, fontWeight: 700, color: '#0050cb', width: 60 },
  searchName: { fontSize: 13, color: '#374151' },
  searchExchange: { fontSize: 11, color: '#9ca3af' },
  topBarRight: { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  refreshBtn: { padding: '7px 14px', borderRadius: 8, border: '1px solid #eceef5', background: 'white', fontSize: 13, color: '#424656', cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  betaChip: { padding: '4px 12px', borderRadius: 20, background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 700 },

  // Indices
  indicesRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderBottom: '1px solid #eceef5', background: 'white' },
  indexCard: { padding: '14px 24px', borderRight: '1px solid #eceef5' },
  indexCardSkeleton: { padding: '14px 24px', height: 72, background: '#f3f4f6', borderRight: '1px solid #eceef5', animation: 'pulse 1.5s infinite' },
  indexName: { fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.05em', textTransform: 'uppercase', margin: '0 0 4px' },
  indexPrice: { fontSize: 18, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.02em', fontFamily: 'monospace' },

  // Page header
  pageHeader: { padding: '28px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  pageTitle: { fontSize: 26, fontWeight: 800, color: '#161b2b', margin: '0 0 6px', letterSpacing: '-0.03em' },
  pageSub: { fontSize: 13, color: '#767b93', margin: 0 },
  updatedAt: { color: '#9ca3af' },

  // Feature cards
  featureCards: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, padding: '20px 32px' },
  featureCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 8px', background: 'white', borderRadius: 12, border: '1px solid #eceef5', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif' },
  featureCardActive: { border: '2px solid #0050cb', background: '#f0f6ff' },
  featureCardIcon: { fontSize: 22 },
  featureCardLabel: { fontSize: 11, fontWeight: 600, color: '#424656', textAlign: 'center', letterSpacing: '0.01em' },

  // Tables
  tablesGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: '0 32px' },
  tableCard: { background: 'white', borderRadius: 12, border: '1px solid #eceef5', overflow: 'hidden' },
  tableCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' },
  tableCardTitle: { fontSize: 15, fontWeight: 700, color: '#161b2b', display: 'flex', alignItems: 'center' },
  tableCardDate: { fontSize: 11, color: '#9ca3af' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8f9ff' },
  th: { padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f9fafb', transition: 'background 0.1s' },
  td: { padding: '13px 16px', fontSize: 13, color: '#161b2b' },
  symPill: { fontWeight: 700, color: '#0050cb', fontSize: 13 },
  badge: { display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' },

  // Loading
  loadingBox: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 80 },
  spinner: { width: 36, height: 36, border: '3px solid #eceef5', borderTop: '3px solid #0050cb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}
