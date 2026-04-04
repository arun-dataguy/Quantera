import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const TRENDING = [
  { sym: '₿', name: 'BTC/USD', sub: 'Bitcoin',       change: '+4.2%', price: '$68,240.21', pos: true,  bg: '#fff7ed', color: '#ea8c00' },
  { sym: 'N', name: 'NVDA',    sub: 'Nvidia Corp',    change: '+2.1%', price: '$894.52',    pos: true,  bg: '#eff6ff', color: '#2563eb' },
  { sym: '$', name: 'DXY',     sub: 'US Dollar Index', change: '-0.12%', price: '104.12',   pos: false, bg: '#f8fafc', color: '#475569' },
]

const HOT_TOPICS = ['#FedRateCuts', '#AIBoom', '#EarningsSeason', '#OPEC+', '#CryptoRegulation', '#EVWar']

const NEWS = [
  {
    type: 'standard',
    source: 'BLOOMBERG', time: '2m ago', sentiment: 'BULLISH', sentimentColor: '#006c46', sentimentBg: 'rgba(0,108,70,0.08)',
    title: 'Federal Reserve Signals Potential Rate Cut in Q3 as Inflation Data Moderates Faster Than Projected',
    body: 'Chairman Jerome Powell noted that while the central bank remains vigilant, the balance of risks is shifting towards economic growth support as labor markets show signs of cooling.',
    tags: [{ label: 'SPY +1.24%', color: '#0050cb' }, { label: 'USD -0.45%', color: '#0050cb' }],
    image: null,
  },
  {
    type: 'standard',
    source: 'REUTERS', time: '15m ago', sentiment: 'BEARISH', sentimentColor: '#ba1a1a', sentimentBg: 'rgba(186,26,26,0.08)',
    title: 'EU Competition Commission Targets Major Tech Platforms with New Antitrust Probe',
    body: 'Brussels moves to investigate dynamic pricing models used by leading e-commerce and cloud infrastructure providers under the Digital Markets Act framework.',
    tags: [{ label: 'AAPL, MSFT, AMZN', color: '#0050cb' }, { label: 'Sector: Technology', color: '#727687' }],
    image: true,
  },
  {
    type: 'signal',
    source: 'AI HIGH CONFIDENCE SIGNAL',
    title: "TSLA: Production Efficiency Breakthrough in Berlin Gigafactory Exceeds Analysts' Expectations",
    sentimentScore: '94.2%',
    impactDuration: 'Short-Medium Term',
  },
  {
    type: 'standard',
    source: 'WSJ', time: '45m ago', sentiment: 'NEUTRAL', sentimentColor: '#424656', sentimentBg: '#e3e7fd',
    title: 'Gold Prices Stabilize Near Record Highs as Safe Haven Demand Offsets Dollar Strength',
    body: 'The precious metal remains the preferred hedge against geopolitical uncertainty in Eastern Europe and the Middle East despite rising Treasury yields.',
    tags: [{ label: 'XAUUSD, GLD', color: '#0050cb' }, { label: 'Sector: Commodities', color: '#727687' }],
    image: true,
  },
]

function SentimentBadge({ label, color, bg }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: bg, color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
      {label}
    </span>
  )
}

