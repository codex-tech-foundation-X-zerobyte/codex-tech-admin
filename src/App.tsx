import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { api, type Role } from './lib/api'
import { Login } from './components/Login'
import { Layout } from './components/Layout'
import { Overview } from './pages/Overview'
import { Waitlist } from './pages/Waitlist'
import { Team } from './pages/Team'
import { Audit } from './pages/Audit'

function useHash() {
  const [hash, setHash] = useState(window.location.hash || '#/overview')
  useEffect(() => {
    const on = () => setHash(window.location.hash || '#/overview')
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const [path, query = ''] = hash.slice(1).split('?')
  return { path: path || '/overview', params: new URLSearchParams(query) }
}

type State = { kind: 'loading' } | { kind: 'out'; notice?: string } | { kind: 'in'; role: Role; email: string }

export default function App() {
  const [state, setState] = useState<State>({ kind: 'loading' })
  const { path, params } = useHash()

  useEffect(() => {
    async function resolve(session: Session | null) {
      if (!session) return setState({ kind: 'out' })
      try {
        const role = await api.me()
        if (!role) {
          await supabase.auth.signOut()
          return setState({ kind: 'out', notice: 'This account does not have admin access.' })
        }
        setState({ kind: 'in', role, email: session.user.email ?? '' })
      } catch {
        setState({ kind: 'out', notice: 'Could not verify your access. Try again.' })
      }
    }
    supabase.auth.getSession().then(({ data }) => resolve(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { void resolve(session) })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (state.kind === 'loading') return <div className="center mu" role="status">Loading...</div>
  if (state.kind === 'out') return <Login notice={state.notice} />

  const { role, email } = state
  let page
  if (path === '/team' && role === 'super_admin') page = <Team meEmail={email} />
  else if (path === '/audit' && role !== 'viewer') page = <Audit />
  else if (path === '/waitlist') page = <Waitlist role={role} params={params} />
  else page = <Overview />

  return (
    <Layout path={['/team', '/audit', '/waitlist'].includes(path) ? path : '/overview'} role={role} email={email} onSignOut={() => supabase.auth.signOut()}>
      {page}
    </Layout>
  )
}
