import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Pricing() {
  const { user, apiFetch } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(null)

  const handleCheckout = async (plan) => {
    if (!user) { navigate('/signup'); return }
    setLoading(plan)
    try {
      const data = await apiFetch('/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      })
      window.location.href = data.checkout_url
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <Link to="/" style={s.logo}>
          <div style={s.logoMark}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <span style={s.logoText}>Quantera</span>
        </Link>
        <div style={{ display: 'flex', gap: 12 }}>
          {user ? <Link to="/dashboard" style={s.navLink}>Dashboard</Link>
                : <><Link to="/login" style={s.navLink}>Sign in</Link>
                    <Link to="/signup" style={s.navBtn}>Get started</Link></>}
        </div>
      </nav>

      <div style={s.body}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h1 style={s.title}>Simple, transparent pricing</h1>
          <p style={s.sub}>Start free. Upgrade when you're ready. Cancel anytime.</p>
        </div>

        <div style={s.grid}>
          {/* Free */}
          <div style={s.card}>
            <div style={s.planName}>Free</div>
            <div style={s.price}><sup style={s.curr}>$</sup>0<span style={s.period}>/month</span></div>
            <p style={s.desc}>Perfect for exploring Quantera's AI signals.</p>
            <hr style={s.hr}/>
            <ul style={s.features}>
              <li style={s.feat}>✓ 5 signals per day (1h delay)</li>
              <li style={s.feat}>✓ US stocks only</li>
              <li style={s.feat}>✓ BUY/HOLD/SELL signal</li>
              <li style={s.feat}>✓ 7-day history</li>
              <li style={{ ...s.feat, color: '#8A94A6' }}>✗ Confidence scores</li>
              <li style={{ ...s.feat, color: '#8A94A6' }}>✗ Sentiment analysis</li>
              <li style={{ ...s.feat, color: '#8A94A6' }}>✗ Email alerts</li>
            </ul>
            <Link to="/signup" style={s.btnOutline}>Get started free</Link>
          </div>

          {/* Pro */}
          <div style={{ ...s.card, border: '2px solid #0066FF', position: 'relative' }}>
            <div style={s.popular}>MOST POPULAR</div>
            <div style={s.planName}>Pro</div>
            <div style={s.price}><sup style={s.curr}>$</sup>9<span style={s.period}>.99/month</span></div>
            <p style={s.desc}>For active traders who want the full signal.</p>
            <hr style={s.hr}/>
            <ul style={s.features}>
              <li style={s.feat}>✓ Unlimited live signals</li>
              <li style={s.feat}>✓ US stocks + UK equities</li>
              <li style={s.feat}>✓ Full confidence scores</li>
              <li style={s.feat}>✓ Sentiment analysis</li>
              <li style={s.feat}>✓ LSTM + technical breakdown</li>
              <li style={s.feat}>✓ 30-day history</li>
              <li style={s.feat}>✓ Email alerts</li>
            </ul>
            <button style={s.btnPrimary} onClick={() => handleCheckout('pro')} disabled={loading === 'pro'}>
              {loading === 'pro' ? 'Loading…' : 'Start Pro — $9.99/mo'}
            </button>
          </div>

          {/* Premium */}
          <div style={s.card}>
            <div style={s.planName}>Premium</div>
            <div style={s.price}><sup style={s.curr}>$</sup>29<span style={s.period}>.99/month</span></div>
            <p style={s.desc}>Everything in Pro plus crypto and API access.</p>
            <hr style={s.hr}/>
            <ul style={s.features}>
              <li style={s.feat}>✓ Everything in Pro</li>
              <li style={s.feat}>✓ Crypto signals (BTC, ETH, SOL)</li>
              <li style={s.feat}>✓ Instant real-time alerts</li>
              <li style={s.feat}>✓ REST API access</li>
              <li style={s.feat}>✓ Full signal history</li>
              <li style={s.feat}>✓ Backtesting reports</li>
              <li style={s.feat}>✓ Priority support</li>
            </ul>
            <button style={s.btnOutlineBlue} onClick={() => handleCheckout('premium')} disabled={loading === 'premium'}>
              {loading === 'premium' ? 'Loading…' : 'Get Premium — $29.99/mo'}
            </button>
          </div>
        </div>

        <p style={s.disclaimer}>
          ⚠ Quantera signals are for informational purposes only and do not constitute financial advice.
          Trading involves significant risk of loss.
        </p>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#F7F9FC', fontFamily: 'DM Sans, sans-serif' },
  nav: { background: 'white', borderBottom: '1px solid #E4E8F0', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' },
  logoMark: { width: 30, height: 30, borderRadius: 8, background: '#0066FF', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 16, fontWeight: 600, color: '#0A0F1E' },
  navLink: { fontSize: 14, color: '#5A6478', textDecoration: 'none', padding: '8px 16px' },
  navBtn: { padding: '8px 18px', borderRadius: 8, background: '#0066FF', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 600 },
  body: { maxWidth: 1100, margin: '0 auto', padding: '64px 32px' },
  title: { fontSize: 40, fontWeight: 300, color: '#0A0F1E', letterSpacing: '-0.025em', margin: '0 0 12px' },
  sub: { fontSize: 17, color: '#5A6478' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 },
  card: { background: 'white', borderRadius: 16, border: '1px solid #E4E8F0', padding: '32px 28px' },
  popular: { position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#0066FF', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: 20, letterSpacing: '0.06em', whiteSpace: 'nowrap' },
  planName: { fontSize: 12, fontWeight: 600, color: '#5A6478', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 },
  price: { fontSize: 44, fontWeight: 300, color: '#0A0F1E', letterSpacing: '-0.03em', lineHeight: 1 },
  curr: { fontSize: 20, verticalAlign: 'super' },
  period: { fontSize: 16, color: '#5A6478', fontWeight: 400 },
  desc: { fontSize: 14, color: '#5A6478', margin: '12px 0 20px', lineHeight: 1.6 },
  hr: { border: 'none', borderTop: '1px solid #E4E8F0', margin: '0 0 20px' },
  features: { listStyle: 'none', padding: 0, margin: '0 0 28px' },
  feat: { fontSize: 14, color: '#0A0F1E', padding: '6px 0' },
  btnPrimary: { width: '100%', padding: 13, borderRadius: 10, border: 'none', background: '#0066FF', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  btnOutline: { display: 'block', width: '100%', padding: 13, borderRadius: 10, border: '1.5px solid #E4E8F0', background: 'transparent', color: '#0A0F1E', fontSize: 15, fontWeight: 500, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' },
  btnOutlineBlue: { width: '100%', padding: 13, borderRadius: 10, border: '1.5px solid #0066FF', background: 'transparent', color: '#0066FF', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  disclaimer: { fontSize: 12, color: '#8A94A6', textAlign: 'center', marginTop: 48, lineHeight: 1.6 },
}