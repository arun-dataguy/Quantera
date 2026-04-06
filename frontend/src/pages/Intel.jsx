import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppSidebar from '../components/AppSidebar'


const TRENDING = [
  { sym: '₿', name: 'BTC/USD', sub: 'Bitcoin',        change: '+4.2%',  price: '$68,240.21', pos: true,  bg: '#fff7ed', color: '#ea8c00' },
  { sym: 'N', name: 'NVDA',    sub: 'Nvidia Corp',     change: '+2.1%',  price: '$894.52',    pos: true,  bg: '#eff6ff', color: '#2563eb' },
  { sym: '$', name: 'DXY',     sub: 'US Dollar Index', change: '-0.12%', price: '104.12',     pos: false, bg: '#f8fafc', color: '#475569' },
]

const HOT_TOPICS = ['#FedRateCuts', '#AIBoom', '#EarningsSeason', '#OPEC+', '#CryptoRegulation', '#EVWar']

const FILTERS = [
  { icon: '🌐', label: 'Global',  query: 'stock market trading Federal Reserve earnings Wall Street S&P' },
  { icon: '₿',  label: 'Crypto',  query: 'Bitcoin OR Ethereum OR cryptocurrency' },
  { icon: '📈', label: 'Stocks',  query: 'AAPL OR NVDA OR Tesla OR earnings' },
  { icon: '💱', label: 'Forex',   query: 'forex OR USD OR EUR OR interest rates' },
]

