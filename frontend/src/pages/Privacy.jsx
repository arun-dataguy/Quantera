import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

const LAST_UPDATED = 'April 2026'

export default function Privacy() {
  return (
    <div style={s.root}>
      <nav style={s.nav}>
        <Link to="/" style={s.navBrand}><Logo height={30} /></Link>
        <div style={s.navLinks}>
          <Link to="/terms"  style={s.navLink}>Terms of Service</Link>
          <Link to="/signup" style={s.navCta}>Get Started Free</Link>
        </div>
      </nav>

      <main style={s.main}>
        <div style={s.header}>
          <p style={s.label}>LEGAL</p>
          <h1 style={s.title}>Privacy Policy</h1>
          <p style={s.meta}>Last updated: {LAST_UPDATED} · Applies to all Quantera AI users</p>
        </div>

        <div style={s.gdprBadge}>
          <span style={s.gdprIcon}>🔒</span>
          <div>
            <p style={s.gdprTitle}>GDPR Compliant</p>
            <p style={s.gdprText}>We are committed to protecting your personal data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.</p>
          </div>
        </div>

        <div style={s.body}>

          <Section title="1. Who We Are">
            <p>Quantera AI ("we", "us", "our") is developed as part of an MSc Artificial Intelligence research programme at the University of Leicester, United Kingdom, and operates the platform at <strong>quantera.markets</strong>. We are the data controller responsible for your personal data.</p>
            <p>Contact: <a href="mailto:hello@quantera.markets" style={s.link}>hello@quantera.markets</a> · <a href="https://quantera.markets" style={s.link}>quantera.markets</a></p>
          </Section>

          <Section title="2. What Data We Collect">
            <p>We collect the following categories of personal data:</p>

            <p><strong>Account Data (provided by you):</strong></p>
            <ul>
              <li>Full name and email address (on registration)</li>
              <li>Password (stored as a bcrypt hash — we never store plain-text passwords)</li>
              <li>Google account details if you use Google Sign-In (name, email, profile picture URL)</li>
            </ul>

            <p><strong>Usage Data (collected automatically):</strong></p>
            <ul>
              <li>IP address and browser user agent (for security and fraud prevention)</li>
              <li>Pages visited and features used within the platform</li>
              <li>Authentication session tokens (stored in your browser's localStorage)</li>
            </ul>

            <p><strong>Paper Trading Data:</strong></p>
            <ul>
              <li>Virtual portfolio positions and trade history (these involve no real money)</li>
            </ul>

            <p><strong>Payment Data (Stripe):</strong></p>
            <ul>
              <li>We use Stripe to process subscription payments. We never see or store your card details. Stripe is PCI-DSS compliant. We store only your Stripe customer ID and subscription status.</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Data">
            <p>We use your personal data to:</p>
            <ul>
              <li>Create and manage your account</li>
              <li>Provide access to trading signals and platform features</li>
              <li>Process subscription payments via Stripe</li>
              <li>Detect and prevent fraud, abuse, and unauthorised access</li>
              <li>Send transactional emails (account verification, password reset)</li>
              <li>Improve the platform based on usage patterns (in aggregate, anonymised form)</li>
              <li>Comply with legal obligations</li>
            </ul>
          </Section>

          <Section title="4. Legal Basis for Processing">
            <p>Under UK GDPR, we process your data on the following legal bases:</p>
            <ul>
              <li><strong>Contract performance</strong> — to provide the service you signed up for</li>
              <li><strong>Legitimate interests</strong> — security, fraud prevention, service improvement</li>
              <li><strong>Legal obligation</strong> — compliance with applicable law</li>
              <li><strong>Consent</strong> — for any optional marketing communications (you can withdraw at any time)</li>
            </ul>
          </Section>

          <Section title="5. Data Sharing">
            <p>We do not sell your personal data. We share data only with:</p>
            <ul>
              <li><strong>Stripe Inc.</strong> — payment processing (PCI-DSS compliant, USA, Standard Contractual Clauses apply)</li>
              <li><strong>Railway.app</strong> — backend hosting and database (data processed in their infrastructure)</li>
              <li><strong>Vercel Inc.</strong> — frontend hosting (USA, Standard Contractual Clauses apply)</li>
              <li><strong>Google LLC</strong> — if you use Google Sign-In (subject to Google's Privacy Policy)</li>
              <li><strong>NewsAPI</strong> — we make server-side requests for news data; no personal data is shared</li>
              <li><strong>Alpaca Markets Inc.</strong> — third-party brokerage infrastructure for paper trading simulation. When broker connectivity is enabled, your account identifier may be shared with Alpaca to facilitate order routing. Alpaca's own privacy policy applies to data processed on their platform. No personal financial data beyond what is necessary for order execution is shared.</li>
            </ul>
            <p>We may disclose data to law enforcement if required by law or legal process.</p>
          </Section>

          <Section title="6. Data Retention">
            <p>We retain your data for as long as your account is active. If you delete your account:</p>
            <ul>
              <li>Account data is deleted within 30 days</li>
              <li>Paper trading history is deleted immediately</li>
              <li>Anonymised, aggregated usage data may be retained for research purposes</li>
              <li>Payment records may be retained for up to 7 years for legal/tax compliance</li>
            </ul>
          </Section>

          <Section title="7. Your Rights Under UK GDPR">
            <p>You have the following rights regarding your personal data:</p>
            <ul>
              <li><strong>Right of access</strong> — request a copy of the data we hold about you</li>
              <li><strong>Right to rectification</strong> — correct inaccurate or incomplete data</li>
              <li><strong>Right to erasure</strong> — request deletion of your data ("right to be forgotten")</li>
              <li><strong>Right to restrict processing</strong> — limit how we use your data</li>
              <li><strong>Right to data portability</strong> — receive your data in a machine-readable format</li>
              <li><strong>Right to object</strong> — object to processing based on legitimate interests</li>
              <li><strong>Right to withdraw consent</strong> — at any time, where processing is consent-based</li>
            </ul>
            <p>To exercise any of these rights, email us at <a href="mailto:hello@quantera.markets" style={s.link}>hello@quantera.markets</a>. We will respond within 30 days.</p>
            <p>You have the right to lodge a complaint with the <strong>Information Commissioner's Office (ICO)</strong> at ico.org.uk if you believe we have mishandled your data.</p>
          </Section>

          <Section title="8. Cookies and Local Storage">
            <p>We use browser <strong>localStorage</strong> (not traditional cookies) to store authentication tokens. These are:</p>
            <ul>
              <li><code style={s.code}>q_access</code> — your session access token (expires in 15–60 minutes)</li>
              <li><code style={s.code}>q_refresh</code> — your refresh token (expires in 7 days)</li>
            </ul>
            <p>These are strictly necessary for the service to function. We do not currently use tracking, advertising, or analytics cookies. If we introduce analytics in the future, we will update this policy and notify you in advance.</p>
          </Section>

          <Section title="9. Security">
            <p>We take data security seriously. Measures we employ include:</p>
            <ul>
              <li>Passwords hashed with bcrypt (industry standard, no plain-text storage)</li>
              <li>JWT tokens for stateless authentication with short expiry windows</li>
              <li>HTTPS enforced on all connections (via Vercel and Railway)</li>
              <li>Refresh token rotation to limit exposure from token theft</li>
              <li>Database credentials stored as encrypted environment variables</li>
            </ul>
            <p>No security system is perfect. In the event of a data breach affecting your rights, we will notify you within 72 hours as required by UK GDPR.</p>
          </Section>

          <Section title="10. International Transfers">
            <p>Some of our service providers (Stripe, Vercel, Railway) process data outside the UK/EEA. Where this occurs, we rely on:</p>
            <ul>
              <li>Standard Contractual Clauses (SCCs) approved by the UK ICO</li>
              <li>Adequacy decisions where applicable</li>
            </ul>
          </Section>

          <Section title="11. Children's Privacy">
            <p>Quantera AI is not directed at persons under 18 years of age. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us immediately.</p>
          </Section>

          <Section title="12. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification at least 14 days before changes take effect. The updated date at the top of this page reflects the latest revision.</p>
          </Section>

          <Section title="13. Contact Us">
            <p>For any privacy-related queries or to exercise your rights:</p>
            <p>
              <strong>Quantera AI Research Project</strong><br/>
              University of Leicester, MSc Artificial Intelligence<br/>
              Email: <a href="mailto:hello@quantera.markets" style={s.link}>hello@quantera.markets</a>
            </p>
            <p>We aim to respond to all requests within 30 days.</p>
          </Section>

        </div>
      </main>

      <footer style={s.footer}>
        <Logo height={24} />
        <div style={s.footerLinks}>
          <Link to="/terms"   style={s.footerLink}>Terms of Service</Link>
          <Link to="/privacy" style={s.footerLink}>Privacy Policy</Link>
          <Link to="/"        style={s.footerLink}>Home</Link>
        </div>
        <p style={s.footerCopy}>© {new Date().getFullYear()} Quantera AI. Student Research Project. Not a regulated financial service.</p>
      </footer>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section style={s.section}>
      <h2 style={s.sectionTitle}>{title}</h2>
      <div style={s.sectionBody}>{children}</div>
    </section>
  )
}

const s = {
  root: { minHeight: '100vh', background: '#faf8ff', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' },
  nav: { position: 'sticky', top: 0, zIndex: 50, background: '#faf8ff', borderBottom: '1px solid #eceef5', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' },
  navBrand: { textDecoration: 'none', display: 'flex', alignItems: 'center' },
  navLinks: { display: 'flex', alignItems: 'center', gap: 24 },
  navLink: { fontSize: 14, color: '#424656', textDecoration: 'none', fontWeight: 500 },
  navCta: { padding: '8px 18px', borderRadius: 8, background: '#0050cb', color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none' },
  main: { maxWidth: 780, margin: '0 auto', padding: '60px 32px 80px', flex: 1, width: '100%' },
  header: { marginBottom: 40, paddingBottom: 32, borderBottom: '1px solid #eceef5' },
  label: { fontSize: 11, fontWeight: 700, color: '#0050cb', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' },
  title: { fontSize: 40, fontWeight: 800, color: '#161b2b', margin: '0 0 12px', letterSpacing: '-0.03em' },
  meta: { fontSize: 13, color: '#767b93', margin: 0 },
  gdprBadge: { display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, marginBottom: 48 },
  gdprIcon: { fontSize: 20, flexShrink: 0, marginTop: 2 },
  gdprTitle: { fontSize: 14, fontWeight: 700, color: '#1e40af', margin: '0 0 4px' },
  gdprText: { fontSize: 13, color: '#1d4ed8', lineHeight: 1.6, margin: 0 },
  body: { display: 'flex', flexDirection: 'column', gap: 0 },
  section: { paddingBottom: 32, marginBottom: 32, borderBottom: '1px solid #f0f2fa' },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: '#161b2b', margin: '0 0 16px', letterSpacing: '-0.01em' },
  sectionBody: { fontSize: 15, color: '#424656', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 12 },
  link: { color: '#0050cb', textDecoration: 'none' },
  code: { fontFamily: 'monospace', background: '#f0f2fa', padding: '1px 6px', borderRadius: 4, fontSize: 13, color: '#0050cb' },
  footer: { background: '#f0f2fa', padding: '32px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' },
  footerLinks: { display: 'flex', gap: 28 },
  footerLink: { fontSize: 13, color: '#424656', textDecoration: 'none' },
  footerCopy: { fontSize: 12, color: '#767b93', margin: 0 },
}
