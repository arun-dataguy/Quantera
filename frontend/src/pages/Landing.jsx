import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'

const TICKERS = [
  { sym: 'AAPL', change: '+1.24%', pos: true },
  { sym: 'TSLA', change: '-0.82%', pos: false },
  { sym: 'BTC',  change: '+3.41%', pos: true },
  { sym: 'ETH',  change: '+2.15%', pos: true },
  { sym: 'NVDA', change: '+4.88%', pos: true },
  { sym: 'MSFT', change: '-0.12%', pos: false },
]

const METRICS = [
  { icon: '✓', num: '73%',   label: 'Signal Accuracy',   sub: 'Verified historical performance across all asset classes.' },
  { icon: '◈', num: '40+',   label: 'Indicators',        sub: 'Aggregated technical and social sentiment markers.' },
  { icon: '⊕', num: '3',     label: 'Markets',           sub: 'Specialized algorithms for Crypto, Forex, and Equities.' },
  { icon: '↺', num: '30min', label: 'Refresh Rate',      sub: 'Low-latency data processing for high-frequency insights.' },
]

const SIGNALS = [
  { sym: 'AAPL', name: 'Apple Inc.',  sub: '3m ago • Technical + Sentiment', signal: 'BUY',  conf: 85, pos: true },
  { sym: 'TSLA', name: 'Tesla Inc.',  sub: '12m ago • Macro Trend',          signal: 'HOLD', conf: 40, pos: false },
  { sym: 'BTC',  name: 'Bitcoin',     sub: '1m ago • Volume Spike',          signal: 'BUY',  conf: 94, pos: true },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={s.root}>
      {/* ── Navbar ── */}
      <nav style={s.nav}>
        <div style={s.navLeft}>
          <Logo height={32} />
          <div style={s.navLinks}>
            <Link to="/dashboard" style={s.navLink}>Dashboard</Link>
            <Link to="/crypto"    style={s.navLink}>Crypto</Link>
            <Link to="/pricing"   style={s.navLink}>Pricing</Link>
          </div>
        </div>
        <div style={s.navRight}>
          <Link to="/login"  style={s.loginBtn}>Login</Link>
          <Link to="/signup" style={s.getStartedBtn}>Get Started</Link>
        </div>
      </nav>

      {/* ── Ticker Strip ── */}
      <div style={s.tickerWrap}>
        <div style={s.tickerTrack}>
          {[...TICKERS, ...TICKERS].map((t, i) => (
            <div key={i} style={s.tickerItem}>
              <span style={s.tickerSym}>{t.sym}</span>
              <span style={{ ...s.tickerChange, color: t.pos ? '#006c46' : '#ba1a1a' }}>{t.change}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <main style={s.main}>
        <div style={s.heroGrid}>
          {/* Left — text */}
          <div style={s.heroLeft}>
            <div style={s.newBadge}>NEW: AI v2.0</div>
            <h1 style={s.heroH1}>
              Data-driven trading{' '}
              <span style={s.heroAccent}>signals</span>{' '}
              for everyone
            </h1>
            <p style={s.heroPara}>
              Empowering traders with real-time confidence scores and sentiment analysis. Our neural networks process millions of data points to deliver clarity in high-volatility markets.
            </p>
            <div style={s.heroCtas}>
              <Link to="/signup" style={s.ctaPrimary}>Start free</Link>
              <Link to="/pricing" style={s.ctaSecondary}>See how it works ◎</Link>
            </div>
            <div style={s.socialProof}>
              <span style={s.asSeenOn}>AS SEEN ON</span>
              <div style={s.pressLogos}>
                <span style={s.pressItem}>Forbes</span>
                <span style={s.pressItem}>TechCrunch</span>
                <span style={s.pressItem}>Wired</span>
              </div>
            </div>
          </div>

          {/* Right — dashboard mockup */}
          <div style={s.heroRight}>
            <div style={s.mockGlow}/>
            <div style={s.mockCard}>
              {/* Card header */}
              <div style={s.mockHeader}>
                <div>
                  <div style={s.mockTitle}>Live Signals</div>
                  <div style={s.mockSub}>Real-time AI monitoring</div>
                </div>
                <div style={s.marketOpenBadge}>
                  <span style={s.marketDot}/>
                  <span style={s.marketText}>MARKET OPEN</span>
                </div>
              </div>

              {/* Signal rows */}
              <div style={s.signalList}>
                {SIGNALS.map((sig, i) => (
                  <div key={i} style={s.signalRow}>
                    <div style={s.sigLeft}>
                      <div style={s.sigIcon}>{sig.sym}</div>
                      <div>
                        <div style={s.sigName}>{sig.name}</div>
                        <div style={s.sigTime}>{sig.sub}</div>
                      </div>
                    </div>
                    <div style={s.sigRight}>
                      <div style={s.sigConf}>
                        <div style={s.confLabel}>CONFIDENCE</div>
                        <div style={s.confBarBg}>
                          <div style={{ ...s.confBarFill, width: sig.conf + '%', background: sig.pos ? '#006c46' : '#424656' }}/>
                        </div>
                      </div>
                      <span style={{ ...s.sigBadge, background: sig.pos ? 'rgba(0,108,70,0.1)' : 'rgba(66,70,86,0.1)', color: sig.pos ? '#006c46' : '#424656' }}>
                        {sig.signal}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social proof footer */}
              <div style={s.cardFooter}>
                <div style={s.avatarRow}>
                  {['JD', 'AL', '+12'].map((a, i) => (
                    <div key={i} style={s.avatar}>{a}</div>
                  ))}
                </div>
                <span style={s.joinedText}>Joined by 12,400+ pro traders today</span>
              </div>
            </div>

            {/* Floating glass card */}
            <div style={s.floatingCard}>
              <div style={s.floatingIcon}>↑</div>
              <div>
                <div style={s.floatingNum}>+24.3%</div>
                <div style={s.floatingLabel}>AVERAGE WEEKLY YIELD</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Metrics grid ── */}
        <div style={s.metricsGrid}>
          {METRICS.map((m, i) => (
            <div key={i} style={{ ...s.metricCard, borderLeft: i === 0 ? '4px solid #0050cb' : 'none' }}>
              <div style={s.metricIcon}>{m.icon}</div>
              <div style={s.metricNum}>{m.num}</div>
              <div style={s.metricLabel}>{m.label}</div>
              <p style={s.metricSub}>{m.sub}</p>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={s.footer}>
        <div>
          <span style={s.footerBrand}>Quantera AI</span>
          <p style={s.footerCopy}>© {new Date().getFullYear()} Quantera AI. Editorial Precision in Trading.</p>
        </div>
        <div style={s.footerLinks}>
          <Link to="/privacy" style={s.footerLink}>Privacy Policy</Link>
          <Link to="/terms"   style={s.footerLink}>Terms of Service</Link>
          <Link to="/pricing" style={s.footerLink}>Pricing</Link>
          <Link to="/signup"  style={s.footerLink}>Get Started</Link>
        </div>
      </footer>

      <style>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  )
}

const s = {
  root: { minHeight: '100vh', background: '#faf8ff', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' },

  // Navbar
  nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 64, background: '#faf8ff', boxShadow: '0 32px 64px rgba(0,84,214,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' },
  navLeft: { display: 'flex', alignItems: 'center', gap: 32 },
  navBrand: { fontSize: 20, fontWeight: 700, color: '#161b2b', letterSpacing: '-0.04em' },
  navLinks: { display: 'flex', gap: 24 },
  navLink: { fontSize: 14, fontWeight: 500, color: '#424656', textDecoration: 'none', letterSpacing: '-0.01em' },
  navRight: { display: 'flex', alignItems: 'center', gap: 12 },
  loginBtn: { padding: '8px 16px', fontSize: 14, fontWeight: 500, color: '#424656', textDecoration: 'none', borderRadius: 8 },
  getStartedBtn: { padding: '10px 20px', fontSize: 14, fontWeight: 600, color: 'white', textDecoration: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #0050cb, #0066ff)', boxShadow: '0 4px 12px rgba(0,84,214,0.15)' },

  // Ticker
  tickerWrap: { marginTop: 64, background: '#161b2b', overflow: 'hidden', height: 44, display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  tickerTrack: { display: 'flex', alignItems: 'center', gap: 0, animation: 'ticker 30s linear infinite', width: 'fit-content' },
  tickerItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '0 32px', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.05)' },
  tickerSym: { fontSize: 13, fontWeight: 700, color: 'white' },
  tickerChange: { fontSize: 13, fontWeight: 600 },

  // Hero
  main: { maxWidth: 1280, margin: '0 auto', padding: '64px 32px 80px', flex: 1 },
  heroGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', marginBottom: 120 },
  heroLeft: { display: 'flex', flexDirection: 'column', gap: 28 },
  newBadge: { display: 'inline-flex', alignItems: 'center', padding: '5px 12px', borderRadius: 6, background: '#dae1ff', color: '#003fa4', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', width: 'fit-content' },
  heroH1: { fontSize: 64, fontWeight: 900, color: '#161b2b', letterSpacing: '-0.04em', lineHeight: 1.1, margin: 0 },
  heroAccent: { color: '#0050cb' },
  heroPara: { fontSize: 17, color: '#424656', lineHeight: 1.7, margin: 0, maxWidth: 480 },
  heroCtas: { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  ctaPrimary: { padding: '14px 28px', borderRadius: 8, background: 'linear-gradient(135deg, #0050cb, #0066ff)', color: 'white', textDecoration: 'none', fontSize: 15, fontWeight: 700, boxShadow: '0 4px 12px rgba(0,84,214,0.2)' },
  ctaSecondary: { padding: '14px 28px', borderRadius: 8, border: '1.5px solid rgba(194,198,216,0.4)', background: 'transparent', color: '#161b2b', textDecoration: 'none', fontSize: 15, fontWeight: 500 },
  socialProof: { display: 'flex', flexDirection: 'column', gap: 8 },
  asSeenOn: { fontSize: 10, fontWeight: 700, color: '#727687', letterSpacing: '0.12em', textTransform: 'uppercase' },
  pressLogos: { display: 'flex', gap: 24 },
  pressItem: { fontSize: 18, fontWeight: 900, color: '#161b2b', letterSpacing: '-0.02em' },

  // Mockup
  heroRight: { position: 'relative' },
  mockGlow: { position: 'absolute', inset: -16, background: 'rgba(0,80,203,0.05)', filter: 'blur(40px)', borderRadius: '50%', zIndex: 0 },
  mockCard: { position: 'relative', zIndex: 1, background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 32px 64px rgba(0,84,214,0.08)', border: '1px solid rgba(194,198,216,0.1)' },
  mockHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  mockTitle: { fontSize: 15, fontWeight: 700, color: '#161b2b' },
  mockSub: { fontSize: 11, color: '#424656', marginTop: 2 },
  marketOpenBadge: { display: 'flex', alignItems: 'center', gap: 6 },
  marketDot: { width: 8, height: 8, borderRadius: '50%', background: '#006c46', animation: 'pulse 2s infinite', flexShrink: 0 },
  marketText: { fontSize: 10, fontWeight: 700, color: '#006c46', letterSpacing: '0.08em' },
  signalList: { display: 'flex', flexDirection: 'column', gap: 12 },
  signalRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, background: '#f2f3ff', borderRadius: 8, transition: 'transform 0.15s' },
  sigLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  sigIcon: { width: 40, height: 40, borderRadius: 8, background: '#dee1f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0050cb', flexShrink: 0 },
  sigName: { fontSize: 13, fontWeight: 700, color: '#161b2b' },
  sigTime: { fontSize: 10, color: '#424656', marginTop: 2 },
  sigRight: { display: 'flex', alignItems: 'center', gap: 20 },
  sigConf: { textAlign: 'right' },
  confLabel: { fontSize: 9, fontWeight: 700, color: '#727687', letterSpacing: '0.08em', marginBottom: 4 },
  confBarBg: { width: 64, height: 6, background: '#dee1f7', borderRadius: 3, overflow: 'hidden' },
  confBarFill: { height: 6, borderRadius: 3 },
  sigBadge: { padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' },
  cardFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(194,198,216,0.15)' },
  avatarRow: { display: 'flex' },
  avatar: { width: 32, height: 32, borderRadius: '50%', border: '2px solid #faf8ff', background: '#dae1ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#161b2b', marginLeft: -8 },
  joinedText: { fontSize: 10, color: '#424656', fontWeight: 500 },
  floatingCard: { position: 'absolute', bottom: -32, left: -40, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', padding: '16px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 12, zIndex: 2 },
  floatingIcon: { width: 40, height: 40, borderRadius: '50%', background: '#006c46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'white', flexShrink: 0 },
  floatingNum: { fontSize: 22, fontWeight: 900, color: '#161b2b' },
  floatingLabel: { fontSize: 9, fontWeight: 700, color: '#006c46', letterSpacing: '0.1em', textTransform: 'uppercase' },

  // Metrics
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 },
  metricCard: { padding: 32, background: '#f2f3ff', borderRadius: 12, transition: 'background 0.2s' },
  metricIcon: { fontSize: 28, color: '#0050cb', marginBottom: 14, display: 'block' },
  metricNum: { fontSize: 40, fontWeight: 900, color: '#161b2b', lineHeight: 1, marginBottom: 8 },
  metricLabel: { fontSize: 13, fontWeight: 700, color: '#161b2b', marginBottom: 8 },
  metricSub: { fontSize: 12, color: '#424656', margin: 0, lineHeight: 1.6 },

  // Footer
  footer: { background: '#f2f3ff', padding: '48px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 },
  footerBrand: { fontSize: 13, fontWeight: 700, color: '#161b2b' },
  footerCopy: { fontSize: 12, color: '#424656', margin: '4px 0 0' },
  footerLinks: { display: 'flex', gap: 28 },
  footerLink: { fontSize: 12, color: '#424656', textDecoration: 'none' },
}
