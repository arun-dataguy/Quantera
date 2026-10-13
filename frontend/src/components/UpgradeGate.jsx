import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const PLAN_LABELS = { pro: 'Pro', premium: 'Premium' }
const PLAN_PRICES = { pro: '$9.99/mo', premium: '$25/mo' }
const PLAN_FEATURES = {
  pro: ['All 58 stock signals', 'Full confidence & sentiment data', 'Paper trading portfolio'],
  premium: ['Everything in Pro', 'Crypto signals (BTC, ETH, SOL…)', 'Backtesting engine'],
}

export default function UpgradeGate({ requiredPlan = 'pro', feature = 'this feature' }) {
  const { apiFetch } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: requiredPlan }),
      })
      window.location.href = data.checkout_url
    } catch (err) { alert(err.message) }
    finally { setLoading(false) }
  }

  const label = PLAN_LABELS[requiredPlan] || requiredPlan
  const price = PLAN_PRICES[requiredPlan] || ''
  const features = PLAN_FEATURES[requiredPlan] || []

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 24px', textAlign: 'center',
    }}>
      <div style={{
        maxWidth: 420, background: '#fff', borderRadius: 16,
        border: '1.5px solid #E4E8F0', padding: '40px 36px',
        boxShadow: '0 4px 24px rgba(0,80,203,0.06)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0D1B3E', margin: '0 0 8px' }}>
          {label} Plan Required
        </h2>
        <p style={{ fontSize: 14, color: '#5A6478', margin: '0 0 24px', lineHeight: 1.6 }}>
          Upgrade to <strong>{label}</strong> ({price}) to access {feature}.
        </p>
        <ul style={{ textAlign: 'left', paddingLeft: 20, margin: '0 0 28px', color: '#3B4A6B', fontSize: 14, lineHeight: 2 }}>
          {features.map(f => <li key={f}>{f}</li>)}
        </ul>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #0050cb 0%, #1a7aff 100%)',
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Redirecting…' : `Upgrade to ${label}`}
        </button>
      </div>
    </div>
  )
}