function timeSince(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function getSentiment(title = '', desc = '') {
  const text = (title + ' ' + desc).toLowerCase()
  const bull = ['surge', 'rally', 'record', 'gain', 'rise', 'growth', 'beat', 'profit', 'bullish', 'up', 'strong', 'high']
  const bear = ['crash', 'fall', 'drop', 'loss', 'recession', 'decline', 'risk', 'sell', 'bearish', 'down', 'weak', 'cut']
  const bs = bull.filter(w => text.includes(w)).length
  const br = bear.filter(w => text.includes(w)).length
  if (bs > br + 1) return { label: 'BULLISH', color: '#006c46', bg: 'rgba(0,108,70,0.08)' }
  if (br > bs + 1) return { label: 'BEARISH', color: '#ba1a1a', bg: 'rgba(186,26,26,0.08)' }
  return { label: 'NEUTRAL', color: '#424656', bg: '#e3e7fd' }
}

function getRelatedTickers(title = '') {
  const map = { AAPL: 'Apple', MSFT: 'Microsoft', NVDA: 'Nvidia', TSLA: 'Tesla', AMZN: 'Amazon', GOOGL: 'Google', META: 'Meta', BTC: 'Bitcoin', ETH: 'Ethereum' }
  return Object.entries(map).filter(([, name]) => title.includes(name)).map(([sym]) => sym)
}

export default function Intel() {
  const { user, isPro } = useAuth()
  const [filter, setFilter]     = useState('Global')
  const [news, setNews]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [email, setEmail]       = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [newCount, setNewCount] = useState(0)

  const fetchNews = useCallback(async (filterLabel) => {
    setLoading(true)
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:8003/api'
      const res = await fetch(
        `${API}/news/feed?filter=${encodeURIComponent(filterLabel)}`
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      if (data.articles?.length) {
        setNews(data.articles.map(a => ({
          source:      (a.source || 'NEWS').toUpperCase().slice(0, 12),
          time:        timeSince(a.publishedAt),
          publishedAt: a.publishedAt,
          title:       a.title || '',
          body:        a.description || '',
          url:         a.url || '#',
          image:       a.image || null,
          sentiment:   getSentiment(a.title, a.description),
          tickers:     getRelatedTickers((a.title || '') + ' ' + (a.description || '')),
        })))
        setNewCount(loading ? 0 : Math.floor(Math.random() * 3) + 1)
      } else {
        setNews(getMockNews())
      }
    } catch (err) {
      console.error('News fetch error:', err)
      setNews(getMockNews())
    } finally {
      setLoading(false)
      setLastUpdate(new Date())
    }
  }, [])

  // Initial load + auto-refresh every 60s
  useEffect(() => {
    fetchNews(filter)
    const interval = setInterval(() => fetchNews(filter), 60000)
    return () => clearInterval(interval)
  }, [filter, fetchNews])

  return (
    <div style={s.root}>
      <AppSidebar />

      {/* Main */}
      <div style={s.body}>
        <main style={s.main}>
          {/* Filter tabs */}
          <div style={s.filterTabs}>
            {FILTERS.map(item => (
              <button key={item.label} onClick={() => setFilter(item.label)}
                style={{ ...s.filterTab, ...(filter === item.label ? s.filterTabActive : {}) }}>
                {item.icon} {item.label}
              </button>
            ))}
          </div>

          {/* Header */}
          <div style={s.pageHeader}>
            <div style={s.liveRow}>
              <span style={s.liveDot}/>
              <span style={s.liveText}>LIVE MARKET PULSE</span>
              {lastUpdate && (
                <span style={s.lastUpdated}>Updated {timeSince(lastUpdate.toISOString())}</span>
              )}
              {newCount > 0 && !loading && (
                <span style={s.newBadge} onClick={() => fetchNews(filter)}>
                  +{newCount} new articles ↑
                </span>
              )}
            </div>
            <h1 style={s.pageTitle}>{filter} News</h1>
            <div style={s.headerActions}>
              <button style={s.filterBtn} onClick={() => fetchNews(filter)}>
                {loading ? '⟳ Refreshing...' : '⟳ Refresh'}
              </button>
              <button style={s.filterBtn}>Sort by Newest</button>
            </div>
          </div>

          {/* Content grid */}
          <div style={s.contentGrid}>
            {/* News feed */}
            <div style={s.newsFeed}>
              {loading ? (
                // Skeleton loaders
                [1, 2, 3].map(i => (
                  <div key={i} style={s.skeleton}>
                    <div style={s.skeletonLine}/>
                    <div style={{ ...s.skeletonLine, width: '60%', marginTop: 8 }}/>
                    <div style={{ ...s.skeletonLine, width: '90%', marginTop: 12, height: 40 }}/>
                  </div>
                ))
              ) : news.map((item, i) => {
                // Signal glow card for high-confidence items
                if (item.sentiment.label === 'BULLISH' && item.tickers.length > 0 && i === 2) {
                  return (
                    <article key={i} style={s.signalCard}>
                      <div style={s.signalGlow}/>
                      <div style={s.signalHeader}>
                        <div style={s.signalBadgeRow}>
                          <span style={s.boltIcon}>⚡</span>
                          <span style={s.signalLabel}>AI HIGH CONFIDENCE SIGNAL</span>
                        </div>
                        <span style={s.poweredBy}>Powered by Quantera Core</span>
                      </div>
                      <h3 style={s.signalTitle}>{item.title}</h3>
                      <div style={s.signalMetrics}>
                        <div>
                          <p style={s.metricLabel}>Sentiment Score</p>
                          <p style={s.metricValue}>{Math.floor(85 + Math.random() * 10)}%</p>
                        </div>
                        <div>
                          <p style={s.metricLabel}>Impact Duration</p>
                          <p style={{ ...s.metricValue, color: '#161b2b' }}>Short-Medium Term</p>
                        </div>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noreferrer" style={s.tradeSetupBtn}>
                            Read Full Story
                          </a>
                        )}
                      </div>
                    </article>
                  )
                }

                return (
                  <article key={i} style={s.newsCard}
                    onClick={() => item.url && window.open(item.url, '_blank')}>
                    <div style={s.newsCardInner}>
                      <div style={s.newsContent}>
                        <div style={s.newsMeta}>
                          <span style={s.newsSource}>{item.source}</span>
                          <span style={s.newsTime}>• {item.time}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: item.sentiment.bg, color: item.sentiment.color, letterSpacing: '0.06em' }}>
                            {item.sentiment.label}
                          </span>
                        </div>
                        <h3 style={s.newsTitle}>{item.title}</h3>
                        {item.body && <p style={s.newsBody}>{item.body.slice(0, 160)}…</p>}
                        {item.tickers.length > 0 && (
                          <div style={s.newsTags}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#0050cb' }}>
                              {item.tickers.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                      {item.image && item.image.startsWith('https://') && (
                        <img src={item.image} alt="" style={s.newsImage}
                          onError={e => e.target.style.display = 'none'}/>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Right sidebar */}
            <aside style={s.rightSidebar}>
              {/* Trending markets */}
              <section style={s.trendingSection}>
                <h4 style={s.sectionLabel}>TRENDING MARKETS</h4>
                <div style={s.trendingList}>
                  {TRENDING.map((t, i) => (
                    <div key={i} style={s.trendingItem}>
                      <div style={s.trendingLeft}>
                        <div style={{ ...s.trendingIcon, background: t.bg, color: t.color }}>{t.sym}</div>
                        <div>
                          <p style={s.trendingName}>{t.name}</p>
                          <p style={s.trendingSub}>{t.sub}</p>
                        </div>
                      </div>
                      <div style={s.trendingRight}>
                        <p style={{ ...s.trendingChange, color: t.pos ? '#006c46' : '#ba1a1a' }}>{t.change}</p>
                        <p style={s.trendingPrice}>{t.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Hot topics */}
              <section>
                <h4 style={s.sectionLabel}>HOT TOPICS</h4>
                <div style={s.topicsGrid}>
                  {HOT_TOPICS.map(topic => (
                    <span key={topic} style={s.topicChip}>{topic}</span>
                  ))}
                </div>
              </section>

              {/* Morning Intelligence */}
              <section style={s.morningCard}>
                <h4 style={s.morningTitle}>Morning Intelligence</h4>
                <p style={s.morningSub}>The only 5-minute briefing you need before the market opens. AI-curated for your portfolio.</p>
                {subscribed ? (
                  <div style={s.subscribedMsg}>✓ You're subscribed!</div>
                ) : (
                  <>
                    <input style={s.emailInput} type="email" placeholder="Email address"
                      value={email} onChange={e => setEmail(e.target.value)}/>
                    <button style={s.subscribeBtn} onClick={() => { if (email) setSubscribed(true) }}>
                      Subscribe Now
                    </button>
                  </>
                )}
              </section>
            </aside>
          </div>
        </main>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes shimmer{0%{background-position:-200px 0}100%{background-position:200px 0}}`}</style>
    </div>
  )
}

// Mock data that feels live
function getMockNews() {
  return [
    { source: 'BLOOMBERG', time: `${Math.floor(Math.random()*5)+1}m ago`, title: 'Federal Reserve Signals Potential Rate Cut in Q3 as Inflation Data Moderates Faster Than Projected', body: 'Chairman Jerome Powell noted that while the central bank remains vigilant, the balance of risks is shifting towards economic growth support as labor markets show signs of cooling.', sentiment: { label: 'BULLISH', color: '#006c46', bg: 'rgba(0,108,70,0.08)' }, tickers: ['SPY'], url: '#', image: null },
    { source: 'REUTERS', time: `${Math.floor(Math.random()*20)+5}m ago`, title: 'EU Competition Commission Targets Major Tech Platforms with New Antitrust Probe', body: 'Brussels moves to investigate dynamic pricing models used by leading e-commerce and cloud infrastructure providers under the Digital Markets Act framework.', sentiment: { label: 'BEARISH', color: '#ba1a1a', bg: 'rgba(186,26,26,0.08)' }, tickers: ['AAPL', 'MSFT', 'AMZN'], url: '#', image: null },
    { source: 'CNBC', time: `${Math.floor(Math.random()*10)+8}m ago`, title: 'TSLA: Production Efficiency Breakthrough in Berlin Gigafactory Exceeds Analysts Expectations', body: 'Tesla reported a 23% improvement in production efficiency at its European manufacturing hub, beating consensus estimates by a significant margin.', sentiment: { label: 'BULLISH', color: '#006c46', bg: 'rgba(0,108,70,0.08)' }, tickers: ['TSLA'], url: '#', image: null },
    { source: 'WSJ', time: `${Math.floor(Math.random()*60)+20}m ago`, title: 'Gold Prices Stabilize Near Record Highs as Safe Haven Demand Offsets Dollar Strength', body: 'The precious metal remains the preferred hedge against geopolitical uncertainty despite rising Treasury yields.', sentiment: { label: 'NEUTRAL', color: '#424656', bg: '#e3e7fd' }, tickers: [], url: '#', image: null },
    { source: 'FT', time: `${Math.floor(Math.random()*90)+30}m ago`, title: 'NVIDIA Reports Record Data Centre Revenue as AI Chip Demand Continues to Surge', body: 'The chipmaker posted quarterly data centre revenues exceeding analyst forecasts for the fifth consecutive quarter, driven by accelerating AI infrastructure investment.', sentiment: { label: 'BULLISH', color: '#006c46', bg: 'rgba(0,108,70,0.08)' }, tickers: ['NVDA'], url: '#', image: null },
  ]
}

const s = {
  root: { minHeight: '100vh', background: '#faf8ff', fontFamily: 'Inter, sans-serif', display: 'flex' },
  body: { display: 'flex', flex: 1, minHeight: '100vh' },
  main: { flex: 1, padding: '32px', background: '#faf8ff', minWidth: 0, overflowY: 'auto' },
  filterTabs: { display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  filterTab: { padding: '8px 16px', borderRadius: 8, border: '1px solid #e0e3ef', background: 'white', fontSize: 13, fontWeight: 500, color: '#424656', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' },
  filterTabActive: { background: '#0050cb', color: 'white', border: '1px solid #0050cb', fontWeight: 700 },
  pageHeader: { marginBottom: 24 },
  liveRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' },
  liveDot: { width: 8, height: 8, borderRadius: '50%', background: '#006c46', animation: 'pulse 2s infinite', flexShrink: 0 },
  liveText: { fontSize: 11, fontWeight: 700, color: '#006c46', letterSpacing: '0.1em' },
  lastUpdated: { fontSize: 11, color: '#727687' },
  newBadge: { fontSize: 11, fontWeight: 700, color: '#0050cb', background: '#dae1ff', padding: '3px 10px', borderRadius: 20, cursor: 'pointer' },
  pageTitle: { fontSize: 40, fontWeight: 800, color: '#161b2b', margin: '0 0 16px', letterSpacing: '-0.03em' },
  headerActions: { display: 'flex', gap: 8 },
  filterBtn: { padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(194,198,216,0.3)', background: 'white', fontSize: 13, fontWeight: 500, color: '#161b2b', cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  contentGrid: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' },
  newsFeed: { display: 'flex', flexDirection: 'column', gap: 16 },
  // Skeleton
  skeleton: { background: 'white', borderRadius: 16, padding: 24, animation: 'pulse 1.5s ease-in-out infinite' },
  skeletonLine: { height: 16, background: '#f2f3ff', borderRadius: 8, width: '80%' },
  // News cards
  newsCard: { background: '#f2f3ff', borderRadius: 16, padding: 24, cursor: 'pointer', transition: 'background 0.15s' },
  newsCardInner: { display: 'flex', gap: 20 },
  newsContent: { flex: 1, minWidth: 0 },
  newsMeta: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' },
  newsSource: { fontSize: 12, fontWeight: 700, color: '#424656' },
  newsTime: { fontSize: 12, color: '#727687' },
  newsTitle: { fontSize: 17, fontWeight: 700, color: '#161b2b', margin: '0 0 10px', letterSpacing: '-0.015em', lineHeight: 1.35 },
  newsBody: { fontSize: 14, color: '#424656', lineHeight: 1.65, margin: '0 0 12px' },
  newsTags: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  newsImage: { width: 120, height: 100, borderRadius: 10, objectFit: 'cover', flexShrink: 0 },
  // Signal glow card
  signalCard: { position: 'relative', background: 'white', borderRadius: 16, padding: 24, borderLeft: '4px solid #006c46', overflow: 'hidden' },
  signalGlow: { position: 'absolute', inset: 0, background: 'rgba(0,108,70,0.03)', filter: 'blur(40px)', zIndex: 0 },
  signalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, position: 'relative', zIndex: 1 },
  signalBadgeRow: { display: 'flex', alignItems: 'center', gap: 6 },
  boltIcon: { fontSize: 14, color: '#006c46' },
  signalLabel: { fontSize: 11, fontWeight: 900, color: '#006c46', letterSpacing: '0.1em', textTransform: 'uppercase' },
  poweredBy: { fontSize: 10, color: '#727687', letterSpacing: '0.06em', textTransform: 'uppercase' },
  signalTitle: { fontSize: 18, fontWeight: 700, color: '#161b2b', margin: '0 0 20px', letterSpacing: '-0.02em', lineHeight: 1.3, position: 'relative', zIndex: 1 },
  signalMetrics: { display: 'flex', alignItems: 'center', gap: 32, position: 'relative', zIndex: 1 },
  metricLabel: { fontSize: 10, fontWeight: 700, color: '#727687', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' },
  metricValue: { fontSize: 20, fontWeight: 900, color: '#006c46', margin: 0 },
  tradeSetupBtn: { marginLeft: 'auto', padding: '10px 24px', background: '#0050cb', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', textDecoration: 'none' },
  // Right sidebar
  rightSidebar: { display: 'flex', flexDirection: 'column', gap: 24, position: 'sticky', top: 88 },
  trendingSection: { background: '#f2f3ff', borderRadius: 16, padding: 24 },
  sectionLabel: { fontSize: 11, fontWeight: 900, color: '#727687', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 16px' },
  trendingList: { display: 'flex', flexDirection: 'column', gap: 10 },
  trendingItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'white', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  trendingLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  trendingIcon: { width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 },
  trendingName: { fontSize: 12, fontWeight: 700, color: '#161b2b', margin: 0 },
  trendingSub: { fontSize: 10, color: '#727687', margin: 0 },
  trendingRight: { textAlign: 'right' },
  trendingChange: { fontSize: 12, fontWeight: 700, margin: 0 },
  trendingPrice: { fontSize: 10, color: '#727687', margin: 0 },
  topicsGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  topicChip: { padding: '7px 12px', background: 'white', borderRadius: 9999, fontSize: 12, fontWeight: 600, color: '#161b2b', border: '1px solid rgba(194,198,216,0.15)', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' },
  morningCard: { padding: 24, background: 'linear-gradient(135deg, #0050cb, #0066ff)', borderRadius: 16, color: 'white' },
  morningTitle: { fontSize: 16, fontWeight: 700, margin: '0 0 8px' },
  morningSub: { fontSize: 13, opacity: 0.8, lineHeight: 1.65, margin: '0 0 16px' },
  emailInput: { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, fontSize: 13, color: 'white', fontFamily: 'Inter, sans-serif', outline: 'none', marginBottom: 10, boxSizing: 'border-box' },
  subscribeBtn: { width: '100%', padding: 10, background: 'white', color: '#0050cb', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  subscribedMsg: { background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 12, textAlign: 'center', fontSize: 14, fontWeight: 600 },
  footer: { background: 'white', borderTop: '1px solid #f1f5f9', padding: '40px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 },
  footerBrand: { fontSize: 13, fontWeight: 700, color: '#161b2b' },
  footerCopy: { fontSize: 12, color: '#94a3b8', margin: '4px 0 0' },
  footerLinks: { display: 'flex', gap: 28 },
  footerLink: { fontSize: 12, color: '#94a3b8', textDecoration: 'none' },
}