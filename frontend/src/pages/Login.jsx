import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, loginWithGoogle } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from || '/dashboard'

  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Link to="/" style={s.logo}>
          <div style={s.logoMark}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <span style={s.logoText}>Quantera</span>
        </Link>

        <h1 style={s.title}>Welcome back</h1>
        <p style={s.sub}>Sign in to access your trading signals</p>

        <button style={s.googleBtn} onClick={loginWithGoogle} type="button">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div style={s.divider}><span style={s.dividerText}>or sign in with email</span></div>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" placeholder="you@example.com"
              value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required autoFocus/>
          </div>
          <div style={s.field}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={s.label}>Password</label>
              <Link to="/forgot-password" style={{ ...s.link, fontSize: 12 }}>Forgot?</Link>
            </div>
            <input style={s.input} type="password" placeholder="Your password"
              value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required/>
          </div>
          {error && <div style={s.error}>{error}</div>}
          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={s.switch}>Don't have an account? <Link to="/signup" style={s.link}>Sign up free</Link></p>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F9FC', padding: 24 },
  card: { background: 'white', borderRadius: 16, border: '1px solid #E4E8F0', padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,102,255,0.06)' },
  logo: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 28 },
  logoMark: { width: 32, height: 32, borderRadius: 8, background: '#0066FF', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 17, fontWeight: 600, color: '#0A0F1E', fontFamily: 'DM Sans, sans-serif' },
  title: { fontSize: 22, fontWeight: 600, color: '#0A0F1E', margin: '0 0 6px', fontFamily: 'DM Sans, sans-serif' },
  sub: { fontSize: 14, color: '#5A6478', margin: '0 0 24px', fontFamily: 'DM Sans, sans-serif' },
  googleBtn: { width: '100%', padding: '11px 16px', borderRadius: 10, border: '1.5px solid #E4E8F0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 14, fontWeight: 500, color: '#0A0F1E', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  divider: { margin: '20px 0', borderTop: '1px solid #E4E8F0', position: 'relative' },
  dividerText: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 12px', fontSize: 12, color: '#8A94A6', fontFamily: 'DM Sans, sans-serif', top: -10 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: '#374151', fontFamily: 'DM Sans, sans-serif' },
  input: { padding: '10px 13px', borderRadius: 8, border: '1.5px solid #E4E8F0', fontSize: 14, color: '#0A0F1E', fontFamily: 'DM Sans, sans-serif', outline: 'none', background: 'white' },
  error: { background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626', fontFamily: 'DM Sans, sans-serif' },
  btn: { padding: 12, borderRadius: 10, border: 'none', background: '#0066FF', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  switch: { fontSize: 14, color: '#5A6478', marginTop: 16, textAlign: 'center', fontFamily: 'DM Sans, sans-serif' },
  link: { color: '#0066FF', textDecoration: 'none', fontWeight: 500 },
}