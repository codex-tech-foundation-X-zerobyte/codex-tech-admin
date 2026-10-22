import { useState } from 'react'
import { api, type Role } from '../lib/api'
import { useLoad } from '../lib/useLoad'
import { formatDate } from '../lib/format'

const ROLES: [Role, string][] = [['super_admin', 'Super admin'], ['admin', 'Admin'], ['viewer', 'Viewer']]
const roleName = (r: Role) => ROLES.find((x) => x[0] === r)?.[1] ?? r

export function Team({ meEmail }: { meEmail: string }) {
  const { data, error, loading, reload } = useLoad(() => api.team(), [])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('viewer')
  const [notice, setNotice] = useState('')
  const [confirm, setConfirm] = useState<string | null>(null)

  async function act(fn: () => Promise<unknown>, done: string) {
    setNotice('')
    try { await fn(); setNotice(done); reload() } catch (e) { setNotice((e as Error).message) }
  }
  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    await act(() => api.addMember(email, role), 'Admin added.')
    setEmail('')
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}><h1>Team and roles</h1><span className="mu">Only the super admin can add admins or change roles.</span></div>
      {notice && <div className="msg" role="status">{notice}</div>}
      {error && <div className="msg err" role="alert">{error}</div>}
      <form className="card pad row wrap" style={{ alignItems: 'flex-end', marginBottom: 16 }} onSubmit={add}>
        <div><label htmlFor="te">Account email</label><input id="te" className="in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" required /></div>
        <div><label htmlFor="tr">Role</label><select id="tr" className="in" value={role} onChange={(e) => setRole(e.target.value as Role)}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <button className="btn pri" type="submit">Add admin</button>
        <p className="mu" style={{ flexBasis: '100%', margin: 0, fontSize: 13 }}>The person needs an account first: create the user in Supabase, Authentication, Users. Then add them here.</p>
      </form>
      <div className="card"><div className="tablewrap"><table className="tb">
        <thead><tr><th>Account</th><th>Role</th><th>Last sign in</th><th>Actions</th></tr></thead>
        <tbody>
          {loading && !data && <tr><td colSpan={4}><div className="skel" /></td></tr>}
          {(data ?? []).map((m) => {
            const me = m.email === meEmail
            return (
              <tr key={m.user_id}>
                <td>{m.email}{me && <span className="mu"> (you)</span>}</td>
                <td><span className={`bd${m.role === 'super_admin' ? ' ac' : ''}`}>{roleName(m.role)}</span></td>
                <td className="mono">{m.last_sign_in_at ? formatDate(m.last_sign_in_at) : 'Never'}</td>
                <td>{me ? <span className="mu">Cannot change yourself</span> : (
                  <div className="row">
                    <label className="sr-only" htmlFor={`r-${m.user_id}`}>Role for {m.email}</label>
                    <select id={`r-${m.user_id}`} className="in sm" value={m.role} onChange={(e) => act(() => api.setRole(m.user_id, e.target.value as Role), 'Role updated.')}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                    {confirm === m.user_id ? (
                      <><button className="btn sm danger" type="button" onClick={() => { setConfirm(null); act(() => api.removeMember(m.user_id), 'Admin removed.') }}>Confirm remove</button><button className="btn sm" type="button" onClick={() => setConfirm(null)}>Cancel</button></>
                    ) : <button className="btn sm" type="button" onClick={() => setConfirm(m.user_id)}>Remove</button>}
                  </div>
                )}</td>
              </tr>
            )
          })}
        </tbody>
      </table></div></div>
    </>
  )
}
