import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children, requirePlan = null }) {
  const { user, loading, isPro, isPremium } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F9FC' }}>
        <div style={{ textAlign: 'center', fontFamily: 'DM Sans, sans-serif' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #E4E8F0', borderTopColor: '#0066FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}/>
          <p style={{ color: '#5A6478', fontSize: 14 }}>Loading…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (requirePlan === 'pro' && !isPro) return <Navigate to="/pricing" replace />
  if (requirePlan === 'premium' && !isPremium) return <Navigate to="/pricing" replace />

  return children
}