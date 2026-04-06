import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PLANS = [
  {
    id: 'free', label: 'FREE', price: '$0', period: '/month', featured: false,
    features: [
      { text: '5 signals per day', included: true },
      { text: 'Basic signal only', included: true },
      { text: 'No confidence scores', included: false },
    ],
    cta: 'Start for free', ctaPath: '/signup',
  },
  {
    id: 'pro', label: 'PRO', price: '$10', period: '/month', featured: true,
    features: [
      { text: 'Unlimited signals', included: true },
      { text: 'AI confidence scores', included: true },
      { text: 'Market sentiment analysis', included: true },
      { text: 'Daily market digest', included: true },
    ],
    cta: 'Upgrade to Pro', ctaPath: null,
  },
  {
    id: 'premium', label: 'PREMIUM', price: '$25', period: '/month', featured: false,
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Full Crypto signals', included: true },
      { text: 'Advanced API access', included: true },
      { text: 'Priority Support', included: true },
    ],
    cta: 'Go Premium', ctaPath: null,
  },
]

export default function Pricing() {
  const { user, apiFetch } = useAuth()
  const navigate  = useNavigate()
  const [loading, setLoading] = useState(null)

  const handleCheckout = async (planId) => {
    if (!user) { navigate('/signup'); return }
    if (planId === 'free') { navigate('/dashboard'); return }
    setLoading(planId)
    try {
      const data = await apiFetch('/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: planId }),
      })
      window.location.href = data.checkout_url
    } catch (err) { alert(err.message) }
    finally { setLoading(null) }
  }

  return (
    <div style={s.root}>
      {/* ── Navbar ── */}
      <nav style={s.nav}>
        <div style={s.navLeft}>
          <span style={s.navBrand}>Quantera</span>
          <div style={s.navLinks}>
            <Link to="/dashboard" style={s.navLink}>Dashboard</Link>
            <Link to="/crypto"    style={s.navLink}>Crypto</Link>
            <Link to="/pricing"   style={{ ...s.navLink, ...s.navLinkActive }}>Pricing</Link>
          </div>
        </div>
        <div style={s.navRight}>
          <Link to="/login"  style={s.loginBtn}>Login</Link>
          <Link to="/signup" style={s.getStartedBtn}>Get Started</Link>
        </div>
      </nav>

      <main style={s.main}>
        {/* Hero */}
        <div style={s.heroSection}>
          <h1 style={s.heroTitle}>Simple, transparent pricing</h1>
          <p style={s.heroSub}>Unlock professional-grade AI trading signals and market intelligence. No hidden fees. No complexity.</p>
        </div>

        {/* Pricing cards */}
        <div style={s.cardsGrid}>
          {PLANS.map(plan => (
            <div key={plan.id} style={{
              ...s.card,
              ...(plan.featured ? s.cardFeatured : {}),
            }}>
              {plan.featured && <div style={s.popularBadge}>MOST POPULAR</div>}

              <div style={s.planHeader}>
                <h3 style={{ ...s.planLabel, color: plan.featured ? '#0050cb' : '#424656' }}>{plan.label}</h3>
                <div style={s.priceRow}>
                  <span style={s.priceNum}>{plan.price}</span>
                  <span style={s.pricePeriod}>{plan.period}</span>
                </div>
              </div>

              <ul style={s.featureList}>
                {plan.features.map((f, i) => (
                  <li key={i} style={s.featureItem}>
                    <span style={{ ...s.featureIcon, color: f.included ? (plan.featured ? '#0050cb' : '#006c46') : '#c2c6d8' }}>
                      {f.included ? '✓' : '✗'}
                    </span>
                    <span style={{ ...s.featureText, opacity: f.included ? 1 : 0.4, fontWeight: f.included && plan.featured ? 500 : 400 }}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                style={plan.featured ? s.ctaFeatured : s.ctaDefault}
                onClick={() => handleCheckout(plan.id)}
                disabled={loading === plan.id}>
                {loading === plan.id ? 'Loading…' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Secondary section */}
        <div style={s.secondarySection}>
          <div style={s.secondaryLeft}>
            <h2 style={s.secondaryTitle}>Designed for high-velocity decisions.</h2>
            <p style={s.secondarySub}>Our pricing is built to grow with your trading journey. Whether you're just starting to explore AI-driven markets or you're a professional scaling through our API, we have a tier designed for your precision.</p>
            <div style={s.trustBadge}>
              <div style={s.trustIcon}>🔒</div>
              <div>
                <p style={s.trustTitle}>Secure Transactions</p>
                <p style={s.trustSub}>Encrypted via Stripe</p>
              </div>
            </div>
          </div>
          <div style={s.secondaryRight}>
            <div style={s.chartImgPlaceholder}>
              <div style={s.chartImgOverlay}/>
              <span style={s.chartImgIcon}>📈</span>
              <span style={s.chartImgText}>Live Trading Interface</span>
            </div>
          </div>
        </div>

        {/* Legal disclaimer */}
        <div style={s.disclaimer}>
          <p style={s.disclaimerLabel}>LEGAL DISCLAIMER</p>
          <p style={s.disclaimerText}>
            Trading stocks and cryptocurrencies involves significant risk and can result in the loss of your invested capital. Quantera AI provides data and signals for informational purposes only. Past performance is not indicative of future results. None of the information provided should be considered financial or investment advice. Always consult with a certified financial professional before making trading decisions.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer style={s.footer}>
        <div>
          <span style={s.footerBrand}>Quantera AI</span>
          <p style={s.footerCopy}>© 2024 Quantera AI. Editorial Precision in Trading.</p>
        </div>
        <div style={s.footerLinks}>
          {['Privacy Policy', 'Terms of Service', 'API Docs', 'Support'].map(l => (
            <Link key={l} to="/" style={s.footerLink}>{l}</Link>
          ))}
        </div>
      </footer>
    </div>
  )
}

const s = {
  root: { minHeight: '100vh', background: '#faf8ff', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' },
  nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 64, background: '#faf8ff', boxShadow: '0 32px 64px rgba(0,84,214,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' },
  navLeft: { display: 'flex', alignItems: 'center', gap: 32 },
  navBrand: { fontSize: 20, fontWeight: 700, color: '#161b2b', letterSpacing: '-0.04em' },
  navLinks: { display: 'flex', gap: 24 },
  navLink: { fontSize: 14, fontWeight: 500, color: '#424656', textDecoration: 'none' },
  navLinkActive: { fontWeight: 600, color: '#0050cb', borderBottom: '2px solid #0050cb', paddingBottom: 2 },
  navRight: { display: 'flex', alignItems: 'center', gap: 12 },
  loginBtn: { padding: '8px 16px', fontSize: 14, fontWeight: 500, color: '#424656', textDecoration: 'none' },
  getStartedBtn: { padding: '10px 20px', fontSize: 14, fontWeight: 600, color: 'white', textDecoration: 'none', borderRadius: 8, background: '#0050cb' },
  main: { maxWidth: 1200, margin: '0 auto', padding: '120px 32px 80px', flex: 1 },
  heroSection: { textAlign: 'center', marginBottom: 64 },
  heroTitle: { fontSize: 56, fontWeight: 900, color: '#161b2b', letterSpacing: '-0.04em', margin: '0 0 16px', lineHeight: 1.1 },
  heroSub: { fontSize: 18, color: '#424656', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, alignItems: 'start', marginBottom: 96 },
  card: { background: 'white', borderRadius: 12, padding: 32, display: 'flex', flexDirection: 'column', transition: 'transform 0.25s', position: 'relative' },
  cardFeatured: { border: '2px solid #0050cb', boxShadow: '0 32px 64px rgba(0,84,214,0.12)', transform: 'scale(1.03)', zIndex: 1 },
  popularBadge: { position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#0050cb', color: 'white', fontSize: 10, fontWeight: 700, padding: '4px 14px', borderRadius: 6, letterSpacing: '0.1em', whiteSpace: 'nowrap' },
  planHeader: { marginBottom: 24 },
  planLabel: { fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 10px' },
  priceRow: { display: 'flex', alignItems: 'baseline', gap: 4 },
  priceNum: { fontSize: 40, fontWeight: 700, color: '#161b2b', letterSpacing: '-0.03em' },
  pricePeriod: { fontSize: 14, color: '#424656' },
  featureList: { listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 },
  featureItem: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  featureIcon: { fontSize: 16, flexShrink: 0, marginTop: 1, fontWeight: 700 },
  featureText: { fontSize: 13, color: '#424656', lineHeight: 1.5 },
  ctaFeatured: { width: '100%', padding: '16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #0050cb, #0066ff)', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 12px rgba(0,80,203,0.2)' },
  ctaDefault: { width: '100%', padding: '14px', borderRadius: 8, border: 'none', background: '#e3e7fd', color: '#161b2b', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  secondarySection: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', marginBottom: 80 },
  secondaryLeft: { display: 'flex', flexDirection: 'column', gap: 20 },
  secondaryTitle: { fontSize: 32, fontWeight: 700, color: '#161b2b', letterSpacing: '-0.025em', margin: 0 },
  secondarySub: { fontSize: 15, color: '#424656', lineHeight: 1.7, margin: 0 },
  trustBadge: { display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#f2f3ff', borderRadius: 12 },
  trustIcon: { width: 40, height: 40, background: 'rgba(0,80,203,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 },
  trustTitle: { fontSize: 13, fontWeight: 700, color: '#161b2b', margin: 0 },
  trustSub: { fontSize: 12, color: '#424656', margin: 0 },
  secondaryRight: { position: 'relative', borderRadius: 16, overflow: 'hidden' },
  chartImgPlaceholder: { height: 280, background: 'linear-gradient(135deg, #161b2b, #0050cb)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative' },
  chartImgOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(250,248,255,0.3), transparent)' },
  chartImgIcon: { fontSize: 48, position: 'relative', zIndex: 1 },
  chartImgText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600, position: 'relative', zIndex: 1 },
  disclaimer: { maxWidth: 700, margin: '0 auto', textAlign: 'center', padding: '40px 0' },
  disclaimerLabel: { fontSize: 10, fontWeight: 700, color: '#424656', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 12px' },
  disclaimerText: { fontSize: 12, color: '#424656', lineHeight: 1.8, margin: 0, opacity: 0.7 },
  footer: { background: '#f2f3ff', padding: '48px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 },
  footerBrand: { fontSize: 13, fontWeight: 700, color: '#161b2b' },
  footerCopy: { fontSize: 12, color: '#424656', margin: '4px 0 0' },
  footerLinks: { display: 'flex', gap: 28 },
  footerLink: { fontSize: 12, color: '#424656', textDecoration: 'none' },
}
