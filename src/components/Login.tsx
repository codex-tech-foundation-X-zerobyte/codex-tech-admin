import { useState } from 'react'
import logoUrl from '../assets/logo.svg'
import { supabase, configured } from '../lib/supabase'

export function Login({ notice }: { notice?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (err) setError('Sign in failed. Check your email and password.')
  }

  return (
    <div className="center">
      <div className="card login">
        <div className="lg" style={{ padding: '0 0 20px' }}><img src={logoUrl} alt="" /> Codex Admin</div>
        <h1>Sign in</h1>
        <p className="mu" style={{ margin: '0 0 24px' }}>Authorized staff only.</p>
        {!configured && <div className="msg err" role="alert">Supabase is not configured. Set the VITE_ variables.</div>}
        {notice && <div className="msg err" role="alert">{notice}</div>}
        <form className="stack" onSubmit={submit}>
          <div><label htmlFor="a1">Email</label><input id="a1" className="in" style={{ width: '100%' }} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><label htmlFor="a2">Password</label><input id="a2" className="in" style={{ width: '100%' }} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <button className="btn pri" type="submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
          <p className="msg err" role="alert" hidden={!error} style={{ margin: 0 }}>{error}</p>
        </form>
        <p className="mu" style={{ fontSize: 12, margin: '20px 0 0' }}>Access is logged. Contact the super admin if you need an account.</p>
      </div>
    </div>
  )
}