export default function Intel() {
  const { user, isPro } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [filter, setFilter] = useState('Global')

  return (
    <div style={s.root}>
      {/* ── Top Navbar ── */}
      <nav style={s.topNav}>
        <div style={s.navInner}>
          <div style={s.navLeft}>
            <span style={s.navBrand}>Quantera</span>
            <div style={s.navLinks}>
              {['Dashboard', 'Markets', 'Portfolio', 'Insights'].map(item => (
                <Link key={item} to={item === 'Dashboard' ? '/dashboard' : '#'}
                  style={{ ...s.navLink, ...(item === 'Markets' ? s.navLinkActive : {}) }}>
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <div style={s.navRight}>
            <div style={s.searchWrap}>
              <span style={s.searchIcon}>🔍</span>
              <input style={s.searchInput} placeholder="Search markets..." type="text"/>
            </div>
            <button style={s.iconBtn}>🔔</button>
            <button style={s.iconBtn}>⚙</button>
            <div style={s.userAvatar}>{user?.full_name?.charAt(0) || 'A'}</div>
          </div>
        </div>
      </nav>

      <div style={s.body}>
        {/* ── Left Sidebar ── */}
        <aside style={s.sidebar}>
          <div style={s.sidebarLabel}>Intelligence Feed</div>
          <nav style={s.sideNav}>
            {[
              { icon: '🌐', label: 'Global' },
              { icon: '₿', label: 'Crypto' },
              { icon: '📈', label: 'Stocks' },
              { icon: '💱', label: 'Forex' },
            ].map(item => (
              <button key={item.label} onClick={() => setFilter(item.label)}
                style={{ ...s.sideNavItem, ...(filter === item.label ? s.sideNavItemActive : {}) }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Upgrade CTA */}
          {!isPro && (
            <div style={s.upgradeCta}>
              <p style={s.upgradeTitle}>PRO FEATURES</p>
              <p style={s.upgradeSub}>Unlock real-time volatility alerts and sentiment heatmaps.</p>
              <Link to="/pricing" style={s.upgradeBtn}>Upgrade to Pro</Link>
            </div>
          )}
        </aside>

        {/* ── Main Content ── */}
        <main style={s.main}>
          {/* Page header */}
          <div style={s.pageHeader}>
            <div style={s.liveIndicator}>
              <span style={s.liveDot}/>
              <span style={s.liveText}>LIVE MARKET PULSE</span>
            </div>
            <h1 style={s.pageTitle}>Global News</h1>
            <div style={s.headerActions}>
              <button style={s.filterBtn}>Filters</button>
              <button style={s.filterBtn}>Sort by Newest</button>
            </div>
          </div>

          {/* News grid */}
          <div style={s.contentGrid}>
            {/* News feed — left column */}
            <div style={s.newsFeed}>
              {NEWS.map((item, i) => {
                if (item.type === 'signal') return (
                  <article key={i} style={s.signalCard}>
                    <div style={s.signalGlow}/>
                    <div style={s.signalHeader}>
                      <div style={s.signalBadgeRow}>
                        <span style={s.boltIcon}>⚡</span>
                        <span style={s.signalLabel}>{item.source}</span>
                      </div>
                      <span style={s.poweredBy}>Powered by Quantera Core</span>
                    </div>
                    <h3 style={s.signalTitle}>{item.title}</h3>
                    <div style={s.signalMetrics}>
                      <div>
                        <p style={s.metricLabel}>Sentiment Score</p>
                        <p style={s.metricValue}>{item.sentimentScore}</p>
                      </div>
                      <div>
                        <p style={s.metricLabel}>Impact Duration</p>
                        <p style={{ ...s.metricValue, color: '#161b2b' }}>{item.impactDuration}</p>
                      </div>
                      <button style={s.tradeSetupBtn}>Trade Setup</button>
                    </div>
                  </article>
                )

                return (
                  <article key={i} style={s.newsCard}>
                    <div style={s.newsCardInner}>
                      <div style={s.newsContent}>
                        <div style={s.newsMeta}>
                          <span style={s.newsSource}>{item.source}</span>
                          <span style={s.newsTime}>• {item.time}</span>
                          <SentimentBadge label={item.sentiment} color={item.sentimentColor} bg={item.sentimentBg}/>
                        </div>
                        <h3 style={s.newsTitle}>{item.title}</h3>
                        <p style={s.newsBody}>{item.body}</p>
                        <div style={s.newsTags}>
                          {item.tags?.map((tag, j) => (
                            <span key={j} style={{ fontSize: 12, fontWeight: 700, color: tag.color }}>{tag.label}</span>
                          ))}
                        </div>
                      </div>
                      {item.image && (
                        <div style={s.newsImagePlaceholder}>
                          <span style={{ fontSize: 24 }}>📰</span>
                        </div>
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

      {/* Footer */}
      <footer style={s.footer}>
        <div>
          <span style={s.footerBrand}>Quantera AI</span>
          <p style={s.footerCopy}>© 2024 Quantera AI. All rights reserved. Precision & Luminescence.</p>
        </div>
        <div style={s.footerLinks}>
          {['Privacy Policy', 'Terms of Service', 'API Documentation', 'Support'].map(l => (
            <Link key={l} to="/" style={s.footerLink}>{l}</Link>
          ))}
        </div>
      </footer>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}

const s = {
  root: { minHeight: '100vh', background: '#faf8ff', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' },

  // Navbar
  topNav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', height: 64 },
  navInner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: '100%', maxWidth: 1600, margin: '0 auto' },
  navLeft: { display: 'flex', alignItems: 'center', gap: 32 },
  navBrand: { fontSize: 22, fontWeight: 900, color: '#1d4ed8', letterSpacing: '-0.04em' },
  navLinks: { display: 'flex', gap: 28 },
  navLink: { fontSize: 14, fontWeight: 500, color: '#475569', textDecoration: 'none' },
  navLinkActive: { fontWeight: 700, color: '#1d40af', borderBottom: '2px solid #1d40af', paddingBottom: 2 },
  navRight: { display: 'flex', alignItems: 'center', gap: 12 },
  searchWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 10, fontSize: 13 },
  searchInput: { paddingLeft: 32, paddingRight: 16, paddingTop: 8, paddingBottom: 8, background: '#f2f3ff', border: 'none', borderRadius: 9999, fontSize: 13, width: 220, outline: 'none', fontFamily: 'Inter, sans-serif' },
  iconBtn: { padding: 8, background: 'transparent', border: 'none', fontSize: 16, cursor: 'pointer', color: '#424656' },
  userAvatar: { width: 32, height: 32, borderRadius: '50%', background: '#dee1f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#0050cb' },

  // Layout
  body: { display: 'flex', paddingTop: 64, flex: 1 },

  // Left sidebar
  sidebar: { width: 240, background: '#f1f5f9', display: 'flex', flexDirection: 'column', padding: '28px 16px', position: 'sticky', top: 64, height: 'calc(100vh - 64px)', flexShrink: 0 },
  sidebarLabel: { fontSize: 11, fontWeight: 700, color: '#727687', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 12px', marginBottom: 16 },
  sideNav: { display: 'flex', flexDirection: 'column', gap: 4 },
  sideNavItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#475569', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'left', transition: 'all 0.15s' },
  sideNavItemActive: { background: 'white', color: '#1d4ed8', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  upgradeCta: { marginTop: 'auto', padding: 16, background: 'rgba(0,80,203,0.06)', borderRadius: 12, border: '1px solid rgba(0,80,203,0.1)' },
  upgradeTitle: { fontSize: 10, fontWeight: 700, color: '#0050cb', letterSpacing: '0.1em', margin: '0 0 6px' },
  upgradeSub: { fontSize: 11, color: '#424656', lineHeight: 1.6, margin: '0 0 12px' },
  upgradeBtn: { display: 'block', width: '100%', padding: '8px', background: '#0050cb', color: 'white', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 700, textAlign: 'center' },

  // Main
  main: { flex: 1, padding: '32px 32px 32px', background: '#faf8ff', overflowY: 'auto' },
  pageHeader: { marginBottom: 32 },
  liveIndicator: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 },
  liveDot: { width: 8, height: 8, borderRadius: '50%', background: '#006c46', animation: 'pulse 2s infinite', flexShrink: 0 },
  liveText: { fontSize: 11, fontWeight: 700, color: '#006c46', letterSpacing: '0.1em' },
  pageTitle: { fontSize: 40, fontWeight: 800, color: '#161b2b', margin: '0 0 16px', letterSpacing: '-0.03em' },
  headerActions: { display: 'flex', gap: 8 },
  filterBtn: { padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(194,198,216,0.3)', background: 'white', fontSize: 13, fontWeight: 500, color: '#161b2b', cursor: 'pointer', fontFamily: 'Inter, sans-serif' },

  // Content grid
  contentGrid: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28 },
  newsFeed: { display: 'flex', flexDirection: 'column', gap: 16 },

  // Standard news card
  newsCard: { background: '#f2f3ff', borderRadius: 16, padding: 24, cursor: 'pointer', transition: 'background 0.15s' },
  newsCardInner: { display: 'flex', gap: 24 },
  newsContent: { flex: 1 },
  newsMeta: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' },
  newsSource: { fontSize: 12, fontWeight: 700, color: '#424656' },
  newsTime: { fontSize: 12, color: '#727687' },
  newsTitle: { fontSize: 18, fontWeight: 700, color: '#161b2b', margin: '0 0 10px', letterSpacing: '-0.015em', lineHeight: 1.35 },
  newsBody: { fontSize: 14, color: '#424656', lineHeight: 1.65, margin: '0 0 16px' },
  newsTags: { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  newsImagePlaceholder: { width: 120, height: 120, borderRadius: 12, background: '#dee1f7', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // Signal glow card
  signalCard: { position: 'relative', background: 'white', borderRadius: 16, padding: 24, borderLeft: '4px solid #006c46', overflow: 'hidden' },
  signalGlow: { position: 'absolute', inset: 0, background: 'rgba(0,108,70,0.03)', filter: 'blur(40px)', zIndex: 0 },
  signalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, position: 'relative', zIndex: 1 },
  signalBadgeRow: { display: 'flex', alignItems: 'center', gap: 6 },
  boltIcon: { fontSize: 14, color: '#006c46' },
  signalLabel: { fontSize: 11, fontWeight: 900, color: '#006c46', letterSpacing: '0.1em', textTransform: 'uppercase' },
  poweredBy: { fontSize: 10, color: '#727687', letterSpacing: '0.06em', textTransform: 'uppercase' },
  signalTitle: { fontSize: 20, fontWeight: 700, color: '#161b2b', margin: '0 0 20px', letterSpacing: '-0.02em', lineHeight: 1.3, position: 'relative', zIndex: 1 },
  signalMetrics: { display: 'flex', alignItems: 'center', gap: 32, position: 'relative', zIndex: 1 },
  metricLabel: { fontSize: 10, fontWeight: 700, color: '#727687', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' },
  metricValue: { fontSize: 18, fontWeight: 900, color: '#006c46', margin: 0 },
  tradeSetupBtn: { marginLeft: 'auto', padding: '10px 24px', background: '#0050cb', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },

  // Right sidebar
  rightSidebar: { display: 'flex', flexDirection: 'column', gap: 24 },
  trendingSection: { background: '#f2f3ff', borderRadius: 16, padding: 24 },
  sectionLabel: { fontSize: 11, fontWeight: 900, color: '#727687', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 20px' },
  trendingList: { display: 'flex', flexDirection: 'column', gap: 12 },
  trendingItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  trendingLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  trendingIcon: { width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 },
  trendingName: { fontSize: 12, fontWeight: 700, color: '#161b2b', margin: 0 },
  trendingSub: { fontSize: 10, color: '#727687', margin: 0 },
  trendingRight: { textAlign: 'right' },
  trendingChange: { fontSize: 12, fontWeight: 700, margin: 0 },
  trendingPrice: { fontSize: 10, color: '#727687', margin: 0 },
  topicsGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  topicChip: { padding: '8px 14px', background: 'white', borderRadius: 9999, fontSize: 12, fontWeight: 600, color: '#161b2b', border: '1px solid rgba(194,198,216,0.15)', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' },

  // Morning Intelligence
  morningCard: { padding: 24, background: 'linear-gradient(135deg, #0050cb, #0066ff)', borderRadius: 16, color: 'white' },
  morningTitle: { fontSize: 16, fontWeight: 700, margin: '0 0 8px' },
  morningSub: { fontSize: 13, opacity: 0.8, lineHeight: 1.65, margin: '0 0 20px' },
  emailInput: { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, fontSize: 13, color: 'white', fontFamily: 'Inter, sans-serif', outline: 'none', marginBottom: 10, boxSizing: 'border-box' },
  subscribeBtn: { width: '100%', padding: '10px', background: 'white', color: '#0050cb', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  subscribedMsg: { background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 12, textAlign: 'center', fontSize: 14, fontWeight: 600 },

  // Footer
  footer: { background: 'white', borderTop: '1px solid #f1f5f9', padding: '48px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 },
  footerBrand: { fontSize: 13, fontWeight: 700, color: '#161b2b' },
  footerCopy: { fontSize: 12, color: '#94a3b8', margin: '4px 0 0' },
  footerLinks: { display: 'flex', gap: 28 },
  footerLink: { fontSize: 12, color: '#94a3b8', textDecoration: 'none' },
}
