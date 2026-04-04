import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthCallback() {
  const { handleOAuthCallback } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const access  = params.get('access_token')
    const refresh = params.get('refresh_token')
    if (access) {
      handleOAuthCallback(access, refresh)
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/login?error=oauth_failed', { replace: true })
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F9FC' }}>
      <div style={{ textAlign: 'center', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #E4E8F0', borderTopColor: '#0066FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}/>
        <p style={{ color: '#5A6478', fontSize: 14 }}>Completing sign in…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}