import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Disclaimer from './components/Disclaimer'
import { ProtectedRoute } from './components/ProtectedRoute'
import Landing     from './pages/Landing'
import Login       from './pages/Login'
import Signup      from './pages/Signup'
import Dashboard   from './pages/Dashboard'
import Crypto      from './pages/Crypto'
import Intel       from './pages/Intel'
import Pricing     from './pages/Pricing'
import Billing     from './pages/Billing'
import Portfolio from './pages/Portfolio'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import AuthCallback from './pages/AuthCallback'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Disclaimer />
        <Routes>
          {/* Public */}
          <Route path="/"              element={<Landing />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/signup"        element={<Signup />} />
          <Route path="/pricing"       element={<Pricing />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}/>
          <Route path="/crypto"    element={<ProtectedRoute><Crypto /></ProtectedRoute>}/>
          <Route path="/intel"     element={<ProtectedRoute><Intel /></ProtectedRoute>}/>
          <Route path="/billing"   element={<ProtectedRoute><Billing /></ProtectedRoute>}/>
          <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>}/>

          {/* Legal */}
          <Route path="/terms"   element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
