import { useEffect, useState } from 'react'
import MaterialSymbol from '../components/MaterialSymbol.jsx'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function LoginPage({ onSignIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaId, setCaptchaId] = useState('')
  const [captchaImage, setCaptchaImage] = useState('')
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshingCaptcha, setRefreshingCaptcha] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const loadCaptcha = async () => {
    setRefreshingCaptcha(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/auth/captcha`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Unable to load captcha.')
      }
      const data = await response.json()
      setCaptchaId(data.captcha_id)
      setCaptchaImage(data.image_data)
    } catch (err) {
      setError(err.message || 'Unable to load captcha.')
    } finally {
      setRefreshingCaptcha(false)
    }
  }

  useEffect(() => {
    loadCaptcha()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          captcha_id: captchaId,
          captcha_answer: captchaAnswer,
        }),
      })

      if (!response.ok) {
        const detail = await response.json().catch(() => ({ detail: 'Login failed.' }))
        throw new Error(detail.detail || 'Login failed.')
      }

      const data = await response.json()
      window.localStorage.setItem('access_token', data.access_token)
      onSignIn()
    } catch (err) {
      setError(err.message || 'Login failed.')
      loadCaptcha()
    } finally {
      setLoading(false)
      setCaptchaAnswer('')
    }
  }

  return (
    <div className="h-screen grid place-items-center overflow-hidden px-4">
      <div className="w-full max-w-[1200px] h-[calc(100vh-32px)] grid lg:grid-cols-2 rounded-[24px] overflow-hidden bg-card shadow-[0_25px_60px_rgba(31,77,62,0.18)]">
        <aside className="relative px-10 py-10 text-white flex flex-col gap-8 bg-gradient-to-br from-primary to-accent">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.18),transparent_45%)]"></div>
            <div className="absolute inset-[16%_12%_18%_12%] rounded-[28px] border border-white/15 bg-[linear-gradient(120deg,rgba(255,255,255,0.18),rgba(255,255,255,0))] shadow-[inset_0_0_80px_rgba(0,0,0,0.45)]"></div>
            <div className="absolute inset-[8%_22%_10%_22%] rounded-[22px] border border-white/10 shadow-[inset_0_0_40px_rgba(0,0,0,0.55)]"></div>
          </div>

          <header className="relative z-10 flex items-center gap-3">
            <span className="icon-crest icon-crest--brand icon-crest--compact h-9 w-9 rounded-xl bg-white/15 text-gold flex items-center justify-center backdrop-blur">
              <MaterialSymbol name="spa" className="text-[20px]" filled />
            </span>
            <div>
              <p className="font-heading text-lg tracking-[0.6px]">Movi Cloud Spa</p>
              <p className="text-[11px] uppercase tracking-[1.2px] text-white/70">
                Zen-modern sanctuary
              </p>
            </div>
          </header>

          <div className="relative z-10 space-y-4">
            <h1 className="text-[38px] leading-tight">
              Luxury Spa <em className="font-heading italic">Management</em> System
            </h1>
            <p className="text-[15px] text-white/80 max-w-[360px]">
              The definitive operating system for high-end wellness sanctuaries.
              Orchestrating tranquility through intelligent scheduling and
              concierge automation.
            </p>
          </div>

          <div className="relative z-10 mt-auto grid grid-cols-2 gap-3">
            {[
              {
                title: '99.9% reliable',
                subtitle: 'Uptime guaranteed',
                icon: <MaterialSymbol name="verified_user" className="text-[16px]" />,
              },
              {
                title: '24/7 concierge',
                subtitle: 'Priority tech support',
                icon: <MaterialSymbol name="support_agent" className="text-[16px]" />,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur"
              >
                <span className="icon-crest icon-crest--metric icon-crest--compact h-7 w-7 rounded-full bg-[radial-gradient(circle,_#f0d7b0,_#c8a97e)] text-[#1f4d3e] shadow-[0_0_0_6px_rgba(200,169,126,0.18)] flex items-center justify-center">
                  {item.icon}
                </span>
                <div>
                  <p className="text-[12px] uppercase tracking-[1px]">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-white/70">{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="bg-soft px-10 py-5 grid h-full grid-rows-[1fr_auto_auto] items-center gap-2">
          <div className="w-full max-w-[460px] justify-self-center rounded-[24px] bg-white/95 p-6 shadow-soft">
            <div className="space-y-2 text-center">
              <h2 className="text-[30px]">Welcome Back</h2>
              <p className="text-[14px] text-muted">
                Enter your credentials to access the management dashboard.
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-[11px] uppercase tracking-[1px] text-muted">
                Email address
                <input
                  type="email"
                  placeholder="admin@spa.com"
                  aria-label="Email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 h-10 w-full rounded-[18px] border border-primary/15 bg-white px-4 text-[14px] text-heading shadow-[0_8px_16px_rgba(31,77,62,0.06)] transition"
                  required
                />
              </label>

              <label className="block text-[11px] uppercase tracking-[1px] text-muted">
                Password
                <div className="relative mt-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="************"
                    aria-label="Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-10 w-full rounded-[18px] border border-primary/15 bg-white px-4 pr-12 text-[14px] text-heading shadow-[0_8px_16px_rgba(31,77,62,0.06)] transition"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    <MaterialSymbol name={showPassword ? 'visibility_off' : 'visibility'} className="text-[20px]" />
                  </button>
                </div>
              </label>

              <label className="block text-[11px] uppercase tracking-[1px] text-muted">
                Captcha
                <div className="mt-2 captcha-row">
                  <input
                    type="text"
                    inputMode="text"
                    placeholder="Enter text"
                    aria-label="Captcha answer"
                    value={captchaAnswer}
                    onChange={(event) => setCaptchaAnswer(event.target.value)}
                    className="h-10 w-full rounded-[18px] border border-primary/15 bg-white px-4 text-center text-[14px] text-heading shadow-[0_8px_16px_rgba(31,77,62,0.06)] transition"
                    required
                  />
                  <div className="captcha-cluster">
                    <div className="captcha-card">
                      {captchaImage ? (
                        <img
                          src={captchaImage}
                          alt="Captcha"
                          className="captcha-image"
                        />
                      ) : (
                        <span className="text-muted">Loading...</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="captcha-refresh"
                      onClick={loadCaptcha}
                      aria-label="Refresh captcha"
                      disabled={refreshingCaptcha}
                    >
                      <MaterialSymbol name="refresh" className="text-[16px]" />
                    </button>
                  </div>
                </div>
              </label>

              <div className="flex items-center justify-between text-[12px] text-muted">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-primary" />
                  Remember me
                </label>
                <button type="button" className="text-accent">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="h-11 w-full rounded-full bg-gradient-to-br from-primary to-accent text-[12px] uppercase tracking-[1.2px] text-white shadow-[0_18px_28px_rgba(31,77,62,0.28)] transition-all duration-300 hover:scale-[1.02]"
                disabled={loading}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {loading ? 'Signing in...' : 'Sign in to dashboard'}
                  <MaterialSymbol name="arrow_right_alt" className="text-[16px]" />
                </span>
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-[10px] uppercase tracking-[1.2px] text-muted">
                Secured by serenity protocols
              </p>
              <div className="mt-3 flex justify-center gap-3">
                {[
                  <MaterialSymbol name="lock" className="text-[14px]" key="lock" />,
                  <MaterialSymbol name="policy" className="text-[14px]" key="policy" />,
                  <MaterialSymbol name="verified_user" className="text-[14px]" key="secure" />,
                ].map((icon, index) => (
                  <span
                    key={`secure-${index}`}
                    className="icon-crest icon-crest--security icon-crest--compact h-6 w-6 rounded-full border border-primary/10 bg-white text-primary flex items-center justify-center"
                  >
                    {icon}
                  </span>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[1px] text-muted mb-2">Demo Credentials</p>
                <p className="text-[11px] text-heading font-medium">Email: <span className="font-mono">admin@spa.com</span></p>
                <p className="text-[11px] text-heading font-medium">Password: <span className="font-mono">Admin123</span></p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] uppercase tracking-[1px] text-muted">
            <a className="transition-colors hover:text-primary" href="#privacy">
              Privacy policy
            </a>
            <a className="transition-colors hover:text-primary" href="#terms">
              Terms of service
            </a>
            <a className="transition-colors hover:text-primary" href="#support">
              Contact support
            </a>
          </div>

          <p className="text-center text-[11px] text-muted">
            2024 Serenity Sanctuary. All rights reserved.
          </p>
        </main>
      </div>
    </div>
  )
}
