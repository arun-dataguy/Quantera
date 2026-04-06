import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

export default function AlpacaConnect() {
  const [connecting, setConnecting] = useState(false)

  const handleConnect = () => {
    setConnecting(true)
    // Alpaca OAuth URL — replace CLIENT_ID with your Alpaca app client ID
    const ALPACA_CLIENT_ID = import.meta.env.VITE_ALPACA_CLIENT_ID || 'YOUR_ALPACA_CLIENT_ID'
    const REDIRECT_URI = encodeURIComponent(`${window.location.origin}/alpaca/callback`)
    const url = `https://app.alpaca.markets/oauth/authorize?response_type=code&client_id=${ALPACA_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=account:write%20trading`
    window.location.href = url
  }

  return (
    <div style={s.page}>
      <div style={s.blobTop} />
      <div style={s.blobBottom} />

      <div style={s.card}>
        {/* Header */}
        <div style={s.header}>
          <Logo height={36} />
          <div style={s.plus}>+</div>
          <img
            src="https://files.alpaca.markets/webassets/alpaca_wordmark.svg"
            alt="Alpaca"
            height={28}
            style={{ opacity: 0.85 }}
            onError={e => { e.target.style.display = 'none' }}
          />
        </div>

        <h1 style={s.title}>Connect your Alpaca account</h1>
        <p style={s.subtitle}>
          Enable live and paper trading directly from Quantera AI using your Alpaca brokerage account.
        </p>

        {/* Permissions */}
        <div style={s.permBox}>
          <p style={s.permTitle}>Quantera will be able to:</p>
          <ul style={s.permList}>
            <li style={s.permItem}>
              <span style={s.check}>✓</span>
              View your Alpaca account information and balances
            </li>
            <li style={s.permItem}>
              <span style={s.check}>✓</span>
              Place buy and sell orders at your direction
            </li>
            <li style={s.permItem}>
              <span style={s.check}>✓</span>
              View your portfolio positions and order history
            </li>
          </ul>
        </div>

        {/* Required Alpaca Disclosure */}
        <div style={s.disclosure}>
          <p style={s.disclosureTitle}>Authorization Disclosure</p>
          <p style={s.disclosureText}>
            By allowing <strong>Quantera</strong> to access your Alpaca account, you are granting{' '}
            <strong>Quantera</strong> access to your account information and authorization to place
            transactions in your account at your direction. Alpaca does not warrant or guarantee
            that <strong>Quantera</strong> will work as advertised or expected. Before authorizing,{' '}
            <a href="https://quantera.markets" style={s.disclosureLink} target="_blank" rel="noopener noreferrer">
              learn more about Quantera
            </a>.
          </p>
        </div>

        {/* CTA */}
        <button
          style={{ ...s.btn, opacity: connecting ? 0.75 : 1 }}
          onClick={handleConnect}
          disabled={connecting}
        >
          {connecting ? 'Redirecting to Alpaca…' : 'Authorize Quantera'}
        </button>

        <p style={s.cancel}>
          <Link to="/dashboard" style={s.cancelLink}>Cancel — return to Dashboard</Link>
        </p>

        {/* Legal footer */}
        <p style={s.legal}>
          Quantera AI is not a registered broker-dealer or investment adviser. All trading activity
          via Alpaca is subject to{' '}
          <a href="https://alpaca.markets/legal/customer-agreement" style={s.legalLink} target="_blank" rel="noopener noreferrer">
            Alpaca's Customer Agreement
          </a>. Paper trading involves no real money.
          See our <Link to="/terms" style={s.legalLink}>Terms of Service</Link> and{' '}
          <Link to="/privacy" style={s.legalLink}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#f2f3ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 16px',
    fontFamily: 'Inter, sans-serif',
    position: 'relative',
    overflow: 'hidden',
  },
  blobTop: {
    position: 'fixed', top: '-10%', left: '-5%', width: '40%', height: '40%',
    background: 'rgba(0,80,203,0.06)', borderRadius: '50%', filter: 'blur(120px)',
    pointerEvents: 'none', zIndex: 0,
  },
  blobBottom: {
    position: 'fixed', bottom: '-10%', right: '-5%', width: '50%', height: '50%',
    background: 'rgba(109,252,183,0.08)', borderRadius: '50%', filter: 'blur(120px)',
    pointerEvents: 'none', zIndex: 0,
  },
  card: {
    position: 'relative', zIndex: 1,
    width: '100%', maxWidth: 480,
    background: '#ffffff',
    borderRadius: 16,
    padding: '40px 36px',
    boxShadow: '0 32px 64px rgba(0,84,214,0.07)',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center',
    paddingBottom: 20,
    borderBottom: '1px solid #eceef5',
  },
  plus: {
    fontSize: 22, color: '#c2c6d8', fontWeight: 300, lineHeight: 1,
  },
  title: {
    fontSize: 22, fontWeight: 800, color: '#161b2b',
    margin: 0, letterSpacing: '-0.02em', textAlign: 'center',
  },
  subtitle: {
    fontSize: 14, color: '#424656', lineHeight: 1.6,
    margin: 0, textAlign: 'center',
  },
  permBox: {
    background: '#f7f8ff',
    border: '1px solid #e8eaf5',
    borderRadius: 10,
    padding: '16px 20px',
  },
  permTitle: {
    fontSize: 11, fontWeight: 700, color: '#767b93',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    margin: '0 0 10px',
  },
  permList: { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 },
  permItem: { fontSize: 14, color: '#424656', display: 'flex', alignItems: 'flex-start', gap: 10 },
  check: { color: '#16a34a', fontWeight: 700, fontSize: 13, flexShrink: 0, marginTop: 1 },
  disclosure: {
    background: '#fffbeb',
    border: '1px solid #fcd34d',
    borderRadius: 10,
    padding: '14px 18px',
  },
  disclosureTitle: {
    fontSize: 11, fontWeight: 700, color: '#92400e',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    margin: '0 0 6px',
  },
  disclosureText: {
    fontSize: 13, color: '#78350f', lineHeight: 1.65, margin: 0,
  },
  disclosureLink: { color: '#b45309', fontWeight: 600 },
  btn: {
    width: '100%', height: 48,
    background: 'linear-gradient(135deg, #0050cb 0%, #0066ff 100%)',
    border: 'none', borderRadius: 10,
    color: 'white', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    transition: 'opacity 0.2s',
  },
  cancel: { margin: 0, textAlign: 'center' },
  cancelLink: { fontSize: 13, color: '#767b93', textDecoration: 'none' },
  legal: {
    fontSize: 11, color: '#9ca3af', lineHeight: 1.6,
    margin: 0, textAlign: 'center',
    borderTop: '1px solid #f0f2fa', paddingTop: 16,
  },
  legalLink: { color: '#9ca3af', textDecoration: 'underline' },
}
