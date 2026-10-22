import { useState } from 'react'
import { api } from '../lib/api'
import { useLoad } from '../lib/useLoad'
import { formatDate } from '../lib/format'
import { Pagination } from '../components/Pagination'

const ACTIONS: Record<string, string> = {
  'waitlist.status': 'Changed signup status', 'waitlist.delete': 'Deleted signup', 'waitlist.export': 'Exported waitlist CSV',
  'team.add': 'Added admin', 'team.role': 'Changed role', 'team.remove': 'Removed admin',
}

export function Audit() {
  const [page, setPage] = useState(1)
  const size = 25
  const { data, error, loading } = useLoad(() => api.audit(size, (page - 1) * size), [page])
  const rows = data?.rows ?? []
  return (
    <>
      <div style={{ marginBottom: 20 }}><h1>Audit log</h1><span className="mu">Every sensitive admin action is recorded. Times are local to your browser.</span></div>
      {error && <div className="msg err" role="alert">{error}</div>}
      <div className="card">
        <div className="tablewrap"><table className="tb">
          <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th></tr></thead>
          <tbody>
            {loading && rows.length === 0 && <tr><td colSpan={4}><div className="skel" /></td></tr>}
            {rows.map((r) => <tr key={r.id}><td className="mono">{formatDate(r.at)}</td><td>{r.actor_email ?? 'Unknown'}</td><td>{ACTIONS[r.action] ?? r.action}</td><td>{r.target ?? ''}</td></tr>)}
          </tbody>
        </table></div>
        {!loading && rows.length === 0 && !error && <div className="empty">Nothing recorded yet.</div>}
        <Pagination total={data?.total ?? 0} page={page} size={size} onPage={setPage} />
      </div>
    </>
  )
}
