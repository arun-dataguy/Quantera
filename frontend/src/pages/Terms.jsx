import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

const LAST_UPDATED = 'April 2026'

export default function Terms() {
  return (
    <div style={s.root}>
      <nav style={s.nav}>
        <Link to="/" style={s.navBrand}><Logo height={30} /></Link>
        <div style={s.navLinks}>
          <Link to="/privacy" style={s.navLink}>Privacy Policy</Link>
          <Link to="/signup" style={s.navCta}>Get Started Free</Link>
        </div>
      </nav>

      <main style={s.main}>
        <div style={s.header}>
          <p style={s.label}>LEGAL</p>
          <h1 style={s.title}>Terms of Service</h1>
          <p style={s.meta}>Last updated: {LAST_UPDATED} · Effective immediately upon use</p>
        </div>

        <div style={s.disclaimer}>
          <strong>⚠️ Important:</strong> Quantera AI provides trading signals and market data for <strong>educational and informational purposes only</strong>. This is not a regulated financial service. We do not provide financial advice. All trading involves significant risk of loss.
        </div>

        <div style={s.body}>

          <Section title="1. Acceptance of Terms">
            <p>By accessing or using Quantera AI ("the Service", "we", "us", or "our"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.</p>
            <p>Quantera AI is developed as part of an MSc Artificial Intelligence research programme at the University of Leicester and is currently operating in public beta at <strong>quantera.markets</strong>.</p>
          </Section>

          <Section title="2. Description of Service">
            <p>Quantera AI provides:</p>
            <ul>
              <li>AI-generated trading signals for stocks and cryptocurrencies based on technical and sentiment analysis</li>
              <li>A paper trading portfolio (virtual money only — no real funds are held or managed)</li>
              <li>Market intelligence and news aggregation</li>
              <li>Educational tools for understanding market dynamics</li>
            </ul>
            <p><strong>We do not:</strong> hold, manage, or invest real money on behalf of users. We do not execute real trades. We are not a broker, investment adviser, or regulated financial institution.</p>
          </Section>

          <Section title="3. Not Financial Advice">
            <p>All content, signals, analysis, and information provided by Quantera AI is for <strong>informational and educational purposes only</strong>. Nothing on this platform constitutes:</p>
            <ul>
              <li>Investment advice or a recommendation to buy or sell any security</li>
              <li>An offer or solicitation to buy or sell any financial instrument</li>
              <li>Professional financial, legal, or tax advice</li>
            </ul>
            <p>Past performance of any signal, model, or indicator does not guarantee or predict future results. Markets are volatile and unpredictable. You should always consult a qualified financial adviser before making any investment decisions.</p>
          </Section>

          <Section title="4. Risk Disclosure">
            <p>Trading in stocks, cryptocurrencies, and other financial instruments carries significant risk. You may lose some or all of your invested capital. Factors beyond our analysis can affect markets including:</p>
            <ul>
              <li>Economic events, regulatory changes, and geopolitical developments</li>
              <li>Company-specific news and earnings surprises</li>
              <li>Market manipulation and flash crashes</li>
              <li>Liquidity constraints and slippage</li>
            </ul>
            <p>By using our signals, you acknowledge and accept these risks entirely.</p>
          </Section>

          <Section title="5. User Accounts">
            <p>To access certain features, you must create an account. You agree to:</p>
            <ul>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your password and account</li>
              <li>Notify us immediately of any unauthorised account access</li>
              <li>Be responsible for all activities that occur under your account</li>
            </ul>
            <p>You must be at least 18 years old to create an account. By registering, you confirm you meet this requirement.</p>
          </Section>

          <Section title="6. Paper Trading">
            <p>The paper trading portfolio feature uses virtual money only. No real currency is involved. The virtual $10,000 starting balance is fictional and holds no monetary value. Quantera AI does not hold, process, or transmit real funds of any kind.</p>
            <p>Paper trading results do not reflect actual trading outcomes. Real markets involve execution risk, slippage, and costs not replicated in paper trading.</p>
          </Section>

          <Section title="7. Data Sources and Accuracy">
            <p>Our signals are generated using publicly available market data, news APIs, and proprietary machine learning models. We make no warranty regarding the accuracy, completeness, timeliness, or fitness for purpose of any data or signal.</p>
            <p>Data may be delayed, inaccurate, or unavailable during market disruptions. Always verify data from authoritative sources before making decisions.</p>
          </Section>

          <Section title="8. Intellectual Property">
            <p>All content, software, models, and design elements of Quantera AI are the intellectual property of the developer. You may not reproduce, distribute, or create derivative works without prior written permission.</p>
          </Section>

          <Section title="9. Prohibited Uses">
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any unlawful purpose or in violation of applicable laws</li>
              <li>Attempt to reverse-engineer, scrape, or systematically extract data from the platform</li>
              <li>Use automated bots or scripts to access the Service without permission</li>
              <li>Share account credentials or resell access to the Service</li>
              <li>Use signals to manipulate markets or engage in insider trading</li>
            </ul>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>To the fullest extent permitted by law, Quantera AI and its developer shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from:</p>
            <ul>
              <li>Your use of or reliance on our signals or content</li>
              <li>Any trading losses you incur</li>
              <li>Service interruptions or data inaccuracies</li>
              <li>Unauthorised access to your account</li>
            </ul>
            <p>Our total liability to you for any claim shall not exceed the amount you paid us in the 3 months preceding the claim, or £50, whichever is greater.</p>
          </Section>

          <Section title="11. Indemnification">
            <p>You agree to indemnify and hold harmless Quantera AI and its developer from any claims, losses, damages, or expenses arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.</p>
          </Section>

          <Section title="12. Modifications to Terms">
            <p>We reserve the right to update these Terms at any time. We will notify users of material changes via email or in-app notice. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
          </Section>

          <Section title="13. Termination">
            <p>We may suspend or terminate your account at any time for violation of these Terms or for any other reason at our sole discretion. You may delete your account at any time by contacting us.</p>
          </Section>

          <Section title="14. Governing Law">
            <p>These Terms shall be governed by and construed in accordance with the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
          </Section>

          <Section title="15. Third-Party Broker Connectivity">
            <p>Quantera AI may integrate with third-party brokerage and trading infrastructure providers, including <strong>Alpaca Markets Inc.</strong>, to facilitate paper trading simulations and, in future, live order execution for eligible users.</p>
            <ul>
              <li>Any brokerage connectivity is subject to the terms and conditions of the respective broker</li>
              <li>Quantera AI acts solely as a signal and analytics layer — all order execution is handled by the third-party broker</li>
              <li>Users must independently agree to the broker's terms before enabling live trading features</li>
              <li>Quantera AI is not responsible for order execution, fills, rejections, or account actions performed by the broker</li>
            </ul>
            <p>Current integrations: <strong>Alpaca Markets Inc.</strong> (paper trading infrastructure). Live trading features are not yet enabled.</p>
          </Section>

          <Section title="16. Contact">
            <p>For questions about these Terms, please contact us at:<br/>
            <strong>Quantera AI</strong><br/>
            University of Leicester, MSc Artificial Intelligence<br/>
            Website: <a href="https://quantera.markets" style={s.link}>quantera.markets</a><br/>
            Email: <a href="mailto:hello@quantera.markets" style={s.link}>hello@quantera.markets</a></p>
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
  disclaimer: { padding: '16px 20px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, fontSize: 14, color: '#92400e', lineHeight: 1.6, marginBottom: 48 },
  body: { display: 'flex', flexDirection: 'column', gap: 0 },
  section: { paddingBottom: 32, marginBottom: 32, borderBottom: '1px solid #f0f2fa' },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: '#161b2b', margin: '0 0 16px', letterSpacing: '-0.01em' },
  sectionBody: { fontSize: 15, color: '#424656', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 12 },
  link: { color: '#0050cb', textDecoration: 'none' },
  footer: { background: '#f0f2fa', padding: '32px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' },
  footerLinks: { display: 'flex', gap: 28 },
  footerLink: { fontSize: 13, color: '#424656', textDecoration: 'none' },
  footerCopy: { fontSize: 12, color: '#767b93', margin: 0 },
}
