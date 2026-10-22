import { useState, type ReactNode } from 'react'
import logoUrl from '../assets/logo.svg'
import { getTheme, setTheme, type Theme } from '../lib/theme'
import type { Role } from '../lib/api'

const ROLE_LABEL: Record<Role, string> = { super_admin: 'Super admin', admin: 'Admin', viewer: 'Viewer' }

type Props = { path: string; role: Role; email: string; onSignOut: () => void; children: ReactNode }

export function Layout({ path, role, email, onSignOut, children }: Props) {
  const [theme, setT] = useState<Theme>(getTheme())
  const items: [string, string, boolean][] = [
    ['#/overview', 'Overview', true],
    ['#/waitlist', 'Waitlist', true],
    ['#/team', 'Team and roles', role === 'super_admin'],
    ['#/audit', 'Audit log', role !== 'viewer'],
  ]
  function toggle() { const n: Theme = theme === 'light' ? 'dark' : 'light'; setTheme(n); setT(n) }
  function search(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = String(new FormData(e.currentTarget).get('q') ?? '').trim()
    window.location.hash = q ? `#/waitlist?q=${encodeURIComponent(q)}` : '#/waitlist'
  }
  return (
    <div className="app">
      <aside className="sb">
        <div className="lg"><img src={logoUrl} alt="" /> Codex Admin</div>
        <nav aria-label="Main" style={{ display: 'contents' }}>
          {items.filter((i) => i[2]).map(([href, name]) => (
            <a key={href} className={`ni${path === href.slice(1) ? ' cur' : ''}`} href={href} aria-current={path === href.slice(1) ? 'page' : undefined}>{name}</a>
          ))}
        </nav>
        <div className="grp">Platform</div>
        <span className="ni dis">Monitor (not yet shipped)</span>
        <span className="ni dis">Mail (not yet shipped)</span>
      </aside>
      <div className="main">
        <header className="top">
          <form onSubmit={search} role="search">
            <label className="sr-only" htmlFor="q">Search emails</label>
            <input id="q" name="q" className="in" style={{ width: 320, maxWidth: '100%' }} placeholder="Search emails" />
          </form>
          <div className="row wrap">
            <button className="btn sm" type="button" onClick={toggle}>Theme: {theme === 'light' ? 'Light' : 'Dark'}</button>
            <span className="mu">{email} ({ROLE_LABEL[role]})</span>
            <button className="btn sm" type="button" onClick={onSignOut}>Sign out</button>
          </div>
        </header>
        <main className="ct">{children}</main>
      </div>
    </div>
  )
}
